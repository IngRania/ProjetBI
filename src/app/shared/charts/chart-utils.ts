import { DestroyRef, ElementRef, Signal, afterNextRender, inject, signal } from '@angular/core';

/** Une série d'un graphique (couleur = identité, jamais le rang). */
export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  values: (number | null)[];
}

/** Ligne d'infobulle : la valeur passe avant le libellé. */
export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
  shape?: 'line' | 'rect' | 'dot';
}

export interface Tooltip {
  x: number;
  y: number;
  /** Ancrage utilisé quand l'infobulle passe à gauche (près du bord droit). */
  xLeft?: number;
  title: string;
  rows: TooltipRow[];
}

/** Couleurs des séries (palette validée daltonisme, voir styles.scss). */
export const SERIES_COLORS = {
  H: 'var(--viz-series-1)',
  F: 'var(--viz-series-2)',
} as const;

/** Largeur réelle de l'élément hôte, mise à jour au redimensionnement. */
export function hostWidth(): Signal<number> {
  const el = inject<ElementRef<HTMLElement>>(ElementRef);
  const destroyRef = inject(DestroyRef);
  const width = signal(0);
  afterNextRender(() => {
    const observer = new ResizeObserver(([entry]) => width.set(Math.floor(entry.contentRect.width)));
    observer.observe(el.nativeElement);
    destroyRef.onDestroy(() => observer.disconnect());
  });
  return width.asReadonly();
}

/** Échelle linéaire domaine → plage. */
export function linear(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v) => r0 + (v - d0) * k;
}

/** Graduations « rondes » (1, 2, 5 × 10ⁿ) couvrant [min, max] ; entières pour des comptages. */
export function niceTicks(min: number, max: number, count = 5, integer = false): number[] {
  if (max <= min) max = min + 1;
  const raw = (max - min) / count;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const nice = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
  const step = integer ? Math.max(1, nice) : nice;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

/** Barre/colonne avec un bout arrondi de 4 px côté donnée et un angle droit côté ligne de base. */
export function columnPath(x: number, y: number, w: number, h: number): string {
  if (h <= 0) return '';
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
