import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Athlete, DivisionFilter } from '../../core/models/crossfit.model';
import { AuthService } from '../../core/services/auth.service';
import { CrossfitDataService } from '../../core/services/crossfit-data.service';
import {
  Measures, bracketLabel, filterByDivision, formatInt, formatRank, groupBy, measures,
} from '../../core/services/crossfit-measures';
import { SERIES_COLORS, ChartSeries, TooltipRow } from '../charts/chart-utils';
import { ColumnChart } from '../charts/column-chart';
import { LineChart } from '../charts/line-chart';
import { ScatterChart, ScatterPoint } from '../charts/scatter-chart';
import { MapValue, WorldMap } from '../charts/world-map';
import { ReportFilters } from './report-filters';
import { VisualCard, VisualTable } from './visual-card';

/**
 * Page « Tableau de bord » du rapport CrossFit_final.pbix, reconstruite en Angular :
 * carte des pays gagnants, morphologie (IMC), tranches d'âge et performance des femmes par pays.
 * Cliquer sur un pays (carte ou nuage de points) filtre les autres visuels, comme dans Power BI.
 */
@Component({
  selector: 'app-native-dashboard',
  imports: [RouterLink, ReportFilters, VisualCard, WorldMap, LineChart, ColumnChart, ScatterChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './native-dashboard.html',
  styleUrl: './native-report.scss',
})
export class NativeDashboard {
  private readonly data = inject(CrossfitDataService);
  private readonly auth = inject(AuthService);

  protected readonly dataset = this.data.dataset;
  protected readonly countries = this.data.countries;
  protected readonly colors = SERIES_COLORS;
  protected readonly formatRank = formatRank;
  protected readonly formatInt = formatInt;

  protected readonly division = signal<DivisionFilter>('all');
  protected readonly country = signal<string | null>(null);
  /** Lien d'exploration vers la page Salles (rôles qui y ont accès). */
  protected readonly canDrill = computed(() => this.auth.hasRole('ADMIN', 'ATHLETE'));

  /** Athlètes filtrés par division : la carte et le nuage de points montrent tous les pays. */
  private readonly base = computed(() => filterByDivision(this.data.athletes(), this.division()));
  /** Athlètes filtrés par division et par pays : indicateurs, IMC et tranches d'âge. */
  private readonly scoped = computed(() => {
    const c = this.country();
    return c ? this.base().filter((a) => a.country === c) : this.base();
  });

  protected readonly kpi = computed(() => {
    const rows = this.scoped();
    return {
      ...measures(rows),
      countries: new Set(rows.map((a) => a.country)).size,
      gyms: new Set(rows.map((a) => a.gym).filter(Boolean)).size,
    };
  });

  private readonly byCountry = computed(() => {
    const out: { country: string; m: Measures }[] = [];
    for (const [country, rows] of groupBy(this.base(), (a) => a.country)) out.push({ country, m: measures(rows) });
    return out;
  });

  // ---------- Pays qui compte le plus de gagnants (filledMap) ----------
  protected readonly mapValues = computed(() => {
    const values: Record<string, MapValue> = {};
    for (const { country, m } of this.byCountry()) {
      values[country] = {
        value: m.winners,
        rows: [
          { label: 'gagnants (top 10)', value: formatInt(m.winners) },
          { label: 'hommes', value: formatInt(m.winnersH), color: SERIES_COLORS.H, shape: 'rect' },
          { label: 'femmes', value: formatInt(m.winnersF), color: SERIES_COLORS.F, shape: 'rect' },
          { label: 'athlètes', value: formatInt(m.athletesTotal) },
        ],
      };
    }
    return values;
  });

  private readonly winnersRanking = computed(() =>
    this.byCountry()
      .filter((c) => c.m.winners > 0)
      .sort((a, b) => b.m.winners - a.m.winners || a.country.localeCompare(b.country)),
  );

  /** Mesure « Couleur Max » : le pays en tête est mis en évidence. */
  protected readonly mapSubtitle = computed(() => {
    const top = this.winnersRanking()[0];
    return top
      ? `En tête : ${top.country} (${formatInt(top.m.winners)} gagnants). Cliquez sur un pays pour filtrer le rapport.`
      : 'Aucun gagnant pour ce filtre.';
  });

  protected readonly mapTable = computed<VisualTable>(() => ({
    columns: ['Pays', 'Gagnants', 'Hommes', 'Femmes', 'Athlètes'],
    rows: this.winnersRanking().map(({ country, m }) => [country, m.winners, m.winnersH, m.winnersF, m.athletesTotal]),
  }));

  // ---------- Meilleure morphologie (IMC) (lineChart) ----------
  private readonly bmi = computed(() =>
    this.byBracket(this.dataset.hasValue() ? this.dataset.value().bmiBrackets : [], (a) => a.bmiBracket),
  );

  protected readonly bmiCategories = computed(() => this.bmi().map((b) => b.label));
  protected readonly bmiSeries = computed<ChartSeries[]>(() => [
    { key: 'H', label: 'Rang moyen hommes', color: SERIES_COLORS.H, values: this.bmi().map((b) => b.m.avgRankH) },
    { key: 'F', label: 'Rang moyen femmes', color: SERIES_COLORS.F, values: this.bmi().map((b) => b.m.avgRankF) },
  ]);
  protected readonly bmiExtra = computed<TooltipRow[][]>(() =>
    this.bmi().map((b) => [{ label: 'athlètes', value: formatInt(b.m.athletesTotal) }]),
  );
  protected readonly bmiTable = computed<VisualTable>(() => ({
    columns: ['Tranche IMC', 'Rang moyen hommes', 'Rang moyen femmes', 'Athlètes'],
    rows: this.bmi().map((b) => [b.label, formatRank(b.m.avgRankH), formatRank(b.m.avgRankF), b.m.athletesTotal]),
  }));

  // ---------- Tranche d'âge la plus gagnante (clusteredColumnChart) ----------
  private readonly age = computed(() =>
    this.byBracket(this.dataset.hasValue() ? this.dataset.value().ageBrackets : [], (a) => a.ageBracket),
  );

  protected readonly ageCategories = computed(() => this.age().map((b) => b.label));
  protected readonly ageSeries = computed<ChartSeries[]>(() => [
    { key: 'H', label: 'Gagnants hommes', color: SERIES_COLORS.H, values: this.age().map((b) => b.m.winnersH) },
    { key: 'F', label: 'Gagnants femmes', color: SERIES_COLORS.F, values: this.age().map((b) => b.m.winnersF) },
  ]);
  protected readonly ageTable = computed<VisualTable>(() => ({
    columns: ["Tranche d'âge", 'Gagnants hommes', 'Gagnants femmes', 'Athlètes'],
    rows: this.age().map((b) => [b.label, b.m.winnersH, b.m.winnersF, b.m.athletesTotal]),
  }));

  // ---------- Performance des femmes par origine (scatterChart) ----------
  private readonly women = computed(() =>
    this.byCountry()
      .filter((c) => c.m.athletesF > 0 && c.m.avgRankF !== null)
      .sort((a, b) => b.m.athletesF - a.m.athletesF || a.m.avgRankF! - b.m.avgRankF!),
  );

  protected readonly womenPoints = computed<ScatterPoint[]>(() =>
    this.women().map(({ country, m }) => ({
      key: country,
      x: m.athletesF,
      y: m.avgRankF!,
      rows: [
        { label: 'athlètes femmes', value: formatInt(m.athletesF), color: SERIES_COLORS.F, shape: 'dot' },
        { label: 'rang moyen', value: formatRank(m.avgRankF) },
      ],
    })),
  );
  /** Étiquettes directes : seulement les pays les plus représentés. */
  protected readonly womenLabels = computed(() => this.women().slice(0, 6).map((c) => c.country));
  protected readonly womenTable = computed<VisualTable>(() => ({
    columns: ['Pays', 'Athlètes femmes', 'Rang moyen femmes'],
    rows: this.women().map(({ country, m }) => [country, m.athletesF, formatRank(m.avgRankF)]),
  }));

  protected toggleCountry(country: string): void {
    this.country.set(this.country() === country ? null : country);
  }

  /** Mesures pour chaque tranche (IMC ou âge), dans l'ordre des tables DAX Tranche_IMC / Tranche_Age. */
  private byBracket(brackets: string[], key: (a: Athlete) => string | null) {
    const groups = groupBy(this.scoped(), key);
    return brackets.map((b) => ({ label: bracketLabel(b), m: measures(groups.get(b) ?? []) }));
  }
}
