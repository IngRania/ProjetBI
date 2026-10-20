import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

export interface VisualTable {
  columns: string[];
  rows: (string | number)[][];
}

/**
 * Cadre d'un visuel du rapport : titre, sous-titre et bascule « Tableau »
 * (équivalent de « Afficher sous forme de tableau » dans Power BI).
 */
@Component({
  selector: 'app-visual-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card visual">
      <header>
        <div>
          <h2 class="visual-title">{{ heading() }}</h2>
          @if (subtitle()) { <p class="visual-sub">{{ subtitle() }}</p> }
        </div>
        @if (table()) {
          <button type="button" class="btn btn-outline btn-sm" [attr.aria-pressed]="showTable()" (click)="showTable.set(!showTable())">
            {{ showTable() ? 'Graphique' : 'Tableau' }}
          </button>
        }
      </header>
      @if (showTable() && table(); as t) {
        <div class="table-wrap">
          <table>
            <thead><tr>@for (c of t.columns; track c) { <th scope="col">{{ c }}</th> }</tr></thead>
            <tbody>
              @for (r of t.rows; track $index) {
                <tr>@for (v of r; track $index) { <td>{{ v }}</td> }</tr>
              } @empty {
                <tr><td [attr.colspan]="t.columns.length">Aucune donnée pour ce filtre.</td></tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <ng-content />
      }
    </section>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .visual { height: 100%; padding: 18px 20px; }
    header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .visual-title { font-size: 1.08rem; }
    .visual-sub { margin: 2px 0 0; color: var(--c-muted); font-size: 0.85rem; }
    .table-wrap { max-height: 360px; overflow: auto; border: 1px solid var(--c-border); border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid var(--viz-grid); }
    th { position: sticky; top: 0; background: var(--c-bg); font-weight: 600; }
    td { font-variant-numeric: tabular-nums; }
  `,
})
export class VisualCard {
  readonly heading = input.required<string>();
  readonly subtitle = input('');
  readonly table = input<VisualTable | null>(null);

  protected readonly showTable = signal(false);
}
