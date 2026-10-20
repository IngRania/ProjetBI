import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { ChartTooltip } from './chart-tooltip';
import { Tooltip, TooltipRow, hostWidth } from './chart-utils';

export interface MapValue {
  value: number;
  rows: TooltipRow[];
}

/** Noms du jeu de données (anglais, type ISO) → noms de la carte world-atlas (Natural Earth). */
const ATLAS_NAMES: Record<string, string> = {
  'United States': 'United States of America',
  'Russian Federation': 'Russia',
  'Korea, Republic of': 'South Korea',
  'Czech Republic': 'Czechia',
  'Bosnia and Herzegovina': 'Bosnia and Herz.',
  'Dominican Republic': 'Dominican Rep.',
  'Palestinian Territory': 'Palestine',
  'Syrian Arab Republic': 'Syria',
  'Viet Nam': 'Vietnam',
  'Brunei Darussalam': 'Brunei',
};

/** Petits États absents de la carte au 1/110 000 000 : affichés par un point. */
const SMALL_STATES: Record<string, [number, number]> = {
  Andorra: [1.52, 42.51],
  Bahrain: [50.56, 26.07],
  Barbados: [-59.54, 13.19],
  Malta: [14.38, 35.94],
  Mauritius: [57.55, -20.35],
  'Saint Lucia': [-60.98, 13.91],
  Singapore: [103.82, 1.35],
  Tonga: [-175.2, -21.18],
};

/** Classes de la légende : une seule teinte, du clair (peu) au foncé (beaucoup). */
export const MAP_BINS = [
  { min: 1, label: '1', color: 'var(--viz-seq-1)' },
  { min: 2, label: '2–3', color: 'var(--viz-seq-2)' },
  { min: 4, label: '4–7', color: 'var(--viz-seq-3)' },
  { min: 8, label: '8–20', color: 'var(--viz-seq-4)' },
  { min: 21, label: '21 et +', color: 'var(--viz-seq-5)' },
];

const colorFor = (v: number | undefined): string =>
  !v ? 'var(--viz-empty)' : [...MAP_BINS].reverse().find((b) => v >= b.min)!.color;

type CountryFeature = Feature<Geometry, { name: string }>;

/** Carte choroplèthe des pays (équivalent du visuel Power BI filledMap). */
@Component({
  selector: 'app-world-map',
  imports: [ChartTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plot" (mouseleave)="hover.set(null)">
      @if (layout(); as l) {
        <svg [attr.width]="l.width" [attr.height]="l.height" role="img" [attr.aria-label]="ariaLabel()">
          @for (c of l.countries; track c.atlas) {
            <path [attr.d]="c.d" [attr.fill]="c.fill" class="country" [class.clickable]="c.name"
                  [class.selected]="c.name && c.name === selected()"
                  (mousemove)="onHover($event, c.name ?? c.atlas)" (click)="c.name && pick.emit(c.name)" />
          }
          @for (s of l.small; track s.name) {
            <circle [attr.cx]="s.x" [attr.cy]="s.y" r="4" [attr.fill]="s.fill" stroke="#fff" stroke-width="2"
                    class="clickable" [class.selected]="s.name === selected()"
                    (mousemove)="onHover($event, s.name)" (click)="pick.emit(s.name)" />
          }
        </svg>
      } @else {
        <div class="loading" [style.height.px]="width() * 0.45">Chargement de la carte…</div>
      }
      <app-chart-tooltip [tip]="tooltip()" [width]="width()" />
    </div>
    <ul class="legend scale">
      <li class="caption">{{ legendTitle() }}</li>
      @for (b of bins; track b.label) {
        <li><i [style.background]="b.color"></i>{{ b.label }}</li>
      }
      <li><i class="empty"></i>Aucun</li>
    </ul>
  `,
  styleUrl: './chart.scss',
  styles: `
    .country { stroke: #fff; stroke-width: 0.5; }
    .clickable { cursor: pointer; }
    .clickable:hover { opacity: .85; }
    .selected { stroke: var(--c-ink); stroke-width: 1.5; }
    .loading { display: flex; align-items: center; justify-content: center; color: var(--c-muted); }
    .scale { margin: 10px 0 0; }
    .caption { font-weight: 600; color: var(--c-ink); }
    i.empty { background: var(--viz-empty); box-shadow: inset 0 0 0 1px var(--viz-border); }
  `,
})
export class WorldMap {
  /** Valeur par pays (nom du jeu de données). */
  readonly values = input.required<Record<string, MapValue>>();
  readonly selected = input<string | null>(null);
  readonly legendTitle = input('');
  readonly ariaLabel = input('');
  readonly pick = output<string>();

  protected readonly bins = MAP_BINS;
  protected readonly width = hostWidth();
  protected readonly hover = signal<{ name: string; x: number; y: number } | null>(null);

  private readonly topology = httpResource<Topology>(() => 'data/countries-110m.json');

  /** Fond de carte, sans l'Antarctique. */
  private readonly world = computed<FeatureCollection<Geometry, { name: string }> | null>(() => {
    if (!this.topology.hasValue()) return null;
    const topo = this.topology.value();
    const all = feature(topo, topo.objects['countries'] as GeometryCollection<{ name: string }>);
    return { ...all, features: all.features.filter((f) => f.properties.name !== 'Antarctica') };
  });

  /** Nom de la carte → nom du jeu de données. */
  private readonly dataNames = computed(() => {
    const map = new Map<string, string>();
    for (const name of Object.keys(this.values())) map.set(ATLAS_NAMES[name] ?? name, name);
    return map;
  });

  protected readonly layout = computed(() => {
    const width = this.width();
    const world = this.world();
    if (!width || !world) return null;
    // Ajuste la carte à la largeur, puis la hauteur au contenu (sans bandes vides en haut et en bas).
    const projection = geoNaturalEarth1().fitWidth(width - 8, world);
    const [[, y0], [, y1]] = geoPath(projection).bounds(world);
    const [tx, ty] = projection.translate();
    projection.translate([tx + 4, ty - y0 + 4]);
    const height = Math.ceil(y1 - y0) + 8;
    const path = geoPath(projection);
    const values = this.values();
    const names = this.dataNames();
    const selected = this.selected();
    const countries = world.features
      .map((f: CountryFeature) => {
        const name = names.get(f.properties.name) ?? null;
        return { atlas: f.properties.name, name, d: path(f) ?? '', fill: colorFor(name ? values[name]?.value : 0) };
      })
      // Le pays sélectionné est dessiné en dernier pour que son contour reste visible.
      .sort((a, b) => Number(a.name === selected) - Number(b.name === selected));
    const small = Object.entries(SMALL_STATES)
      .filter(([name]) => values[name]?.value > 0)
      .map(([name, lonLat]) => {
        const [x, y] = projection(lonLat) ?? [0, 0];
        return { name, x, y, fill: colorFor(values[name].value) };
      });
    return { width, height, countries, small };
  });

  protected readonly tooltip = computed<Tooltip | null>(() => {
    const h = this.hover();
    if (!h) return null;
    const v = this.values()[h.name];
    return { x: h.x, y: h.y, title: h.name, rows: v ? v.rows : [{ label: 'aucun athlète', value: '0' }] };
  });

  protected onHover(event: MouseEvent, name: string): void {
    const svg = (event.target as SVGElement).ownerSVGElement!;
    const rect = svg.getBoundingClientRect();
    this.hover.set({ name, x: event.clientX - rect.left, y: event.clientY - rect.top });
  }
}
