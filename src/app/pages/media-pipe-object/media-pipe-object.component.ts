// import {
//   Component,
//   ElementRef,
//   ViewChild,
//   AfterViewInit,
//   OnDestroy,
// } from '@angular/core';

// import {
//   ObjectDetector,
//   FilesetResolver,
//   ObjectDetectorResult,
// } from '@mediapipe/tasks-vision';

// @Component({
//   selector: 'app-media-pipe-object',
//   imports: [],
//   templateUrl: './media-pipe-object.component.html',
//   styleUrl: './media-pipe-object.component.css'
// })
// export class MediaPipeObjectComponent implements AfterViewInit, OnDestroy {
//   private focusedBox: any = null;
//   private lostFrames = 0;
//   ////

//   private readonly FOCUS_BOX_RATIO = 0.55; // % of screen
// private readonly MIN_STABLE_FRAMES = 6;
// private stableCounter = 0;

//   private readonly MAX_LOST = 10;
//   private readonly SMOOTH = 0.85;
//   private readonly IOU_THRESHOLD = 0.4;
//     @ViewChild('video', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
//     @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

//     private detector!: ObjectDetector;
//     private running = true;
//     private lastVideoTime = -1;

//     async ngAfterViewInit() {
//       await this.initDetector();
//       await this.startCamera();
//       this.detectLoop();
//     }

//     ngOnDestroy() {
//       this.running = false;
//       const video = this.videoRef.nativeElement;
//       const stream = video.srcObject as MediaStream;
//       stream?.getTracks().forEach(t => t.stop());
//     }

//     /* ---------------- INIT ---------------- */

//     async initDetector() {
//       const vision = await FilesetResolver.forVisionTasks(
//         'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm'
//       );

//       this.detector = await ObjectDetector.createFromOptions(vision, {
//         baseOptions: {
//           modelAssetPath:
//             'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
//           delegate: 'GPU',
//         },
//         runningMode: 'VIDEO',
//         scoreThreshold: 0.5,
//       });
//     }

//     /* ---------------- CAMERA ---------------- */

//     async startCamera() {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: 'environment' },
//       });

//       const video = this.videoRef.nativeElement;
//       video.srcObject = stream;
//       await video.play();
//     }

//     /* ---------------- LOOP ---------------- */

//     detectLoop = async () => {
//       if (!this.running) return;

//       const video = this.videoRef.nativeElement;
//       const canvas = this.canvasRef.nativeElement;
//       const ctx = canvas.getContext('2d')!;

//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;

//       if (video.currentTime !== this.lastVideoTime) {
//         this.lastVideoTime = video.currentTime;

//         const now = performance.now();
//         const result = this.detector.detectForVideo(video, now);
//         this.draw(result, ctx);
//       }

//       requestAnimationFrame(this.detectLoop);
//     };

//     /* ---------------- DRAW ---------------- */

//   //   draw(result: ObjectDetectorResult, ctx: CanvasRenderingContext2D) {
//   //   ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
//   //   ctx.strokeStyle = 'lime';
//   //   ctx.lineWidth = 2;
//   //   ctx.font = '14px Arial';
//   //   ctx.fillStyle = 'lime';

//   //   for (const det of result.detections) {
//   //     if (!det.boundingBox || det.categories.length === 0) continue;

//   //     const box = det.boundingBox;
//   //     const label = det.categories[0];

//   //     ctx.strokeRect(
//   //       box.originX,
//   //       box.originY,
//   //       box.width,
//   //       box.height
//   //     );

//   //     ctx.fillText(
//   //       `${label.categoryName} ${(label.score * 100).toFixed(1)}%`,
//   //       box.originX,
//   //       box.originY > 12 ? box.originY - 5 : box.originY + 15
//   //     );
//   //   }
//   // }
//   // draw(result: ObjectDetectorResult, ctx: CanvasRenderingContext2D) {
//   //   ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

//   //   const cx = ctx.canvas.width / 2;
//   //   const cy = ctx.canvas.height / 2;

//   //   let candidates: any[] = [];

//   //   // ---- collect valid detections ----
//   //   for (const det of result.detections) {
//   //     if (!det.boundingBox || det.categories.length === 0) continue;

//   //     const box = det.boundingBox;
//   //     const label = det.categories[0];

//   //     const centerX = box.originX + box.width / 2;
//   //     const centerY = box.originY + box.height / 2;
//   //     const dist = Math.hypot(centerX - cx, centerY - cy);

