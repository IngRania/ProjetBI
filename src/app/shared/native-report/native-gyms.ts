import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DivisionFilter } from '../../core/models/crossfit.model';
import { CrossfitDataService } from '../../core/services/crossfit-data.service';
import { Measures, filterByDivision, formatInt, formatRank, groupBy, measures } from '../../core/services/crossfit-measures';
import { BarChart, BarItem } from '../charts/bar-chart';
import { ReportFilters } from './report-filters';
import { VisualCard, VisualTable } from './visual-card';

type SortKey = 'country' | 'gym' | 'athletes' | 'winners' | 'rank';

interface GymRow {
  country: string;
  gym: string;
  m: Measures;
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Page « Salles » du rapport CrossFit_final.pbix, reconstruite en Angular :
 * table « Salles de sport affiliées par pays » enrichie des mesures du rapport.
 */
@Component({
  selector: 'app-native-gyms',
  imports: [ReportFilters, VisualCard, BarChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './native-gyms.html',
  styleUrls: ['./native-report.scss', './native-gyms.scss'],
})
export class NativeGyms {
  private readonly data = inject(CrossfitDataService);

  protected readonly dataset = this.data.dataset;
  protected readonly countries = this.data.countries;
  protected readonly formatInt = formatInt;
  protected readonly formatRank = formatRank;

  protected readonly division = signal<DivisionFilter>('all');
  /** Pays reçu de la carte du tableau de bord (exploration « Voir les salles de ce pays »). */
  protected readonly country = signal<string | null>(inject(ActivatedRoute).snapshot.queryParamMap.get('pays'));
  protected readonly search = signal('');
  protected readonly sort = signal<{ key: SortKey; dir: 1 | -1 }>({ key: 'country', dir: 1 });

  private readonly scoped = computed(() => {
    const c = this.country();
    const rows = filterByDivision(this.data.athletes(), this.division());
    return c ? rows.filter((a) => a.country === c) : rows;
  });

  /** Couples pays / salle distincts, comme le visuel table du rapport. */
  private readonly gyms = computed<GymRow[]>(() => {
    const q = normalize(this.search().trim());
    const out: GymRow[] = [];
    for (const [key, rows] of groupBy(this.scoped(), (a) => (a.gym ? `${a.country}\u0000${a.gym}` : null))) {
      const [country, gym] = key.split('\u0000');
      if (!q || normalize(gym).includes(q)) out.push({ country, gym, m: measures(rows) });
    }
    return out;
  });

  protected readonly kpi = computed(() => {
    const rows = this.gyms();
    return {
      gyms: new Set(rows.map((r) => r.gym)).size,
      countries: new Set(rows.map((r) => r.country)).size,
      athletes: rows.reduce((s, r) => s + r.m.athletesTotal, 0),
      winners: rows.reduce((s, r) => s + r.m.winners, 0),
    };
  });

  protected readonly sorted = computed(() => {
    const { key, dir } = this.sort();
    const compare = (a: GymRow, b: GymRow): number => {
      switch (key) {
        case 'country': return a.country.localeCompare(b.country) * dir;
        case 'gym': return a.gym.localeCompare(b.gym) * dir;
        case 'athletes': return (a.m.athletesTotal - b.m.athletesTotal) * dir;
        case 'winners': return (a.m.winners - b.m.winners) * dir;
        case 'rank': {
          const ra = a.m.avgRankTotal;
          const rb = b.m.avgRankTotal;
          // Les salles sans athlète classé restent en bas, quel que soit le sens du tri.
          if (ra === null || rb === null) return ra === rb ? 0 : ra === null ? 1 : -1;
          return (ra - rb) * dir;
        }
      }
    };
    return [...this.gyms()].sort(
      (a, b) => compare(a, b) || a.country.localeCompare(b.country) || a.gym.localeCompare(b.gym),
    );
  });

  private readonly topWinners = computed(() =>
    this.gyms()
      .filter((r) => r.m.winners > 0)
      .sort((a, b) => b.m.winners - a.m.winners || (a.m.avgRankTotal ?? 0) - (b.m.avgRankTotal ?? 0))
      .slice(0, 10),
  );

  protected readonly topBars = computed<BarItem[]>(() =>
    this.topWinners().map((r) => ({
      label: r.gym,
      sub: r.country,
      value: r.m.winners,
      text: `${r.m.winners} / ${r.m.athletesTotal} athlète${r.m.athletesTotal > 1 ? 's' : ''}`,
    })),
  );

  protected readonly topTable = computed<VisualTable>(() => ({
    columns: ['Salle', 'Pays', 'Gagnants', 'Athlètes', 'Rang moyen'],
    rows: this.topWinners().map((r) => [r.gym, r.country, r.m.winners, r.m.athletesTotal, formatRank(r.m.avgRankTotal)]),
  }));

  protected sortBy(key: SortKey): void {
    const s = this.sort();
    // Les nombres se lisent d'abord du plus grand au plus petit, sauf le rang (1 = meilleur).
    const first: 1 | -1 = key === 'athletes' || key === 'winners' ? -1 : 1;
    this.sort.set({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : first });
  }

  protected ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    const s = this.sort();
    return s.key !== key ? 'none' : s.dir === 1 ? 'ascending' : 'descending';
  }
}
