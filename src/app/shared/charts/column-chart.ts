import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ChartTooltip } from './chart-tooltip';
import { ChartSeries, Tooltip, columnPath, hostWidth, linear, niceTicks } from './chart-utils';

const M = { top: 22, right: 8, bottom: 34, left: 34 };
const GAP = 2;

/** Histogramme groupé (équivalent du visuel Power BI clusteredColumnChart). */
@Component({
  selector: 'app-column-chart',
  imports: [ChartTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="legend">
      @for (s of series(); track s.key) {
        <li><i [style.background]="s.color"></i>{{ s.label }}</li>
      }
    </ul>
    <div class="plot" (mouseleave)="active.set(null)">
      @if (layout(); as l) {
        <svg [attr.width]="l.width" [attr.height]="height()" role="img" [attr.aria-label]="ariaLabel()">
          @for (t of l.ticks; track t.value) {
            <line class="grid" [attr.x1]="m.left" [attr.x2]="l.width - m.right" [attr.y1]="t.y" [attr.y2]="t.y" />
            <text class="tick" [attr.x]="m.left - 6" [attr.y]="t.y" text-anchor="end" dominant-baseline="middle">{{ t.value }}</text>
          }
          @for (g of l.groups; track g.label; let gi = $index) {
            @for (b of g.bars; track b.key) {
              <path [attr.d]="b.d" [attr.fill]="b.color" [class.dim]="active() !== null && active() !== gi" />
              @if (b.value > 0) {
                <text class="cap" [attr.x]="b.cx" [attr.y]="b.y - 5" text-anchor="middle">{{ b.value }}</text>
              }
            }
            <text class="tick" [attr.x]="g.cx" [attr.y]="height() - m.bottom + 18" text-anchor="middle">{{ g.label }}</text>
          }
          <line class="axis" [attr.x1]="m.left" [attr.x2]="l.width - m.right" [attr.y1]="l.base" [attr.y2]="l.base" />
          @for (g of l.groups; track g.label; let i = $index) {
            <rect class="hit" [attr.x]="g.x" [attr.y]="m.top" [attr.width]="g.w" [attr.height]="l.base - m.top"
                  tabindex="0" [attr.aria-label]="g.aria"
                  (mouseenter)="active.set(i)" (focus)="active.set(i)" (blur)="active.set(null)" />
          }
        </svg>
      }
      <app-chart-tooltip [tip]="tooltip()" [width]="width()" />
    </div>
  `,
  styleUrl: './chart.scss',
})
export class ColumnChart {
  readonly categories = input.required<string[]>();
  readonly series = input.required<ChartSeries[]>();
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
    const max = Math.max(1, ...series.flatMap((s) => s.values.map((v) => v ?? 0)));
    const ticks = niceTicks(0, max, 4, true);
    const base = this.height() - M.bottom;
    const y = linear(0, ticks[ticks.length - 1], base, M.top);
    const band = (width - M.left - M.right) / cats.length;
    const k = series.length;
    const barW = Math.max(4, Math.min(24, (band * 0.7 - GAP * (k - 1)) / k));
    const clusterW = barW * k + GAP * (k - 1);
    return {
      width,
      base,
      ticks: ticks.map((value) => ({ value, y: y(value) })),
      groups: cats.map((label, i) => {
        const x0 = M.left + band * i;
        const start = x0 + (band - clusterW) / 2;
        const bars = series.map((s, j) => {
          const value = s.values[i] ?? 0;
          const bx = start + j * (barW + GAP);
          const by = y(value);
          return { key: s.key, color: s.color, value, cx: bx + barW / 2, y: by, d: columnPath(bx, by, barW, base - by) };
        });
        return {
          label,
          x: x0,
          w: band,
          cx: x0 + band / 2,
          left: start,
          right: start + clusterW,
          top: Math.min(...bars.map((b) => b.y)),
          bars,
          aria: `${label} : ` + series.map((s) => `${s.label} ${s.values[i] ?? 0}`).join(', '),
        };
      }),
    };
  });

  protected readonly tooltip = computed<Tooltip | null>(() => {
    const i = this.active();
    const l = this.layout();
    if (i === null || !l) return null;
    const g = l.groups[i];
    // À côté du groupe survolé, pour ne masquer ni ses colonnes ni leurs valeurs.
    return {
      x: g.right,
      xLeft: g.left,
      y: Math.max(g.top, M.top + 30),
      title: g.label,
      rows: this.series().map((s) => ({ label: s.label, value: String(s.values[i] ?? 0), color: s.color, shape: 'rect' })),
    };
  });
}
