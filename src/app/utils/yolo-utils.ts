export interface Detection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  score: number;
  cls: number;
}

function iou(a: Detection, b: Detection) {
  const xx1 = Math.max(a.x1, b.x1);
  const yy1 = Math.max(a.y1, b.y1);
  const xx2 = Math.min(a.x2, b.x2);
  const yy2 = Math.min(a.y2, b.y2);
  const w = Math.max(0, xx2 - xx1);
  const h = Math.max(0, yy2 - yy1);
  const inter = w * h;
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  return inter / (areaA + areaB - inter + 1e-6);
}

export function nonMaxSuppression(dets: Detection[], thresh = 0.45) {
  const out: Detection[] = [];
  dets.sort((a, b) => b.score - a.score);

  const used = Array(dets.length).fill(false);
  for (let i = 0; i < dets.length; i++) {
    if (used[i]) continue;

    out.push(dets[i]);
    for (let j = i + 1; j < dets.length; j++) {
      if (iou(dets[i], dets[j]) > thresh) used[j] = true;
    }
  }
  return out;
}

export function decodeYoloOutput(output: any, W: number, H: number, conf = 0.35) {
  const key = Object.keys(output)[0];
  const arr = output[key].data;

  const dets: Detection[] = [];
  for (let i = 0; i < arr.length; i += 6) {
    const score = arr[i + 4];
    if (score < conf) continue;

    dets.push({
      x1: arr[i] * (W / 640),
      y1: arr[i + 1] * (H / 640),
      x2: arr[i + 2] * (W / 640),
      y2: arr[i + 3] * (H / 640),
      score,
      cls: Math.round(arr[i + 5])
    });
  }

  return nonMaxSuppression(dets);
}
