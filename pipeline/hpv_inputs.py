"""Official fixed inputs for the HPV cohort: Census 2022 and consolidated D1."""

import json
import re
import urllib.request
from datetime import UTC, datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlencode

import duckdb

from pipeline.download import fetch, with_retries

CENSUS_URL = ('https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/93'
              '?localidades=N6%5Ball%5D&classificacao=2%5B4,5%5D%7C287%5B6566,6567,6568,6569,6570,6571%5D%7C286%5B113635%5D')
TABNET_FORM = 'http://tabnet.datasus.gov.br/cgi/dhdat.exe?bd_pni/dpnibr.def'
TABNET_QUERY = 'http://tabnet.datasus.gov.br/cgi/webtabx.exe?bd_pni/dpnibr.def'


class _Form(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.values: dict[str, list[str]] = {}
        self.select: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == 'select':
            self.select = attributes.get('name')
            if self.select:
                self.values[self.select] = []
        elif tag == 'option' and self.select and attributes.get('value'):
            self.values[self.select].append(attributes['value'] or '')

    def handle_endtag(self, tag: str) -> None:
        if tag == 'select':
            self.select = None


def download_fixed_inputs(raw_dir: Path, clean_dir: Path) -> None:
    """Fetch historical inputs once; keep source responses for reproducibility."""
    raw_dir.mkdir(parents=True, exist_ok=True)
    clean_dir.mkdir(parents=True, exist_ok=True)
    if not (clean_dir / 'census.parquet').exists():
        results = []
        # The IBGE endpoint rejects requests with more than 50,000 cells.
        for category in ('4', '5'):
            path = raw_dir / f'census-{category}.json'
            fetch(CENSUS_URL.replace('2%5B4,5%5D', f'2%5B{category}%5D'), path)
            results.extend(json.loads(path.read_text())[0]['resultados'])
        path = raw_dir / 'census.json'
        path.write_text(json.dumps([{'resultados': results}]))
        clean_census(path, clean_dir / 'census.parquet')
    if (clean_dir / 'legacy.parquet').exists() and (clean_dir / 'legacy.json').exists():
        return
    form_path = raw_dir / 'tabnet-form.html'
    fetch(TABNET_FORM, form_path)
    parser = _Form()
    parser.feed(form_path.read_bytes().decode('latin1'))
    values = parser.values
    ages = [v for v in values['SFaixa_Etária'] if v.split('|')[0] in {f'{age} anos' for age in range(9, 15)}]
    if len(ages) != 6:
        raise ValueError('TabNet no longer exposes the six simple ages for HPV')
    records = []
    for year in range(2015, 2020):
        for sex, label in [('F', 'Feminino'), ('M', 'Masculino')]:
            payload: dict[str, str | list[str]] = {name: 'TODAS_AS_CATEGORIAS__' for name in values if name.startswith('S')}
            payload.update({
                'Linha': next(v for v in values['Linha'] if v.startswith('Município|')),
                'Coluna': next(v for v in values['Coluna'] if v.startswith('Faixa_Etária|')),
                'Incremento': next(v for v in values['Incremento'] if v.startswith('Doses_aplicadas|')),
                'PAno': next(v for v in values['PAno'] if v.startswith(f'{year}|')),
                'nomedef': 'bd_pni/dpnibr.def',
                'SImunobiológicos': next(v for v in values['SImunobiológicos'] if v.startswith(f'HPV Quadrivalente - {label}|')),
                'SDose': next(v for v in values['SDose'] if v.startswith('1ª dose|')),
                'SFaixa_Etária': ages,
            })
            request = urllib.request.Request(TABNET_QUERY, data=urlencode(payload, doseq=True, encoding='latin1').encode('ascii'))
            path = raw_dir / f'tabnet-{year}-{sex}.html'
            def query() -> bytes:
                with urllib.request.urlopen(request, timeout=180) as response:
                    return bytes(response.read())
            body = with_retries(query, f'query TabNet HPV {year}/{sex}')
            path.write_bytes(body)
            records.extend(parse_legacy_table(body.decode('latin1'), year, sex))
    destination = clean_dir / 'legacy.parquet'
    with duckdb.connect() as db:
        db.execute('CREATE TABLE legacy (year INTEGER, municipality VARCHAR, sex VARCHAR, age INTEGER, vaccinated BIGINT)')
        db.executemany('INSERT INTO legacy VALUES (?,?,?,?,?)', records)
        db.execute('COPY legacy TO ? (FORMAT PARQUET)', [str(destination)])
    (clean_dir / 'legacy.json').write_text(json.dumps({
        'source_url': TABNET_FORM, 'complete_years': list(range(2015, 2020)), 'dose': 'D1',
        'extracted_at': datetime.now(UTC).date().isoformat(),
    }))


def parse_legacy_table(html: str, year: int, sex: str) -> list[tuple[int, str, str, int, int]]:
    """Read the official table's embedded values, checking its national total."""
    columns = re.findall(r"data.addColumn\('number','([^']+)'\)", html)
    if set(columns) != {f'{age} anos' for age in range(9, 15)} | {' Total'}:
        raise ValueError(f'TabNet HPV {year}/{sex}: missing age columns')
    block = html.split('data.addRows([', 1)[-1].split(']);', 1)[0]
    records: list[tuple[int, str, str, int, int]] = []
    reported_total = None
    total = 0
    for name, cells in re.findall(r'\["([^"\n]+)"\s*,(.*?)\]', block, re.DOTALL):
        numbers = [int(float(value)) for value in re.findall(r'\{v:\s*([\d.]+)', cells)]
        if len(numbers) != len(columns):
            raise ValueError(f'TabNet HPV {year}/{sex}: malformed row')
        if name.strip() == 'Total':
            reported_total = numbers[columns.index(' Total')]
            continue
        if not re.match(r'^\d{6} ', name):
            if any(numbers):
                raise ValueError(f'TabNet HPV {year}/{sex}: doses without a municipality')
            continue
        row_total = sum(numbers[i] for i, column in enumerate(columns) if column != ' Total')
        if row_total != numbers[columns.index(' Total')]:
            raise ValueError('TabNet HPV age counts do not sum to the municipality total')
        total += row_total
        records.extend((year, name[:6], sex, int(column.split()[0]), numbers[i])
                       for i, column in enumerate(columns) if column != ' Total')
    if not records or reported_total != total:
        raise ValueError(f'TabNet HPV {year}/{sex}: incomplete national table')
    return records


def clean_census(path: Path, destination: Path) -> None:
    data = json.loads(path.read_text())
    records = []
    for result in data[0]['resultados']:
        categories = {str(c['id']): next(iter(c['categoria'])) for c in result['classificacoes']}
        sex = {'4': 'M', '5': 'F'}[categories['2']]
        age = int(categories['287']) - 6557
        if categories['286'] != '113635' or age not in range(9, 15):
            raise ValueError('unexpected SIDRA 9514 age/declaration slice')
        for item in result['series']:
            code = item['localidade']['id'][:6]
            value = item['serie']['2022']
            if value == '-':
                value = '0'
            if not value.isdigit():
                raise ValueError(f'Census 2022 population missing for {code}')
            records.append((code, sex, age, int(value)))
    if not records:
        raise ValueError('empty Census 2022 extract')
    destination.parent.mkdir(parents=True, exist_ok=True)
    partial = destination.with_suffix('.parquet.part')
    with duckdb.connect() as db:
        db.execute('CREATE TABLE census (municipality VARCHAR, sex VARCHAR, age INTEGER, population BIGINT)')
        db.executemany('INSERT INTO census VALUES (?,?,?,?)', records)
        db.execute('COPY census TO ? (FORMAT PARQUET)', [str(partial)])
    partial.replace(destination)
