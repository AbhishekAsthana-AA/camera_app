// import {
//   Component,
//   ElementRef,
//   OnDestroy,
//   OnInit,
//   ViewChild
// } from '@angular/core';

// import * as cocoSSD from '@tensorflow-models/coco-ssd';
// import '@tensorflow/tfjs-backend-webgl';
// import * as tf from '@tensorflow/tfjs';

// @Component({
//   selector: 'app-camera',
//   standalone: true,
//   templateUrl: './camera.component.html',
//   styleUrl: './camera.component.css'
// })
// export class CameraComponent implements OnInit, OnDestroy {

//   @ViewChild('video', { static: true })
//   videoRef!: ElementRef<HTMLVideoElement>;

//   @ViewChild('canvas', { static: true })
//   canvasRef!: ElementRef<HTMLCanvasElement>;

//   loading = true;
//   private model!: cocoSSD.ObjectDetection;
//   private stream!: MediaStream;
//   private isDetecting = true;

//   async ngOnInit() {
//     await tf.setBackend('webgl');
//     await tf.ready();
//     await this.initCamera();
//   }

//   async initCamera() {
//     const video = this.videoRef.nativeElement;

//     this.stream = await navigator.mediaDevices.getUserMedia({
//       video: {
//         facingMode: 'environment'
//       },
//       audio: false
//     });

//     video.srcObject = this.stream;

//     video.onloadedmetadata = async () => {
//       await video.play();

//       // 🚨 IMPORTANT: wait until dimensions are ready
//       if (video.videoWidth === 0) return;

//       this.loading = false;
//       await this.loadModel();
//       this.detectFrame();
//     };
//   }

//   async loadModel() {
//     this.model = await cocoSSD.load({
//       base: 'lite_mobilenet_v2' // faster for mobile
//     });
//   }

//   detectFrame() {
//     if (!this.isDetecting) return;

//     const video = this.videoRef.nativeElement;

//     // 🔐 Guard against 0x0 texture crash
//     if (video.videoWidth === 0 || video.videoHeight === 0) {
//       requestAnimationFrame(() => this.detectFrame());
//       return;
//     }

//     this.model.detect(video).then(predictions => {
//       this.renderPredictions(predictions);
//       requestAnimationFrame(() => this.detectFrame());
//     });
//   }

//   getOverlayType(
//     w: number,
//     h: number
//   ): 'circle' | 'horizontal' | 'vertical' | 'rectangle' {

//     const aspect = w / h;

//     // 🔵 Circle (near square)
//     if (Math.abs(aspect - 1) < 0.25) {
//       return 'circle';
//     }

//     // ↔️ Horizontal object
//     if (aspect > 1.4) {
//       return 'horizontal';
//     }

//     // ↕️ Vertical object
//     if (aspect < 0.7) {
//       return 'vertical';
//     }

//     // ⬛ Normal rectangle
//     return 'rectangle';
//   }

//   renderPredictions(predictions: cocoSSD.DetectedObject[]) {
//     const canvas = this.canvasRef.nativeElement;
//     const ctx = canvas.getContext('2d')!;
//     const video = this.videoRef.nativeElement;

//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     predictions.forEach(pred => {
//       const [x, y, w, h] = pred.bbox;
//       const type = this.getOverlayType(w, h);

//       ctx.strokeStyle = '#00FFFF';
//       ctx.lineWidth = 3;

//       switch (type) {
//         case 'circle':
//           this.drawCircle(ctx, x, y, w, h);
//           break;

//         case 'horizontal':
//           this.drawHorizontalRect(ctx, x, y, w, h);
//           break;

//         case 'vertical':
//           this.drawVerticalRect(ctx, x, y, w, h);
//           break;

//         case 'rectangle':
//           ctx.strokeRect(x, y, w, h);
//           break;
//       }

//       // Label
//       ctx.fillStyle = '#00FFFF';
//       ctx.font = '14px sans-serif';
//       ctx.fillText(pred.class, x + 4, y - 6);
//     });
//   }
//   drawCircle(
//     ctx: CanvasRenderingContext2D,
//     x: number,
//     y: number,
//     w: number,
//     h: number
//   ) {
//     const r = Math.min(w, h) / 2;
//     const cx = x + w / 2;
//     const cy = y + h / 2;

//     ctx.beginPath();
//     ctx.arc(cx, cy, r, 0, Math.PI * 2);
//     ctx.stroke();
//   }
//   drawHorizontalRect(
//     ctx: CanvasRenderingContext2D,
//     x: number,
//     y: number,
//     w: number,
//     h: number
//   ) {
//     // Slight padding for better visual fit
//     const pad = h * 0.15;

//     ctx.strokeRect(
//       x,
//       y + pad,
//       w,
//       h - pad * 2
//     );
//   }
//   drawVerticalRect(
//     ctx: CanvasRenderingContext2D,
//     x: number,
//     y: number,
//     w: number,
//     h: number
//   ) {
//     const pad = w * 0.15;

//     ctx.strokeRect(
//       x + pad,
//       y,
//       w - pad * 2,
//       h
//     );
//   }

//   // renderPredictions(predictions: cocoSSD.DetectedObject[]) {
//   //   const canvas = this.canvasRef.nativeElement;
//   //   const ctx = canvas.getContext('2d')!;
//   //   const video = this.videoRef.nativeElement;

//   //   // 🔁 Match canvas to video
//   //   canvas.width = video.videoWidth;
//   //   canvas.height = video.videoHeight;

