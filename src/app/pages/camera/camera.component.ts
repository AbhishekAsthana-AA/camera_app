import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import * as cocoSSD from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';

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

  loading = true;
  private model!: cocoSSD.ObjectDetection;
  private stream!: MediaStream;
  private isDetecting = true;

  async ngOnInit() {
    await tf.setBackend('webgl');
    await tf.ready();
    await this.initCamera();
  }

  async initCamera() {
    const video = this.videoRef.nativeElement;

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment'
      },
      audio: false
    });

    video.srcObject = this.stream;

    video.onloadedmetadata = async () => {
      await video.play();

      // 🚨 IMPORTANT: wait until dimensions are ready
      if (video.videoWidth === 0) return;

      this.loading = false;
      await this.loadModel();
      this.detectFrame();
    };
  }

  async loadModel() {
    this.model = await cocoSSD.load({
      base: 'lite_mobilenet_v2' // faster for mobile
    });
  }

  detectFrame() {
    if (!this.isDetecting) return;

    const video = this.videoRef.nativeElement;

    // 🔐 Guard against 0x0 texture crash
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      requestAnimationFrame(() => this.detectFrame());
      return;
    }

    this.model.detect(video).then(predictions => {
      this.renderPredictions(predictions);
      requestAnimationFrame(() => this.detectFrame());
    });
  }

  renderPredictions(predictions: cocoSSD.DetectedObject[]) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const video = this.videoRef.nativeElement;

    // 🔁 Match canvas to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach(prediction => {
      const [x, y, width, height] = prediction.bbox;

      // Box
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Label background
      ctx.fillStyle = '#00FFFF';
      ctx.font = '14px sans-serif';
      const textWidth = ctx.measureText(prediction.class).width;
      ctx.fillRect(x, y - 18, textWidth + 6, 18);

      // Label text
      ctx.fillStyle = '#000';
      ctx.fillText(prediction.class, x + 3, y - 4);
    });
  }

  ngOnDestroy() {
    this.isDetecting = false;
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
    }
  }
}
