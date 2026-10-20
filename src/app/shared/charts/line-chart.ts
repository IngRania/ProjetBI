import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ChartTooltip } from './chart-tooltip';
import { ChartSeries, Tooltip, TooltipRow, hostWidth, linear, niceTicks } from './chart-utils';

const M = { top: 22, right: 12, bottom: 34, left: 40 };

/** Courbes sur un axe de catégories ordonnées (équivalent du visuel Power BI lineChart). */
@Component({
  selector: 'app-line-chart',
  imports: [ChartTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="legend">
      @for (s of series(); track s.key) {
        <li><i class="line" [style.background]="s.color"></i>{{ s.label }}</li>
      }
    </ul>
    <div class="plot" (mouseleave)="active.set(null)">
      @if (layout(); as l) {
        <svg [attr.width]="l.width" [attr.height]="height()" role="img" [attr.aria-label]="ariaLabel()"
             (mousemove)="onMove($event, l)">
          @for (t of l.ticks; track t.value) {
            <line class="grid" [attr.x1]="m.left" [attr.x2]="l.width - m.right" [attr.y1]="t.y" [attr.y2]="t.y" />
            <text class="tick" [attr.x]="m.left - 6" [attr.y]="t.y" text-anchor="end" dominant-baseline="middle">{{ t.value }}</text>
          }
          @for (c of l.cats; track c.label) {
            <text class="tick" [attr.x]="c.x" [attr.y]="height() - m.bottom + 18" text-anchor="middle">{{ c.label }}</text>
          }
          <line class="axis" [attr.x1]="m.left" [attr.x2]="l.width - m.right" [attr.y1]="l.base" [attr.y2]="l.base" />
          @if (active() !== null) {
            <line class="crosshair" [attr.x1]="l.cats[active()!].x" [attr.x2]="l.cats[active()!].x" [attr.y1]="m.top" [attr.y2]="l.base" />
          }
          @for (s of l.lines; track s.key) {
            <path [attr.d]="s.d" fill="none" [attr.stroke]="s.color" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
            @for (p of s.points; track p.i) {
              <circle [attr.cx]="p.x" [attr.cy]="p.y" [attr.r]="active() === p.i ? 5.5 : 4" [attr.fill]="s.color" stroke="#fff" stroke-width="2" />
            }
            @if (s.best; as b) {
              <text class="cap" [attr.x]="b.x" [attr.y]="b.y + b.dy" text-anchor="middle">{{ b.text }}</text>
            }
          }
          @for (c of l.cats; track c.label; let i = $index) {
            <rect class="hit" [attr.x]="c.x - l.band / 2" [attr.y]="m.top" [attr.width]="l.band" [attr.height]="l.base - m.top"
                  tabindex="0" [attr.aria-label]="c.aria" (focus)="active.set(i)" (blur)="active.set(null)" />
          }
        </svg>
      }
      <app-chart-tooltip [tip]="tooltip()" [width]="width()" />
    </div>
  `,
  styleUrl: './chart.scss',
})
export class LineChart {
  readonly categories = input.required<string[]>();
  readonly series = input.required<ChartSeries[]>();
  /** Lignes ajoutées à l'infobulle pour chaque catégorie (ex. nombre d'athlètes). */
  readonly extraRows = input<TooltipRow[][]>([]);
  /** Libellé du point mis en évidence sur chaque courbe (la plus petite valeur). */
  readonly bestLabel = input<(v: number) => string>((v) => String(v));
  readonly format = input<(v: number) => string>((v) => String(v));
  readonly height = input(280);
  readonly ariaLabel = input('');

  protected readonly m = M;
  protected readonly width = hostWidth();
  protected readonly active = signal<number | null>(null);

  protected readonly layout = computed(() => {
    const width = this.width();
    const cats = this.categories();
    const series = this.series();
    if (!width || !cats.length) return null;
    const values = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
    const ticks = niceTicks(values.length ? Math.min(...values) * 0.9 : 0, values.length ? Math.max(...values) : 1, 4);
    const base = this.height() - M.bottom;
    const y = linear(ticks[0], ticks[ticks.length - 1], base, M.top);
    const band = (width - M.left - M.right) / cats.length;
    const xs = cats.map((_, i) => M.left + band * (i + 0.5));
    return {
      width,
      base,
      band,
      ticks: ticks.map((value) => ({ value, y: y(value) })),
      cats: cats.map((label, i) => ({
        label,
        x: xs[i],
        aria: `${label} : ` + series.map((s) => `${s.label} ${s.values[i] === null ? 'aucune donnée' : this.format()(s.values[i]!)}`).join(', '),
      })),
      lines: series.map((s) => {
        const points = s.values.flatMap((v, i) => (v === null ? [] : [{ i, v, x: xs[i], y: y(v) }]));
        // Un segment par suite de points consécutifs : pas de trait au-dessus d'une catégorie sans donnée.
        let d = '';
        points.forEach((p, k) => (d += `${k > 0 && points[k - 1].i === p.i - 1 ? 'L' : 'M'}${p.x},${p.y}`));
        const best = points.reduce<(typeof points)[number] | null>((b, p) => (!b || p.v < b.v ? p : b), null);
        // Le minimum est le point le plus bas : son étiquette va dessous, à l'écart des segments qui y arrivent.
        const dy = best && best.y + 18 < base ? 18 : -10;
        return { key: s.key, color: s.color, d, points, best: best && { x: best.x, y: best.y, dy, text: this.bestLabel()(best.v) } };
      }),
    };
  });

  protected readonly tooltip = computed<Tooltip | null>(() => {
    const i = this.active();
    const l = this.layout();
    if (i === null || !l) return null;
    const rows: TooltipRow[] = this.series().map((s) => ({
      label: s.label,
      value: s.values[i] === null ? '–' : this.format()(s.values[i]!),
      color: s.color,
      shape: 'line',
    }));
    return { x: l.cats[i].x, y: (M.top + l.base) / 2, title: l.cats[i].label, rows: [...rows, ...(this.extraRows()[i] ?? [])] };
  });

  protected onMove(event: MouseEvent, l: { band: number; cats: unknown[] }): void {
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    const i = Math.floor((event.clientX - rect.left - M.left) / l.band);
    this.active.set(i >= 0 && i < l.cats.length ? i : null);
  }
}
