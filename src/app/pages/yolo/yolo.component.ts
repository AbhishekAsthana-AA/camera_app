import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { YoloService } from '../../services/yolo.service';
import { yoloClasses } from '../../data/yolo-classes';

declare const ort: any;

/* -------------------- STABLE TRACK TYPE -------------------- */
interface StableBox {
  box: number[]; // [x,y,w,h] normalized to 640
  score: number;
  classId: number;
  ttl: number;
}

@Component({
  selector: 'app-yolo',
  templateUrl: './yolo.component.html',
  styleUrls: ['./yolo.component.css'],
})
export class YoloComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  /* -------------------- CONFIG -------------------- */
  modelResolution: [number, number] = [640, 640];
  running = false;

  // stability tuning
  private tracked: StableBox[] = [];
  private MAX_TTL = 6;          // frames to keep box alive
  private IOU_MATCH = 0.45;     // match threshold
  private SMOOTH_ALPHA = 0.65;  // EMA smoothing

  // inference throttling
  private lastInfer = 0;
  private INFER_INTERVAL = 80; // ms (~12 FPS)

  constructor(private yolo: YoloService) {}

  /* -------------------- LIFECYCLE -------------------- */

  async ngAfterViewInit() {
    await this.startCamera();
    await this.yolo.loadModel('assets/models/yolo11n.onnx');
    this.startLoop();
  }

  ngOnDestroy() {
    this.running = false;
  }

  /* -------------------- CAMERA -------------------- */

  async startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    const video = this.videoRef.nativeElement;
    video.srcObject = stream;
    await video.play();
  }

  /* -------------------- PREPROCESS -------------------- */

  preprocess(video: HTMLVideoElement): any {
    const [W, H] = this.modelResolution;

    const tmp = document.createElement('canvas');
    tmp.width = W;
    tmp.height = H;
    const ctx = tmp.getContext('2d')!;
    ctx.drawImage(video, 0, 0, W, H);

    const img = ctx.getImageData(0, 0, W, H);
    const rgba = img.data;

    const chw = new Float32Array(3 * W * H);
    let p = 0;
    let r = 0;
    let g = W * H;
    let b = 2 * W * H;

    for (let i = 0; i < W * H; i++) {
      chw[r++] = rgba[p++] / 255;
      chw[g++] = rgba[p++] / 255;
      chw[b++] = rgba[p++] / 255;
      p++; // alpha
    }

    return new ort.Tensor('float32', chw, [1, 3, H, W]);
  }

  /* -------------------- MAIN LOOP -------------------- */

  startLoop() {
    this.running = true;

    const loop = async (t: number) => {
      if (!this.running) return;

      if (t - this.lastInfer > this.INFER_INTERVAL) {
        this.lastInfer = t;
        await this.runOnce();
      }
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  async runOnce() {
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const input = this.preprocess(video);
    const [output] = await this.yolo.run(input);

    this.postprocess(ctx, output);
  }

  /* -------------------- POSTPROCESS (STABLE) -------------------- */

  postprocess(ctx: CanvasRenderingContext2D, tensor: any) {
    const [inW, inH] = this.modelResolution;
    const scaleX = ctx.canvas.width / inW;
    const scaleY = ctx.canvas.height / inH;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = 'lime';
    ctx.fillStyle = 'lime';
    ctx.lineWidth = 2;
    ctx.font = '14px Arial';

    const data = tensor.data as Float32Array;
    const numAnchors = tensor.dims[2];
    const numClasses = 80;

    const detections: StableBox[] = [];

    const CONF_ENTER = 0.35;
    const CONF_EXIT = 0.20;

    /* -------- DECODE -------- */
    for (let i = 0; i < numAnchors; i++) {
      let bestScore = 0;
      let bestClass = -1;

      for (let c = 0; c < numClasses; c++) {
        const s = data[(4 + c) * numAnchors + i];
        if (s > bestScore) {
          bestScore = s;
          bestClass = c;
        }
      }

      if (bestScore < CONF_ENTER) continue;

      const x = data[i];
      const y = data[numAnchors + i];
      const w = data[2 * numAnchors + i];
      const h = data[3 * numAnchors + i];

      detections.push({
        box: [x - w / 2, y - h / 2, w, h],
        score: bestScore,
        classId: bestClass,
        ttl: this.MAX_TTL,
      });
    }

    /* -------- MATCH & SMOOTH -------- */
    const updated: StableBox[] = [];

    for (const det of detections) {
      let matched = false;

      for (const prev of this.tracked) {
        if (
          prev.classId === det.classId &&
          this.iou(prev.box, det.box) > this.IOU_MATCH
        ) {
          // smooth box
          prev.box = prev.box.map(
            (v, i) => v * this.SMOOTH_ALPHA + det.box[i] * (1 - this.SMOOTH_ALPHA)
          );
          prev.score =
            prev.score * this.SMOOTH_ALPHA +
            det.score * (1 - this.SMOOTH_ALPHA);

          prev.ttl = this.MAX_TTL;
          updated.push(prev);
          matched = true;
          break;
        }
      }

      if (!matched) updated.push(det);
    }

    /* -------- KEEP OLD (TTL) -------- */
    for (const prev of this.tracked) {
      if (!updated.includes(prev)) {
        prev.ttl--;
        if (prev.ttl > 0 && prev.score > CONF_EXIT) {
          updated.push(prev);
        }
      }
    }

    this.tracked = updated;

    /* -------- DRAW -------- */
    for (const t of this.tracked) {
      const [x, y, w, h] = t.box;

      const px = x * scaleX;
      const py = y * scaleY;
      const pw = w * scaleX;
      const ph = h * scaleY;

      ctx.strokeRect(px, py, pw, ph);
      ctx.fillText(
        `${yoloClasses[t.classId]} ${(t.score * 100).toFixed(1)}%`,
        px,
        py > 12 ? py - 5 : py + 15
      );
    }
  }

  /* -------------------- IOU -------------------- */

  iou(a: number[], b: number[]): number {
    const [x1, y1, w1, h1] = a;
    const [x2, y2, w2, h2] = b;

    const xa = Math.max(x1, x2);
    const ya = Math.max(y1, y2);
    const xb = Math.min(x1 + w1, x2 + w2);
    const yb = Math.min(y1 + h1, y2 + h2);

    const inter = Math.max(0, xb - xa) * Math.max(0, yb - ya);
    const union = w1 * h1 + w2 * h2 - inter;

    return inter / union;
  }
}
