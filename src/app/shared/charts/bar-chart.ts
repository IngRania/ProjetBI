import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface BarItem {
  label: string;
  /** Texte secondaire sous le libellé (ex. pays de la salle). */
  sub?: string;
  value: number;
  /** Texte affiché au bout de la barre. */
  text: string;
}

/** Barres horizontales à une seule série, valeur écrite au bout de chaque barre. */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="bars" [attr.aria-label]="ariaLabel()">
      @for (b of bars(); track b.label) {
        <li>
          <span class="name" [title]="b.label">{{ b.label }}@if (b.sub) {<small>{{ b.sub }}</small>}</span>
          <span class="track">
            <span class="bar" [style.width.%]="b.pct" [style.background]="color()"></span>
            <span class="value">{{ b.text }}</span>
          </span>
        </li>
      }
    </ol>
  `,
  styles: `
    :host { display: block; }
    .bars { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
    li { display: grid; grid-template-columns: minmax(120px, 38%) 1fr; align-items: center; gap: 12px; min-height: 30px; }
    .name { font-size: 0.85rem; color: var(--c-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .name small { display: block; color: var(--c-muted); font-size: 0.76rem; overflow: hidden; text-overflow: ellipsis; }
    .track { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .bar { height: 14px; min-width: 2px; border-radius: 0 4px 4px 0; }
    .value { flex: none; font-size: 0.8rem; font-weight: 600; color: var(--c-ink); font-variant-numeric: tabular-nums; }
  `,
})
export class BarChart {
  readonly items = input.required<BarItem[]>();
  readonly color = input('var(--viz-series-1)');
  readonly ariaLabel = input('');

  protected readonly bars = computed(() => {
    const max = Math.max(1, ...this.items().map((i) => i.value));
    // La barre la plus longue occupe 85 % de la piste : la valeur garde sa place au bout.
    return this.items().map((i) => ({ ...i, pct: (i.value / max) * 85 }));
  });
}
