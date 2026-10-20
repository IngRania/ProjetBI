import { Athlete, DivisionFilter, Gender } from '../models/crossfit.model';

/**
 * Mesures DAX du rapport CrossFit_final.pbix, recalculées en TypeScript.
 * Chaque fonction reçoit les athlètes déjà filtrés (l'équivalent du contexte de filtre Power BI).
 */

/** « Gagnant » = classé dans le top 10 (CALCULATE(..., overallrank <= 10)). */
export const WINNER_RANK = 10;

export interface Measures {
  /** Nb Athletes F / H / Total */
  athletesF: number;
  athletesH: number;
  athletesTotal: number;
  /** Rang Moyen F / H (AVERAGE : les athlètes non classés sont ignorés) */
  avgRankF: number | null;
  avgRankH: number | null;
  /** Rang Moyen Total (hommes et femmes) */
  avgRankTotal: number | null;
  /** Nb Gagnants F / H / total */
  winnersF: number;
  winnersH: number;
  winners: number;
}

export const isWinner = (a: Athlete): boolean => a.rank !== null && a.rank <= WINNER_RANK;

function average(values: number[]): number | null {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
}

function ranks(rows: readonly Athlete[], gender?: Gender): number[] {
  const out: number[] = [];
  for (const a of rows) {
    if (a.rank !== null && (!gender || a.gender === gender)) out.push(a.rank);
  }
  return out;
}

export function measures(rows: readonly Athlete[]): Measures {
  let athletesF = 0;
  let winnersF = 0;
  let winnersH = 0;
  for (const a of rows) {
    if (a.gender === 'F') athletesF++;
    if (isWinner(a)) {
      if (a.gender === 'F') winnersF++;
      else winnersH++;
    }
  }
  return {
    athletesF,
    athletesH: rows.length - athletesF,
    athletesTotal: rows.length,
    avgRankF: average(ranks(rows, 'F')),
    avgRankH: average(ranks(rows, 'H')),
    avgRankTotal: average(ranks(rows)),
    winnersF,
    winnersH,
    winners: winnersF + winnersH,
  };
}

/** Regroupe les athlètes par clé (pays, salle, tranche…) ; les clés nulles sont ignorées. */
export function groupBy(rows: readonly Athlete[], key: (a: Athlete) => string | null): Map<string, Athlete[]> {
  const groups = new Map<string, Athlete[]>();
  for (const a of rows) {
    const k = key(a);
    if (k === null || k === '') continue;
    const list = groups.get(k);
    if (list) list.push(a);
    else groups.set(k, [a]);
  }
  return groups;
}

export function filterByDivision(rows: readonly Athlete[], division: DivisionFilter): Athlete[] {
  if (division === 'all') return [...rows];
  return rows.filter((a) => a.masters === (division === 'masters'));
}

/** "2. 23-27" → "23-27" : retire le préfixe de tri des tranches. */
export function bracketLabel(bracket: string): string {
  return bracket.replace(/^\d+\.\s*/, '');
}

export const DIVISION_LABELS: Record<DivisionFilter, string> = {
  all: 'Toutes',
  elite: 'Élite',
  masters: 'Masters',
};

const integer = new Intl.NumberFormat('fr-FR');
const decimal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatInt = (v: number): string => integer.format(v);
export const formatRank = (v: number | null): string => (v === null ? '–' : decimal.format(v));
