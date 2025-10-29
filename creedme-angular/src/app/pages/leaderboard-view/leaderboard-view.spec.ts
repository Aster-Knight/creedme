import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaderboardView } from './leaderboard-view';

describe('LeaderboardView', () => {
  let component: LeaderboardView;
  let fixture: ComponentFixture<LeaderboardView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaderboardView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
