import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NativeCameraComponent } from '../native-camera/native-camera.component';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-claim',
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  templateUrl: './claim.component.html',
  styleUrl: './claim.component.css'
})
export class ClaimComponent {
 videoUrl: string | null = null;

  constructor(private dialog: MatDialog) {}

  openCameraDialog(): void {
    const dialogRef = this.dialog.open(NativeCameraComponent, {
      width: '400px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((videoFile: File) => {
      if (videoFile) {
        this.videoUrl = URL.createObjectURL(videoFile); // Direct preview
       
         const renamedFile = new File([videoFile], 'recorded-video.mp4', {
      type: videoFile.type,
      lastModified: videoFile.lastModified
    });
     console.log(renamedFile);
      }
    });
  }
}
