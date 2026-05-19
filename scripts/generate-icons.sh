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
    <linearGradient id="bg" x1="128" y1="96" x2="896" y2="928" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ff67a8"/>
      <stop offset="0.52" stop-color="#ff3f91"/>
      <stop offset="1" stop-color="#5cc8ff"/>
    </linearGradient>
    <linearGradient id="shine" x1="228" y1="148" x2="790" y2="778" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.42"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="36" flood-color="#1d0f22" flood-opacity="0.28"/>
    </filter>
  </defs>
  <rect x="96" y="96" width="832" height="832" rx="208" fill="url(#bg)" filter="url(#softShadow)"/>
  <rect x="128" y="128" width="768" height="768" rx="188" fill="url(#shine)"/>
  <g fill="#ffffff" font-family="PingFang SC, Hiragino Sans GB, Heiti SC, Microsoft YaHei, sans-serif" font-weight="900">
    <text x="512" y="642" text-anchor="middle" font-size="470" letter-spacing="0">译</text>
    <text x="698" y="750" text-anchor="middle" font-size="178" letter-spacing="0">A</text>
    <path d="M634 704h128v44H634z" opacity="0.9"/>
  </g>
</svg>
SVG

for size in 16 32 48 128 1024; do
  qlmanage -t -s "$size" -o "$TMP_DIR" "$SVG_FILE" >/dev/null 2>&1
  mv "$TMP_DIR/$(basename "$SVG_FILE").png" "$ICON_DIR/icon-$size.png"
done

echo "Generated icons in $ICON_DIR"
