import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoBacklog } from './paso-backlog';

describe('PasoBacklog', () => {
  let component: PasoBacklog;
  let fixture: ComponentFixture<PasoBacklog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasoBacklog],
    }).compileComponents();

    fixture = TestBed.createComponent(PasoBacklog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
