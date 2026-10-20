import { httpResource } from '@angular/common/http';
import { Injectable, computed } from '@angular/core';
import { CrossfitDataset } from '../models/crossfit.model';

/**
 * Données du rapport Power BI, extraites de CrossFit_final.pbix par scripts/extract_pbix.py.
 * Le fichier JSON est chargé une seule fois, puis partagé par toutes les pages.
 */
@Injectable({ providedIn: 'root' })
export class CrossfitDataService {
  readonly dataset = httpResource<CrossfitDataset>(() => 'data/crossfit-games-2019.json');

  readonly athletes = computed(() => (this.dataset.hasValue() ? this.dataset.value().athletes : []));

  /** Liste triée des pays (équivalent de la table calculée DAX « Pays »). */
  readonly countries = computed(() =>
    [...new Set(this.athletes().map((a) => a.country).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
  );
}
