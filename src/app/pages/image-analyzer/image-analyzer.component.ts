// import {
//   Component,
//   ViewChild,
//   ElementRef,
//   AfterViewInit,
//   OnDestroy,
// } from '@angular/core';

// import * as cocoSsd from '@tensorflow-models/coco-ssd';
// import * as tf from '@tensorflow/tfjs';
// import '@tensorflow/tfjs-backend-webgl';
// @Component({
//   selector: 'app-image-analyzer',
//   imports: [],
//   templateUrl: './image-analyzer.component.html',
//   styleUrl: './image-analyzer.component.css'
// })
// export class ImageAnalyzerComponent implements AfterViewInit, OnDestroy {
//   @ViewChild('videoElem') videoElem!: ElementRef<HTMLVideoElement>;
//   @ViewChild('overlayCanvas') overlayCanvas!: ElementRef<HTMLCanvasElement>;

//   model: any;
//   animationId: any;

//   smoothRect: any = null;
//   smoothType: string | null = null;
//   smoothFactor = 0.2;

//   ngAfterViewInit() {
//     setTimeout(() => {
//       this.start();
//     }, 1000);

//   }

//   ngOnDestroy() {
//     cancelAnimationFrame(this.animationId);
//   }

//   async start() {
//     // Load ML model
//     await tf.setBackend('webgl');
//     await tf.ready();
//     this.model = await cocoSsd.load();
//     console.log('COCO-SSD Loaded');

//     // Start camera
//     const stream = await navigator.mediaDevices.getUserMedia({
//       video: {
//         facingMode: 'environment',
//         width: { ideal: 1280 },
//         height: { ideal: 720 },
//       },
//     });

//     const video = this.videoElem.nativeElement;
//     video.srcObject = stream;

//     await new Promise((res) => (video.onloadedmetadata = res));

//     const canvas = this.overlayCanvas.nativeElement;
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     this.detectLoop();
//   }

//   /** 🔍 Determine overlay type */
//   getOverlayType(obj: any) {
//     const { w, h } = obj;
//     const aspect = w / h;

//     if (Math.abs(aspect - 1) < 0.3 && w < 400 && h < 200) return 'circle';
//     if (Math.abs(aspect - 1) < 0.3) return 'rectangle';
//     if (aspect >= 2.5) return 'horizontal';
//     if (aspect <= 0.4) return 'vertical';

//     return 'free-form';
//   }

//   /** 🎯 Main detection loop */
//   async detectLoop() {
//     const video = this.videoElem.nativeElement;
//     const canvas = this.overlayCanvas.nativeElement;
//     const ctx = canvas.getContext('2d')!;

//     // Resize video for faster detection
//     const detectWidth = 400;
//     const scale = detectWidth / video.videoWidth;
//     const detectHeight = video.videoHeight * scale;

//     // Temp canvas
//     const tempCanvas = document.createElement('canvas');
//     tempCanvas.width = detectWidth;
//     tempCanvas.height = detectHeight;
//     const tempCtx = tempCanvas.getContext('2d')!;
//     tempCtx.drawImage(video, 0, 0, detectWidth, detectHeight);

//     // Predict
//     const predictions = await this.model.detect(tempCanvas);

//     const filtered = predictions.filter((p: any) => p.score > 0.3);

//     let maxArea = 0;
//     let focus: any = null;

//     const scaleX = video.videoWidth / detectWidth;
//     const scaleY = video.videoHeight / detectHeight;

//     for (const obj of filtered) {
//       const [x, y, w, h] = obj.bbox;

//       const fx = x * scaleX;
//       const fy = y * scaleY;
//       const fw = w * scaleX;
//       const fh = h * scaleY;
//       const area = fw * fh;

//       if (area > maxArea) {
//         maxArea = area;
//         focus = { x: fx, y: fy, w: fw, h: fh, class: obj.class };
//       }
//     }

//     if (focus) {
//       const type = this.getOverlayType(focus);

