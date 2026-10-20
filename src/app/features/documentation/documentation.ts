import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Node {
  id: string;
  label: string;
  kind: 'fact' | 'dim' | 'sub';
  x: number;
  y: number;
  fields: string[];
}

const NODES: Node[] = [
  { id: 'fact', label: '2019_games_scores', kind: 'fact', x: 50, y: 17, fields: ['competitorid', 'gender', 'rank', 'score', 'division'] },
  { id: 'women', label: '2019_games_athletes_women', kind: 'dim', x: 23, y: 51, fields: ['competitorid', 'âge, taille, poids', 'IMC (calculée)'] },
  { id: 'men', label: 'Men_athletes_games', kind: 'dim', x: 77, y: 51, fields: ['competitorid', 'âge, taille, poids', 'IMC (calculée)'] },
  { id: 'pays', label: 'Pays', kind: 'sub', x: 11, y: 88, fields: ['countryoforigin'] },
  { id: 'salle', label: 'Salle', kind: 'sub', x: 37, y: 88, fields: ['affiliate'] },
  { id: 'age', label: 'Tranche_Age', kind: 'sub', x: 63, y: 88, fields: ['tranche'] },
  { id: 'imc', label: 'Tranche_IMC', kind: 'sub', x: 89, y: 88, fields: ['tranche'] },
];

const EDGES: [string, string][] = [
  ['fact', 'women'], ['fact', 'men'],
  ['women', 'pays'], ['women', 'salle'], ['women', 'age'], ['women', 'imc'],
  ['men', 'pays'], ['men', 'salle'], ['men', 'age'], ['men', 'imc'],
];

@Component({
  selector: 'app-documentation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './documentation.html',
  styleUrl: './documentation.scss',
})
export class Documentation {
  protected readonly nodes = NODES;
  protected readonly lines = EDGES.map(([a, b]) => {
    const from = NODES.find((n) => n.id === a)!;
    const to = NODES.find((n) => n.id === b)!;
    return { key: a + '-' + b, x1: from.x, y1: from.y, x2: to.x, y2: to.y, main: a === 'fact' };
  });

  protected readonly measures = [
    { group: "Nombre d'athlètes", items: ['Nb athlètes femmes', 'Nb athlètes hommes', 'Nb athlètes total'] },
    { group: 'Rang moyen', items: ['Rang moyen femmes', 'Rang moyen hommes', 'Rang moyen total'] },
    { group: 'Nombre de gagnants (top 10)', items: ['Nb gagnants femmes', 'Nb gagnants hommes', 'Nb gagnants total'] },
    { group: 'Mise en forme', items: ['Couleur du pays maximum (met en évidence le pays en tête)'] },
  ];
}
