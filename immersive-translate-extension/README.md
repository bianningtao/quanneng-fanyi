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
- Paragraph-level bilingual translation with low-intrusion and custom styles: underline, dotted/wavy underline, quote line, marker/highlight, boxed, shadow, blur, dim, and custom color/font/width controls.
- Display modes: bilingual, translation only, original only with hover, replace original, and hover only.
- Learning mode masks translations with blur until hover.
- Site-specific rules for GitHub/Twitter/Reddit/StackOverflow/Medium/YouTube/ChatGPT-style pages. GitHub repository file rows, filenames, buttons, code, and navigation are excluded; README and issue/discussion text are targeted.
- User rules can be added as JSON with `matches`, `selectors`, `excludeSelectors`, and `stayOriginalSelectors`.
- Visible-content-first translation, scroll-triggered dynamic translation, in-memory cache, and configurable concurrency for faster first results.
- Floating in-page translate controls with icon-only dock, hover reveal, close/settings dialog, configurable click behavior, side position, opacity, compact mode, and site-level hiding.
- Chrome context menus for page translation, whole-page translation, selection translation, side panel, and learning mode.
- Keyboard commands: `Alt+A` page toggle, `Alt+W` whole page, `Alt+S` side panel, and `Alt+I` active input translation.
- Selected text translation popover.
- Triple-space input translation for text fields.
- Video subtitle translation for visible YouTube captions and common HTML5 player caption layers, with bilingual or translation-only subtitle display.
- Built-in and custom terminology glossaries. Simple custom APIs receive matched glossary entries; `/chat/completions` APIs receive the matched terms in the system message. Google/Microsoft/demo can only do light local correction when the translated result still contains the source term.
- Translation engines: Google web translate, Microsoft Translator web endpoint, custom JSON/OpenAI-compatible engines, and demo mode. The default fallback order is Google -> Microsoft -> custom API, and users can reorder or add custom engines in the settings page.
- Custom API keys, custom engine secrets, and custom glossary terms are stored in `chrome.storage.local`; synced settings do not contain those local-only values.

## Deferred feature modules

The real Immersive Translate extension also includes PDF layout-preserving translation, EPUB bilingual export, image/manga OCR translation, and AI writing assistants. Those are intentionally not marked complete here because they need dedicated parsers, OCR, service-side support, or much larger provider configuration.

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
  "targetLanguage": "zh-CN",
  "glossary": [
    { "source": "LLM", "target": "大语言模型", "note": "", "domains": [] }
  ]
}
```

Accepted response fields:

```json
{ "text": "你好" }
```

`translatedText`, `translation`, `result`, `data.text`, `data.translatedText`, and `data.translation` are also accepted.

OpenAI-compatible engines can point to `/chat/completions`; Transly sends `model`, `temperature`, `messages`, glossary constraints, and the configured single/multi-paragraph prompts.
