import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProyectosList } from './proyectos-list';

describe('ProyectosList', () => {
  let component: ProyectosList;
  let fixture: ComponentFixture<ProyectosList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProyectosList],
    }).compileComponents();

    fixture = TestBed.createComponent(ProyectosList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
