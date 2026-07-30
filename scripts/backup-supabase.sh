#!/usr/bin/env bash
set -euo pipefail

command -v supabase >/dev/null || {
  echo "Supabase CLI mangler." >&2
  exit 1
}
command -v age >/dev/null || {
  echo "age mangler. Installér age og brug skolens godkendte modtagernøgle." >&2
  exit 1
}

: "${ELEVSPOR_BACKUP_DIR:?Angiv en eksisterende, skolegodkendt backupmappe i ELEVSPOR_BACKUP_DIR.}"
: "${ELEVSPOR_BACKUP_AGE_RECIPIENT:?Angiv skolens age-modtagernøgle i ELEVSPOR_BACKUP_AGE_RECIPIENT.}"

[[ -d "$ELEVSPOR_BACKUP_DIR" ]] || {
  echo "Backupmappen findes ikke: $ELEVSPOR_BACKUP_DIR" >&2
  exit 1
}
[[ "$ELEVSPOR_BACKUP_AGE_RECIPIENT" == age1* ]] || {
  echo "Modtagernøglen ligner ikke en age-nøgle." >&2
  exit 1
}

backup_stamp="$(date -u +%Y%m%dT%H%M%SZ)"
temporary_dir="$(mktemp -d)"
plain_dump="$temporary_dir/elevspor-$backup_stamp.sql"
encrypted_dump="$ELEVSPOR_BACKUP_DIR/elevspor-$backup_stamp.sql.age"
checksum_file="$encrypted_dump.sha256"

cleanup() {
  rm -rf -- "$temporary_dir"
}
trap cleanup EXIT

umask 077
supabase db dump \
  --linked \
  --data-only \
  --use-copy \
  --schema public \
  --file "$plain_dump"

age --recipient "$ELEVSPOR_BACKUP_AGE_RECIPIENT" \
  --output "$encrypted_dump" \
  "$plain_dump"
sha256sum "$encrypted_dump" > "$checksum_file"

echo "Krypteret backup oprettet:"
echo "$encrypted_dump"
echo "$checksum_file"
echo "Flyt filerne til skolens godkendte off-site-lager og registrér kontrollen."
