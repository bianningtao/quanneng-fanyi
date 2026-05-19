#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT_DIR="$ROOT_DIR/all-in-one-translate-extension"
DIST_DIR="$ROOT_DIR/dist"
MANIFEST="$EXT_DIR/manifest.json"

if [[ ! -f "$MANIFEST" ]]; then
  echo "Missing manifest: $MANIFEST" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required for manifest validation." >&2
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "zip is required to package the extension." >&2
  exit 1
fi

VERSION="$(node -e "const fs=require('fs'); const manifest=JSON.parse(fs.readFileSync('$MANIFEST','utf8')); if(!manifest.version) process.exit(2); process.stdout.write(manifest.version);")"
PACKAGE_NAME="quanneng-fanyi-v$VERSION.zip"
PACKAGE_PATH="$DIST_DIR/$PACKAGE_NAME"
CHECKSUM_PATH="$PACKAGE_PATH.sha256"

required_files=(
  "$EXT_DIR/manifest.json"
  "$EXT_DIR/background.js"
  "$EXT_DIR/content-core.js"
  "$EXT_DIR/content-script.js"
  "$EXT_DIR/content.css"
  "$EXT_DIR/options.html"
  "$EXT_DIR/popup.html"
  "$EXT_DIR/sidepanel.html"
  "$EXT_DIR/icons/icon-16.png"
  "$EXT_DIR/icons/icon-32.png"
  "$EXT_DIR/icons/icon-48.png"
  "$EXT_DIR/icons/icon-128.png"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required extension file: $file" >&2
    exit 1
  fi
done

node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('$MANIFEST','utf8'));"

if grep -RInE '(gho_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]{12,}|OPENAI_API_KEY|api[_-]?key[[:space:]]*[:=][[:space:]]*[A-Za-z0-9_-]{12,})' "$EXT_DIR" \
  --exclude='*.png' --exclude='*.jpg' --exclude='*.jpeg' --exclude='*.webp' >/tmp/quanneng-fanyi-secret-scan.txt; then
  cat /tmp/quanneng-fanyi-secret-scan.txt >&2
  echo "Potential secret found. Refusing to package." >&2
  exit 1
fi

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

(
  cd "$ROOT_DIR"
  zip -qr "$PACKAGE_PATH" all-in-one-translate-extension \
    -x '*.DS_Store' \
    -x '*/.DS_Store' \
    -x '*/node_modules/*' \
    -x '*/dist/*' \
    -x '*/build/*'
)

if unzip -l "$PACKAGE_PATH" | grep -E '(^|/)(process|tests)/' >/dev/null; then
  echo "Package unexpectedly contains process/ or tests/." >&2
  exit 1
fi

shasum -a 256 "$PACKAGE_PATH" > "$CHECKSUM_PATH"

echo "Created $PACKAGE_PATH"
echo "Created $CHECKSUM_PATH"
