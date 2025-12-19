import { Injectable } from '@angular/core';
import * as ort from 'onnxruntime-web';

@Injectable({ providedIn: 'root' })
export class YoloService {

  private session: ort.InferenceSession | null = null;
  private inputSize = 640;

   async init() {
  if (this.session) return;

  // fetch model from public folder
  const response = await fetch('/models/best.onnx');
  const arrayBuffer = await response.arrayBuffer();
  const modelData = new Uint8Array(arrayBuffer);

  this.session = await ort.InferenceSession.create(modelData, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });

  console.log('ONNX Runtime Web session loaded!');
}

  preprocess(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!;
    const tmp = document.createElement('canvas');
    tmp.width = this.inputSize;
    tmp.height = this.inputSize;

    tmp.getContext('2d')!.drawImage(canvas, 0, 0, this.inputSize, this.inputSize);

    const imgData = tmp.getContext('2d')!.getImageData(0, 0, this.inputSize, this.inputSize);
    const data = imgData.data;

    const r = new Float32Array(this.inputSize * this.inputSize);
    const g = new Float32Array(this.inputSize * this.inputSize);
    const b = new Float32Array(this.inputSize * this.inputSize);

    for (let i = 0, px = 0; i < data.length; i += 4, px++) {
      r[px] = data[i] / 255;
      g[px] = data[i + 1] / 255;
      b[px] = data[i + 2] / 255;
    }

    const tensor = new Float32Array(3 * this.inputSize * this.inputSize);
    tensor.set(r, 0);
    tensor.set(g, r.length);
    tensor.set(b, r.length + g.length);

    return tensor;
  }

  async run(canvas: HTMLCanvasElement) {
    if (!this.session) throw new Error('YOLO model not loaded');

    const inputTensor = new ort.Tensor(
      'float32',
      this.preprocess(canvas),
      [1, 3, this.inputSize, this.inputSize]
    );

    const feeds: any = {};
    feeds[this.session.inputNames[0]] = inputTensor;

    return await this.session.run(feeds);
  }
}
