import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tooltip } from './chart-utils';

/** Infobulle commune aux graphiques : positionnée dans le conteneur (position: relative) du graphique. */
@Component({
  selector: 'app-chart-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tip(); as t) {
      <div class="tip" role="status" [class.flip]="flip()" [style.left.px]="flip() ? (t.xLeft ?? t.x) : t.x" [style.top.px]="t.y">
        <div class="tip-title">{{ t.title }}</div>
        @for (r of t.rows; track r.label) {
          <div class="tip-row">
            @if (r.color) {
              <i class="key" [class]="r.shape ?? 'line'" [style.background]="r.color"></i>
            }
            <strong>{{ r.value }}</strong>
            <span>{{ r.label }}</span>
          </div>
        }
      </div>
    }
  `,
  styles: `
    :host { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
    .tip {
      position: absolute; transform: translate(12px, -50%); min-width: 150px; max-width: 240px;
      padding: 8px 10px; background: #fff; border: 1px solid var(--viz-border); border-radius: 6px;
      box-shadow: 0 6px 18px rgba(14, 59, 43, 0.12); font-size: 0.82rem; line-height: 1.35;
    }
    .tip.flip { transform: translate(calc(-100% - 12px), -50%); }
    .tip-title { font-weight: 600; color: var(--c-ink); margin-bottom: 4px; }
    .tip-row { display: flex; align-items: center; gap: 6px; color: var(--c-muted); }
    .tip-row strong { color: var(--c-ink); font-variant-numeric: tabular-nums; }
    .key { flex: none; display: inline-block; }
    .key.line { width: 12px; height: 2px; border-radius: 1px; }
    .key.rect { width: 9px; height: 9px; border-radius: 2px; }
    .key.dot { width: 8px; height: 8px; border-radius: 50%; }
  `,
})
export class ChartTooltip {
  readonly tip = input<Tooltip | null>(null);
  /** Largeur du graphique : l'infobulle passe à gauche du pointeur près du bord droit. */
  readonly width = input(0);

  protected readonly flip = computed(() => {
    const t = this.tip();
    return !!t && t.x > this.width() - 200;
  });
}
