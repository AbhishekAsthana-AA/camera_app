import { Routes } from '@angular/router';
import { ClaimComponent } from './pages/claim/claim.component';
import { ImageAnalyzerComponent } from './pages/image-analyzer/image-analyzer.component';
import { CameraComponent } from './pages/camera/camera.component';
import { YoloComponent } from './pages/yolo/yolo.component';

export const routes: Routes = [
    {
      path: '',
      component: ClaimComponent,
    },
     {
      path: 'image-analyzer',
      component: ImageAnalyzerComponent,
    },
    {
      path: 'cam-yolo',
      component: CameraComponent,
    },
    {
      path: 'yolo-model',
      component: YoloComponent,
    },
];
