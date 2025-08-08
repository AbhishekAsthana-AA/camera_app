import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { VideoTrimService } from '../../services/video-trim.service';
@Component({
  selector: 'app-native-camera',
  imports: [CommonModule, MatButtonModule],
  templateUrl: './native-camera.component.html',
  styleUrl: './native-camera.component.css'
})
export class NativeCameraComponent implements OnInit {
  
  @ViewChild('videoInput') videoInputRef!: ElementRef<HTMLInputElement>;
 videoFile: File | null = null;
  videoPreviewUrl: string | null = null;
  error: string = '';

  constructor(private dialogRef: MatDialogRef<NativeCameraComponent>,
    public videoUploadService:VideoTrimService
  ) {

  }

 
  ngOnInit(): void {
     setTimeout(() => {
      console.log(this.videoInputRef);
         this.videoInputRef.nativeElement.click();
     },1000);
 
  }

  // handleVideoInput(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   const file = input.files?.[0];

  //   if (file) {
  //     const video = document.createElement('video');
  //     video.preload = 'metadata';
  //     video.onloadedmetadata = () => {
  //       URL.revokeObjectURL(video.src);
  //       if (video.duration > 30) {
  //         this.error = 'Video must be 30 seconds or less.';
  //       } else {
  //         this.error = '';
  //         this.videoFile = file;
  //         this.videoPreviewUrl = URL.createObjectURL(file);
  //       }
  //     };
  //     video.src = URL.createObjectURL(file);
  //   }
  // }


//   handleVideoInput(event: Event) {
//   const input = event.target as HTMLInputElement;
//   const file = input.files?.[0];

//   if (file) {
//     const video = document.createElement('video');
//     video.preload = 'metadata';

//     video.onloadedmetadata = () => {
//       URL.revokeObjectURL(video.src);

//       if (video.duration > 30) {
//         // Instead of error, call service to trim
//         this.error = '';
//         const newName = `trimmed-video-${Date.now()}.mp4`;
//         const renamedFile = new File([file], newName, {
//           type: file.type,
//           lastModified: file.lastModified
//         });

//         this.videoUploadService.uploadVideo(renamedFile).subscribe({
//           next: (trimmedBlob) => {
//           console.log(trimmedBlob.trimmedPath);
//             this.videoFile = new File([trimmedBlob.trimmedPath], newName, { type: 'video/mp4' });
              
//             this.videoPreviewUrl = URL.createObjectURL(this.videoFile);
//           },
//           error: (err) => {
//             console.error('Trimming failed:', err);
//             this.error = 'Video trimming failed. Please try again.';
//           }
//         });

//       } else {
//         this.error = '';
//         this.videoFile = file;
//         this.videoPreviewUrl = URL.createObjectURL(file);
//       }
//     };

//     video.src = URL.createObjectURL(file);
//   }
// }
handleVideoInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file) {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);

      if (video.duration > 30) {
        this.error = '';
        const newName = `trimmed-video-${Date.now()}.mp4`;
        const renamedFile = new File([file], newName, {
          type: file.type,
          lastModified: file.lastModified
        });

        this.videoUploadService.uploadVideo(renamedFile).subscribe({
          next: (response) => {
            console.log('📥 Trimmed URL:', response.trimmedUrl);

            fetch(response.trimmedUrl)
              .then(res => res.blob())
              .then(blob => {
                this.videoFile = new File([blob], newName, { type: 'video/mp4' });
                this.videoPreviewUrl = URL.createObjectURL(this.videoFile);
              });
          },
          error: (err) => {
            console.error('Trimming failed:', err);
            this.error = 'Video trimming failed. Please try again.';
          }
        });

      } else {
        this.error = '';
        this.videoFile = file;
        this.videoPreviewUrl = URL.createObjectURL(file);
      }
    };

    video.src = URL.createObjectURL(file);
  }
}


  submitVideo(): void {
    if (this.videoFile) {
      this.dialogRef.close(this.videoFile);
    }
  }

  retakeVideo(): void {
    this.videoFile = null;
    this.videoPreviewUrl = null;
         setTimeout(() => {
      console.log(this.videoInputRef);
         this.videoInputRef.nativeElement.click();
     },1000);
  }
}
