import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Miembro } from '../../miembros/miembro.model';
import { Tarea } from '../tarea.model';

export interface TareaDialogData {
  miembros: Miembro[];
  tarea?: Tarea;
}

@Component({
  selector: 'app-tarea-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './tarea-dialog.html',
  styleUrl: './tarea-dialog.scss',
})
export class TareaDialog {
  private dialogRef = inject(MatDialogRef<TareaDialog>);
  data = inject<TareaDialogData>(MAT_DIALOG_DATA);

  esEdicion = !!this.data.tarea;

  titulo = signal(this.data.tarea?.titulo ?? '');
  responsableId = signal(this.data.tarea?.responsableId ?? (this.data.miembros[0]?.usuario?.id ?? ''));
  fechaInicio = signal(this.data.tarea?.fechaInicio ?? '');
  fechaFin = signal(this.data.tarea?.fechaFin ?? '');
  prioridad = signal<Tarea['prioridad']>(this.data.tarea?.prioridad ?? 'Media');

  cancelar() {
    this.dialogRef.close();
  }

  guardar() {
    if (!this.titulo().trim() || !this.responsableId() || !this.fechaInicio() || !this.fechaFin()) return;

    this.dialogRef.close({
      title: this.titulo(),
      responsibleId: this.responsableId(),
      startDate: this.fechaInicio(),
      endDate: this.fechaFin(),
      priority: this.prioridad(),
    });
  }
}