//   //     candidates.push({
//   //       x: box.originX,
//   //       y: box.originY,
//   //       w: box.width,
//   //       h: box.height,
//   //       label: label.categoryName,
//   //       score: label.score,
//   //       dist
//   //     });
//   //   }

//   //   // ---- no detections ----
//   //   if (candidates.length === 0) {
//   //     this.lostFrames++;
//   //     if (this.lostFrames > this.MAX_LOST) {
//   //       this.focusedBox = null;
//   //     }
//   //     if (this.focusedBox) this.drawBox(ctx, this.focusedBox);
//   //     return;
//   //   }

//   //   this.lostFrames = 0;

//   //   // ---- FIRST LOCK: nearest to center ----
//   //   if (!this.focusedBox) {
//   //     candidates.sort((a, b) => a.dist - b.dist);
//   //     this.focusedBox = candidates[0];
//   //     this.drawBox(ctx, this.focusedBox);
//   //     return;
//   //   }

//   //   // ---- TRACK SAME OBJECT USING IOU ----
//   //   let bestMatch = null;
//   //   let bestIou = 0;

//   //   for (const c of candidates) {
//   //     const iouVal = this.iou(this.focusedBox, c);
//   //     if (iouVal > bestIou) {
//   //       bestIou = iouVal;
//   //       bestMatch = c;
//   //     }
//   //   }

//   //   // ---- UPDATE IF SAME OBJECT ----
//   //   if (bestMatch && bestIou > this.IOU_THRESHOLD) {
//   //     this.focusedBox.x =
//   //       this.focusedBox.x * this.SMOOTH + bestMatch.x * (1 - this.SMOOTH);
//   //     this.focusedBox.y =
//   //       this.focusedBox.y * this.SMOOTH + bestMatch.y * (1 - this.SMOOTH);
//   //     this.focusedBox.w =
//   //       this.focusedBox.w * this.SMOOTH + bestMatch.w * (1 - this.SMOOTH);
//   //     this.focusedBox.h =
//   //       this.focusedBox.h * this.SMOOTH + bestMatch.h * (1 - this.SMOOTH);
//   //     this.focusedBox.score =
//   //       this.focusedBox.score * 0.9 + bestMatch.score * 0.1;
//   //     this.focusedBox.label = bestMatch.label;
//   //   }

//   //   this.drawBox(ctx, this.focusedBox);
//   // }

//   draw(result: ObjectDetectorResult, ctx: CanvasRenderingContext2D) {
//   ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

//   // 1️⃣ Draw default focus guide
//   const focusArea = this.drawFocusGuide(ctx);

//   let candidates: any[] = [];

//   // 2️⃣ Collect detections INSIDE focus box only
//   for (const det of result.detections) {
//     if (!det.boundingBox || det.categories.length === 0) continue;

//     const box = det.boundingBox;
//     const label = det.categories[0];

//     // center of detected box
//     const cx = box.originX + box.width / 2;
//     const cy = box.originY + box.height / 2;

//     // must be inside focus guide
//     if (
//       cx < focusArea.x ||
//       cx > focusArea.x + focusArea.w ||
//       cy < focusArea.y ||
//       cy > focusArea.y + focusArea.h
//     ) {
//       continue;
//     }

//     candidates.push({
//       x: box.originX,
//       y: box.originY,
//       w: box.width,
//       h: box.height,
//       label: label.categoryName,
//       score: label.score,
//     });
//   }

//   // 3️⃣ No valid detection → reset slowly
//   if (candidates.length === 0) {
//     this.stableCounter = 0;
//     this.lostFrames++;

//     if (this.lostFrames > this.MAX_LOST) {
//       this.focusedBox = null;
//     }

//     if (this.focusedBox) {
//       this.drawBox(ctx, this.focusedBox);
//     }

//     return;
//   }

//   this.lostFrames = 0;

//   // 4️⃣ Lock only after object is stable
//   if (!this.focusedBox) {
//     this.stableCounter++;

//     if (this.stableCounter < this.MIN_STABLE_FRAMES) {
//       // waiting for stability → DO NOT lock yet
//       return;
//     }

//     // choose biggest object (best for close-up)
//     candidates.sort((a, b) => b.w * b.h - a.w * a.h);
//     this.focusedBox = candidates[0];
//     this.drawBox(ctx, this.focusedBox);
//     return;
//   }

//   // 5️⃣ Track focused object using IOU
//   let bestMatch = null;
//   let bestIou = 0;

