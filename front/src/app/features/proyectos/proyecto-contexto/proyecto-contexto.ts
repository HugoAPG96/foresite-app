import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ProyectosStore } from '../proyectos.store';

// Vive en la ruta `proyectos/:id`: lee el id de la URL, le avisa al store
// cuál es el proyecto activo (lo que el sidebar usa para mostrar el resto
// de los ítems), y limpia esa selección al salir del proyecto.
@Component({
  selector: 'app-proyecto-contexto',
  imports: [RouterOutlet],
  templateUrl: './proyecto-contexto.html',
})
export class ProyectoContexto implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly proyectosStore = inject(ProyectosStore);

  private readonly paramMap = toSignal(this.route.paramMap);
  private readonly proyectoId = computed(() => this.paramMap()?.get('id') ?? null);

  private readonly hasLoadedOnce = signal(false);

  constructor() {
    this.proyectosStore.load().then(() => this.hasLoadedOnce.set(true));

    effect(() => {
      this.proyectosStore.seleccionar(this.proyectoId());
    });

    effect(() => {
      if (this.hasLoadedOnce() && this.proyectoId() && !this.proyectosStore.proyectoActual()) {
        this.router.navigate(['/proyectos']);
      }
    });
  }

  ngOnDestroy(): void {
    this.proyectosStore.seleccionar(null);
  }
}
