#!/usr/bin/env bash
# Rebuild the self-hosted Inter subset and its license in site/public/fonts/.
# Inter has no Reserved Font Name, so the OFL allows publishing a subset under the same name.
# Needs uv and network access. The official release is pinned by hash.
set -euo pipefail

VERSION=4.1
SHA256=9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e
URL="https://github.com/rsms/inter/releases/download/v${VERSION}/Inter-${VERSION}.zip"

# Basic Latin, Latin-1, Latin Extended-A, typographic punctuation, arrows and the math
# signs the site prints, including the >= that the usual "latin" subsets leave out.
UNICODES="U+0020-007E,U+00A0-017F,U+2010-2015,U+2018-201E,U+2022,U+2026,U+2190-2193,U+2212,U+2264,U+2265"
# Only the features the site uses; tnum gives the tabular figures.
FEATURES="kern,liga,calt,ccmp,locl,mark,mkmk,case,tnum"

fonts_dir="$(cd "$(dirname "$0")/../public" && pwd)/fonts"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
mkdir -p "$fonts_dir" "$work/release"

curl -fsSL -o "$work/release/inter.zip" "$URL"
echo "$SHA256  $work/release/inter.zip" | sha256sum --check --quiet
unzip -q -j "$work/release/inter.zip" InterVariable.ttf LICENSE.txt -d "$work/release"

python() { uv run --quiet --no-project --isolated --with 'fonttools[woff]==4.61.1' python -I "$@"; }
fonttools() { python -m fontTools "$@"; }

# Fix the optical size and keep the weights the design uses (400 to 600, with room to 700).
fonttools varLib.instancer "$work/release/InterVariable.ttf" opsz=14 wght=400:700 -o "$work/instance.ttf"
python "$(dirname "$0")/keep-tabular-figures.py" "$work/instance.ttf" "$work/figures.ttf"
fonttools subset "$work/figures.ttf" \
  --unicodes="$UNICODES" --layout-features="$FEATURES" --flavor=woff2 \
  --output-file="$fonts_dir/InterVariable-subset.woff2"
cp "$work/release/LICENSE.txt" "$fonts_dir/OFL.txt"
ls -l "$fonts_dir"
