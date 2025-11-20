import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalLeaderboard } from './global-leaderboard';

describe('GlobalLeaderboard', () => {
  let component: GlobalLeaderboard;
  let fixture: ComponentFixture<GlobalLeaderboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalLeaderboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalLeaderboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
