"""Read the Ministry's public, qualified HPV cohort table through its Qlik app."""

import json
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright

PANEL_URL = 'https://www.gov.br/saude/pt-br/vacinacao/paineis-de-vacinacao/hpv'
APP_URL = 'https://infoms.saude.gov.br/extensions/SEIDIGI_DEMAS_VACINACAO_HPV/index.html'
TABLE_ID = 'KeWXGFP'


def download_official_cohorts(destination: Path, years: tuple[int, ...]) -> None:
    """Save aggregate numerators and Census denominators, with effective selections."""
    with sync_playwright() as playwright:
        executable = os.environ.get('CHROMIUM_PATH')
        with playwright.chromium.launch(executable_path=executable, args=['--no-sandbox']) as browser:
            page = browser.new_page()
            page.goto(PANEL_URL, wait_until='domcontentloaded', timeout=60000)
            page.goto(APP_URL, wait_until='domcontentloaded', timeout=60000)
            page.wait_for_function("typeof app !== 'undefined' && app.model", timeout=60000)
            # Let the published dashboard finish its initial default selections.
            page.wait_for_timeout(8000)
            result: dict[str, Any] = page.evaluate('''async ({years, tableId}) => {
                const timed = promise => Promise.race([promise, new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Official HPV query timed out')), 60000))]);
                await timed(app.clearAll());
                const table = await timed(app.getObject(tableId));
                const selections = await timed(app.getObject('CurrentSelections'));
                const result = {records: [], selections: {}};
                for (const year of years) {
                    await timed(app.field('Ano Referência').selectValues([year], false, true));
                    const selected = JSON.parse(JSON.stringify(await timed(selections.getLayout())));
                    const filters = selected.qSelectionObject.qSelections;
                    if (filters.length !== 1 || filters[0].qField !== 'Ano Referência'
                        || filters[0].qSelected !== String(year)) {
                        throw new Error('Unexpected official HPV selections');
                    }
                    result.selections[year] = filters.map(f => ({field: f.qField, value: f.qSelected}));
                    const layout = await timed(table.getLayout());
                    const cube = layout.qHyperCube;
                    const labels = cube.qMeasureInfo.slice(0, 3).map(m => m.qFallbackTitle);
                    if (JSON.stringify(labels) !== JSON.stringify([
                        'Cobertura 9 a 14 Anos', 'Doses 9 a 14 Anos', 'População 9 a 14 Anos'])) {
                        throw new Error('Official HPV table schema changed');
                    }
                    for (let top = 0; top < cube.qSize.qcy; top += 350) {
                        const pages = await timed(table.getHyperCubeData('/qHyperCubeDef', [{
                            qTop: top, qLeft: 0, qWidth: 9, qHeight: Math.min(350, cube.qSize.qcy - top)
                        }]));
                        for (const row of pages[0].qMatrix) {
                            result.records.push({year, municipality: row[4].qText.split(' - ')[0],
                                sex: row[5].qText, coverage: row[6].qNum,
                                vaccinated: row[7].qNum, population: row[8].qNum});
                        }
                    }
                }
                return result;
            }''', {'years': list(years), 'tableId': TABLE_ID})
    result.update(source_url=PANEL_URL, table_id=TABLE_ID,
                  extracted_at=datetime.now(UTC).date().isoformat(), years=list(years))
    destination.parent.mkdir(parents=True, exist_ok=True)
    partial = destination.with_suffix('.json.part')
    partial.write_text(json.dumps(result, ensure_ascii=False, allow_nan=False))
    partial.replace(destination)
