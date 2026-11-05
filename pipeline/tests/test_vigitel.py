import csv
import json
import zipfile

import pytest

from pipeline.sources.vigitel import VigitelSource


def test_weighted_microdata_reaches_state_profiles_without_map_layer(tmp_path):
    raw = tmp_path / 'input.zip'
    import io
    text = io.StringIO()
    writer = csv.writer(text)
    writer.writerow(['ano', 'cidade', 'q6', 'fumante', 'pesorake2025'])
    # Unequal weights: one smoker weighs three times each of nine nonsmokers.
    for year in (2020, 2021, 2023, 2024):
        for city in range(1, 28):
            writer.writerow([year, city, 30, 1, 3])
            writer.writerows([[year, city, 30, 0, 1]] * 9)
    with zipfile.ZipFile(raw, 'w') as archive:
        archive.writestr('changing-name.csv', text.getvalue())
    site = tmp_path / 'site'
    profiles = site / 'profiles'
    profiles.mkdir(parents=True)
    (profiles / 'PE.json').write_text(json.dumps({'uf': 'PE', 'indicators': {'existing': 7}}))
    source = VigitelSource(input_path=raw, clean_dir=tmp_path / 'clean', site_data_dir=site)
    source.download()
    source.clean()
    source.compute()
    source.validate()
    source.export()
    profile = json.loads((profiles / 'PE.json').read_text())
    data = profile['indicators']['smoking']['all']
    assert profile['indicators']['existing'] == 7
    assert data == profile['indicators']['smoking']['lung']
    assert data['capital_name'] == 'Recife'
    assert data['value'] == pytest.approx(25)
    # Independent survey linearization: sum(w²(y-p)²) = 5.625, sum(w) = 12.
    assert data['series'][0]['standard_error'] == pytest.approx(19.773392, abs=0.00001)
    assert data['status'] == 'far'
    assert data['trend']['trend_class'] == 'no_clear_direction'
    assert [p['year'] for p in data['series']] == [2020, 2021, 2023, 2024]
    assert len(list(profiles.glob('*.json'))) == 27
    assert not (site / 'map').exists()


def test_log_trend_and_status_are_published_from_microdata(tmp_path):
    raw = tmp_path / 'changing-name.csv'
    with raw.open('w') as file:
        writer = csv.writer(file)
        writer.writerow(['ano', 'cidade', 'q6', 'fumante', 'pesorake2025'])
        for year, prevalence in ((2010, 0.9), (2020, .09), (2021, .081), (2023, .06561), (2024, .059049)):
            for city in range(1, 28):
                writer.writerow([year, city, 30, 1, prevalence])
                writer.writerow([year, city, 30, 0, 1 - prevalence])
    source = VigitelSource(input_path=raw, clean_dir=tmp_path / 'clean', site_data_dir=tmp_path / 'site')
    source.clean()
    source.compute()
    source.export()
    data = json.loads((tmp_path / 'site/profiles/PE.json').read_text())['indicators']['smoking']['lung']
    assert data['trend']['annual_percent_change'] == pytest.approx(-10)
    assert data['trend']['first_year'] == 2020
    assert data['trend']['last_year'] == 2024
    assert data['trend']['ci_low'] < -10 < data['trend']['ci_high']
    assert data['status'] == 'near'


def test_invalid_weights_cannot_replace_profiles(tmp_path):
    raw = tmp_path / 'input.csv'
    raw.write_text('ano,cidade,q6,fumante,pesorake2025\n2024,19,30,1,nan\n')
    source = VigitelSource(input_path=raw, clean_dir=tmp_path / 'clean', site_data_dir=tmp_path / 'site')
    with pytest.raises(ValueError, match='Invalid Vigitel interview'):
        source.clean()
    assert not (tmp_path / 'site/manifest.json').exists()


@pytest.mark.parametrize(('value', 'status'), [(5.9, 'reached'), (7.4, 'near'), (7.401, 'far')])
def test_published_smoking_uses_explicit_reference_cuts(tmp_path, value, status):
    raw = tmp_path / 'input.csv'
    with raw.open('w') as file:
        writer = csv.writer(file)
        writer.writerow(['ano', 'cidade', 'q6', 'fumante', 'pesorake2025'])
        for city in range(1, 28):
            writer.writerow([2024, city, 30, 1, value])
            writer.writerow([2024, city, 30, 0, 100-value])
    source = VigitelSource(input_path=raw, clean_dir=tmp_path / 'clean', site_data_dir=tmp_path / 'site')
    source.clean()
    source.compute()
    source.export()
    data = json.loads((tmp_path / 'site/profiles/PE.json').read_text())
    assert data['indicators']['smoking']['all']['status'] == status
