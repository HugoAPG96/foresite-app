import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoRaci } from './paso-raci';

describe('PasoRaci', () => {
  let component: PasoRaci;
  let fixture: ComponentFixture<PasoRaci>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasoRaci],
    }).compileComponents();

    fixture = TestBed.createComponent(PasoRaci);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
