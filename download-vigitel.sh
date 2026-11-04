#!/usr/bin/env bash
# Fetch the unified Vigitel microdata and matching documentation for manual use.
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd -- "$project_dir"
for command in curl python3 flock tee; do
  command -v "$command" >/dev/null || { printf 'Missing command: %s\n' "$command" >&2; exit 1; }
done
mkdir -p data/raw/vigitel data/logs
exec 9>data/logs/vigitel-download.lock
flock -n 9 || { printf 'Another Vigitel download is running.\n' >&2; exit 1; }
exec > >(tee -a data/logs/vigitel-download.log) 2>&1
trap 'printf "Download interrupted; rerun to retry incomplete files.\n"; exit 130' INT
page_url="${VIGITEL_PAGE_URL:-https://svs.aids.gov.br/daent/cgdnt/vigitel/}"
printf '[%s] Discovering Vigitel inputs: %s\n' "$(date -u +%FT%TZ)" "$page_url"
curl --fail --location --retry 3 --connect-timeout 30 --max-time 180 \
  "$page_url" -o data/raw/vigitel/index.html.part
python3 - "$page_url" <<'PY'
import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

root = Path('data/raw/vigitel')
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.links.extend(value for key, value in attrs if key == 'href' and value)

parser = Links()
parser.feed((root / 'index.html.part').read_text())
matches = []
for href in parser.links:
    match = re.fullmatch(r'vigitel-2006-(\d{4})-peso-rake-csv.zip', Path(urlparse(href).path).name)
    if match:
        matches.append((int(match[1]), href))
if not matches:
    raise SystemExit('No unified CSV found; inspect the official page before retrying.')
year, archive = max(matches)
urls = []
for pattern, override in [
    (re.escape(Path(urlparse(archive).path).name), 'VIGITEL_CSV_URL'),
    (rf'dicionario-vigitel-2006-{year}\.xlsx', 'VIGITEL_DICTIONARY_URL'),
    (rf'nota-metodologica-vigitel-2006-{year}\.pdf', 'VIGITEL_NOTE_URL'),
]:
    candidates = {urljoin(sys.argv[1], href) for href in parser.links
                  if re.fullmatch(pattern, Path(urlparse(href).path).name)}
    url = os.environ.get(override)
    if not url:
        if len(candidates) != 1:
            raise SystemExit(f'Expected one matching input for {override}; found {len(candidates)}')
        url = candidates.pop()
    if urlparse(url).scheme != 'https':
        raise SystemExit('Input URLs must use HTTPS')
    urls.append(url)
(root / 'urls.txt').write_text('\n'.join(urls) + '\n')
(root / 'index.html.part').replace(root / 'index.html')
PY
input_index=0
while IFS= read -r url; do
  # Stable local names keep configurable URLs independent of their remote paths.
  input_index=$((input_index + 1))
  case "$input_index" in
    1) destination='data/raw/vigitel/microdata.zip' ;;
    2) destination='data/raw/vigitel/dictionary.xlsx' ;;
    3) destination='data/raw/vigitel/methodology.pdf' ;;
  esac
  printf '\nDownloading %s -> %s\n' "$url" "$destination"
  curl --fail --location --retry 3 --connect-timeout 30 --progress-bar \
    "$url" -o "$destination.part"
  python3 - "$destination.part" "$input_index" <<'PY'
import sys
import zipfile
from pathlib import Path
path = Path(sys.argv[1])
if sys.argv[2] in ('1', '2'):
    with zipfile.ZipFile(path) as archive:
        if archive.testzip() is not None:
            raise SystemExit('Archive integrity check failed')
        if sys.argv[2] == '1' and not any(name.lower().endswith('.csv') for name in archive.namelist()):
            raise SystemExit('Microdata archive contains no CSV')
else:
    with path.open('rb') as stream:
        if stream.read(5) != b'%PDF-':
            raise SystemExit('Invalid methodology PDF')
path.replace(path.with_suffix(''))
PY
done < data/raw/vigitel/urls.txt
python3 - <<'PY'
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
root = Path('data/raw/vigitel')
files = []
for name, url in zip(('microdata.zip', 'dictionary.xlsx', 'methodology.pdf'), (root / 'urls.txt').read_text().splitlines(), strict=True):
    path = root / name
    with path.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    files.append(dict(file=name, url=url, bytes=path.stat().st_size, sha256=digest))
(root / 'download.json').write_text(json.dumps(dict(downloaded_at=datetime.now(timezone.utc).isoformat(), files=files), indent=2) + '\n')
PY
printf '\nDownload complete: data/raw/vigitel/ (provenance: download.json).\n'
printf 'No indicator computation or publication was performed.\n'
