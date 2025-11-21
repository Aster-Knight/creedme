import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructionsPanel } from './instructions-panel';

describe('InstructionsPanel', () => {
  let component: InstructionsPanel;
  let fixture: ComponentFixture<InstructionsPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructionsPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstructionsPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
