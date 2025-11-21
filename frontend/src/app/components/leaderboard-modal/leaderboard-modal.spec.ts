import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaderboardModal } from './leaderboard-modal';

describe('LeaderboardModal', () => {
  let component: LeaderboardModal;
  let fixture: ComponentFixture<LeaderboardModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaderboardModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
