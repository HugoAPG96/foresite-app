import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProyectoWizard } from './proyecto-wizard';

describe('ProyectoWizard', () => {
  let component: ProyectoWizard;
  let fixture: ComponentFixture<ProyectoWizard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProyectoWizard],
    }).compileComponents();

    fixture = TestBed.createComponent(ProyectoWizard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