//   for (const c of candidates) {
//     const iouVal = this.iou(this.focusedBox, c);
//     if (iouVal > bestIou) {
//       bestIou = iouVal;
//       bestMatch = c;
//     }
//   }

//   if (bestMatch && bestIou > this.IOU_THRESHOLD) {
//     this.focusedBox.x =
//       this.focusedBox.x * this.SMOOTH + bestMatch.x * (1 - this.SMOOTH);
//     this.focusedBox.y =
//       this.focusedBox.y * this.SMOOTH + bestMatch.y * (1 - this.SMOOTH);
//     this.focusedBox.w =
//       this.focusedBox.w * this.SMOOTH + bestMatch.w * (1 - this.SMOOTH);
//     this.focusedBox.h =
//       this.focusedBox.h * this.SMOOTH + bestMatch.h * (1 - this.SMOOTH);
//     this.focusedBox.score =
//       this.focusedBox.score * 0.9 + bestMatch.score * 0.1;
//   }

//   this.drawBox(ctx, this.focusedBox);
// }




//   // drawBox(ctx: CanvasRenderingContext2D, box: any) {
//   //   ctx.strokeStyle = 'lime';
//   //   ctx.lineWidth = 2;
//   //   ctx.font = '14px Arial';
//   //   ctx.fillStyle = 'lime';

//   //   ctx.strokeRect(box.x, box.y, box.w, box.h);
//   //   ctx.fillText(
//   //     `${box.label} ${(box.score * 100).toFixed(1)}%`,
//   //     box.x,
//   //     box.y > 12 ? box.y - 5 : box.y + 15
//   //   );
//   // }

//   drawBox(ctx: CanvasRenderingContext2D, box: any) {
//   ctx.strokeStyle = 'lime';
//   ctx.lineWidth = 3;
//   ctx.font = '14px Arial';
//   ctx.fillStyle = 'lime';

//   ctx.strokeRect(box.x, box.y, box.w, box.h);

//   ctx.fillText(
//     `${box.label} ${(box.score * 100).toFixed(1)}%`,
//     box.x,
//     box.y > 12 ? box.y - 5 : box.y + 15
//   );
// }


//   iou(a: any, b: any): number {
//     const xA = Math.max(a.x, b.x);
//     const yA = Math.max(a.y, b.y);
//     const xB = Math.min(a.x + a.w, b.x + b.w);
//     const yB = Math.min(a.y + a.h, b.y + b.h);

//     const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
//     const unionArea = a.w * a.h + b.w * b.h - interArea;

//     return unionArea === 0 ? 0 : interArea / unionArea;
//   }


//   drawFocusGuide(ctx: CanvasRenderingContext2D) {
//   const w = ctx.canvas.width * this.FOCUS_BOX_RATIO;
//   const h = ctx.canvas.height * this.FOCUS_BOX_RATIO;

//   const x = (ctx.canvas.width - w) / 2;
//   const y = (ctx.canvas.height - h) / 2;

//   ctx.strokeStyle = 'rgba(255,255,255,0.6)';
//   ctx.lineWidth = 2;
//   ctx.setLineDash([10, 6]);
//   ctx.strokeRect(x, y, w, h);
//   ctx.setLineDash([]);

//   return { x, y, w, h };
// }



// }


import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import {
  ObjectDetector,
  FilesetResolver,
  ObjectDetectorResult,
} from '@mediapipe/tasks-vision';

