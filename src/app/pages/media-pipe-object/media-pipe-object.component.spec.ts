import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaPipeObjectComponent } from './media-pipe-object.component';

describe('MediaPipeObjectComponent', () => {
  let component: MediaPipeObjectComponent;
  let fixture: ComponentFixture<MediaPipeObjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaPipeObjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaPipeObjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
