import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultsDashboard } from './results-dashboard';

describe('ResultsDashboard', () => {
  let component: ResultsDashboard;
  let fixture: ComponentFixture<ResultsDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultsDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultsDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
