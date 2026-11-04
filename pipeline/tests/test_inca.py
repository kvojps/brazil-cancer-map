import json
from pathlib import Path

from pipeline.sources.inca import IncaSource


def test_source_exports_annual_estimates_only_in_profiles_and_preserves_other_data(tmp_path):
    profiles = tmp_path / 'profiles'
    profiles.mkdir()
    (profiles / 'PE.json').write_text(json.dumps({'uf': 'PE', 'indicators': {'existing': {'value': 7}}}))
    source = IncaSource(site_data_dir=tmp_path)
    source.download()
    source.clean()
    source.compute()
    source.validate()
    source.export()
    profile = json.loads((profiles / 'PE.json').read_text())
    assert profile['indicators']['existing'] == {'value': 7}
    estimates = profile['indicators']['estimated_cases']
    assert estimates['all']['state_cases'] == 19790
    assert estimates['all']['capital_cases'] == 4400
    assert estimates['breast']['state_cases'] == 3190
    assert estimates['cervix']['capital_cases'] == 160
    assert estimates['all']['capital_name'] == 'Recife'
    assert estimates['all']['annual_year'] == 2026
    assert not {'trend', 'reference', 'series', 'status'} & estimates['all'].keys()
    assert len(list(profiles.glob('*.json'))) == 27
    assert not (tmp_path / 'map').exists()
    assert json.loads((tmp_path / 'manifest.json').read_text())['sources']['inca']['extracted_at'] == '2026-11-04'


def test_invalid_manual_input_cannot_replace_published_profiles(tmp_path):
    import pytest
    from pipeline.sources.inca import INPUT

    data = json.loads(INPUT.read_text())
    profile = tmp_path / 'profiles' / 'PE.json'
    profile.parent.mkdir()
    original = '{"uf":"PE","indicators":{"existing":true}}'
    profile.write_text(original)
    source_path = tmp_path / 'input.json'
    for mutate in (
        lambda d: d['states'].pop('AC'),
        lambda d: d['states']['PE']['capital'].pop('lung'),
        lambda d: d['states']['PE'].update(capital_name='São Paulo'),
        lambda d: d['states']['PE']['state'].update(all=-10),
        lambda d: d['states']['PE']['state'].update(all=True),
        lambda d: d['states']['PE']['capital'].update(all=9999990),
        lambda d: d.update(extracted_at='invalid'),
        lambda d: d['source'].update(url=''),
    ):
        invalid = json.loads(json.dumps(data))
        mutate(invalid)
        source_path.write_text(json.dumps(invalid))
        with pytest.raises(ValueError):
            IncaSource(input_path=source_path, site_data_dir=tmp_path).export()
        assert profile.read_text() == original
        assert not (tmp_path / 'manifest.json').exists()
