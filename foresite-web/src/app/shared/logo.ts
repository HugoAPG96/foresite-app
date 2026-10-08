import { Component, input } from '@angular/core';

/**
 * Logo de Foresite: una "F" construida con barras (planificación) cuyo trazo
 * superior termina en un punto turquesa — la señal de "ver adelante"
 * (fore-site) que representa el indicador predictivo.
 */
@Component({
  selector: 'app-logo',
  template: `
    <span class="logo" [class.stacked]="stacked()">
      <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 40 40" role="img" aria-label="Foresite">
        <defs>
          <linearGradient [attr.id]="gid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#6C4FD1" />
            <stop offset="1" stop-color="#9B86F0" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" [attr.fill]="'url(#' + gid + ')'" />
        <rect x="11" y="9" width="5" height="22" rx="2.5" fill="#fff" />
        <rect x="11" y="9" width="15" height="5" rx="2.5" fill="#fff" />
        <rect x="11" y="18.5" width="10" height="5" rx="2.5" fill="#fff" opacity=".88" />
        <circle cx="32" cy="11.5" r="3" fill="#2BC7B0" />
        <circle cx="32" cy="11.5" r="5.2" fill="none" stroke="#2BC7B0" stroke-opacity=".45" stroke-width="1.1" />
      </svg>
      @if (showText()) {
        <span class="wordmark" [style.font-size.px]="size() * 0.62">Fore<b>site</b></span>
      }
    </span>
  `,
  styles: `
    .logo { display: inline-flex; align-items: center; gap: 10px; }
    .logo.stacked { flex-direction: column; gap: 8px; }
    .wordmark { font-weight: 600; letter-spacing: -0.02em; color: #232529; line-height: 1; }
    .wordmark b { font-weight: 700; color: #6c4fd1; }
  `,
})
export class LogoComponent {
  size = input(34);
  showText = input(true);
  stacked = input(false);
  protected readonly gid = 'fg' + Math.random().toString(36).slice(2, 7);
}
