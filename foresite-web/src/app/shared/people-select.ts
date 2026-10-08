import { Component, computed, input, output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { User } from '../core/models';

/** Selector múltiple compacto para celdas de tabla (Consultado / Informado) con el atajo "Todo el equipo". */
@Component({
  selector: 'app-people-select',
  imports: [MatMenuModule, MatCheckboxModule, MatIconModule],
  template: `
    <button type="button" class="ps" [class.empty]="!value().length" [matMenuTriggerFor]="menu" [attr.aria-label]="ariaLabel()">
      <span class="txt">{{ summary() }}</span>
      <mat-icon>arrow_drop_down</mat-icon>
    </button>
    <mat-menu #menu="matMenu">
      <div class="panel" (click)="$event.stopPropagation()">
        <mat-checkbox
          [checked]="allSelected()"
          [indeterminate]="value().length > 0 && !allSelected()"
          (change)="toggleAll($event.checked)"
        >Todo el equipo</mat-checkbox>
        @for (p of people(); track p.id) {
          <mat-checkbox [checked]="value().includes(p.id)" (change)="toggle(p.id, $event.checked)">{{ p.name }}</mat-checkbox>
        } @empty {
          <span class="muted small">Sin integrantes.</span>
        }
      </div>
    </mat-menu>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .ps {
      display: flex; align-items: center; justify-content: space-between; gap: 2px; width: 100%; height: 32px;
      padding: 0 4px 0 8px; border: 1px solid var(--line); border-radius: 8px; background: #fff; color: var(--ink);
      font: inherit; font-size: 12.5px; cursor: pointer; text-align: left;
    }
    .ps.empty { color: var(--ink-soft); }
    .ps:hover { border-color: #c9c9d3; }
    .ps:focus-visible { outline: 2px solid var(--purple); outline-offset: 1px; }
    .txt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ps mat-icon { flex-shrink: 0; font-size: 20px; width: 20px; height: 20px; }
    .panel { display: flex; flex-direction: column; padding: 4px 12px; min-width: 200px; }
  `,
})
export class PeopleSelect {
  readonly people = input.required<User[]>();
  readonly value = input<string[]>([]);
  readonly placeholder = input('—');
  readonly ariaLabel = input('Seleccionar personas');
  readonly changed = output<string[]>();

  protected allSelected = computed(() => this.people().length > 0 && this.people().every((p) => this.value().includes(p.id)));

  protected summary = computed(() => {
    const ids = this.value();
    if (!ids.length) return this.placeholder();
    if (this.allSelected() && this.people().length > 1) return 'Todo el equipo';
    return this.people()
      .filter((p) => ids.includes(p.id))
      .map((p) => p.name.split(' ')[0])
      .join(', ');
  });

  protected toggle(id: string, checked: boolean): void {
    const set = new Set(this.value());
    if (checked) set.add(id);
    else set.delete(id);
    this.changed.emit(this.people().map((p) => p.id).filter((x) => set.has(x)));
  }

  protected toggleAll(checked: boolean): void {
    this.changed.emit(checked ? this.people().map((p) => p.id) : []);
  }
}
