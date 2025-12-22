import { Injectable } from '@angular/core';
// import { InferenceSession, Tensor } from 'onnxruntime-web';
declare const ort: any;
 
@Injectable({ providedIn: 'root' })
export class YoloService {
 session: any;

  async loadModel(modelPath: string) {
    this.session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all'
    });
  }

  async run(tensor: any): Promise<[any, number]> {
    const feeds: Record<string, any> = {};
    feeds[this.session.inputNames[0]] = tensor;

    const start = performance.now();
    const results = await this.session.run(feeds);
    const end = performance.now();

    return [results[this.session.outputNames[0]], end - start];
  }
}