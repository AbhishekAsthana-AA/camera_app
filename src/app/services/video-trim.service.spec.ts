import { TestBed } from '@angular/core/testing';

import { VideoTrimService } from './video-trim.service';

describe('VideoTrimService', () => {
  let service: VideoTrimService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoTrimService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
