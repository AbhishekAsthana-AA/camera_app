import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YoloComponent } from './yolo.component';

describe('YoloComponent', () => {
  let component: YoloComponent;
  let fixture: ComponentFixture<YoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YoloComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
