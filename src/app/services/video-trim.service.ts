import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoTrimService {

    private apiUrl = 'http://localhost:3000/upload-video'; // Node server endpoint

  constructor(private http: HttpClient) {}

  /**
   * Upload video to backend, backend trims to 30s if needed
   */
  // uploadVideo(videoFile: File): Observable<any> {
  //   const formData = new FormData();
  //   formData.append('video', videoFile);

  //   return this.http.post(this.apiUrl, formData);
  // }
  uploadVideo(videoFile: File): Observable<any> {
  const formData = new FormData();
  formData.append('video', videoFile);

  return this.http.post<any>(this.apiUrl, formData);
}
}
