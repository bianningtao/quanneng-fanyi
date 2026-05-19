#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ICON_DIR="$ROOT_DIR/all-in-one-translate-extension/icons"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

if ! command -v qlmanage >/dev/null 2>&1; then
  echo "qlmanage is required to render SVG icons on macOS." >&2
  exit 1
fi

mkdir -p "$ICON_DIR"

SVG_FILE="$TMP_DIR/quanneng-fanyi-icon.svg"
cat > "$SVG_FILE" <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="132" y1="92" x2="868" y2="906" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ff63a6"/>
      <stop offset="0.56" stop-color="#f03d91"/>
      <stop offset="1" stop-color="#6a66ff"/>
    </linearGradient>
    <linearGradient id="corner" x1="620" y1="604" x2="900" y2="900" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8cf3ff" stop-opacity="0"/>
      <stop offset="1" stop-color="#8cf3ff" stop-opacity="0.76"/>
    </linearGradient>
    <linearGradient id="shine" x1="238" y1="128" x2="768" y2="746" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.34"/>
      <stop offset="0.46" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="26" stdDeviation="30" flood-color="#1b0d20" flood-opacity="0.24"/>
    </filter>
  </defs>
  <circle cx="512" cy="512" r="418" fill="url(#bg)" filter="url(#softShadow)"/>
  <circle cx="512" cy="512" r="418" fill="url(#corner)"/>
  <circle cx="512" cy="512" r="374" fill="url(#shine)"/>
  <g fill="#ffffff" font-family="PingFang SC, Hiragino Sans GB, Heiti SC, Microsoft YaHei, sans-serif" font-weight="900">
    <text x="488" y="660" text-anchor="middle" font-size="500" letter-spacing="0">译</text>
    <text x="704" y="766" text-anchor="middle" font-size="198" letter-spacing="0">A</text>
    <path d="M626 718h154v48H626z" opacity="0.95"/>
  </g>
</svg>
SVG

for size in 16 32 48 128 1024; do
  qlmanage -t -s "$size" -o "$TMP_DIR" "$SVG_FILE" >/dev/null 2>&1
  mv "$TMP_DIR/$(basename "$SVG_FILE").png" "$ICON_DIR/icon-$size.png"
done

echo "Generated icons in $ICON_DIR"
