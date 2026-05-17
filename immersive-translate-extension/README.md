# Transly Immersive Translator

Standalone Chrome Manifest V3 extension.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Choose **Load unpacked**.
4. Select this folder: `immersive-translate-extension/`.

## Features

- Chinese-first popup with basic Chrome i18n manifest metadata.
- Persistent Chinese side panel for webpage controls, display settings, site-rule inspection, custom rules, service settings, and free text translation.
- Paragraph-level bilingual translation with low-intrusion themes: muted line, marker, underline, or none.
- Display modes: bilingual, translation only, original only with hover, replace original, and hover only.
- Learning mode masks translations with blur until hover.
- Site-specific rules for GitHub/Twitter/Reddit/StackOverflow/Medium/YouTube/ChatGPT-style pages. GitHub repository file rows, filenames, buttons, code, and navigation are excluded; README and issue/discussion text are targeted.
- User rules can be added as JSON with `matches`, `selectors`, `excludeSelectors`, and `stayOriginalSelectors`.
- Visible-content-first translation, scroll-triggered dynamic translation, in-memory cache, and configurable concurrency for faster first results.
- Floating in-page translate controls: page, whole page, translation-only toggle, learning mask, side panel, and clear.
- Chrome context menus for page translation, whole-page translation, selection translation, side panel, and learning mode.
- Keyboard commands: `Alt+A` page toggle, `Alt+W` whole page, `Alt+S` side panel, and `Alt+I` active input translation.
- Selected text translation popover.
- Triple-space input translation for text fields.
- Video subtitle translation for visible YouTube captions and common HTML5 player caption layers, with bilingual or translation-only subtitle display.
- Providers: Google web translate, custom JSON API, and demo mode.
- Custom API keys are stored in `chrome.storage.local`; synced settings do not contain the secret.

## Deferred feature modules

The real Immersive Translate extension also includes PDF layout-preserving translation, EPUB bilingual export, image/manga OCR translation, glossary management, and AI writing assistants. Those are intentionally not marked complete here because they need dedicated parsers, OCR, service-side support, or much larger provider configuration.

## Research Notes

Immersive Translate's public docs describe paragraph-level bilingual reading, hover translation, input-box translation, document/PDF/subtitle support, and many advanced rule fields. The important implementation ideas for this prototype are:

- translate paragraphs as the smallest reading unit instead of replacing the whole page;
- use site rules with `selectors` and `excludeSelectors`;
- provide multiple display themes instead of a fixed card style;
- translate dynamically and prioritize visible content;
- cache results and avoid translating navigation, file names, buttons, code, dates, and counters.

## Custom API contract

Custom provider requests:

```json
{
  "text": "Hello",
  "sourceLanguage": "auto",
  "targetLanguage": "zh-CN"
}
```

Accepted response fields:

```json
{ "text": "你好" }
```

`translatedText`, `translation`, `result`, `data.text`, `data.translatedText`, and `data.translation` are also accepted.
