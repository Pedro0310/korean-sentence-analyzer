#!/usr/bin/env bash
# Downloads the Kiwi model into public/model/ (git-ignored, ~84 MB).
# Runs as part of the Render build; locally it does nothing if the model is there.
# The model version must match kiwi-nlp in package.json.
set -euo pipefail

VERSION=0.24.1
DIR="$(cd "$(dirname "$0")/.." && pwd)/public/model"
FILES=(combiningRule.txt cong.mdl default.dict dialect.dict extract.mdl sj.morph typo.dict)

missing=0
for f in "${FILES[@]}"; do [ -s "$DIR/$f" ] || missing=1; done
if [ "$missing" = 0 ]; then
  echo "Kiwi model already in public/model"
  exit 0
fi

echo "Downloading Kiwi model v$VERSION…"
mkdir -p "$DIR"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
curl -fsSL -o "$tmp/model.tgz" "https://github.com/bab2min/Kiwi/releases/download/v$VERSION/kiwi_model_v${VERSION}_base.tgz"
tar xzf "$tmp/model.tgz" -C "$tmp"
# Only the files the app loads (see MODEL_FILES in src/lib/kiwi.worker.ts); multi.dict and
# nounchr.mdl are left out.
for f in "${FILES[@]}"; do cp "$tmp/models/cong/base/$f" "$DIR/$f"; done
echo "Kiwi model ready: $(du -sh "$DIR" | cut -f1)"
