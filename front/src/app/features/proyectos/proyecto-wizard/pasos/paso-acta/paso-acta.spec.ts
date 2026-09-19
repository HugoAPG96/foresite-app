import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoActa } from './paso-acta';

describe('PasoActa', () => {
  let component: PasoActa;
  let fixture: ComponentFixture<PasoActa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasoActa],
    }).compileComponents();

    fixture = TestBed.createComponent(PasoActa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
