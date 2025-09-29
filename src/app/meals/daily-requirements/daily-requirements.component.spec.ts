import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyRequirementsComponent } from './daily-requirements.component';

describe('DailyRequirementsComponent', () => {
  let component: DailyRequirementsComponent;
  let fixture: ComponentFixture<DailyRequirementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyRequirementsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyRequirementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
