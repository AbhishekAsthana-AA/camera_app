import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
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

  constructor(private dialogRef: MatDialogRef<NativeCameraComponent>) {

  }

 
  ngOnInit(): void {
     setTimeout(() => {
      console.log(this.videoInputRef);
         this.videoInputRef.nativeElement.click();
     },1000);
 
  }

  handleVideoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > 30) {
          this.error = 'Video must be 30 seconds or less.';
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
