(function bootstrapOmniTranslator() {
  const core = window.TranslyCore;
  const SETTINGS_KEY = "translySettings";
  const GLOSSARY_KEY = "translyCustomGlossaryTerms";
  const translatedAttribute = "data-transly-translated";
  const originalTextAttribute = "data-transly-original-text";
  const originalHtmlAttribute = "data-transly-original-html";
  const originalDisplayAttribute = "data-transly-original-display";
  const translyOwnedSelector = "[data-transly-owned], [data-transly-panel]";
  const GITHUB_CHROME_SELECTORS = [
    "[itemprop='name']",
    "#repository-container-header",
    "[aria-label='Repository files']",
    "[aria-label='Repository files'] .Box-row",
    "[aria-label='Breadcrumb']",
    ".AppHeader",
    ".AppHeader-context",
    ".AppHeader-globalBar",
    ".AppHeader-actions",
    ".js-repo-nav",
    ".react-directory-row",
    ".js-navigation-item",
    "table.files",
    "file-tree",
    ".branch-name",
    ".commit-meta",
    ".commit-author"
  ];
  const GITHUB_CONTENT_OVERRIDE_SELECTORS = [
    "[data-testid='dashboard-changelog'] h2",
    "[data-testid='dashboard-changelog'] h3",
    "[data-testid='dashboard-changelog'] p",
    "[data-testid='dashboard-changelog'] li",
    ".dashboard-changelog h2",
    ".dashboard-changelog h3",
    ".dashboard-changelog p",
    ".dashboard-changelog li",
    ".js-comment-body p",
    ".js-comment-body li",
    ".comment-body p",
    ".comment-body li",
    "[data-testid='comment-body'] p",
    "[data-testid='comment-body'] li"
  ];
  const REDDIT_CHROME_SELECTORS = [
    "reddit-header-large",
    "reddit-sidebar-nav",
    "#left-sidebar-container",
    "[aria-label='Primary']",
    "[aria-label='主导航']",
    "[aria-label='侧边栏']",
    "nav",
    "header",
    "faceplate-tracker",
    "shreddit-comment-action-row",
    "[data-testid='post-actions']",
    "[data-testid='comment-action-row']",
    "button",
    "input",
    "textarea",
    "select"
  ];
  const REDDIT_CONTENT_OVERRIDE_SELECTORS = [
    "shreddit-post [slot='title']",
    "shreddit-post [slot='text-body']",
    "article [slot='title']",
    "article [slot='text-body']",
    "[data-testid='post-title']",
    "[data-testid='post-content'] p",
    "[data-testid='post-content'] li",
    "aside a[href*='/comments/']",
    "[aria-label='近期帖子'] a",
    "[aria-label='Recent posts'] a",
    ".recent-post-title",
    "shreddit-comment [slot='comment']",
    "shreddit-comment [slot='body']",
    "shreddit-comment p",
    "[data-testid='comment'] p",
    "[data-testid='comment-content'] p",
    "[data-testid='comment-content'] li",
    ".comment-body p",
    ".comment-body li"
  ];
  const FALLBACK_SELECTORS = [
    "p",
    "li",
    "blockquote",
    "figcaption",
    "h1",
    "h2",
    "h3",
    "[data-testid='tweetText']",
    "div[dir='auto']"
  ];
  const readableFallbackTags = new Set([
    "P",
    "LI",
    "BLOCKQUOTE",
    "FIGCAPTION",
    "H1",
    "H2",
    "H3",
    "TD",
    "TH"
  ]);
  const fallbackContainerTags = new Set(["DIV", "SECTION", "ARTICLE"]);
  const textContainerSelector = "p, li, blockquote, figcaption, h1, h2, h3, pre, code";
  const subtitleHostSelector = [
    ".ytp-caption-window-container .caption-window",
    ".ytp-caption-window-container [class*='caption-window']",
    ".vjs-text-track-display",
    ".plyr__captions",
    ".jw-text-track-display .jw-text-track-cue",
    ".mejs-captions-layer .mejs-captions-text",
    "[data-transly-subtitle-source]"
  ].join(", ");
  const subtitleSegmentSelector = [
    ".ytp-caption-segment",
    ".caption-window .captions-text",
    ".vjs-text-track-cue",
    ".plyr__caption",
    ".jw-text-track-cue",
    ".mejs-captions-text"
  ].join(", ");
  const subtitleMutationSelector = [
    ".ytp-caption-window-container",
    ".caption-window",
    ".ytp-caption-segment",
    ".vjs-text-track-display",
    ".vjs-text-track-cue",
    ".plyr__captions",
    ".plyr__caption",
    ".jw-text-track-display",
    ".jw-text-track-cue",
    ".mejs-captions-layer",
    ".mejs-captions-text"
  ].join(", ");
  const smartScopeSelector = [
    "main",
    "article",
    "[role='main']",
    ".content",
    ".page-content",
    ".post-content",
    ".article-content",
    ".entry-content"
  ].join(", ");
  const smartTextSelector = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "li",
    "blockquote",
    "figcaption",
    "summary",
    "dt",
    "dd",
    "[role='heading']",
    "div",
    "span"
  ].join(", ");
  const semanticTextPattern = /(title|headline|heading|summary|description|desc|body|copy|content|text|subtitle|caption|entry|card|tile|teaser|dek|excerpt|lead|changelog|release)/i;
  const inlineTextTags = new Set(["A", "ABBR", "B", "BR", "CITE", "EM", "I", "MARK", "SMALL", "SPAN", "STRONG", "SUB", "SUP", "TIME", "U", "WBR"]);

  const state = {
    settings: core.createDefaultSettings(),
    messages: core.getUiMessages("zh-CN"),
    rule: core.getSiteRule(location.href),
    cache: new Map(),
    panel: null,
    status: null,
    statusTimer: null,
    selectionPopover: null,
    hoverTooltip: null,
    dynamicTimer: null,
    dynamicObserver: null,
    dynamicPending: false,
    dynamicBound: false,
    subtitleTimer: null,
    subtitleObserver: null,
    subtitleRunId: 0,
    floatingSettingsDialog: null,
    autoTranslateActive: false,
    pageTranslated: false,
    lastUrl: location.href,
    runId: 0,
    translating: false
  };

  init();

  function init() {
    loadSettings().then((settings) => {
      state.settings = settings;
      state.messages = core.getUiMessages(settings.interfaceLanguage);
      state.rule = core.getSiteRule(location.href, settings.userRules);
      state.autoTranslateActive = shouldAutoTranslateCurrentPage(settings);
      mountPanel();
      bindDocumentInteractions();
      installDynamicTranslation();
      installSubtitleTranslation();
      if (settings.enabled && state.autoTranslateActive) {
        window.setTimeout(() => translatePage(), 450);
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message) return false;
      if (message.type === "TRANSLY_APPLY") {
        togglePageTranslation(message.options || {}).then(sendResponse);
        return true;
      }
      if (message.type === "TRANSLY_APPLY_WHOLE") {
        translatePage({ wholePage: true }).then(sendResponse);
        return true;
      }
      if (message.type === "TRANSLY_TRANSLATE_TO_END") {
        translatePage({ wholePage: true, toEnd: true }).then(sendResponse);
        return true;
      }
      if (message.type === "TRANSLY_CLEAR") {
        clearTranslations();
        sendResponse({ ok: true });
        return false;
      }
      if (message.type === "TRANSLY_TOGGLE_ONLY_TRANSLATION") {
        toggleOnlyTranslation().then(sendResponse);
        return true;
      }
      if (message.type === "TRANSLY_TOGGLE_MASK") {
        toggleTranslationMask().then(sendResponse);
        return true;
      }
      if (message.type === "TRANSLY_GET_PAGE_INFO") {
        sendResponse(getPageInfo());
        return false;
      }
      if (message.type === "TRANSLY_CAPTURE_PLAYER_SUBTITLES") {
        capturePlayerSubtitles().then(sendResponse);
        return true;
      }
      if (message.type === "TRANSLY_TRANSLATE_SELECTION") {
        translateSelectionText(message.text).then(sendResponse);
        return true;
      }
      if (message.type === "TRANSLY_TRANSLATE_INPUT") {
        translateActiveInput().then(sendResponse);
        return true;
      }
      if (message.type === "TRANSLY_SETTINGS_CHANGED") {
        state.settings = core.normalizeSettings(message.settings);
        state.cache.clear();
        state.messages = core.getUiMessages(state.settings.interfaceLanguage);
        state.rule = core.getSiteRule(location.href, state.settings.userRules);
        state.autoTranslateActive = shouldAutoTranslateCurrentPage(state.settings);
        syncSubtitleTranslation();
        updatePanelState();
        sendResponse({ ok: true });
        return false;
      }
      return false;
    });
  }

  async function loadSettings() {
    const [stored, localStored] = await Promise.all([
      chrome.storage.sync.get([SETTINGS_KEY]),
      chrome.storage.local && chrome.storage.local.get
        ? chrome.storage.local.get([GLOSSARY_KEY])
        : Promise.resolve({})
    ]);
    const syncSettings = stored[SETTINGS_KEY] || {};
    return core.normalizeSettings({
      ...syncSettings,
      customGlossaryTerms:
        localStored[GLOSSARY_KEY] ||
        syncSettings.customGlossaryTerms ||
        []
    });
  }

  function shouldAutoTranslateCurrentPage(settings) {
    return (
      core.shouldAutoTranslateUrl(location.href, settings) ||
      core.shouldAutoTranslateLanguage(detectDocumentLanguage(), settings.targetLanguage, settings)
    );
  }

  function detectDocumentLanguage() {
    const htmlLanguage = document.documentElement && document.documentElement.lang;
    if (htmlLanguage) return htmlLanguage;
    const metaLanguage = document.querySelector(
      "meta[http-equiv='content-language'], meta[name='language']"
    );
    return (metaLanguage && metaLanguage.getAttribute("content")) || "";
  }

  function mountPanel() {
    if (!document.body) return;
    if (core.shouldBlockFloatingBall(location.href, state.settings) || isFloatingPanelHiddenForSession()) {
      if (state.panel) {
        state.panel.remove();
        state.panel = null;
        state.status = null;
      }
      return;
    }
    if (state.panel) return;

    const panel = document.createElement("div");
    panel.className = "transly-panel";
    panel.setAttribute("data-transly-panel", "true");
    panel.setAttribute("data-transly-owned", "true");
    panel.innerHTML = [
      `<button class="transly-panel-tool" type="button" data-action="options" title="打开设置" aria-label="打开设置">${panelIcon("settings")}</button>`,
      `<button class="transly-panel-main" type="button" data-action="translate" title="${state.messages.translatePage}" aria-label="${state.messages.translatePage}">${panelIcon("languages")}</button>`,
      `<button class="transly-panel-tool" type="button" data-action="mask" title="${state.messages.toggleTranslationMask}" aria-label="${state.messages.toggleTranslationMask}">${panelIcon("eyeOff")}</button>`,
      `<button class="transly-panel-tool" type="button" data-action="sidepanel" title="${state.messages.openSidePanel}" aria-label="${state.messages.openSidePanel}">${panelIcon("panelRight")}</button>`,
      `<button class="transly-panel-close" type="button" data-action="floatingSettings" title="关闭快捷按钮" aria-label="关闭快捷按钮">${panelIcon("close")}</button>`,
      `<div class="transly-panel-tooltip" role="tooltip">${state.messages.translatePage}</div>`,
      `<div class="transly-panel-status" role="status">${state.messages.ready}</div>`
    ].join("");

    panel.addEventListener("click", (event) => {
      const target = event.target && event.target.closest && event.target.closest("[data-action]");
      if (!target) return;
      const action = target.getAttribute("data-action");
      if (action === "translate") {
        handleFloatingMainAction();
      }
      if (action === "mask") {
        toggleTranslationMask();
      }
      if (action === "options") {
        sendRuntimeMessage({ type: "TRANSLY_OPEN_OPTIONS_PAGE" }).catch(showRuntimeErrorStatus);
      }
      if (action === "sidepanel") {
        sendRuntimeMessage({ type: "TRANSLY_OPEN_SIDE_PANEL" }).catch(showRuntimeErrorStatus);
      }
      if (action === "floatingSettings") {
        openFloatingSettingsDialog();
      }
      releaseFloatingPanelFocusAfterPointerClick(event, target);
    });
    panel.addEventListener("pointerover", showPanelTooltipForEvent);
    panel.addEventListener("focusin", showPanelTooltipForEvent);
    panel.addEventListener("pointerout", hidePanelTooltipForEvent);
    panel.addEventListener("focusout", hidePanelTooltipForEvent);
    panel.addEventListener("pointermove", (event) => {
      if (!event.target.closest || !event.target.closest("[data-action]")) {
        hidePanelTooltip();
      }
    });

    document.body.appendChild(panel);
    state.panel = panel;
    state.status = panel.querySelector(".transly-panel-status");
    updatePanelState();
  }

  function panelIcon(name) {
    const brandIcon = () => {
      const iconUrl =
        typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL
          ? chrome.runtime.getURL("icons/icon-128.png")
          : "";
      return `<img class="transly-brand-icon" src="${iconUrl}" alt="" aria-hidden="true" draggable="false">`;
    };
    const icons = {
      settings: [
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
        '<path d="M4 7h10"></path><path d="M18 7h2"></path><path d="M16 5v4"></path>',
        '<path d="M4 17h2"></path><path d="M10 17h10"></path><path d="M8 15v4"></path>',
        "</svg>"
      ].join(""),
      languages: brandIcon(),
      eyeOff: [
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
        '<path d="M3 3l18 18"></path><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>',
        '<path d="M9.9 5.2A9.8 9.8 0 0 1 12 5c5 0 8.5 4.2 9.5 7a12.5 12.5 0 0 1-2.2 3.4"></path>',
        '<path d="M6.1 6.6C4.3 8 3.1 10 2.5 12c1 2.8 4.5 7 9.5 7 1.4 0 2.7-.3 3.8-.9"></path>',
        "</svg>"
      ].join(""),
      panelRight: [
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
        '<rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M15 4v16"></path>',
        "</svg>"
      ].join(""),
      close: [
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
        '<path d="M6 6l12 12"></path><path d="M18 6L6 18"></path>',
        "</svg>"
      ].join("")
    };
    return icons[name] || icons.languages;
  }

  function updatePanelState() {
    mountPanel();
    if (!state.panel) return;
    state.panel.classList.toggle("is-disabled", !state.settings.enabled);
    state.panel.classList.toggle("is-mask-on", state.settings.translationMaskEnabled);
    state.panel.classList.toggle("is-compact", state.settings.floatingBallCompact);
    state.panel.classList.toggle("is-hover-only", state.settings.floatingBallHoverOnly);
    state.panel.setAttribute("data-position", state.settings.floatingBallPosition);
    state.panel.style.setProperty(
      "--transly-floating-idle-opacity",
      String(Math.min(1, Math.max(0.58, state.settings.floatingBallOpacity / 100)))
    );
    const mainButton = state.panel.querySelector(".transly-panel-main");
    const tooltip = state.panel.querySelector(".transly-panel-tooltip");
    if (mainButton) updateActionLabel(mainButton);
    state.panel.querySelectorAll("[data-action]").forEach(updateActionLabel);
    if (tooltip && state.panel.classList.contains("has-tooltip")) {
      const activeAction = state.panel.getAttribute("data-tooltip-action");
      tooltip.textContent = panelTooltipText(activeAction);
    }
    document.documentElement.classList.toggle("transly-mask-enabled", state.settings.translationMaskEnabled);
    setStatus(state.settings.enabled ? state.messages.ready : state.messages.paused, {
      persistent: !state.settings.enabled
    });
  }

  function showPanelTooltipForEvent(event) {
    const target = event.target && event.target.closest && event.target.closest("[data-action]");
    if (!target || !state.panel || !state.panel.contains(target)) return;
    const action = target.getAttribute("data-action");
    const tooltip = state.panel.querySelector(".transly-panel-tooltip");
    if (!tooltip) return;
    tooltip.textContent = panelTooltipText(action);
    const panelRect = state.panel.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    state.panel.style.setProperty(
      "--transly-tooltip-y",
      `${targetRect.top + targetRect.height / 2 - panelRect.top}px`
    );
    state.panel.setAttribute("data-tooltip-action", action);
    state.panel.classList.add("has-tooltip");
  }

  function hidePanelTooltipForEvent(event) {
    const related = event.relatedTarget;
    if (related && related.closest && related.closest("[data-action]")) return;
    hidePanelTooltip();
  }

  function hidePanelTooltip() {
    if (!state.panel) return;
    state.panel.classList.remove("has-tooltip");
    state.panel.removeAttribute("data-tooltip-action");
  }

  function releaseFloatingPanelFocusAfterPointerClick(event, target) {
    if (!event || event.detail <= 0 || !target || !state.panel) return;
    window.setTimeout(() => {
      if (!state.panel) return;
      const active = document.activeElement;
      if (active && state.panel.contains(active) && typeof active.blur === "function") {
        active.blur();
      }
      hidePanelTooltip();
    }, 0);
  }

  function updateActionLabel(button) {
    const action = button.getAttribute("data-action");
    const label = panelTooltipText(action);
    button.setAttribute("title", label);
    button.setAttribute("aria-label", label);
  }

  function handleFloatingMainAction() {
    const action = state.settings.floatingBallClickAction || "toggle";
    if (action === "sidepanel") {
      sendRuntimeMessage({ type: "TRANSLY_OPEN_SIDE_PANEL" })
        .then(() => setStatus(state.messages.openSidePanel))
        .catch(showRuntimeErrorStatus);
      return;
    }
    if (action === "translate") {
      translatePage();
      return;
    }
    if (action === "showOriginal") {
      if (state.pageTranslated) {
        clearTranslations();
      } else {
        setStatus(state.messages.currentTranslated);
      }
      return;
    }
    togglePageTranslation();
  }

  function panelTooltipText(action) {
    if (action === "options") return "打开设置页";
    if (action === "translate") {
      if (state.settings.floatingBallClickAction === "sidepanel") return "点击打开侧边栏";
      if (state.settings.floatingBallClickAction === "translate") {
        return `点击翻译为${core.languageLabel(state.settings.targetLanguage)}`;
      }
      if (state.settings.floatingBallClickAction === "showOriginal") return "点击切换回原文";
      return state.pageTranslated
        ? "点击切换回原文"
        : `点击翻译为${core.languageLabel(state.settings.targetLanguage)}`;
    }
    if (action === "mask") {
      return state.settings.translationMaskEnabled ? "关闭学习模式" : "开启学习模式";
    }
    if (action === "sidepanel") return "打开侧边栏";
    if (action === "floatingSettings") return "关闭快捷按钮";
    return state.messages.ready;
  }

  function setStatus(text, options = {}) {
    if (!state.status) return;
    state.status.textContent = text;
    window.clearTimeout(state.statusTimer);
    const shouldShow = options.persistent || text !== state.messages.ready;
    if (state.panel) state.panel.classList.toggle("has-status", shouldShow);
    if (shouldShow && !options.persistent && !state.translating) {
      state.statusTimer = window.setTimeout(() => {
        if (state.panel) state.panel.classList.remove("has-status");
      }, 2400);
    }
  }

  async function translatePage(options = {}) {
    if (state.translating) {
      if (options.dynamic) state.dynamicPending = true;
      setStatus(`${state.messages.translating}...`, { persistent: true });
      return { ok: false, error: state.messages.translating };
    }
    state.settings = await loadSettings();
    state.messages = core.getUiMessages(state.settings.interfaceLanguage);
    state.rule = core.getSiteRule(location.href, state.settings.userRules);
    state.autoTranslateActive = shouldAutoTranslateCurrentPage(state.settings);
    if (!state.settings.enabled) {
      setStatus(state.messages.paused);
      return { ok: false, error: state.messages.extensionDisabled };
    }
    if (core.shouldBlockUrl(location.href, state.settings)) {
      const message = "当前页面已阻止翻译";
      setStatus(message);
      return { ok: false, error: message };
    }

    const runId = ++state.runId;
    const effectiveLimit = options.toEnd ? 250 : state.settings.maxBlocks;
    let candidates = collectCandidates(effectiveLimit, {
      visibleOnly: options.wholePage ? false : state.settings.visibleOnly
    });
    if (!candidates.length && state.settings.visibleOnly && !options.wholePage) {
      candidates = collectCandidates(effectiveLimit, { visibleOnly: false, viewportRetry: true });
    }
    const total = candidates.length;
    if (!candidates.length) {
      if (!options.dynamic) {
        const translatedCandidates = collectCandidates(effectiveLimit, {
          visibleOnly: options.wholePage ? false : state.settings.visibleOnly,
          includeTranslated: true,
          translatedOnly: true
        });
        setStatus(translatedCandidates.length ? state.messages.currentTranslated : state.messages.noText);
      }
      return { ok: true, translated: 0 };
    }

    let translated = 0;
    state.translating = true;
    setStatus(`${state.messages.translating} 0/${total}`);
    await runConcurrent(candidates, state.settings.concurrency, async (element) => {
      if (runId !== state.runId) return;
      const text = getElementSourceText(element);
      try {
        const translation = await translateText(text);
        if (runId !== state.runId) return;
        applyTranslation(element, translation);
        translated += 1;
        setStatus(`${state.messages.translating} ${translated}/${total}`);
      } catch (error) {
        element.setAttribute("data-transly-error", error.message || String(error));
      }
    });

    state.translating = false;
    if (translated > 0) state.pageTranslated = true;
    const shouldRunPendingDynamicPass = state.dynamicPending && runId === state.runId;
    state.dynamicPending = false;
    updatePanelState();
    setStatus(`${state.messages.translated} ${translated}/${total}`);
    installDynamicTranslation();
    if (shouldRunPendingDynamicPass) {
      scheduleDynamicTranslation(180);
    }
    return { ok: true, translated };
  }

  async function togglePageTranslation(options = {}) {
    if (state.pageTranslated) {
      clearTranslations();
      return { ok: true, translated: 0, cleared: true };
    }
    return translatePage(options);
  }

  function collectCandidates(limit, options = {}) {
    const root = document.body;
    if (!root) return [];
    const ruleSelectors = state.rule.includeSelectors && state.rule.includeSelectors.length
      ? state.rule.includeSelectors
      : state.rule.selectors;
    const selectors = ruleSelectors && ruleSelectors.length
      ? ruleSelectors
      : core.DEFAULT_SELECTORS;
    const hasSiteSpecificSelectors = state.rule.id !== "default" && selectors.length;
    const seen = new Set();
    const nodes = [];

    collectFromSelectors(root, selectors, limit, nodes, seen, options);
    const overrideSelectors = siteContentOverrideSelectors();
    if (overrideSelectors.length && nodes.length < limit) {
      collectFromSelectors(root, overrideSelectors, limit, nodes, seen, {
        ...options,
        siteOverride: true
      });
    }
    if (shouldUseSmartSupplementalDiscovery() && nodes.length < limit) {
      collectSmartTextLeaves(root, limit, nodes, seen, {
        ...options,
        smart: true
      });
    }
    if (hasSiteSpecificSelectors) return nodes;
    if (!nodes.length) {
      collectFromSelectors(root, FALLBACK_SELECTORS, limit, nodes, seen, {
        ...options,
        fallback: true
      });
    }
    if (!nodes.length) {
      collectReadableContainers(root, limit, nodes, seen, {
        ...options,
        fallback: true
      });
    }
    return nodes;
  }

  function shouldUseSmartSupplementalDiscovery() {
    return ruleDynamicMode() === "eager" || state.rule.id === "default" || state.rule.id === "reddit";
  }

  function collectFromSelectors(root, selectors, limit, nodes, seen, options = {}) {
    for (const selector of selectors) {
      let elements = [];
      try {
        elements = Array.from(root.querySelectorAll(selector));
      } catch (error) {
        continue;
      }
      for (const element of elements) {
        if (nodes.length >= limit) break;
        if (seen.has(element)) continue;
        seen.add(element);
        if (!isCandidateElement(element, options)) continue;
        if (nodes.some((node) => node.contains(element) || element.contains(node))) continue;
        nodes.push(element);
      }
      if (nodes.length >= limit) break;
    }
  }

  function collectReadableContainers(root, limit, nodes, seen, options = {}) {
    const elements = Array.from(root.querySelectorAll("div, section, article, td, th"));
    for (const element of elements) {
      if (nodes.length >= limit) break;
      if (seen.has(element)) continue;
      seen.add(element);
      if (!isCandidateElement(element, options)) continue;
      if (nodes.some((node) => node.contains(element) || element.contains(node))) continue;
      nodes.push(element);
    }
  }

  function collectSmartTextLeaves(root, limit, nodes, seen, options = {}) {
    const scopes = Array.from(root.querySelectorAll(smartScopeSelector));
    const searchScopes = scopes.length ? scopes : [root];
    for (const scope of searchScopes) {
      let elements = [];
      try {
        elements = Array.from(scope.querySelectorAll(smartTextSelector));
      } catch (error) {
        continue;
      }
      for (const element of elements) {
        if (nodes.length >= limit) break;
        if (seen.has(element)) continue;
        seen.add(element);
        if (!isCandidateElement(element, options)) continue;
        if (nodes.some((node) => node.contains(element) || element.contains(node))) continue;
        nodes.push(element);
      }
      if (nodes.length >= limit) break;
    }
  }

  function isCandidateElement(element, options = {}) {
    if (isTranslyOwned(element)) return false;
    if (isSubtitleElement(element)) return false;
    const contentOverride = isSiteContentOverrideElement(element);
    if (core.isSkippableElement(element, state.rule) && !contentOverride) return false;
    if (isSiteChromeElement(element) && !contentOverride) return false;
    const alreadyTranslated = element.hasAttribute(translatedAttribute);
    if (options.translatedOnly && !alreadyTranslated) return false;
    if (alreadyTranslated && !options.includeTranslated) return false;
    if (hasTranslatedAncestor(element)) return false;
    if (!options.includeTranslated && hasTranslatedDescendant(element)) return false;
    if (options.smart && !isSmartReadableElement(element)) return false;
    if (options.fallback && !isReadableFallbackElement(element)) return false;
    if (options.visibleOnly !== false && state.settings.visibleOnly && !isElementNearViewport(element)) return false;
    const text = getElementSourceText(element);
    if (!shouldTranslateText(text)) return false;
    if (element.children.length > 8 && text.length > 1200) return false;
    return true;
  }

  function isSmartReadableElement(element) {
    if (isInteractiveControlElement(element)) return false;
    if (hasBlockLikeChildren(element)) return false;
    const text = getElementSourceText(element);
    if (!text || text.length > 700) return false;
    if (looksLikeUiLabel(text, element)) return false;
    const words = countWords(text);
    if (isHeadingLikeElement(element)) return text.length >= 10 && words >= 2;
    if (isSemanticTextElement(element)) return text.length >= 16 && words >= 3;
    return text.length >= 40 && words >= 6;
  }

  function isInteractiveControlElement(element) {
    return Boolean(
      element.closest(
        "button, input, textarea, select, option, label, [role='button'], [role='menuitem'], [aria-haspopup='true'], [data-action]"
      )
    );
  }

  function hasBlockLikeChildren(element) {
    return Array.from(element.children).some((child) => {
      if (inlineTextTags.has(child.tagName)) return false;
      return core.normalizeText(child.innerText || child.textContent).length > 0;
    });
  }

  function isHeadingLikeElement(element) {
    return /^H[1-6]$/.test(element.tagName) || element.getAttribute("role") === "heading";
  }

  function isSemanticTextElement(element) {
    if (readableFallbackTags.has(element.tagName)) return true;
    if (isHeadingLikeElement(element)) return true;
    return semanticTextPattern.test(
      [
        element.id,
        element.className,
        element.getAttribute("data-testid"),
        element.getAttribute("aria-label")
      ].join(" ")
    );
  }

  function looksLikeUiLabel(text, element) {
    const normalized = core.normalizeText(text);
    const lower = normalized.toLowerCase();
    if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\s+(?:released|updated|created))?$/i.test(normalized)) {
      return true;
    }
    if (/^v?\d+(?:\.\d+){1,}(?:[-+][A-Za-z0-9_.-]+)?$/.test(normalized)) return true;
    if (normalized.length <= 18 && /^(home|dashboard|search|menu|new|filter|settings|profile|pricing|docs|login|log in|sign in|sign out|show more)$/i.test(normalized)) {
      return true;
    }
    if (element.closest("a") && countWords(normalized) <= 2 && !/[.!?。！？:：]/.test(normalized)) return true;
    if (lower.includes("type / to search") || lower.includes("find a repository")) return true;
    return false;
  }

  function shouldTranslateText(text) {
    return core.shouldTranslateTextBlock(text, state.settings, {
      url: location.href,
      rule: state.rule,
      targetLanguage: state.settings.targetLanguage
    });
  }

  function getElementSourceText(element) {
    if (!element) return "";
    const clone = element.cloneNode(true);
    clone.querySelectorAll(translyOwnedSelector).forEach((node) => node.remove());
    return core.normalizeText(clone.innerText || clone.textContent);
  }

  function isTranslyOwned(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    return Boolean(node.matches(translyOwnedSelector) || node.closest(translyOwnedSelector));
  }

  function isSubtitleElement(element) {
    return Boolean(element && safeMatchesClosest(element, subtitleMutationSelector));
  }

  function isSiteChromeElement(element) {
    if (!element) return false;
    if (state.rule.id === "github") {
      return GITHUB_CHROME_SELECTORS.some((selector) => safeMatchesClosest(element, selector));
    }
    if (state.rule.id === "reddit") {
      return REDDIT_CHROME_SELECTORS.some((selector) => safeMatchesClosest(element, selector));
    }
    return false;
  }

  function isSiteContentOverrideElement(element) {
    if (!element) return false;
    if (state.rule.id === "github") {
      return GITHUB_CONTENT_OVERRIDE_SELECTORS.some((selector) => safeMatches(element, selector));
    }
    if (state.rule.id === "reddit") {
      return REDDIT_CONTENT_OVERRIDE_SELECTORS.some((selector) => safeMatches(element, selector));
    }
    return false;
  }

  function siteContentOverrideSelectors() {
    if (state.rule.id === "github") return GITHUB_CONTENT_OVERRIDE_SELECTORS;
    if (state.rule.id === "reddit") return REDDIT_CONTENT_OVERRIDE_SELECTORS;
    return [];
  }

  function safeMatches(element, selector) {
    try {
      return element.matches(selector);
    } catch (error) {
      return false;
    }
  }

  function safeMatchesClosest(element, selector) {
    try {
      return element.matches(selector) || Boolean(element.closest(selector));
    } catch (error) {
      return false;
    }
  }

  function hasTranslatedDescendant(element) {
    return Boolean(
      element.querySelector(
        `[${translatedAttribute}], .transly-translation-wrapper, .transly-translation`
      )
    );
  }

  function hasTranslatedAncestor(element) {
    const parent = element && element.parentElement;
    if (!parent) return false;
    return Boolean(parent.closest(`[${translatedAttribute}], .transly-translation-wrapper, .transly-translation`));
  }

  function isReadableFallbackElement(element) {
    if (readableFallbackTags.has(element.tagName)) return true;
    if (element.matches("[data-testid='tweetText'], div[dir='auto']")) return true;
    if (!fallbackContainerTags.has(element.tagName)) return false;
    if (hasReadableChildBlock(element)) return false;
    const text = getElementSourceText(element);
    if (text.length < 35) return false;
    return countWords(text) >= 5;
  }

  function hasReadableChildBlock(element) {
    return Array.from(element.children).some((child) => {
      if (child.matches(textContainerSelector)) return true;
      if (!fallbackContainerTags.has(child.tagName)) return false;
      const childText = getElementSourceText(child);
      return childText.length >= 24;
    });
  }

  function countWords(text) {
    return String(text || "").split(/\s+/).filter(Boolean).length;
  }

  function isElementNearViewport(element) {
    const rect = element.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 8) return false;
    if (!("IntersectionObserver" in window)) {
      return rect.bottom >= -window.innerHeight && rect.top <= window.innerHeight * 2;
    }
    return rect.bottom >= -window.innerHeight * 0.5 && rect.top <= window.innerHeight * 1.8;
  }

  async function runConcurrent(items, limit, worker) {
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (items.length) {
        const item = items.shift();
        await worker(item);
      }
    });
    await Promise.all(workers);
  }

  async function translateText(text, overrideSettings) {
    const requestSettings = overrideSettings || state.settings;
    const key = [
      requestSettings.provider,
      requestSettings.sourceLanguage,
      requestSettings.targetLanguage,
      requestSettings.providerFallbackOrder.join(">"),
      requestSettings.customEndpoint,
      String(Boolean(requestSettings.fallbackToDemo)),
      core.serviceEngineFingerprint(requestSettings),
      core.glossaryFingerprint(requestSettings),
      text
    ].join(":");
    if (state.cache.has(key)) return state.cache.get(key);

    const response = await sendRuntimeMessage({
      type: "TRANSLY_TRANSLATE",
      text,
      url: location.href,
      settings: requestSettings,
      forceTranslateWhenMixedLanguage: Boolean(state.rule && state.rule.forceTranslateWhenMixedLanguage)
    });
    if (!response || !response.ok) {
      throw new Error((response && response.error) || "翻译失败");
    }
    if (response.warning) {
      setStatus(response.warning, { tone: "warning" });
    }
    if (!response.provider || response.provider === requestSettings.provider) {
      state.cache.set(key, response.text);
    }
    return response.text;
  }

  async function sendRuntimeMessage(message) {
    const runtime = runtimeMessagingApi();
    if (!runtime) throw unavailableRuntimeError();
    try {
      return await runtime.sendMessage(message);
    } catch (error) {
      const messageText = error && error.message ? error.message : String(error || "");
      if (/Extension context invalidated|Receiving end does not exist|context invalid/i.test(messageText)) {
        throw unavailableRuntimeError();
      }
      throw error;
    }
  }

  function runtimeMessagingApi() {
    if (typeof chrome !== "undefined" && chrome && chrome.runtime && typeof chrome.runtime.sendMessage === "function") {
      return chrome.runtime;
    }
    if (typeof browser !== "undefined" && browser && browser.runtime && typeof browser.runtime.sendMessage === "function") {
      return browser.runtime;
    }
    return null;
  }

  function unavailableRuntimeError() {
    return new Error("扩展通信通道不可用，请刷新页面后重试。");
  }

  function showRuntimeErrorStatus(error) {
    setStatus((error && error.message) || unavailableRuntimeError().message);
  }

  function installSubtitleTranslation() {
    if (!document.body || state.subtitleObserver || !("MutationObserver" in window)) {
      syncSubtitleTranslation();
      return;
    }
    state.subtitleObserver = new MutationObserver((mutations) => {
      if (!shouldReactToSubtitleMutations(mutations)) return;
      scheduleSubtitleTranslation(120);
    });
    state.subtitleObserver.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true
    });
    syncSubtitleTranslation();
  }

  function syncSubtitleTranslation() {
    state.subtitleRunId += 1;
    if (!shouldUseSubtitleTranslation()) {
      clearSubtitleTranslations();
      return;
    }
    scheduleSubtitleTranslation(180);
  }

  function shouldUseSubtitleTranslation() {
    if (!state.settings.enabled || !state.settings.videoSubtitleEnabled) return false;
    const hostname = String(location.hostname || "").replace(/^www\./, "").toLowerCase();
    const isYouTube = hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "youtu.be";
    if (isYouTube) return state.settings.videoSubtitleYouTubeEnabled;
    return state.settings.videoSubtitleGenericEnabled;
  }

  function shouldReactToSubtitleMutations(mutations) {
    if (!shouldUseSubtitleTranslation() || document.hidden) return false;
    return mutations.some((mutation) => {
      const nodes = [
        mutation.target,
        ...Array.from(mutation.addedNodes || []),
        ...Array.from(mutation.removedNodes || [])
      ];
      return nodes.some((node) => isSubtitleMutationNode(node));
    });
  }

  function isSubtitleMutationNode(node) {
    if (!node) return false;
    const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!element || element.nodeType !== Node.ELEMENT_NODE || isTranslyOwned(element)) return false;
    return safeMatchesClosest(element, subtitleMutationSelector);
  }

  function scheduleSubtitleTranslation(delay) {
    if (!shouldUseSubtitleTranslation()) return;
    window.clearTimeout(state.subtitleTimer);
    state.subtitleTimer = window.setTimeout(() => {
      translateVisibleSubtitles();
    }, delay);
  }

  async function translateVisibleSubtitles() {
    if (!shouldUseSubtitleTranslation()) return { ok: false, translated: 0 };
    const runId = state.subtitleRunId;
    const groups = collectSubtitleGroups();
    let translated = 0;
    for (const group of groups) {
      if (runId !== state.subtitleRunId) break;
      const sourceText = getSubtitleSourceText(group.container);
      if (!sourceText || !shouldTranslateText(sourceText)) {
        clearSubtitleGroup(group);
        continue;
      }
      if (group.container.getAttribute("data-transly-subtitle-source") === sourceText) {
        applySubtitleMode(group);
        applySubtitleStyle(group);
        continue;
      }
      group.container.setAttribute("data-transly-subtitle-source", sourceText);
      try {
        const translation = await translateText(sourceText, subtitleTranslationSettings());
        if (runId !== state.subtitleRunId) break;
        applySubtitleTranslation(group, translation);
        translated += 1;
      } catch (error) {
        group.container.setAttribute("data-transly-subtitle-error", error.message || String(error));
      }
    }
    return { ok: true, translated };
  }

  function collectSubtitleGroups() {
    if (!document.body) return [];
    const hosts = Array.from(document.querySelectorAll(subtitleHostSelector));
    return hosts
      .filter((container) => !isTranslyOwned(container) && isVisibleSubtitleHost(container))
      .map((container) => ({
        container,
        sources: subtitleSourceElements(container)
      }))
      .filter((group) => group.sources.length);
  }

  function subtitleSourceElements(container) {
    const segments = Array.from(container.querySelectorAll(subtitleSegmentSelector))
      .filter((element) => !isTranslyOwned(element));
    if (segments.length && !segments.includes(container)) return segments;
    return [container];
  }

  function isVisibleSubtitleHost(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getSubtitleSourceText(container) {
    const clone = container.cloneNode(true);
    clone.querySelectorAll(translyOwnedSelector).forEach((node) => node.remove());
    return core.normalizeText(clone.innerText || clone.textContent);
  }

  function subtitleTranslationSettings() {
    const provider =
      state.settings.videoSubtitleProvider === "default"
        ? state.settings.provider
        : state.settings.videoSubtitleProvider;
    const providerFallbackOrder = [
      provider,
      ...state.settings.providerFallbackOrder.filter((item) => item !== provider)
    ];
    return core.normalizeSettings({
      ...state.settings,
      provider,
      providerFallbackOrder
    });
  }

  function applySubtitleTranslation(group, translation) {
    const translationNode = directSubtitleTranslationNode(group.container) || document.createElement("div");
    translationNode.className = "transly-subtitle-translation";
    translationNode.setAttribute("data-transly-owned", "true");
    translationNode.textContent = translation;
    if (!translationNode.parentElement) group.container.appendChild(translationNode);
    group.container.classList.add("transly-subtitle-host");
    group.container.removeAttribute("data-transly-subtitle-error");
    applySubtitleMode(group);
    applySubtitleStyle(group);
  }

  function applySubtitleMode(group) {
    const translationOnly = state.settings.videoSubtitleMode === "translation";
    group.sources.forEach((source) => {
      source.classList.toggle("transly-subtitle-source-hidden", translationOnly && source !== group.container);
    });
    group.container.classList.toggle("transly-subtitle-translation-only", translationOnly);
    applySubtitleStyle(group);
  }

  function applySubtitleStyle(group) {
    const translationNode = directSubtitleTranslationNode(group.container);
    if (!translationNode) return;
    const fontScale = Math.min(2.2, Math.max(0.7, Number(state.settings.videoSubtitleFontScale || 110) / 100));
    const textColor = state.settings.videoSubtitleTextColor || "#ffd2e5";
    const backgroundColor = state.settings.videoSubtitleBackgroundColor || "";
    translationNode.style.setProperty(
      "--transly-subtitle-font-size",
      `clamp(${Math.round(18 * fontScale)}px, ${(2.1 * fontScale).toFixed(2)}vw, ${Math.round(30 * fontScale)}px)`
    );
    translationNode.style.setProperty("--transly-subtitle-color", textColor);
    translationNode.style.setProperty("--transly-subtitle-background", backgroundColor || "transparent");
    translationNode.classList.toggle("has-background", Boolean(backgroundColor));
    translationNode.classList.toggle("has-shadow", state.settings.videoSubtitleTextShadow !== false);
  }

  function directSubtitleTranslationNode(container) {
    return Array.from(container.children).find((node) =>
      node.classList && node.classList.contains("transly-subtitle-translation")
    );
  }

  function clearSubtitleGroup(group) {
    directSubtitleTranslationNode(group.container)?.remove();
    group.container.removeAttribute("data-transly-subtitle-source");
    group.container.removeAttribute("data-transly-subtitle-error");
    group.container.classList.remove("transly-subtitle-host", "transly-subtitle-translation-only");
    group.sources.forEach((source) => source.classList.remove("transly-subtitle-source-hidden"));
  }

  function clearSubtitleTranslations() {
    window.clearTimeout(state.subtitleTimer);
    document.querySelectorAll(".transly-subtitle-translation").forEach((node) => node.remove());
    document.querySelectorAll("[data-transly-subtitle-source], [data-transly-subtitle-error]").forEach((container) => {
      container.removeAttribute("data-transly-subtitle-source");
      container.removeAttribute("data-transly-subtitle-error");
      container.classList.remove("transly-subtitle-host", "transly-subtitle-translation-only");
    });
    document.querySelectorAll(".transly-subtitle-source-hidden").forEach((source) => {
      source.classList.remove("transly-subtitle-source-hidden");
    });
  }

  function applyTranslation(element, translation) {
    const mode = state.settings.displayMode;
    const sameLanguageBackground = core.getSameLanguageBackground(
      getElementSourceText(element),
      state.settings.targetLanguage,
      state.settings
    );
    element.setAttribute(translatedAttribute, "true");
    element.setAttribute("data-transly-theme", state.settings.translationTheme);
    element.setAttribute("data-transly-same-language-background", sameLanguageBackground);
    applyCustomTranslationStyles(element);
    removeTranslationWrappers(element);

    if (mode === "original") {
      element.setAttribute("data-transly-hover-text", translation);
      element.classList.add("transly-hoverable");
      return;
    }

    if (mode === "replace") {
      if (!element.hasAttribute(originalHtmlAttribute)) {
        element.setAttribute(originalHtmlAttribute, element.innerHTML);
        element.setAttribute(originalTextAttribute, element.textContent || "");
      }
      element.textContent = translation;
      element.classList.add("transly-replaced");
      return;
    }

    if (mode === "hover") {
      element.setAttribute("data-transly-hover-text", translation);
      element.classList.add("transly-hoverable");
      return;
    }

    const wrapper = createTranslationWrapper(translation);
    wrapper.setAttribute("data-transly-same-language-background", sameLanguageBackground);

    if (mode === "translation") {
      element.setAttribute(originalDisplayAttribute, element.style.display || "");
      element.style.display = "none";
      element.insertAdjacentElement("afterend", wrapper);
      return;
    }

    if (["LI", "TD", "TH"].includes(element.tagName)) {
      element.appendChild(wrapper);
    } else {
      element.insertAdjacentElement("afterend", wrapper);
    }
  }

  function createTranslationWrapper(translation) {
    const wrapper = document.createElement("span");
    wrapper.className = "transly-translation-wrapper";
    wrapper.setAttribute("data-transly-owned", "true");
    wrapper.setAttribute("data-transly-theme", state.settings.translationTheme);
    applyCustomTranslationStyles(wrapper);

    const translationNode = document.createElement("span");
    translationNode.className = "transly-translation";
    translationNode.setAttribute("data-transly-owned", "true");
    translationNode.setAttribute("data-transly-theme", state.settings.translationTheme);
    translationNode.textContent = translation;
    wrapper.appendChild(translationNode);
    return wrapper;
  }

  function applyCustomTranslationStyles(element) {
    if (!element || !element.style) return;
    setOrRemoveStyleProperty(element, "--transly-translation-color", state.settings.translationTextColor);
    setOrRemoveStyleProperty(element, "--transly-translation-bg", state.settings.translationBackgroundColor);
    const scale = Number(state.settings.translationFontScale || 100) / 100;
    setOrRemoveStyleProperty(element, "--transly-translation-font-scale", Number.isFinite(scale) ? String(scale) : "1");
    setOrRemoveStyleProperty(
      element,
      "--transly-translation-max-width",
      state.settings.translationMaxWidth > 0 ? `${state.settings.translationMaxWidth}px` : ""
    );
    setOrRemoveStyleProperty(element, "--transly-translation-font-family", translationFontStack());
  }

  function clearCustomTranslationStyles(element) {
    if (!element || !element.style) return;
    [
      "--transly-translation-color",
      "--transly-translation-bg",
      "--transly-translation-font-scale",
      "--transly-translation-max-width",
      "--transly-translation-font-family"
    ].forEach((property) => element.style.removeProperty(property));
  }

  function setOrRemoveStyleProperty(element, property, value) {
    if (value) element.style.setProperty(property, value);
    else element.style.removeProperty(property);
  }

  function translationFontStack() {
    const family = state.settings.translationFontFamily || "";
    if (family === "serif") return 'Georgia, "Times New Roman", serif';
    if (family === "sans") return 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    if (family === "mono") return 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
    if (family === "rounded") return 'ui-rounded, "SF Pro Rounded", "Nunito Sans", system-ui, sans-serif';
    if (family === "system") return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    return "";
  }

  function removeTranslationWrappers(element) {
    const next = nextTranslationNode(element);
    if (next) next.remove();
    element.querySelectorAll(":scope > .transly-translation-wrapper").forEach((node) => node.remove());
    element.querySelectorAll(":scope > .transly-translation").forEach((node) => node.remove());
  }

  function nextTranslationNode(element) {
    const next = element.nextElementSibling;
    if (!next) return null;
    return next.classList.contains("transly-translation-wrapper") || next.classList.contains("transly-translation")
      ? next
      : null;
  }

  function clearTranslations() {
    state.runId += 1;
    state.pageTranslated = false;
    state.dynamicPending = false;
    window.clearTimeout(state.dynamicTimer);
    document.querySelectorAll(".transly-translation-wrapper").forEach((node) => node.remove());
    document.querySelectorAll(".transly-translation").forEach((node) => node.remove());
    document.querySelectorAll(`[${translatedAttribute}]`).forEach((element) => {
      if (element.hasAttribute(originalHtmlAttribute)) {
        element.innerHTML = element.getAttribute(originalHtmlAttribute);
      } else if (element.hasAttribute(originalTextAttribute)) {
        element.textContent = element.getAttribute(originalTextAttribute);
      }
      if (element.hasAttribute(originalDisplayAttribute)) {
        element.style.display = element.getAttribute(originalDisplayAttribute);
      }
      element.removeAttribute(translatedAttribute);
      element.removeAttribute(originalTextAttribute);
      element.removeAttribute(originalHtmlAttribute);
      element.removeAttribute(originalDisplayAttribute);
      element.removeAttribute("data-transly-hover-text");
      element.removeAttribute("data-transly-error");
      element.removeAttribute("data-transly-theme");
      element.removeAttribute("data-transly-same-language-background");
      clearCustomTranslationStyles(element);
      element.classList.remove("transly-replaced", "transly-hoverable");
    });
    updatePanelState();
    setStatus(state.messages.cleared);
  }

  async function toggleOnlyTranslation() {
    const nextMode = state.settings.displayMode === "translation" ? "dual" : "translation";
    const settings = core.normalizeSettings({ ...state.settings, displayMode: nextMode });
    await saveSettings(settings);
    clearTranslations();
    return translatePage();
  }

  async function toggleTranslationMask() {
    const settings = core.normalizeSettings({
      ...state.settings,
      translationMaskEnabled: !state.settings.translationMaskEnabled
    });
    await saveSettings(settings);
    updatePanelState();
    return { ok: true, translationMaskEnabled: settings.translationMaskEnabled };
  }

  async function saveSettings(settings) {
    state.settings = core.normalizeSettings(settings);
    await chrome.storage.sync.set({ [SETTINGS_KEY]: publicSettings(state.settings) });
    sendRuntimeMessage({ type: "TRANSLY_SETTINGS_CHANGED", settings: runtimeSettings(state.settings) }).catch(() => {});
  }

  function openFloatingSettingsDialog() {
    if (state.floatingSettingsDialog) return;

    const dialog = document.createElement("div");
    dialog.className = "transly-floating-settings";
    dialog.setAttribute("data-transly-owned", "true");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "transly-floating-settings-title");
    dialog.innerHTML = [
      '<div class="transly-floating-settings-card">',
      '<div class="transly-floating-settings-head">',
      '<div>',
      '<p class="transly-floating-settings-kicker">全能翻译</p>',
      '<h2 id="transly-floating-settings-title" class="transly-floating-settings-title">关闭快捷按钮</h2>',
      "</div>",
      '<button class="transly-floating-settings-close" type="button" data-floating-action="dismiss" aria-label="关闭设置">',
      panelIcon("close"),
      "</button>",
      "</div>",
      '<div class="transly-floating-preview" aria-hidden="true">',
      '<span class="transly-floating-preview-track">',
      '<i class="transly-floating-preview-dot is-tool"></i>',
      '<i class="transly-floating-preview-dot is-main">',
      panelIcon("languages"),
      "</i>",
      '<i class="transly-floating-preview-dot is-tool"></i>',
      "</span>",
      '<span class="transly-floating-preview-copy">关闭前确认 · 设置会立即生效</span>',
      "</div>",
      '<div class="transly-floating-section">',
      '<label class="transly-floating-settings-row">',
      "<span>紧凑按钮</span>",
      `<input name="translyFloatingCompact" type="checkbox" ${state.settings.floatingBallCompact ? "checked" : ""}>`,
      '<i aria-hidden="true"></i>',
      "</label>",
      '<label class="transly-floating-settings-row">',
      "<span>悬停时展开工具</span>",
      `<input name="translyFloatingHoverOnly" type="checkbox" ${state.settings.floatingBallHoverOnly ? "checked" : ""}>`,
      '<i aria-hidden="true"></i>',
      "</label>",
      "</div>",
      '<div class="transly-floating-controls">',
      '<label><span>点击行为</span><select name="translyFloatingClickAction">',
      floatingSelectOption("toggle", "翻译/显示原文", state.settings.floatingBallClickAction),
      floatingSelectOption("translate", "仅翻译", state.settings.floatingBallClickAction),
      floatingSelectOption("showOriginal", "仅显示原文", state.settings.floatingBallClickAction),
      floatingSelectOption("sidepanel", "打开侧边栏", state.settings.floatingBallClickAction),
      "</select></label>",
      '<label><span>固定位置</span><select name="translyFloatingPosition">',
      floatingSelectOption("right", "右侧", state.settings.floatingBallPosition),
      floatingSelectOption("left", "左侧", state.settings.floatingBallPosition),
      "</select></label>",
      `<label><span>透明度</span><input name="translyFloatingOpacity" type="number" min="0" max="100" step="5" value="${state.settings.floatingBallOpacity}"></label>`,
      "</div>",
      '<div class="transly-floating-section">',
      '<label class="transly-floating-settings-row">',
      "<span>确认隐藏按钮</span>",
      '<input name="translyFloatingHidden" type="checkbox" checked>',
      '<i aria-hidden="true"></i>',
      "</label>",
      "</div>",
      '<div class="transly-floating-close-options" role="radiogroup" aria-label="隐藏范围">',
      floatingCloseOption("session", "本次访问", "刷新或下次进入后恢复", true),
      floatingCloseOption("site", "当前网站", "加入不自动翻译，可在弹窗开启"),
      floatingCloseOption("forever", "永久关闭", "可在设置页开启"),
      "</div>",
      '<button class="transly-floating-settings-primary" type="button" data-floating-action="apply">确认关闭</button>',
      "</div>"
    ].join("");

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dismissFloatingSettingsDialog();
        return;
      }
      const target = event.target && event.target.closest && event.target.closest("[data-floating-action]");
      if (!target) return;
      const action = target.getAttribute("data-floating-action");
      if (action === "dismiss") dismissFloatingSettingsDialog();
      if (action === "apply") applyFloatingSettingsDialog();
      if (action === "options") sendRuntimeMessage({ type: "TRANSLY_OPEN_OPTIONS_PAGE" }).catch(showRuntimeErrorStatus);
    });

    const hiddenToggle = dialog.querySelector("input[name='translyFloatingHidden']");
    const primary = dialog.querySelector(".transly-floating-settings-primary");
    const options = dialog.querySelector(".transly-floating-close-options");
    hiddenToggle.addEventListener("change", () => {
      const hidden = hiddenToggle.checked;
      primary.textContent = hidden ? "确认关闭" : "保存显示设置";
      options.classList.toggle("is-disabled", !hidden);
      options.querySelectorAll("input").forEach((input) => {
        input.disabled = !hidden;
      });
    });

    document.body.appendChild(dialog);
    state.floatingSettingsDialog = dialog;
  }

  function floatingCloseOption(value, label, note, checked) {
    return [
      '<label class="transly-floating-radio">',
      `<input name="translyFloatingCloseMode" type="radio" value="${value}" ${checked ? "checked" : ""}>`,
      "<span></span>",
      `<strong>${label}</strong>`,
      note ? `<em>（${note.replace("设置页", '<b data-floating-action="options">设置页</b>')}）</em>` : "",
      "</label>"
    ].join("");
  }

  function floatingSelectOption(value, label, currentValue) {
    return `<option value="${value}" ${value === currentValue ? "selected" : ""}>${label}</option>`;
  }

  async function applyFloatingSettingsDialog() {
    const dialog = state.floatingSettingsDialog;
    if (!dialog) return;
    const compact = dialog.querySelector("input[name='translyFloatingCompact']").checked;
    const hoverOnly = dialog.querySelector("input[name='translyFloatingHoverOnly']").checked;
    const clickAction = dialog.querySelector("select[name='translyFloatingClickAction']").value;
    const position = dialog.querySelector("select[name='translyFloatingPosition']").value;
    const opacity = dialog.querySelector("input[name='translyFloatingOpacity']").value;
    const hidden = dialog.querySelector("input[name='translyFloatingHidden']").checked;
    const modeInput = dialog.querySelector("input[name='translyFloatingCloseMode']:checked");
    const mode = modeInput ? modeInput.value : "session";
    let settings = core.normalizeSettings({
      ...state.settings,
      floatingBallCompact: compact,
      floatingBallHoverOnly: hoverOnly,
      floatingBallClickAction: clickAction,
      floatingBallPosition: position,
      floatingBallOpacity: opacity
    });

    if (!hidden) {
      await saveSettings(settings);
      dismissFloatingSettingsDialog();
      updatePanelState();
      return;
    }

    if (mode === "forever") {
      settings = core.normalizeSettings({ ...settings, floatingBallEnabled: false });
      await saveSettings(settings);
      dismissFloatingSettingsDialog();
      removeFloatingPanel();
      return;
    }

    if (mode === "site") {
      const currentHost = normalizeCurrentHostname();
      settings = core.normalizeSettings({
        ...settings,
        floatingBallBlockedDomains: addDomainToList(settings.floatingBallBlockedDomains, currentHost),
        neverAutoTranslateDomains: addDomainToList(settings.neverAutoTranslateDomains, currentHost),
        alwaysTranslateDomains: removeDomainFromList(settings.alwaysTranslateDomains, currentHost)
      });
      await saveSettings(settings);
      dismissFloatingSettingsDialog();
      removeFloatingPanel();
      return;
    }

    await saveSettings(settings);
    markFloatingPanelHiddenForSession();
    dismissFloatingSettingsDialog();
    removeFloatingPanel();
  }

  function dismissFloatingSettingsDialog() {
    if (!state.floatingSettingsDialog) return;
    state.floatingSettingsDialog.remove();
    state.floatingSettingsDialog = null;
  }

  function removeFloatingPanel() {
    if (state.panel) {
      state.panel.remove();
      state.panel = null;
      state.status = null;
    }
  }

  function normalizeCurrentHostname() {
    return String(location.hostname || "").replace(/^www\./, "").toLowerCase();
  }

  function addDomainToList(list, domain) {
    if (!domain) return Array.isArray(list) ? list : [];
    const values = Array.isArray(list) ? list : [];
    return values.includes(domain) ? values : [...values, domain];
  }

  function removeDomainFromList(list, domain) {
    if (!domain) return Array.isArray(list) ? list : [];
    return (Array.isArray(list) ? list : []).filter((item) => item !== domain);
  }

  function floatingSessionKey() {
    return `transly-floating-hidden:${location.origin}${location.pathname}`;
  }

  function isFloatingPanelHiddenForSession() {
    try {
      return window.sessionStorage.getItem(floatingSessionKey()) === "1";
    } catch (error) {
      return false;
    }
  }

  function markFloatingPanelHiddenForSession() {
    try {
      window.sessionStorage.setItem(floatingSessionKey(), "1");
    } catch (error) {
      // Ignore storage failures on restricted pages; the current DOM still hides the panel.
    }
  }

  function publicSettings(settings) {
    return { ...settings, customApiKey: "", customGlossaryTerms: [] };
  }

  function runtimeSettings(settings) {
    return { ...publicSettings(settings), customGlossaryTerms: settings.customGlossaryTerms };
  }

  function getPageInfo() {
    return {
      ok: true,
      title: document.title,
      url: location.href,
      hostname: location.hostname,
      ruleId: state.rule.id,
      selectors: state.rule.selectors || [],
      excludeSelectors: state.rule.excludeSelectors || [],
      translatedCount: document.querySelectorAll(".transly-translation").length
    };
  }

  async function capturePlayerSubtitles() {
    try {
      const textTrackCapture = await captureTextTrackSubtitles();
      if (textTrackCapture) return textTrackCapture;
      const youtubeCapture = await captureYouTubeSubtitles();
      if (youtubeCapture) return youtubeCapture;
      return {
        ok: false,
        error: "未识别到可下载字幕。请确认播放器已开启字幕，或当前视频提供字幕轨道。"
      };
    } catch (error) {
      return { ok: false, error: error.message || String(error) };
    }
  }

  async function captureTextTrackSubtitles() {
    const videos = Array.from(document.querySelectorAll("video"));
    for (const video of videos) {
      const tracks = Array.from(video.textTracks || []);
      const sortedTracks = tracks
        .filter((track) => track && (track.kind === "subtitles" || track.kind === "captions"))
        .sort((left, right) => trackScore(right) - trackScore(left));
      for (const track of sortedTracks) {
        const originalMode = track.mode;
        try {
          if (track.mode === "disabled") track.mode = "hidden";
          await waitForSubtitleTrack(track);
          const cues = subtitleCuesFromTextTrack(track);
          if (cues.length) {
            return buildCapturedSubtitleResponse(cues, {
              filename: subtitleDownloadFilename("player-captions.vtt"),
              sourceLabel: track.label || track.language || "网页播放器字幕"
            });
          }
        } catch (error) {
          // A single protected or cross-origin track should not block YouTube caption fallback.
        } finally {
          if (originalMode === "disabled") track.mode = originalMode;
        }
      }
    }
    return null;
  }

  function trackScore(track) {
    let score = 0;
    if (track.mode === "showing") score += 8;
    if (track.mode === "hidden") score += 4;
    if (track.kind === "captions") score += 2;
    const target = core.normalizeLanguageCode(state.settings.targetLanguage);
    const language = core.normalizeLanguageCode(track.language || "");
    if (language && language !== target) score += 2;
    return score;
  }

  function waitForSubtitleTrack(track) {
    if (track.cues && track.cues.length) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        track.removeEventListener && track.removeEventListener("load", done);
        resolve();
      };
      track.addEventListener && track.addEventListener("load", done, { once: true });
      window.setTimeout(done, 700);
    });
  }

  function subtitleCuesFromTextTrack(track) {
    return Array.from(track.cues || [])
      .map((cue, index) => ({
        id: cue.id || String(index + 1),
        startTime: cue.startTime,
        endTime: cue.endTime,
        text: readSubtitleCueText(cue)
      }))
      .filter((cue) => cue.text && Number.isFinite(Number(cue.startTime)) && Number.isFinite(Number(cue.endTime)));
  }

  function readSubtitleCueText(cue) {
    if (!cue) return "";
    if (typeof cue.text === "string") return core.normalizeText(cue.text);
    if (typeof cue.getCueAsHTML === "function") {
      const fragment = cue.getCueAsHTML();
      return core.normalizeText(fragment && (fragment.textContent || fragment.innerText));
    }
    return "";
  }

  async function captureYouTubeSubtitles() {
    if (!isYouTubePage()) return null;
    const tracks = await findYouTubeCaptionTracks();
    if (!tracks.length) return null;
    const track = chooseYouTubeCaptionTrack(tracks);
    if (!track || !track.baseUrl) return null;
    const response = await fetchYouTubeCaptionTrack(track.baseUrl);
    const cues = core.parseYouTubeJson3Transcript(response);
    if (!cues.length) return null;
    const label = youtubeTrackLabel(track);
    return buildCapturedSubtitleResponse(cues, {
      filename: subtitleDownloadFilename("youtube-captions.vtt"),
      sourceLabel: label ? `YouTube 字幕：${label}` : "YouTube 字幕"
    });
  }

  function isYouTubePage() {
    const hostname = String(location.hostname || "").replace(/^www\./, "").toLowerCase();
    return hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "youtu.be";
  }

  async function findYouTubeCaptionTracks() {
    const currentVideoId = currentYouTubeVideoId();
    const responses = [];
    for (const script of Array.from(document.scripts || [])) {
      const text = script.textContent || "";
      if (!text.includes("captionTracks") || !text.includes("ytInitialPlayerResponse")) continue;
      const response = parseYouTubeInitialPlayerResponse(text);
      if (!response) continue;
      const responseVideoId = response.videoDetails && response.videoDetails.videoId;
      if (currentVideoId && responseVideoId && responseVideoId !== currentVideoId) continue;
      responses.push(response);
    }
    const pageResponse = await readYouTubePlayerResponseFromPage();
    if (pageResponse) {
      const responseVideoId = pageResponse.videoDetails && pageResponse.videoDetails.videoId;
      if (!currentVideoId || !responseVideoId || responseVideoId === currentVideoId) {
        responses.push(pageResponse);
      }
    }
    return responses
      .flatMap((response) =>
        (((response.captions || {}).playerCaptionsTracklistRenderer || {}).captionTracks || [])
      )
      .filter((track) => track && track.baseUrl);
  }

  function readYouTubePlayerResponseFromPage() {
    if (!isYouTubePage() || typeof window.postMessage !== "function") return Promise.resolve(null);
    const requestId = `transly-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        resolve(value);
      };
      const onMessage = (event) => {
        if (event.source !== window || !event.data) return;
        if (event.data.type !== "TRANSLY_YOUTUBE_PLAYER_RESPONSE" || event.data.requestId !== requestId) return;
        finish(event.data.ok && event.data.response && typeof event.data.response === "object" ? event.data.response : null);
      };
      const timer = window.setTimeout(() => finish(null), 700);
      window.addEventListener("message", onMessage);
      try {
        window.postMessage({ type: "TRANSLY_READ_YOUTUBE_PLAYER_RESPONSE", requestId }, window.location.origin || "*");
      } catch (error) {
        finish(null);
      }
    });
  }

  function currentYouTubeVideoId() {
    try {
      const url = new URL(location.href);
      const fromQuery = url.searchParams.get("v");
      if (fromQuery) return fromQuery;
      const shortsMatch = url.pathname.match(/\/shorts\/([^/?#]+)/u);
      if (shortsMatch) return shortsMatch[1];
      const embedMatch = url.pathname.match(/\/embed\/([^/?#]+)/u);
      if (embedMatch) return embedMatch[1];
      if (url.hostname.replace(/^www\./, "") === "youtu.be") {
        return url.pathname.split("/").filter(Boolean)[0] || "";
      }
    } catch (error) {
      return "";
    }
    return "";
  }

  function parseYouTubeInitialPlayerResponse(scriptText) {
    const marker = "ytInitialPlayerResponse";
    const markerIndex = scriptText.indexOf(marker);
    if (markerIndex < 0) return null;
    const equalsIndex = scriptText.indexOf("=", markerIndex + marker.length);
    if (equalsIndex < 0) return null;
    const jsonStart = scriptText.indexOf("{", equalsIndex);
    if (jsonStart < 0) return null;
    const jsonText = extractBalancedJsonObject(scriptText, jsonStart);
    if (!jsonText) return null;
    try {
      return JSON.parse(jsonText);
    } catch (error) {
      return null;
    }
  }

  function extractBalancedJsonObject(text, startIndex) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = startIndex; index < text.length; index += 1) {
      const char = text[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === "\"") {
          inString = false;
        }
        continue;
      }
      if (char === "\"") {
        inString = true;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) return text.slice(startIndex, index + 1);
      }
    }
    return "";
  }

  function chooseYouTubeCaptionTrack(tracks) {
    const target = core.normalizeLanguageCode(state.settings.targetLanguage);
    const source = core.normalizeSourceLanguage(state.settings.sourceLanguage);
    return tracks
      .slice()
      .sort((left, right) => youtubeCaptionTrackScore(right, source, target) - youtubeCaptionTrackScore(left, source, target))[0];
  }

  function youtubeCaptionTrackScore(track, source, target) {
    const language = core.normalizeLanguageCode(track.languageCode || track.vssId || "");
    let score = 0;
    if (source !== "auto" && language === source) score += 12;
    if (language && language !== target) score += 4;
    if (track.kind !== "asr") score += 3;
    if (track.isTranslatable) score += 1;
    return score;
  }

  async function fetchYouTubeCaptionTrack(baseUrl) {
    const url = new URL(baseUrl);
    url.searchParams.set("fmt", "json3");
    const response = await sendRuntimeMessage({
      type: "TRANSLY_FETCH_SUBTITLE_TRACK",
      url: url.toString()
    });
    if (!response || response.ok === false) {
      throw new Error((response && response.error) || "YouTube 字幕读取失败");
    }
    try {
      return JSON.parse(response.text || "{}");
    } catch (error) {
      throw new Error("YouTube 字幕格式无法解析");
    }
  }

  function youtubeTrackLabel(track) {
    const name = track && track.name;
    if (!name) return track.languageCode || "";
    if (name.simpleText) return name.simpleText;
    if (Array.isArray(name.runs)) return name.runs.map((run) => run.text || "").join("").trim();
    return track.languageCode || "";
  }

  function buildCapturedSubtitleResponse(cues, metadata) {
    const content = core.buildWebVttFromSubtitleCues(cues);
    return {
      ok: true,
      kind: "subtitle",
      format: "vtt",
      cues,
      content,
      filename: metadata.filename,
      sourceLabel: metadata.sourceLabel,
      url: location.href,
      title: document.title
    };
  }

  function subtitleDownloadFilename(fallback) {
    const title = core.normalizeText(document.title || "");
    const base = title
      .replace(/[\\/?:*"<>|]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72);
    return `${base || fallback.replace(/\.vtt$/u, "")}.vtt`;
  }

  async function translateSelectionText(text) {
    const input = core.normalizeText(text || (window.getSelection() && window.getSelection().toString()));
    if (!shouldTranslateText(input)) return { ok: false, error: state.messages.noText };
    const translated = await translateText(input);
    showSelectionPopover(translated, window.innerWidth / 2 - 160, 90);
    return { ok: true, text: translated };
  }

  async function translateActiveInput() {
    const target = document.activeElement;
    if (!isEditable(target)) return { ok: false, error: state.messages.noText };
    const text = core.normalizeText(readEditableValue(target));
    if (!shouldTranslateText(text)) return { ok: false, error: state.messages.noText };
    writeEditableValue(target, `${text}\n${state.messages.translating}...`);
    try {
      const translated = await translateText(text);
      writeEditableValue(target, translated);
      return { ok: true, text: translated };
    } catch (error) {
      writeEditableValue(target, text);
      return { ok: false, error: error.message || "翻译失败" };
    }
  }

  function installDynamicTranslation() {
    if (state.dynamicBound) return;
    state.dynamicBound = true;
    window.addEventListener(
      "scroll",
      () => {
        if (!state.settings.enabled || !state.settings.visibleOnly || state.translating) return;
        scheduleDynamicTranslation(350);
      },
      { passive: true }
    );
    installMutationObserver();
    installUrlChangeDetection();
  }

  function installMutationObserver() {
    if (!document.body || state.dynamicObserver || !("MutationObserver" in window)) return;
    if (ruleDynamicMode() === "off") return;
    state.dynamicObserver = new MutationObserver((mutations) => {
      if (!shouldReactToMutations(mutations)) return;
      if (state.translating) {
        state.dynamicPending = true;
        return;
      }
      scheduleDynamicTranslation(ruleDynamicMode() === "eager" ? 260 : 520);
    });
    state.dynamicObserver.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  function shouldReactToMutations(mutations) {
    if (!state.settings.enabled || document.hidden) return false;
    if (ruleDynamicMode() === "off") return false;
    if (!state.pageTranslated && !state.settings.autoTranslate && !state.autoTranslateActive) return false;
    return mutations.some((mutation) => {
      const nodes = mutation.type === "characterData"
        ? [mutation.target]
        : Array.from(mutation.addedNodes || []);
      return nodes.some((node) => isRelevantAddedNode(node));
    });
  }

  function isRelevantAddedNode(node) {
    if (!node) return false;
    if (node.nodeType === Node.TEXT_NODE) {
      return (
        shouldTranslateText(node.textContent) &&
        !isTranslyOwned(node.parentElement) &&
        !isInsideTranslatedElement(node.parentElement)
      );
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    if (isTranslyOwned(node)) return false;
    if (isInsideTranslatedElement(node)) return false;
    const contentOverride = isSiteContentOverrideElement(node);
    if ((core.isSkippableElement(node, state.rule) || isSiteChromeElement(node)) && !contentOverride) return false;
    if (isCandidateElement(node, { visibleOnly: false })) return true;
    return Boolean(
      node.querySelector && dynamicMutationSelectors().some((selector) => hasRelevantDescendant(node, selector))
    );
  }

  function isInsideTranslatedElement(element) {
    return Boolean(element && element.closest && element.closest(`[${translatedAttribute}]`));
  }

  function dynamicMutationSelectors() {
    return Array.from(
      new Set([
        ...((state.rule.includeSelectors && state.rule.includeSelectors.length
          ? state.rule.includeSelectors
          : state.rule.selectors) || []),
        ...siteContentOverrideSelectors(),
        "p",
        "li",
        "blockquote",
        "figcaption",
        "h1",
        "h2",
        "h3",
        "[data-testid='tweetText']",
        "div[dir='auto']",
        "[slot='title']",
        "[slot='text-body']",
        "[slot='comment']",
        "[slot='body']",
        "[data-testid='post-title']",
        "[data-testid='comment-content']",
        "a[href*='/comments/']"
      ])
    );
  }

  function hasRelevantDescendant(root, selector) {
    let elements = [];
    try {
      elements = Array.from(root.querySelectorAll(selector));
    } catch (error) {
      return false;
    }
    return elements.some((element) => isCandidateElement(element, { visibleOnly: false }));
  }

  function ruleDynamicMode() {
    return state.rule && ["auto", "off", "eager"].includes(state.rule.dynamicMode)
      ? state.rule.dynamicMode
      : "auto";
  }

  function installUrlChangeDetection() {
    patchHistoryMethod("pushState");
    patchHistoryMethod("replaceState");
    window.addEventListener("popstate", handleUrlChange);
    window.setInterval(handleUrlChange, 1000);
  }

  function patchHistoryMethod(method) {
    const original = history[method];
    if (!original || original.__translyPatched) return;
    const patched = function patchedHistoryMethod(...args) {
      const result = original.apply(this, args);
      window.setTimeout(handleUrlChange, 0);
      return result;
    };
    patched.__translyPatched = true;
    history[method] = patched;
  }

  function handleUrlChange() {
    if (state.lastUrl === location.href) return;
    state.lastUrl = location.href;
    state.rule = core.getSiteRule(location.href, state.settings.userRules);
    state.autoTranslateActive = shouldAutoTranslateCurrentPage(state.settings);
    scheduleDynamicTranslation(420);
  }

  function scheduleDynamicTranslation(delay) {
    if (!state.settings.enabled || document.hidden) return;
    if (ruleDynamicMode() === "off") return;
    if (!state.pageTranslated && !state.settings.autoTranslate && !state.autoTranslateActive) return;
    if (state.translating) {
      state.dynamicPending = true;
      return;
    }
    window.clearTimeout(state.dynamicTimer);
    state.dynamicTimer = window.setTimeout(() => {
      if (!state.settings.enabled || document.hidden) return;
      if (state.translating) {
        state.dynamicPending = true;
        return;
      }
      translatePage({ dynamic: true });
    }, delay);
  }

  function bindDocumentInteractions() {
    document.addEventListener("mouseover", handleHover, true);
    document.addEventListener("mouseout", hideHoverTooltip, true);
    document.addEventListener("mouseup", handleSelection, true);
    document.addEventListener("input", handleInputTranslation, true);
    document.addEventListener("scroll", () => hideSelectionPopover(), true);
  }

  function handleHover(event) {
    if (!state.settings.enabled || !state.settings.hoverTranslateEnabled) return;
    const target = event.target && event.target.closest && event.target.closest("[data-transly-hover-text]");
    if (!target) return;
    showHoverTooltip(target.getAttribute("data-transly-hover-text"), event.clientX, event.clientY);
  }

  function showHoverTooltip(text, x, y) {
    hideHoverTooltip();
    const tooltip = document.createElement("div");
    tooltip.className = "transly-hover-tooltip";
    tooltip.textContent = text;
    tooltip.style.left = `${Math.min(x + 14, window.innerWidth - 360)}px`;
    tooltip.style.top = `${Math.max(12, y + 14)}px`;
    document.body.appendChild(tooltip);
    state.hoverTooltip = tooltip;
  }

  function hideHoverTooltip() {
    if (state.hoverTooltip) {
      state.hoverTooltip.remove();
      state.hoverTooltip = null;
    }
  }

  async function handleSelection() {
    if (!state.settings.enabled || !state.settings.selectionTranslateEnabled) return;
    const selection = window.getSelection();
    const text = core.normalizeText(selection && selection.toString());
    if (!shouldTranslateText(text)) {
      hideSelectionPopover();
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    showSelectionPopover(`${state.messages.translating}...`, rect.left, rect.bottom);
    try {
      const translated = await translateText(text);
      showSelectionPopover(translated, rect.left, rect.bottom);
    } catch (error) {
      showSelectionPopover(error.message || "翻译失败", rect.left, rect.bottom);
    }
  }

  function showSelectionPopover(text, x, y) {
    hideSelectionPopover();
    const popover = document.createElement("div");
    popover.className = "transly-selection-popover";
    popover.textContent = text;
    popover.style.left = `${Math.min(Math.max(12, x), window.innerWidth - 360)}px`;
    popover.style.top = `${Math.min(y + 10, window.innerHeight - 80)}px`;
    document.body.appendChild(popover);
    state.selectionPopover = popover;
  }

  function hideSelectionPopover() {
    if (state.selectionPopover) {
      state.selectionPopover.remove();
      state.selectionPopover = null;
    }
  }

  async function handleInputTranslation(event) {
    if (!state.settings.enabled || !state.settings.tripleSpaceEnabled) return;
    const target = event.target;
    if (!isEditable(target)) return;
    const value = readEditableValue(target);
    if (!value.endsWith("   ")) return;
    const text = value.slice(0, -3).trim();
    if (!shouldTranslateText(text)) return;

    writeEditableValue(target, `${text}\n${state.messages.translating}...`);
    try {
      const translated = await translateText(text);
      writeEditableValue(target, translated);
    } catch (error) {
      writeEditableValue(target, text);
    }
  }

  function isEditable(element) {
    if (!element) return false;
    const tagName = element.tagName;
    return (
      element.isContentEditable ||
      tagName === "TEXTAREA" ||
      (tagName === "INPUT" && ["text", "search", "url", "email"].includes(element.type || "text"))
    );
  }

  function readEditableValue(element) {
    return element.isContentEditable ? element.textContent || "" : element.value || "";
  }

  function writeEditableValue(element, value) {
    if (element.isContentEditable) {
      element.textContent = value;
      return;
    }
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
})();