@Component({
  selector: 'app-media-pipe-object',
  templateUrl: './media-pipe-object.component.html',
  styleUrl: './media-pipe-object.component.css'
})
export class MediaPipeObjectComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private detector!: ObjectDetector;
  private running = true;
  private lastVideoTime = -1;

  // --- Focus Tracking ---
  private focusedBox: any = null;
  private lostFrames = 0;
  private stableCounter = 0;

  // --- Config ---
  private readonly SMOOTH = 0.85;
  private readonly MAX_LOST = 10;
  private readonly IOU_THRESHOLD = 0.4;
  private readonly FOCUS_BOX_RATIO = 0.55; // % of screen
  private readonly MIN_STABLE_FRAMES = 6;

  async ngAfterViewInit() {
    await this.initDetector();
    await this.startCamera();
    this.detectLoop();
  }

  ngOnDestroy() {
    this.running = false;
    const video = this.videoRef.nativeElement;
    const stream = video.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
  }

  async initDetector() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm'
    );

    this.detector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      scoreThreshold: 0.5,
    });
  }

  async startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });

    const video = this.videoRef.nativeElement;
    video.srcObject = stream;
    await video.play();
  }

  detectLoop = async () => {
    if (!this.running) return;

    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = video.currentTime;

      const now = performance.now();
      const result = this.detector.detectForVideo(video, now);
      this.draw(result, ctx);
    }

    requestAnimationFrame(this.detectLoop);
  };

  draw(result: ObjectDetectorResult, ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 1️⃣ Draw focus guide
    const focusArea = this.drawFocusGuide(ctx);

    let candidates: any[] = [];

    // 2️⃣ Collect objects that overlap with focus guide
    for (const det of result.detections) {
      if (!det.boundingBox || det.categories.length === 0) continue;

      const box = det.boundingBox;
      const label = det.categories[0];

      if (this.overlaps(box, focusArea)) {
        candidates.push({
          x: box.originX,
          y: box.originY,
          w: box.width,
          h: box.height,
          label: label.categoryName,
          score: label.score,
        });
      }
    }

    // 3️⃣ No candidate detected
    if (candidates.length === 0) {
      this.stableCounter = 0;
      this.lostFrames++;

      if (this.lostFrames > this.MAX_LOST) this.focusedBox = null;

      if (this.focusedBox) this.drawBox(ctx, this.focusedBox);

      return;
    }

    this.lostFrames = 0;

    // 4️⃣ Lock only after object is stable
    if (!this.focusedBox) {
      this.stableCounter++;

      if (this.stableCounter < this.MIN_STABLE_FRAMES) return;

      // Pick the largest object
      candidates.sort((a, b) => b.w * b.h - a.w * a.h);
      this.focusedBox = candidates[0];
      this.drawBox(ctx, this.focusedBox);
      return;
    }

    // 5️⃣ Track focused object using IOU
    let bestMatch: any = null;
    let bestIou = 0;

    for (const c of candidates) {
      const iouVal = this.iou(this.focusedBox, c);
      if (iouVal > bestIou) {
        bestIou = iouVal;
        bestMatch = c;
      }
    }

    if (bestMatch && bestIou > this.IOU_THRESHOLD) {
      this.focusedBox.x =
        this.focusedBox.x * this.SMOOTH + bestMatch.x * (1 - this.SMOOTH);
      this.focusedBox.y =
        this.focusedBox.y * this.SMOOTH + bestMatch.y * (1 - this.SMOOTH);
      this.focusedBox.w =
        this.focusedBox.w * this.SMOOTH + bestMatch.w * (1 - this.SMOOTH);
      this.focusedBox.h =
        this.focusedBox.h * this.SMOOTH + bestMatch.h * (1 - this.SMOOTH);
      this.focusedBox.score =
        this.focusedBox.score * 0.9 + bestMatch.score * 0.1;
      this.focusedBox.label = bestMatch.label;
    }

    this.drawBox(ctx, this.focusedBox);
  }

  drawBox(ctx: CanvasRenderingContext2D, box: any) {
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 3;
    ctx.font = '14px Arial';
    ctx.fillStyle = 'lime';

    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.fillText(
      `${box.label} ${(box.score * 100).toFixed(1)}%`,
      box.x,
      box.y > 12 ? box.y - 5 : box.y + 15
    );
  }

  // Draw semi-transparent focus guide rectangle
  drawFocusGuide(ctx: CanvasRenderingContext2D) {
    const w = ctx.canvas.width * this.FOCUS_BOX_RATIO;
    const h = ctx.canvas.height * this.FOCUS_BOX_RATIO;
    const x = (ctx.canvas.width - w) / 2;
    const y = (ctx.canvas.height - h) / 2;

    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    return { x, y, w, h };
  }

  // Check if two rectangles overlap
  overlaps(a: any, b: any): boolean {
    return !(
      a.originX + a.width < b.x ||
      a.originX > b.x + b.w ||
      a.originY + a.height < b.y ||
      a.originY > b.y + b.h
    );
  }

  // Intersection over Union
  iou(a: any, b: any): number {
    const xA = Math.max(a.x, b.x);
    const yA = Math.max(a.y, b.y);
    const xB = Math.min(a.x + a.w, b.x + b.w);
    const yB = Math.min(a.y + a.h, b.y + b.h);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const unionArea = a.w * a.h + b.w * b.h - interArea;

    return unionArea === 0 ? 0 : interArea / unionArea;
  }
}
