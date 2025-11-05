import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseModal } from './response-modal';

describe('ResponseModal', () => {
  let component: ResponseModal;
  let fixture: ComponentFixture<ResponseModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponseModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResponseModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
