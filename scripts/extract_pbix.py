"""
Extrait les données du rapport Power BI (CrossFit_final.pbix) vers un fichier JSON
lu par le portail Angular (public/data/crossfit-games-2019.json).

Le fichier .pbix ne peut pas être affiché tel quel dans un navigateur : ce script lit
son modèle de données (tables, colonnes calculées) avec la bibliothèque pbixray, et le
portail recalcule ensuite les mesures DAX du rapport (voir crossfit-measures.ts).

Utilisation (à relancer après chaque modification du .pbix) :
    pip install pbixray
    python scripts/extract_pbix.py
"""

import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

from pbixray import PBIXRay

ROOT = Path(__file__).resolve().parent.parent
PBIX = ROOT / 'CrossFit_final.pbix'
OUTPUT = ROOT / 'public' / 'data' / 'crossfit-games-2019.json'

# Mêmes exclusions que la table calculée DAX « Salle ».
NO_GYM = {'', 'unaffected', 'unaffiliated'}


def clean(value):
    """Convertit les valeurs pandas (NA, NaN, numpy) en valeurs JSON."""
    if value is None:
        return None
    try:
        if value != value:  # NaN / NA
            return None
    except TypeError:
        return None
    if hasattr(value, 'item'):
        value = value.item()
    if isinstance(value, float) and math.isinf(value):
        return None
    return value


def text(value):
    value = clean(value)
    if value is None:
        return None
    value = str(value).strip()
    # Certains noms ont été mal encodés dans les fichiers Excel sources (ex. "MalmÃ¶" pour "Malmö").
    if 'Ã' in value or 'Â' in value:
        try:
            value = value.encode('cp1252').decode('utf-8')
        except UnicodeError:
            pass
    return value


def athletes(model, table, gender, division_column):
    rows = []
    for r in model.get_table(table).to_dict('records'):
        gym = text(r['affiliatename'])
        division = text(r[division_column]) or ''
        if division_column == 'Divisions':
            # Colonne Power Query : "We" = division Women, "Wm" = divisions Masters.
            division = 'Women' if division == 'We' else 'Women (Masters)'
        bmi = clean(r['IMC (CC)'])
        rows.append({
            'id': clean(r['competitorid']),
            'firstName': text(r['firstname']),
            'lastName': text(r['lastname']),
            'gender': gender,
            'country': text(r['country']),
            'age': clean(r['age']),
            'height': clean(r['height']),
            'weight': clean(r['weight']),
            'bmi': round(bmi, 2) if bmi is not None else None,
            'ageBracket': text(r['Tranche Age (CC)']),
            'bmiBracket': text(r['Tranche IMC (CC)']),
            'gym': None if gym is None or gym.lower() in NO_GYM else gym,
            'rank': clean(r['overallrank']),
            'division': division,
            'masters': division not in ('Men', 'Women'),
            'status': text(r['status']),
        })
    return rows


def main():
    pbix = Path(sys.argv[1]) if len(sys.argv) > 1 else PBIX
    model = PBIXRay(str(pbix))

    measures = [
        {'table': r['TableName'], 'name': r['Name'], 'expression': r['Expression'].strip()}
        for r in model.dax_measures.to_dict('records')
    ]
    data = {
        'source': {
            'file': pbix.name,
            'extractedAt': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
            'tables': list(model.tables),
        },
        'ageBrackets': [text(v) for v in model.get_table('Tranche_Age')['Tranche Age']],
        'bmiBrackets': [text(v) for v in model.get_table('Tranche_IMC')['Tranche IMC']],
        'measures': measures,
        'athletes': athletes(model, '2019_games_athletes_women', 'F', 'Divisions')
        + athletes(model, 'Men_athletes_games', 'H', 'division'),
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f"{len(data['athletes'])} athlètes extraits de {pbix.name} -> {OUTPUT.relative_to(ROOT)}")


if __name__ == '__main__':
    main()
