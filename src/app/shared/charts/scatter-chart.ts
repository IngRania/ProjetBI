import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ChartTooltip } from './chart-tooltip';
import { Tooltip, TooltipRow, hostWidth, linear, niceTicks } from './chart-utils';

export interface ScatterPoint {
  key: string;
  x: number;
  y: number;
  /** Lignes de l'infobulle (la première valeur est reprise du point). */
  rows: TooltipRow[];
}

const M = { top: 16, right: 16, bottom: 44, left: 48 };
/** Rayon de capture du pointeur : le point le plus proche est retenu, pas besoin de viser le centre. */
const HIT_RADIUS = 24;

/** Nuage de points (équivalent du visuel Power BI scatterChart). */
@Component({
  selector: 'app-scatter-chart',
  imports: [ChartTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plot" (mouseleave)="hover.set(null)">
      @if (layout(); as l) {
        <svg [attr.width]="l.width" [attr.height]="height()" role="img" [attr.aria-label]="ariaLabel()"
             [style.cursor]="hover() ? 'pointer' : 'default'"
             (mousemove)="onMove($event, l.points)" (click)="onClick()">
          @for (t of l.yTicks; track t.value) {
            <line class="grid" [attr.x1]="m.left" [attr.x2]="l.width - m.right" [attr.y1]="t.y" [attr.y2]="t.y" />
            <text class="tick" [attr.x]="m.left - 6" [attr.y]="t.y" text-anchor="end" dominant-baseline="middle">{{ t.value }}</text>
          }
          @for (t of l.xTicks; track t.value) {
            <text class="tick" [attr.x]="t.x" [attr.y]="l.base + 16" text-anchor="middle">{{ t.value }}</text>
          }
          <line class="axis" [attr.x1]="m.left" [attr.x2]="l.width - m.right" [attr.y1]="l.base" [attr.y2]="l.base" />
          <text class="axis-title" [attr.x]="(m.left + l.width - m.right) / 2" [attr.y]="height() - 6" text-anchor="middle">{{ xLabel() }}</text>
          <text class="axis-title" [attr.transform]="'translate(12,' + (m.top + l.base) / 2 + ') rotate(-90)'" text-anchor="middle">{{ yLabel() }}</text>
          @for (p of l.points; track p.key) {
            <circle [attr.cx]="p.cx" [attr.cy]="p.cy" [attr.r]="p.key === selected() || p.key === hover() ? 6 : 4.5"
                    [attr.fill]="color()" stroke="#fff" stroke-width="2"
                    [class.dim]="selected() !== null && p.key !== selected()" />
          }
          @for (p of l.labels; track p.key) {
            <text class="label" [attr.x]="p.lx" [attr.y]="p.ly" [attr.text-anchor]="p.anchor">{{ p.key }}</text>
          }
        </svg>
      }
      <app-chart-tooltip [tip]="tooltip()" [width]="width()" />
    </div>
  `,
  styleUrl: './chart.scss',
})
export class ScatterChart {
  readonly points = input.required<ScatterPoint[]>();
  readonly color = input.required<string>();
  readonly xLabel = input('');
  readonly yLabel = input('');
  /** Points étiquetés directement (les autres restent accessibles par l'infobulle et le tableau). */
  readonly labelKeys = input<string[]>([]);
  readonly selected = input<string | null>(null);
  readonly height = input(340);
  readonly ariaLabel = input('');
  readonly pick = output<string>();

  protected readonly m = M;
  protected readonly width = hostWidth();
  protected readonly hover = signal<string | null>(null);

  protected readonly layout = computed(() => {
    const width = this.width();
    const pts = this.points();
    if (!width || !pts.length) return null;
    const xTicks = niceTicks(0, Math.max(...pts.map((p) => p.x)), 5);
    const yTicks = niceTicks(0, Math.max(...pts.map((p) => p.y)), 5);
    const base = this.height() - M.bottom;
    const x = linear(0, xTicks[xTicks.length - 1], M.left, width - M.right);
    const y = linear(0, yTicks[yTicks.length - 1], base, M.top);
    const points = pts.map((p) => ({ ...p, cx: x(p.x), cy: y(p.y) }));
    return {
      width,
      base,
      xTicks: xTicks.map((value) => ({ value, x: x(value) })),
      yTicks: yTicks.map((value) => ({ value, y: y(value) })),
      points,
      labels: this.placeLabels(points, width),
    };
  });

  protected readonly tooltip = computed<Tooltip | null>(() => {
    const key = this.hover();
    const p = this.layout()?.points.find((q) => q.key === key);
    return p ? { x: p.cx, y: p.cy, title: p.key, rows: p.rows } : null;
  });

  /**
   * Étiquettes directes, par ordre de priorité (pays sélectionné d'abord) : une étiquette qui en
   * chevaucherait une autre est omise (le point reste lisible par l'infobulle et le tableau).
   */
  private placeLabels(points: { key: string; cx: number; cy: number }[], width: number) {
    const keys = [...new Set([...(this.selected() ? [this.selected()!] : []), ...this.labelKeys()])];
    const placed: { key: string; lx: number; ly: number; anchor: 'start' | 'end'; box: [number, number, number, number] }[] = [];
    for (const key of keys) {
      const p = points.find((q) => q.key === key);
      if (!p) continue;
      const w = key.length * 6.6;
      // Près du bord droit, l'étiquette passe à gauche du point.
      const anchor = p.cx + 8 + w > width - 2 ? 'end' : 'start';
      const lx = anchor === 'start' ? p.cx + 8 : p.cx - 8;
      const ly = p.cy - 7;
      const box: [number, number, number, number] = [anchor === 'start' ? lx : lx - w, ly - 11, w, 14];
      const overlaps = placed.some(({ box: b }) =>
        box[0] < b[0] + b[2] && b[0] < box[0] + box[2] && box[1] < b[1] + b[3] && b[1] < box[1] + box[3]);
      if (!overlaps) placed.push({ key, lx, ly, anchor, box });
    }
    return placed;
  }

  protected onMove(event: MouseEvent, points: { key: string; cx: number; cy: number }[]): void {
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    let best: string | null = null;
    let bestD = HIT_RADIUS * HIT_RADIUS;
    for (const p of points) {
      const d = (p.cx - mx) ** 2 + (p.cy - my) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p.key;
      }
    }
    this.hover.set(best);
  }

  protected onClick(): void {
    const key = this.hover();
    if (key) this.pick.emit(key);
  }
}
