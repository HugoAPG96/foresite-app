import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ItemBacklogForm, TipoBacklog } from '../backlog-item.model';

export interface ItemDialogData {
  integrantes: string[];
  fases: string[];
}

const TIPOS: TipoBacklog[] = ['Épica', 'HU', 'Spike', 'Bug', 'Enabler'];
const SPRINTS = ['Sprint 0', 'Sprint 1', 'Sprint 2'];

@Component({
  selector: 'app-item-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './item-dialog.html',
  styleUrl: './item-dialog.scss',
})
export class ItemDialog {
  private dialogRef = inject(MatDialogRef<ItemDialog>);
  data = inject<ItemDialogData>(MAT_DIALOG_DATA);

  tipos = TIPOS;
  sprints = SPRINTS;

  tipo = signal<TipoBacklog>('HU');
  historiaUsuario = signal('');
  descripcion = signal('');
  criterios = signal('- Condición 1\n- Condición 2');
  prioridad = signal<'Alta' | 'Media' | 'Baja'>('Alta');
  estimacion = signal<number | null>(null);
  sprint = signal(SPRINTS[0]);
  fase = signal(this.data.fases[0] ?? '');
  responsables = signal<string[]>([]);
  fechaInicio = signal('');
  fechaFin = signal('');
  dependencia = signal('Ninguna');

  get disponibles(): string[] {
    return this.data.integrantes.filter(i => !this.responsables().includes(i));
  }

  agregarResponsable(nombre: string) {
    if (!nombre) return;
    this.responsables.set([...this.responsables(), nombre]);
  }

  quitarResponsable(nombre: string) {
    this.responsables.set(this.responsables().filter(r => r !== nombre));
  }

  cancelar() {
    this.dialogRef.close();
  }

  crear() {
    if (!this.historiaUsuario().trim()) return;

    const resultado: ItemBacklogForm = {
      tipo: this.tipo(),
      historiaUsuario: this.historiaUsuario(),
      descripcion: this.descripcion(),
      criterios: this.criterios(),
      prioridad: this.prioridad(),
      estimacion: this.estimacion() ?? 0,
      sprint: this.sprint(),
      fase: this.fase(),
      responsables: this.responsables(),
      fechaInicio: this.fechaInicio(),
      fechaFin: this.fechaFin(),
      dependencia: this.dependencia(),
    };

    this.dialogRef.close(resultado);
  }
}
