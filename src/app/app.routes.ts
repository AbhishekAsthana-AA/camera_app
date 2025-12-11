import { Routes } from '@angular/router';
import { ClaimComponent } from './pages/claim/claim.component';
import { ImageAnalyzerComponent } from './pages/image-analyzer/image-analyzer.component';

export const routes: Routes = [
    {
      path: '',
      component: ClaimComponent,
    },
     {
      path: 'image-analyzer',
      component: ImageAnalyzerComponent,
    },
];
