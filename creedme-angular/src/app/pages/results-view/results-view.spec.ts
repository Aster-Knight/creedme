import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultsView } from './results-view';

describe('ResultsView', () => {
  let component: ResultsView;
  let fixture: ComponentFixture<ResultsView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultsView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultsView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