//       if (!this.smoothRect) {
//         this.smoothRect = { ...focus };
//         this.smoothType = type;
//       } else {
//         this.smoothRect.x += (focus.x - this.smoothRect.x) * this.smoothFactor;
//         this.smoothRect.y += (focus.y - this.smoothRect.y) * this.smoothFactor;
//         this.smoothRect.w += (focus.w - this.smoothRect.w) * this.smoothFactor;
//         this.smoothRect.h += (focus.h - this.smoothRect.h) * this.smoothFactor;
//         this.smoothType = type;
//       }
//     }

//     // Draw overlay
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     if (this.smoothRect) {
//       const { x, y, w, h } = this.smoothRect;
//       ctx.strokeStyle = '#00ff44';
//       ctx.lineWidth = 4;

//       switch (this.smoothType) {
//         case 'rectangle':
//           ctx.strokeRect(x, y, w, h);
//           break;

//         case 'horizontal':
//           ctx.strokeRect(x, y + h / 3, w, h / 3);
//           break;

//         case 'vertical':
//           ctx.strokeRect(x + w / 3, y, w / 3, h);
//           break;

//         case 'circle':
//           ctx.beginPath();
//           ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
//           ctx.stroke();
//           break;

//         default:
//           ctx.strokeRect(x, y, w, h);
//       }

//       ctx.fillStyle = '#00ff44';
//       ctx.font = '20px Arial';
//       ctx.fillText(this.smoothRect.class, x, y - 5);
//     }

//     this.animationId = requestAnimationFrame(() => this.detectLoop());
//   }

//   /** 📸 Capture ROI into base64 */
//   captureDetectedObject() {
//     if (!this.smoothRect) return;

//     const video = this.videoElem.nativeElement;

//     const tempCanvas = document.createElement('canvas');
//     tempCanvas.width = this.smoothRect.w;
//     tempCanvas.height = this.smoothRect.h;

//     tempCanvas
//       .getContext('2d')!
//       .drawImage(
//         video,
//         this.smoothRect.x,
//         this.smoothRect.y,
//         this.smoothRect.w,
//         this.smoothRect.h,
//         0,
//         0,
//         this.smoothRect.w,
//         this.smoothRect.h
//       );

//     const image = tempCanvas.toDataURL('image/png');

//     console.log('Captured Image:', image);

//     // 🔥 push into your existing flow (Angular form, upload, etc.)
//     this.onImageCaptured(image);
//   }

//   onImageCaptured(img: string) {
//     /** 
//      * PUT THIS IN YOUR EXISTING FLOW
//      * wherever you previously handled OpenCV cropped output 
//      */
//     console.log('Final Image Ready for Upload', img);
//   }
// }


import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

@Component({
  selector: 'app-image-analyzer',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './image-analyzer.component.html',
  styleUrl: './image-analyzer.component.css'
})
export class ImageAnalyzerComponent implements AfterViewInit, OnDestroy {

  @ViewChild('videoElem') videoElem!: ElementRef<HTMLVideoElement>;
  @ViewChild('overlayCanvas') overlayCanvas!: ElementRef<HTMLCanvasElement>;

  model: any;
  animationId: any;

  smoothRect: any = null;
  smoothType: string | null = null;
  smoothFactor = 0.2;

  // ⭐ NEW
  capturedImage: string | null = null;
  pauseDetection = false;

  ngAfterViewInit() {
    setTimeout(() => {
      this.start();
    }, 1000);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
  }

  async start() {
    await tf.setBackend('webgl');
    await tf.ready();
    this.model = await cocoSsd.load();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    const video = this.videoElem.nativeElement;
    video.srcObject = stream;

    await new Promise(res => (video.onloadedmetadata = res));

    const canvas = this.overlayCanvas.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    this.detectLoop();
  }

  getOverlayType(obj: any) {
    const { w, h } = obj;
    const aspect = w / h;

    if (Math.abs(aspect - 1) < 0.3 && w < 400 && h < 200) return 'circle';
    if (Math.abs(aspect - 1) < 0.3) return 'rectangle';
    if (aspect >= 2.5) return 'horizontal';
    if (aspect <= 0.4) return 'vertical';

    return 'free-form';
  }

  async detectLoop() {
    if (this.pauseDetection) return;

    const video = this.videoElem.nativeElement;
    const canvas = this.overlayCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;

    const detectWidth = 400;
    const scale = detectWidth / video.videoWidth;
    const detectHeight = video.videoHeight * scale;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = detectWidth;
    tempCanvas.height = detectHeight;

    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(video, 0, 0, detectWidth, detectHeight);

    const predictions = await this.model.detect(tempCanvas);
    const filtered = predictions.filter((p: any) => p.score > 0.3);

    let maxArea = 0;
    let focus: any = null;

    const scaleX = video.videoWidth / detectWidth;
    const scaleY = video.videoHeight / detectHeight;

    for (const obj of filtered) {
      const [x, y, w, h] = obj.bbox;
      const fx = x * scaleX;
      const fy = y * scaleY;
      const fw = w * scaleX;
      const fh = h * scaleY;
      const area = fw * fh;

      if (area > maxArea) {
        maxArea = area;
        focus = { x: fx, y: fy, w: fw, h: fh, class: obj.class };
      }
    }

    if (focus) {
      const type = this.getOverlayType(focus);

      if (!this.smoothRect) {
        this.smoothRect = { ...focus };
        this.smoothType = type;
      } else {
        this.smoothRect.x += (focus.x - this.smoothRect.x) * this.smoothFactor;
        this.smoothRect.y += (focus.y - this.smoothRect.y) * this.smoothFactor;
        this.smoothRect.w += (focus.w - this.smoothRect.w) * this.smoothFactor;
        this.smoothRect.h += (focus.h - this.smoothRect.h) * this.smoothFactor;
        this.smoothType = type;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.smoothRect) {
      const { x, y, w, h } = this.smoothRect;
      ctx.strokeStyle = '#00ff44';
      ctx.lineWidth = 4;

      switch (this.smoothType) {
        case 'rectangle': ctx.strokeRect(x, y, w, h); break;
        case 'horizontal': ctx.strokeRect(x, y + h / 3, w, h / 3); break;
        case 'vertical': ctx.strokeRect(x + w / 3, y, w / 3, h); break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
          ctx.stroke();
          break;
        default: ctx.strokeRect(x, y, w, h);
      }

      ctx.fillStyle = '#00ff44';
      ctx.font = '20px Arial';
      ctx.fillText(this.smoothRect.class, x, y - 5);
    }

    this.animationId = requestAnimationFrame(() => this.detectLoop());
  }

  /** --- CAPTURE (NO CHANGE — ONLY added preview UI) --- */
  captureDetectedObject() {
    if (!this.smoothRect) return;


    this.pauseDetection = true;
    cancelAnimationFrame(this.animationId);

    const video = this.videoElem.nativeElement;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.smoothRect.w;
    tempCanvas.height = this.smoothRect.h;

    tempCanvas.getContext('2d')!.drawImage(
      video,
      this.smoothRect.x,
      this.smoothRect.y,
      this.smoothRect.w,
      this.smoothRect.h,
      0,
      0,
      this.smoothRect.w,
      this.smoothRect.h
    );

    this.capturedImage = tempCanvas.toDataURL('image/png');
    this.stopCamera()
  }

  /** --- NEW: RETAKE --- */
  async retake() {
    this.capturedImage = null;
    this.pauseDetection = false;
    await this.start();
    // this.detectLoop(); // restart camera loop
  }

  /** --- NEW: CONFIRM --- */
  confirmCapture() {
    console.log('Final Image Ready for Upload:', this.capturedImage);
    this.onImageCaptured(this.capturedImage!);
  }

  stopCamera() {
    try {
      const stream = this.videoElem.nativeElement.srcObject as MediaStream;
      console.log(stream)
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      this.videoElem.nativeElement.srcObject = null;
      console.log("Camera stopped successfully");
    } catch (error) {
      console.error("Error while stopping camera:", error);
    }
  }

  onImageCaptured(img: string) {
    console.log('Final Image Ready for Upload', img);
  }
}
