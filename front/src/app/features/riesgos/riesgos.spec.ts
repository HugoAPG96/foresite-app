import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Riesgos } from './riesgos';

describe('Riesgos', () => {
  let component: Riesgos;
  let fixture: ComponentFixture<Riesgos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Riesgos],
    }).compileComponents();

    fixture = TestBed.createComponent(Riesgos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