//   //   ctx.clearRect(0, 0, canvas.width, canvas.height);

//   //   predictions.forEach(prediction => {
//   //     const [x, y, width, height] = prediction.bbox;

//   //     // Box
//   //     ctx.strokeStyle = '#00FFFF';
//   //     ctx.lineWidth = 2;
//   //     ctx.strokeRect(x, y, width, height);

//   //     // Label background
//   //     ctx.fillStyle = '#00FFFF';
//   //     ctx.font = '14px sans-serif';
//   //     const textWidth = ctx.measureText(prediction.class).width;
//   //     ctx.fillRect(x, y - 18, textWidth + 6, 18);

//   //     // Label text
//   //     ctx.fillStyle = '#000';
//   //     ctx.fillText(prediction.class, x + 3, y - 4);
//   //   });
//   // }

//   ngOnDestroy() {
//     this.isDetecting = false;
//     if (this.stream) {
//       this.stream.getTracks().forEach(t => t.stop());
//     }
//   }
// }


import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as cocoSSD from '@tensorflow-models/coco-ssd';

@Component({
  selector: 'app-camera',
  standalone: true,
  templateUrl: './camera.component.html',
  styleUrl: './camera.component.css'
})
export class CameraComponent implements OnInit, OnDestroy {

  @ViewChild('video', { static: true })
  videoRef!: ElementRef<HTMLVideoElement>;

  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private stream!: MediaStream;
  private model!: cocoSSD.ObjectDetection;

  loading = true;
  private running = true;

  // 🔒 Focus + stability
  private focusedObject: cocoSSD.DetectedObject | null = null;
  private focusLostFrames = 0;
  private smoothedBox: number[] | null = null;

  async ngOnInit() {
    await tf.setBackend('webgl');
    await tf.ready();
    await this.initCamera();
  }

  async initCamera() {
    const video = this.videoRef.nativeElement;

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });

    video.srcObject = this.stream;

    video.onloadedmetadata = async () => {
      await video.play();

      if (video.videoWidth === 0) return;

      this.model = await cocoSSD.load({
        base: 'lite_mobilenet_v2'
      });

      this.loading = false;
      this.detectLoop();
    };
  }

  detectLoop() {
    if (!this.running) return;

    const video = this.videoRef.nativeElement;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      requestAnimationFrame(() => this.detectLoop());
      return;
    }

    this.model.detect(video).then(predictions => {
      const focused = this.getFocusedObject(
        predictions,
        video.videoWidth,
        video.videoHeight
      );

      if (focused) {
        this.focusedObject = focused;
        this.focusLostFrames = 0;
      } else {
        this.focusLostFrames++;
        if (this.focusLostFrames > 12) {
          this.focusedObject = null;
          this.smoothedBox = null;
        }
      }

      if (this.focusedObject) {
        this.renderFocused(this.focusedObject);
      }

      requestAnimationFrame(() => this.detectLoop());
    });
  }

  // 🎯 pick ONE object (center + confidence)
  getFocusedObject(
    preds: cocoSSD.DetectedObject[],
    vw: number,
    vh: number
  ): cocoSSD.DetectedObject | null {

    const cx = vw / 2;
    const cy = vh / 2;

    let best: cocoSSD.DetectedObject | null = null;
    let bestScore = Infinity;

    preds.forEach(p => {
      if ((p.score ?? 0) < 0.6) return;

      const [x, y, w, h] = p.bbox;
      const ox = x + w / 2;
      const oy = y + h / 2;

      const dist = Math.hypot(cx - ox, cy - oy);

      if (dist < bestScore) {
        bestScore = dist;
        best = p;
      }
    });

    return best;
  }

  // 🧊 smooth jitter
  smoothBBox(box: number[], alpha = 0.85): number[] {
    if (!this.smoothedBox) {
      this.smoothedBox = [...box];
      return box;
    }

    this.smoothedBox = this.smoothedBox.map(
      (v, i) => v * alpha + box[i] * (1 - alpha)
    );

    return this.smoothedBox;
  }

  renderFocused(pred: cocoSSD.DetectedObject) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const video = this.videoRef.nativeElement;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bbox = this.smoothBBox(pred.bbox);
    const [x, y, w, h] = bbox;

    const type = this.getOverlayType(w, h);

    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 3;

    switch (type) {
      case 'circle':
        this.drawCircle(ctx, x, y, w, h);
        break;
      case 'horizontal':
        this.drawHorizontalRect(ctx, x, y, w, h);
        break;
      case 'vertical':
        this.drawVerticalRect(ctx, x, y, w, h);
        break;
      default:
        ctx.strokeRect(x, y, w, h);
    }

    ctx.fillStyle = '#00FFFF';
    ctx.font = '14px sans-serif';
    ctx.fillText(pred.class, x + 4, y - 6);
  }

  // 🔍 shape logic
  getOverlayType(w: number, h: number) {
    const aspect = w / h;
    if (Math.abs(aspect - 1) < 0.25) return 'circle';
    if (aspect > 1.4) return 'horizontal';
    if (aspect < 0.7) return 'vertical';
    return 'rectangle';
  }

  drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const r = Math.min(w, h) / 2;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawHorizontalRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const pad = h * 0.15;
    ctx.strokeRect(x, y + pad, w, h - pad * 2);
  }

  drawVerticalRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const pad = w * 0.15;
    ctx.strokeRect(x + pad, y, w - pad * 2, h);
  }

  ngOnDestroy() {
    this.running = false;
    this.stream?.getTracks().forEach(t => t.stop());
  }
}
