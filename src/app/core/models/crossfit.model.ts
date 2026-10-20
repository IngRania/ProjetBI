/** Hommes / femmes : les deux tables d'athlètes du modèle Power BI. */
export type Gender = 'F' | 'H';

/** Filtre de division : toutes, élite (Men / Women) ou masters (catégories d'âge). */
export type DivisionFilter = 'all' | 'elite' | 'masters';

/** Une ligne des tables 2019_games_athletes_women ou Men_athletes_games du .pbix. */
export interface Athlete {
  id: number;
  firstName: string;
  lastName: string;
  gender: Gender;
  country: string;
  age: number | null;
  height: number | null;
  weight: number | null;
  /** Colonne calculée « IMC (CC) ». */
  bmi: number | null;
  /** Colonne calculée « Tranche Age (CC) », ex. "2. 23-27". */
  ageBracket: string | null;
  /** Colonne calculée « Tranche IMC (CC) », ex. "3. 23-26". */
  bmiBracket: string | null;
  /** Salle affiliée (null si non affilié). */
  gym: string | null;
  /** Classement final (overallrank) ; null si non classé. */
  rank: number | null;
  division: string;
  masters: boolean;
  status: string | null;
}

export interface DaxMeasure {
  table: string;
  name: string;
  expression: string;
}

/** Contenu de public/data/crossfit-games-2019.json (généré par scripts/extract_pbix.py). */
export interface CrossfitDataset {
  source: { file: string; extractedAt: string; tables: string[] };
  ageBrackets: string[];
  bmiBrackets: string[];
  measures: DaxMeasure[];
  athletes: Athlete[];
}
