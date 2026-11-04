#!/usr/bin/env bash
# Download annual HPV partitions with progress and logs in the same terminal.
set -euo pipefail
shopt -s nullglob

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd -- "$project_dir"

if ! command -v uv >/dev/null 2>&1; then
  printf 'Error: uv is required to run the pipeline.\n' >&2
  exit 1
fi

mkdir -p data/logs
exec 9>data/logs/hpv-download.lock
if ! flock -n 9; then
  printf 'Another HPV download script is already running.\n' >&2
  exit 1
fi

worker_pid=''
cleanup() {
  if [[ -n "$worker_pid" ]]; then
    kill -TERM "$worker_pid" 2>/dev/null || true
    wait "$worker_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT
trap 'printf "\nDownload interrupted. Completed extracts are kept.\n"; exit 130' INT
trap 'exit 143' TERM

show_progress() {
  local stage='Preparing inputs / checking cache' file_name='-' file_size='-'
  local archive size elapsed
  local partials=(data/raw/hpv/*.zip.part)
  local archives=(data/raw/hpv/*.zip)
  local extracts=(data/clean/hpv/months/"$year"/*.parquet)

  if ((${#partials[@]})); then
    archive="${partials[0]}"
    stage='Downloading'
  elif ((${#archives[@]})); then
    archive="${archives[0]}"
    stage='Processing ZIP'
  else
    archive=''
  fi

  if [[ -n "$archive" ]]; then
    file_name="${archive##*/}"
    size="$(stat -c%s -- "$archive" 2>/dev/null || printf '0')"
    file_size="$(numfmt --to=iec --suffix=B "$size")"
  fi
  elapsed=$((SECONDS - year_started))
  if [[ -t 1 ]]; then
    printf '\r\033[2K'
  fi
  printf 'Year %s | %s | %s %s | Extracts present: %s/%s | Elapsed: %02d:%02d:%02d' \
    "$year" "$stage" "$file_name" "$file_size" "${#extracts[@]}" "$expected_months" \
    "$((elapsed / 3600))" "$((elapsed / 60 % 60))" "$((elapsed % 60))"
  if [[ ! -t 1 ]]; then
    printf '\n'
  fi
}

last_year="$(date -u +%Y)"
for ((year = 2020; year <= last_year; year++)); do
  log_file="data/logs/hpv-${year}.log"
  year_started=$SECONDS
  expected_months=12
  if ((year == last_year)); then
    expected_months=$((10#$(date -u +%m) - 1))
  fi
  printf '\n[%s] Starting HPV year %s\n' "$(date -u +%FT%TZ)" "$year" | tee -a "$log_file"
  printf 'Log: %s/%s\n' "$project_dir" "$log_file"

  uv run python -u -m pipeline run \
    --source hpv --step download --year "$year" >> "$log_file" 2>&1 &
  worker_pid=$!
  while kill -0 "$worker_pid" 2>/dev/null; do
    show_progress
    sleep 5
  done
  show_progress
  printf '\n'

  if wait "$worker_pid"; then
    worker_pid=''
  else
    result=$?
    worker_pid=''
    printf '\nDownload stopped in %s. Last log lines:\n' "$year" >&2
    tail -n 20 "$log_file" >&2
    printf '\nFull log: %s\nRun this script again to reuse compatible completed extracts.\n' "$log_file" >&2
    exit "$result"
  fi
  printf '[%s] Completed HPV year %s\n' "$(date -u +%FT%TZ)" "$year" | tee -a "$log_file"
done

printf '\nAll annual downloads completed. Extracts: data/clean/hpv/\n'
printf 'Indicator computation, official validation and publication are separate steps.\n'
