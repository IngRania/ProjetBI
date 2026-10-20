import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DivisionFilter } from '../../core/models/crossfit.model';
import { DIVISION_LABELS } from '../../core/services/crossfit-measures';

/** Ligne de filtres placée au-dessus des visuels : elle s'applique à toute la page (comme les segments Power BI). */
@Component({
  selector: 'app-report-filters',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters" role="group" aria-label="Filtres du rapport">
      <div class="segmented" role="radiogroup" aria-label="Division">
        @for (d of divisions; track d) {
          <button type="button" role="radio" [attr.aria-checked]="division() === d" [class.on]="division() === d"
                  (click)="division.set(d)">{{ labels[d] }}</button>
        }
      </div>
      <label class="sr-only" for="filter-country">Pays</label>
      <select id="filter-country" class="input" [ngModel]="country() ?? ''" (ngModelChange)="country.set($event || null)">
        <option value="">Tous les pays</option>
        @for (c of countries(); track c) { <option [value]="c">{{ c }}</option> }
      </select>
      @if (searchable()) {
        <label class="sr-only" for="filter-search">Rechercher une salle</label>
        <input id="filter-search" type="search" class="input" placeholder="Rechercher une salle…"
               [ngModel]="search()" (ngModelChange)="search.set($event)" />
      }
      @if (division() !== 'all' || country() || search()) {
        <button type="button" class="btn btn-outline btn-sm" (click)="reset()">Réinitialiser</button>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .filters { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 16px; }
    .input { width: auto; min-width: 200px; min-height: 38px; }
    input.input { min-width: 220px; }
    .segmented { display: inline-flex; background: #fff; border: 1px solid var(--c-border); border-radius: 6px; padding: 3px; }
    .segmented button {
      border: 0; background: transparent; font: inherit; font-size: 0.88rem; font-weight: 600; color: var(--c-muted);
      padding: 5px 14px; border-radius: 4px; cursor: pointer; min-height: 30px;
    }
    .segmented button.on { background: var(--c-primary); color: #fff; }
    .segmented button:not(.on):hover { color: var(--c-ink); }
    @media (max-width: 560px) { .input, input.input { flex: 1 1 100%; min-width: 0; } }
  `,
})
export class ReportFilters {
  readonly countries = input.required<string[]>();
  readonly searchable = input(false);
  readonly division = model<DivisionFilter>('all');
  readonly country = model<string | null>(null);
  readonly search = model('');

  protected readonly divisions: DivisionFilter[] = ['all', 'elite', 'masters'];
  protected readonly labels = DIVISION_LABELS;

  protected reset(): void {
    this.division.set('all');
    this.country.set(null);
    this.search.set('');
  }
}
