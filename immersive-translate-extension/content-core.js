(function expose(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.TranslyCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCore() {
  const LANGUAGE_LABELS = {
    "zh-CN": "简体中文",
    en: "English",
    ja: "日本語",
    ko: "한국어",
    fr: "Français",
    es: "Español",
    de: "Deutsch"
  };

  const UI_MESSAGES = {
    "zh-CN": {
      ready: "就绪",
      paused: "已暂停",
      noText: "没有可翻译正文",
      currentTranslated: "当前可见正文已翻译",
      translating: "翻译中",
      translated: "已翻译",
      cleared: "已清除",
      saved: "已保存",
      translatePage: "翻译当前页面",
      clear: "清除译文",
      sidePanel: "侧边栏",
      openSidePanel: "打开侧边栏",
      translateWholePage: "翻译整页",
      translateToPageEnd: "翻译到页面底部",
      toggleOnlyTranslation: "切换仅译文",
      toggleTranslationMask: "学习模式",
      textTranslate: "文本翻译",
      extensionDisabled: "插件已关闭",
      pageDidNotRespond: "页面未响应"
    },
    en: {
      ready: "Ready",
      paused: "Paused",
      noText: "No text",
      currentTranslated: "Visible text is already translated",
      translating: "Translating",
      translated: "Translated",
      cleared: "Cleared",
      saved: "Saved",
      translatePage: "Translate page",
      clear: "Clear translations",
      sidePanel: "Side panel",
      openSidePanel: "Open side panel",
      translateWholePage: "Translate whole page",
      translateToPageEnd: "Translate to page end",
      toggleOnlyTranslation: "Translation only",
      toggleTranslationMask: "Learning mask",
      textTranslate: "Text translation",
      extensionDisabled: "Extension is disabled",
      pageDidNotRespond: "Page did not respond"
    }
  };

  const ACTIVE_PROVIDERS = new Set(["google", "custom", "demo"]);
  const PROVIDERS = new Set(["google", "custom", "demo", "openai", "bing", "deepl"]);
  const DISPLAY_MODES = new Set(["dual", "translation", "original", "replace", "hover"]);
  const SUBTITLE_MODES = new Set(["dual", "translation"]);
  const SUBTITLE_PROVIDERS = new Set(["default", "google", "custom", "demo"]);
  const TRANSLATION_THEMES = new Set(["muted", "marker", "underline", "none"]);
  const INTERFACE_LANGUAGES = new Set(["zh-CN", "en"]);
  const SKIPPED_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "CODE",
    "PRE",
    "TEXTAREA",
    "INPUT",
    "SELECT",
    "OPTION",
    "BUTTON",
    "SVG",
    "CANVAS",
    "KBD",
    "SAMP"
  ]);

  const DEFAULT_SELECTORS = [
    "article p",
    "article li",
    "article blockquote",
    "main p",
    "main blockquote",
    "main figcaption",
    "main h1",
    "main h2",
    "main h3",
    "section p",
    "section li",
    "section blockquote",
    ".content p",
    ".content li",
    ".page-content p",
    ".page-content li",
    ".post-content p",
    ".post-content li",
    ".article-content p",
    ".article-content li",
    ".entry-content p",
    ".entry-content li",
    ".summary",
    ".headline",
    "[role='main'] p",
    "[role='main'] blockquote",
    "[role='main'] h1",
    "[role='main'] h2",
    "[role='main'] h3"
  ];

  const DEFAULT_EXCLUDE_SELECTORS = [
    "nav",
    "header",
    "footer",
    "aside",
    "menu",
    "[role='navigation']",
    "[role='banner']",
    "[role='contentinfo']",
    "[aria-hidden='true']",
    "[translate='no']",
    ".notranslate",
    "[contenteditable='true']",
    "[data-transly-panel]",
    ".transly-panel",
    ".transly-translation",
    ".transly-selection-popover",
    ".transly-hover-tooltip"
  ];

  const BUILT_IN_BLOCKED_DOMAINS = [
    "accounts.google.com",
    "myaccount.google.com",
    "mail.google.com",
    "docs.google.com",
    "sheets.google.com",
    "slides.google.com",
    "drive.google.com",
    "figma.com",
    "paypal.com",
    "stripe.com",
    "chase.com",
    "bankofamerica.com",
    "wellsfargo.com",
    "citibank.com",
    "capitalone.com"
  ];

  const BLOCKED_PROTOCOLS = new Set([
    "about:",
    "brave:",
    "chrome:",
    "chrome-extension:",
    "edge:",
    "file:",
    "moz-extension:",
    "opera:"
  ]);

  const SITE_RULES = [
    {
      id: "github",
      matches: ["github.com"],
      selectors: [
        ".markdown-body p",
        ".markdown-body li",
        ".markdown-body blockquote",
        ".markdown-body h1",
        ".markdown-body h2",
        ".markdown-body h3",
        "main section h2",
        "main section h3:not(:has(a))",
        "main p",
        "main li",
        "[data-testid='dashboard-changelog'] h2",
        "[data-testid='dashboard-changelog'] h3",
        "[data-testid='dashboard-changelog'] p",
        "[data-testid='dashboard-changelog'] li",
        ".dashboard-changelog h2",
        ".dashboard-changelog h3",
        ".dashboard-changelog p",
        ".dashboard-changelog li",
        "[data-testid='dashboard-feed'] .markdown-body p",
        "[data-testid='dashboard-feed'] .markdown-body li",
        ".dashboard-feed .markdown-body p",
        ".dashboard-feed .markdown-body li",
        ".dashboard-card h2",
        ".dashboard-card p",
        "[itemprop='description']",
        ".Layout-sidebar p",
        "div.repo-description p",
        ".pinned-item-desc",
        "[data-testid='issue-pr-title-link']",
        "[aria-label='Issues'] .markdown-title",
        "[aria-labelledby='discussions-list'] .markdown-title",
        ".discussion-title",
        ".TimelineItem-body p",
        ".TimelineItem-body li",
        ".commit-title",
        "[data-testid='commit-row-item'] h4"
      ],
      excludeSelectors: [
        "[role='row']",
        "[role='gridcell']",
        ".react-directory-row",
        ".js-navigation-item",
        ".js-navigation-container",
        "table.files",
        "[aria-label='Repository files']",
        "file-tree",
        "nav",
        "header",
        "footer",
        "button",
        ".BtnGroup",
        ".octicon",
        "relative-time",
        ".commit-author",
        ".commit-meta",
        ".branch-name",
        ".Label",
        ".Counter",
        "code",
        "pre"
      ]
    },
    {
      id: "twitter",
      matches: ["twitter.com", "x.com", "mobile.twitter.com"],
      selectors: ["[data-testid='tweetText']", "[data-testid='tweetText'] span"],
      excludeSelectors: ["header", "nav", "[data-testid='User-Name']", "[data-testid='socialContext']"]
    },
    {
      id: "reddit",
      matches: ["reddit.com", "www.reddit.com", "old.reddit.com"],
      selectors: [
        "shreddit-post [slot='title']",
        "shreddit-post [slot='text-body']",
        "article [slot='title']",
        "article [slot='text-body']",
        "[data-testid='post-title']",
        "[data-testid='post-content'] p",
        "[data-testid='post-content'] li",
        ".usertext-body p",
        ".usertext-body li",
        ".Post h3",
        ".Post p",
        "a[href*='/comments/'][slot='title']",
        "aside a[href*='/comments/']",
        "[aria-label='近期帖子'] a",
        "[aria-label='Recent posts'] a",
        ".recent-post-title"
      ],
      excludeSelectors: [
        "nav",
        "header",
        "faceplate-tracker",
        "reddit-header-large",
        "reddit-sidebar-nav",
        "#left-sidebar-container",
        "[aria-label='Primary']",
        "[aria-label='主导航']",
        "[aria-label='侧边栏']",
        "shreddit-comment-action-row",
        "[data-testid='post-actions']"
      ]
    },
    {
      id: "stackoverflow",
      matches: ["stackoverflow.com", "stackexchange.com", "superuser.com", "askubuntu.com", "serverfault.com"],
      selectors: [".s-prose p", ".s-prose li", ".s-post-summary--content-excerpt", ".question-hyperlink"],
      excludeSelectors: ["pre", "code", ".js-vote-count", ".post-tag", ".s-navigation", ".js-post-menu"]
    },
    {
      id: "medium",
      matches: ["medium.com"],
      selectors: ["article h1", "article h2", "article h3", "article p", "article li", "article blockquote"],
      excludeSelectors: ["article pre", "[aria-label='Post Preview Reading Time']", ".speechify-ignore", "button"]
    },
    {
      id: "youtube",
      matches: ["youtube.com", "m.youtube.com", "youtu.be"],
      selectors: ["#description-inline-expander", "#content-text", "ytd-video-primary-info-renderer h1", ".yt-core-attributed-string"],
      excludeSelectors: ["#guide", "#masthead", "ytd-thumbnail", "button", "a.yt-simple-endpoint"]
    },
    {
      id: "openai-chat",
      matches: ["chat.openai.com", "chatgpt.com"],
      selectors: [".markdown p", ".markdown li", "[data-message-author-role='assistant'] .markdown", "[data-message-author-role='user']"],
      excludeSelectors: ["nav", "form", "textarea", "button", "pre", "code", ".katex"]
    }
  ];

  function createDefaultSettings() {
    return {
      enabled: true,
      provider: "google",
      providerFallbackOrder: ["google", "custom"],
      sourceLanguage: "auto",
      targetLanguage: "zh-CN",
      interfaceLanguage: "zh-CN",
      displayMode: "dual",
      translationTheme: "muted",
      autoTranslate: false,
      tripleSpaceEnabled: true,
      selectionTranslateEnabled: true,
      hoverTranslateEnabled: false,
      floatingBallEnabled: true,
      floatingBallCompact: false,
      floatingBallBlockedDomains: [],
      translationMaskEnabled: false,
      maxBlocks: 80,
      concurrency: 6,
      visibleOnly: true,
      customEndpoint: "",
      customApiKey: "",
      customModel: "",
      fallbackToDemo: false,
      sameLanguageBackground: "none",
      videoSubtitleEnabled: true,
      videoSubtitleYouTubeEnabled: true,
      videoSubtitleGenericEnabled: false,
      videoSubtitleMode: "dual",
      videoSubtitleProvider: "default",
      blockedDomains: [],
      alwaysTranslateDomains: [],
      neverAutoTranslateDomains: [],
      neverTranslateLanguages: [],
      alwaysTranslateLanguages: [],
      sensitiveTextFilter: true,
      sameLanguageCheck: true,
      userRules: []
    };
  }

  function normalizeSettings(input) {
    const defaults = createDefaultSettings();
    const raw = input && typeof input === "object" ? input : {};
    const provider = normalizeProvider(raw.provider, defaults.provider);
    const providerFallbackOrder = normalizeProviderOrder(
      raw.providerFallbackOrder || defaults.providerFallbackOrder
    );
    const displayMode = DISPLAY_MODES.has(raw.displayMode) ? raw.displayMode : defaults.displayMode;
    const videoSubtitleMode = SUBTITLE_MODES.has(raw.videoSubtitleMode)
      ? raw.videoSubtitleMode
      : defaults.videoSubtitleMode;
    const videoSubtitleProvider = SUBTITLE_PROVIDERS.has(raw.videoSubtitleProvider)
      ? raw.videoSubtitleProvider
      : defaults.videoSubtitleProvider;
    const translationTheme = TRANSLATION_THEMES.has(raw.translationTheme)
      ? raw.translationTheme
      : defaults.translationTheme;
    const interfaceLanguage = INTERFACE_LANGUAGES.has(raw.interfaceLanguage)
      ? raw.interfaceLanguage
      : defaults.interfaceLanguage;
    const sourceLanguage = normalizeSourceLanguage(raw.sourceLanguage || defaults.sourceLanguage);
    const targetLanguage = normalizeTargetLanguage(raw.targetLanguage || defaults.targetLanguage);
    const maxBlocks = Number.isFinite(Number(raw.maxBlocks))
      ? Math.min(250, Math.max(5, Number(raw.maxBlocks)))
      : defaults.maxBlocks;
    const concurrency = Number.isFinite(Number(raw.concurrency))
      ? Math.min(10, Math.max(1, Number(raw.concurrency)))
      : defaults.concurrency;

    return {
      ...defaults,
      ...raw,
      enabled: typeof raw.enabled === "boolean" ? raw.enabled : defaults.enabled,
      provider,
      providerFallbackOrder,
      sourceLanguage,
      targetLanguage,
      interfaceLanguage,
      displayMode,
      translationTheme,
      autoTranslate: typeof raw.autoTranslate === "boolean" ? raw.autoTranslate : defaults.autoTranslate,
      tripleSpaceEnabled:
        typeof raw.tripleSpaceEnabled === "boolean"
          ? raw.tripleSpaceEnabled
          : defaults.tripleSpaceEnabled,
      selectionTranslateEnabled:
        typeof raw.selectionTranslateEnabled === "boolean"
          ? raw.selectionTranslateEnabled
          : defaults.selectionTranslateEnabled,
      hoverTranslateEnabled:
        typeof raw.hoverTranslateEnabled === "boolean"
          ? raw.hoverTranslateEnabled
          : defaults.hoverTranslateEnabled,
      floatingBallEnabled:
        typeof raw.floatingBallEnabled === "boolean"
          ? raw.floatingBallEnabled
          : defaults.floatingBallEnabled,
      floatingBallCompact:
        typeof raw.floatingBallCompact === "boolean"
          ? raw.floatingBallCompact
          : defaults.floatingBallCompact,
      translationMaskEnabled:
        typeof raw.translationMaskEnabled === "boolean"
          ? raw.translationMaskEnabled
          : defaults.translationMaskEnabled,
      visibleOnly: typeof raw.visibleOnly === "boolean" ? raw.visibleOnly : defaults.visibleOnly,
      fallbackToDemo:
        typeof raw.fallbackToDemo === "boolean" ? raw.fallbackToDemo : defaults.fallbackToDemo,
      videoSubtitleEnabled:
        typeof raw.videoSubtitleEnabled === "boolean"
          ? raw.videoSubtitleEnabled
          : defaults.videoSubtitleEnabled,
      videoSubtitleYouTubeEnabled:
        typeof raw.videoSubtitleYouTubeEnabled === "boolean"
          ? raw.videoSubtitleYouTubeEnabled
          : defaults.videoSubtitleYouTubeEnabled,
      videoSubtitleGenericEnabled:
        typeof raw.videoSubtitleGenericEnabled === "boolean"
          ? raw.videoSubtitleGenericEnabled
          : defaults.videoSubtitleGenericEnabled,
      videoSubtitleMode,
      videoSubtitleProvider,
      sameLanguageBackground: ["none", "soft", "slate"].includes(raw.sameLanguageBackground)
        ? raw.sameLanguageBackground
        : defaults.sameLanguageBackground,
      sensitiveTextFilter:
        typeof raw.sensitiveTextFilter === "boolean"
          ? raw.sensitiveTextFilter
          : defaults.sensitiveTextFilter,
      sameLanguageCheck:
        typeof raw.sameLanguageCheck === "boolean" ? raw.sameLanguageCheck : defaults.sameLanguageCheck,
      maxBlocks,
      concurrency,
      customEndpoint: String(raw.customEndpoint || defaults.customEndpoint).trim(),
      customApiKey: String(raw.customApiKey || defaults.customApiKey).trim(),
      customModel: String(raw.customModel || defaults.customModel).trim(),
      blockedDomains: normalizeDomainList(raw.blockedDomains || defaults.blockedDomains),
      floatingBallBlockedDomains: normalizeDomainList(
        raw.floatingBallBlockedDomains || defaults.floatingBallBlockedDomains
      ),
      alwaysTranslateDomains: normalizeDomainList(raw.alwaysTranslateDomains || defaults.alwaysTranslateDomains),
      neverAutoTranslateDomains: normalizeDomainList(raw.neverAutoTranslateDomains || defaults.neverAutoTranslateDomains),
      neverTranslateLanguages: normalizeLanguageList(raw.neverTranslateLanguages || defaults.neverTranslateLanguages),
      alwaysTranslateLanguages: normalizeLanguageList(raw.alwaysTranslateLanguages || defaults.alwaysTranslateLanguages),
      userRules: normalizeUserRules(raw.userRules || defaults.userRules)
    };
  }

  function normalizeProvider(value, fallback) {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return fallback || "google";
    return normalized;
  }

  function normalizeProviderOrder(value) {
    const candidates = Array.isArray(value)
      ? value
      : String(value || "")
          .split(/[\n,]+/)
          .map((item) => item.trim());
    const order = [];
    candidates.forEach((item) => {
      const provider = normalizeProvider(item, "");
      if (ACTIVE_PROVIDERS.has(provider) && !order.includes(provider)) {
        order.push(provider);
      }
    });
    return order.length ? order : ["google", "custom"];
  }

  function resolveProviderOrder(settings) {
    const normalizedSettings = normalizeSettings(settings);
    const order = normalizeProviderOrder(normalizedSettings.providerFallbackOrder);
    const defaultOrder = createDefaultSettings().providerFallbackOrder;
    if (
      normalizedSettings.provider === "demo" &&
      order.length === defaultOrder.length &&
      order.every((provider, index) => provider === defaultOrder[index])
    ) {
      return ["demo"];
    }
    if (normalizedSettings.fallbackToDemo && !order.includes("demo")) order.push("demo");
    if (!normalizedSettings.fallbackToDemo && normalizedSettings.provider !== "demo") {
      return order.filter((provider) => provider !== "demo");
    }
    return order;
  }

  function normalizeDomainList(value) {
    return asArray(value)
      .map((item) => normalizeDomain(item))
      .filter(Boolean);
  }

  function normalizeDomain(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return "";
    try {
      return new URL(raw.includes("://") ? raw : `https://${raw}`).hostname.replace(/^www\./, "");
    } catch (error) {
      return raw
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "")
        .replace(/^www\./, "");
    }
  }

  function normalizeLanguageList(value) {
    return Array.from(new Set(asArray(value).map(normalizeLanguageCode).filter(Boolean)));
  }

  function normalizeUserRules(value) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((rule) => rule && typeof rule === "object")
      .map((rule) => ({
        ...rule,
        id: String(rule.id || "custom").trim() || "custom",
        matches: asArray(rule.matches).map(String).filter(Boolean),
        selectors: asArray(rule.selectors).map(String).filter(Boolean),
        excludeSelectors: asArray(rule.excludeSelectors).map(String).filter(Boolean),
        stayOriginalSelectors: asArray(rule.stayOriginalSelectors).map(String).filter(Boolean)
      }))
      .filter((rule) => rule.matches.length && rule.selectors.length);
  }

  function normalizeTargetLanguage(value) {
    return normalizeLanguageCode(value) || "zh-CN";
  }

  function normalizeSourceLanguage(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized || normalized === "auto") return "auto";
    return normalizeLanguageCode(value) || "auto";
  }

  function normalizeLanguageCode(value) {
    const normalized = String(value || "").trim();
    if (!normalized) return "";
    const lower = normalized.toLowerCase();
    const base = lower.split(/[-_]/)[0];
    if (["zh", "zh-cn", "zh-hans", "zh-tw", "zh-hant", "cn"].includes(lower) || base === "zh") {
      return "zh-CN";
    }
    if (["en", "ja", "ko", "fr", "es", "de"].includes(lower)) return lower;
    if (["en", "ja", "ko", "fr", "es", "de"].includes(base)) return base;
    return LANGUAGE_LABELS[normalized] ? normalized : "";
  }

  function languageLabel(code) {
    return LANGUAGE_LABELS[normalizeTargetLanguage(code)] || code || "目标语言";
  }

  function getUiMessages(language) {
    return UI_MESSAGES[language] || UI_MESSAGES["zh-CN"];
  }

  function normalizeText(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isTranslatableText(text) {
    const normalized = normalizeText(text);
    if (normalized.length < 6 || normalized.length > 5000) return false;
    if (/^[\d\s.,:;!?'"()[\]{}<>|/\\+\-*=_~`@#$%^&]+$/.test(normalized)) return false;
    if (/^[._/@A-Za-z0-9-]+$/.test(normalized) && !/\s/.test(normalized)) return false;
    if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(normalized)) return false;
    if (/^[A-Za-z0-9_.-]+$/.test(normalized)) return false;
    return /[A-Za-z\u00c0-\u024f\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(normalized);
  }

  function shouldBlockUrl(urlLike, settings) {
    const normalizedSettings = normalizeSettings(settings);
    let parsed = null;
    try {
      parsed = new URL(String(urlLike || ""));
    } catch (error) {
      return false;
    }
    if (BLOCKED_PROTOCOLS.has(parsed.protocol)) return true;
    const hostname = normalizeDomain(parsed.hostname);
    if (!hostname) return false;
    return [...BUILT_IN_BLOCKED_DOMAINS, ...normalizedSettings.blockedDomains].some((domain) =>
      domainMatches(hostname, domain)
    );
  }

  function shouldBlockFloatingBall(urlLike, settings) {
    const normalizedSettings = normalizeSettings(settings);
    if (!normalizedSettings.floatingBallEnabled) return true;
    if (shouldBlockUrl(urlLike, normalizedSettings)) return true;
    let parsed = null;
    try {
      parsed = new URL(String(urlLike || ""));
    } catch (error) {
      return false;
    }
    const hostname = normalizeDomain(parsed.hostname);
    if (!hostname) return false;
    return normalizedSettings.floatingBallBlockedDomains.some((domain) =>
      domainMatches(hostname, domain)
    );
  }

  function shouldAutoTranslateUrl(urlLike, settings) {
    const normalizedSettings = normalizeSettings(settings);
    let parsed = null;
    try {
      parsed = new URL(String(urlLike || ""));
    } catch (error) {
      return false;
    }
    if (shouldBlockUrl(urlLike, normalizedSettings)) return false;
    const hostname = normalizeDomain(parsed.hostname);
    if (!hostname) return false;
    if (normalizedSettings.neverAutoTranslateDomains.some((domain) => domainMatches(hostname, domain))) {
      return false;
    }
    if (normalizedSettings.alwaysTranslateDomains.some((domain) => domainMatches(hostname, domain))) {
      return true;
    }
    return normalizedSettings.autoTranslate;
  }

  function shouldAutoTranslateLanguage(sourceLanguage, targetLanguage, settings) {
    const normalizedSettings = normalizeSettings(settings);
    const source = normalizeLanguageCode(sourceLanguage);
    if (!source) return false;
    if (!normalizedSettings.alwaysTranslateLanguages.includes(source)) return false;
    if (normalizedSettings.neverTranslateLanguages.includes(source)) return false;
    const target = normalizeTargetLanguage(targetLanguage || normalizedSettings.targetLanguage);
    return source !== target;
  }

  function getSameLanguageBackground(text, targetLanguage, settings) {
    const normalizedSettings = normalizeSettings(settings);
    if (normalizedSettings.sameLanguageBackground === "none") return "none";
    const source = detectTextLanguage(text);
    if (!source) return "none";
    const target = normalizeTargetLanguage(targetLanguage || normalizedSettings.targetLanguage);
    if (source === target) return normalizedSettings.sameLanguageBackground;
    if (areRelatedLanguages(source, target)) return normalizedSettings.sameLanguageBackground;
    return "none";
  }

  function areRelatedLanguages(sourceLanguage, targetLanguage) {
    const source = normalizeLanguageCode(sourceLanguage);
    const target = normalizeLanguageCode(targetLanguage);
    if (!source || !target || source === target) return source === target;
    const eastAsian = new Set(["zh-CN", "ja", "ko"]);
    const western = new Set(["en", "fr", "es", "de"]);
    return (eastAsian.has(source) && eastAsian.has(target)) || (western.has(source) && western.has(target));
  }

  function domainMatches(hostname, domain) {
    const normalizedDomain = normalizeDomain(domain);
    return Boolean(
      normalizedDomain &&
        (hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`))
    );
  }

  function hasSensitiveText(text, settings) {
    const normalizedSettings = normalizeSettings(settings);
    if (!normalizedSettings.sensitiveTextFilter) return false;
    const normalized = normalizeText(text);
    if (!normalized) return false;
    const patterns = [
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
      /\b(?:password|passwd|pwd|token|api[_\s-]?key|secret|authorization|access[_\s-]?token|refresh[_\s-]?token)\b\s*[:=]\s*\S{6,}/i,
      /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/i,
      /\bsk-[A-Za-z0-9_-]{8,}\b/i,
      /\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/,
      /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/i
    ];
    return patterns.some((pattern) => pattern.test(normalized));
  }

  function shouldSkipByLanguage(text, targetLanguage, settings) {
    const normalizedSettings = normalizeSettings(settings);
    const normalized = normalizeText(text);
    if (!normalized) return false;
    const source = detectTextLanguage(normalized);
    if (source && normalizedSettings.neverTranslateLanguages.includes(source)) return true;
    if (
      source &&
      normalizedSettings.alwaysTranslateLanguages.length &&
      !normalizedSettings.alwaysTranslateLanguages.includes(source)
    ) {
      return true;
    }
    if (!normalizedSettings.sameLanguageCheck) return false;
    const target = normalizeTargetLanguage(targetLanguage || normalizedSettings.targetLanguage);
    if (source) return source === target;
    return false;
  }

  function detectTextLanguage(text) {
    const normalized = normalizeText(text);
    if (!normalized) return "";
    const stats = getLanguageStats(normalized);
    const letters = Math.max(1, stats.letters);
    if (stats.japanese >= 2 && stats.japanese / letters >= 0.2) return "ja";
    if (stats.korean >= 2 && stats.korean / letters >= 0.2) return "ko";
    if (stats.chinese >= 4 && stats.chinese / letters >= 0.45) return "zh-CN";
    if (stats.latin >= 12 && stats.foreign === 0 && stats.latin / letters >= 0.75) return "en";
    return "";
  }

  function getLanguageStats(text) {
    const chars = Array.from(text);
    let chinese = 0;
    let latin = 0;
    let japanese = 0;
    let korean = 0;
    let otherForeign = 0;
    for (const char of chars) {
      if (/[\u3400-\u9fff]/u.test(char)) {
        chinese += 1;
      } else if (/[A-Za-z]/.test(char)) {
        latin += 1;
      } else if (/[\u3040-\u30ff]/u.test(char)) {
        japanese += 1;
      } else if (/[\uac00-\ud7af]/u.test(char)) {
        korean += 1;
      } else if (/[\u0400-\u04ff]/u.test(char)) {
        otherForeign += 1;
      }
    }
    return {
      chinese,
      latin,
      japanese,
      korean,
      foreign: chinese + japanese + korean + otherForeign,
      letters: chinese + latin + japanese + korean + otherForeign
    };
  }

  function validateTranslationRequest({ text, url, settings } = {}) {
    const normalizedSettings = normalizeSettings(settings);
    const normalizedText = normalizeText(text);
    if (!isTranslatableText(normalizedText)) {
      throw new Error("文本不适合翻译");
    }
    if (shouldBlockUrl(url, normalizedSettings)) {
      throw new Error("当前页面已阻止翻译，以保护隐私或避免影响性能");
    }
    if (hasSensitiveText(normalizedText, normalizedSettings)) {
      throw new Error("检测到敏感文本，已阻止翻译");
    }
    if (shouldSkipByLanguage(normalizedText, normalizedSettings.targetLanguage, normalizedSettings)) {
      throw new Error("文本与目标语言一致，无需翻译");
    }
    assertProviderAvailable(normalizedSettings.provider);
    return {
      text: normalizedText,
      settings: normalizedSettings
    };
  }

  function assertProviderAvailable(provider) {
    const normalized = normalizeProvider(provider, "google");
    if (ACTIVE_PROVIDERS.has(normalized)) return true;
    if (PROVIDERS.has(normalized)) {
      throw new Error(`翻译服务 ${normalized} 暂不支持，请选择 Google、Custom 或 Demo`);
    }
    throw new Error(`不支持的翻译服务：${normalized}`);
  }

  function isSkippableElement(element, rule) {
    if (!element || !element.tagName) return true;
    if (SKIPPED_TAGS.has(element.tagName)) return true;
    const selectors = [...DEFAULT_EXCLUDE_SELECTORS, ...((rule && rule.excludeSelectors) || [])];
    if (typeof element.closest === "function") {
      return selectors.some((selector) => safeClosest(element, selector));
    }
    return false;
  }

  function safeClosest(element, selector) {
    try {
      return Boolean(element.closest(selector));
    } catch (error) {
      return false;
    }
  }

  function getSiteRule(urlLike, userRules) {
    const customRule = normalizeUserRules(userRules).find((candidate) => matchesSiteRule(candidate, urlLike));
    if (customRule) return mergeRule(baseRuleFor(customRule.id), customRule);
    const rule = SITE_RULES.find((candidate) => matchesSiteRule(candidate, urlLike));
    return rule || {
      id: "default",
      matches: ["*"],
      selectors: DEFAULT_SELECTORS,
      excludeSelectors: DEFAULT_EXCLUDE_SELECTORS
    };
  }

  function baseRuleFor(id) {
    return SITE_RULES.find((rule) => rule.id === id) || null;
  }

  function mergeRule(baseRule, customRule) {
    if (!baseRule) {
      return {
        ...customRule,
        excludeSelectors: [...DEFAULT_EXCLUDE_SELECTORS, ...customRule.excludeSelectors]
      };
    }
    return {
      ...baseRule,
      ...customRule,
      selectors: customRule.selectors.length ? customRule.selectors : baseRule.selectors,
      excludeSelectors: [
        ...asArray(baseRule.excludeSelectors),
        ...asArray(customRule.excludeSelectors)
      ],
      stayOriginalSelectors: [
        ...asArray(baseRule.stayOriginalSelectors),
        ...asArray(customRule.stayOriginalSelectors)
      ]
    };
  }

  function matchesSiteRule(rule, urlLike) {
    let hostname = "";
    try {
      hostname = new URL(urlLike).hostname;
    } catch (error) {
      hostname = String(urlLike || "");
    }
    return asArray(rule.matches).some((match) => {
      if (match === "*") return true;
      const normalized = String(match).replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      return hostname === normalized || hostname.endsWith(`.${normalized}`);
    });
  }

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    return [value];
  }

  function buildGoogleTranslateUrl(text, targetLanguage, sourceLanguage = "auto") {
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", normalizeSourceLanguage(sourceLanguage));
    url.searchParams.set("tl", normalizeTargetLanguage(targetLanguage));
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", String(text || ""));
    return url.toString();
  }

  function extractGoogleTranslateResponse(payload) {
    if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
      throw new Error("empty translation response");
    }
    const text = payload[0]
      .map((segment) => (Array.isArray(segment) ? segment[0] : ""))
      .join("")
      .trim();
    if (!text) throw new Error("empty translation response");
    return text;
  }

  function extractProviderTranslation(payload) {
    const candidates = [
      payload && payload.text,
      payload && payload.translatedText,
      payload && payload.translation,
      payload && payload.result,
      payload && payload.data && payload.data.text,
      payload && payload.data && payload.data.translatedText,
      payload && payload.data && payload.data.translation,
      payload && payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content,
      payload && payload.choices && payload.choices[0] && payload.choices[0].text
    ];
    const text = candidates.find((candidate) => typeof candidate === "string" && candidate.trim());
    if (!text) throw new Error("empty translation response");
    return text.trim();
  }

  function buildDemoTranslation(text, targetLanguage) {
    return `[${languageLabel(targetLanguage)}演示] ${normalizeText(text)}`;
  }

  function sanitizeErrorMessage(message, secrets) {
    let output = String(message || "翻译失败");
    for (const secret of asArray(secrets)) {
      const value = String(secret || "");
      if (value) output = output.split(value).join("[REDACTED]");
    }
    return output
      .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED]")
      .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/gi, "Bearer [REDACTED]")
      .replace(/\b(api[_\s-]?key|token|secret|password)\s*[:=]\s*\S+/gi, "$1=[REDACTED]");
  }

  return {
    LANGUAGE_LABELS,
    UI_MESSAGES,
    PROVIDERS,
    ACTIVE_PROVIDERS,
    SITE_RULES,
    DEFAULT_SELECTORS,
    DEFAULT_EXCLUDE_SELECTORS,
    BUILT_IN_BLOCKED_DOMAINS,
    createDefaultSettings,
    normalizeSettings,
    normalizeUserRules,
    normalizeDomainList,
    normalizeProviderOrder,
    resolveProviderOrder,
    normalizeTargetLanguage,
    normalizeSourceLanguage,
    normalizeLanguageCode,
    languageLabel,
    getUiMessages,
    normalizeText,
    isTranslatableText,
    shouldBlockUrl,
    shouldBlockFloatingBall,
    shouldAutoTranslateUrl,
    shouldAutoTranslateLanguage,
    getSameLanguageBackground,
    detectTextLanguage,
    hasSensitiveText,
    shouldSkipByLanguage,
    validateTranslationRequest,
    assertProviderAvailable,
    sanitizeErrorMessage,
    isSkippableElement,
    getSiteRule,
    matchesSiteRule,
    buildGoogleTranslateUrl,
    extractGoogleTranslateResponse,
    extractProviderTranslation,
    buildDemoTranslation
  };
});
