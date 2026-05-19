importScripts("content-core.js");

const core = self.TranslyCore;
const SETTINGS_KEY = "translySettings";
const SECRET_KEY = "translyCustomApiKey";
const GLOSSARY_KEY = "translyCustomGlossaryTerms";
const ENGINE_SECRET_KEY = "translyServiceEngineSecrets";
const RATE_LIMIT_KEY = "translyCustomProviderRateLog";
const GOOGLE_TRANSLATE_ORIGIN = "https://translate.googleapis.com";
const MICROSOFT_TRANSLATE_ORIGIN = "https://api-edge.cognitive.microsofttranslator.com";
const CUSTOM_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const customProviderRequestLog = new Map();

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get([SETTINGS_KEY], (stored) => {
    if (!stored[SETTINGS_KEY]) {
      chrome.storage.sync.set({ [SETTINGS_KEY]: core.createDefaultSettings() });
    }
  });
  createContextMenus();
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  if (message.type === "TRANSLY_TRANSLATE") {
    translateMessage(message, sender)
      .then((payload) => sendResponse({ ok: true, ...payload }))
      .catch((error) => sendResponse({ ok: false, error: core.sanitizeErrorMessage(error.message || String(error)) }));
    return true;
  }

  if (message.type === "TRANSLY_OPEN_SIDE_PANEL") {
    openSidePanel(sender.tab)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message || String(error) }));
    return true;
  }

  if (message.type === "TRANSLY_OPEN_OPTIONS_PAGE") {
    chrome.runtime.openOptionsPage(() => sendResponse({ ok: !chrome.runtime.lastError }));
    return true;
  }

  if (message.type === "TRANSLY_SETTINGS_CHANGED") {
    broadcastSettings(message.settings, sender.tab && sender.tab.id);
    sendResponse({ ok: true });
    return false;
  }

  return false;
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  handleContextMenu(info, tab).catch(() => {});
});

chrome.commands.onCommand.addListener((command, tab) => {
  handleCommand(command, tab).catch(() => {});
});

function createContextMenus() {
  if (!chrome.contextMenus) return;
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "transly-root",
      title: "全能翻译",
      contexts: ["all"]
    });
    chrome.contextMenus.create({
      id: "translate-page",
      parentId: "transly-root",
      title: "翻译网页/显示原文",
      contexts: ["page"]
    });
    chrome.contextMenus.create({
      id: "translate-whole-page",
      parentId: "transly-root",
      title: "翻译整页",
      contexts: ["page"]
    });
    chrome.contextMenus.create({
      id: "translate-page-end",
      parentId: "transly-root",
      title: "立即翻译到页面底部",
      contexts: ["page"]
    });
    chrome.contextMenus.create({
      id: "toggle-only-translation",
      parentId: "transly-root",
      title: "切换双语/仅译文",
      contexts: ["page"]
    });
    chrome.contextMenus.create({
      id: "toggle-mask",
      parentId: "transly-root",
      title: "切换译文模糊学习模式",
      contexts: ["page"]
    });
    chrome.contextMenus.create({
      id: "open-side-panel",
      parentId: "transly-root",
      title: "打开侧边栏",
      contexts: ["all"]
    });
    chrome.contextMenus.create({
      id: "translate-selection",
      parentId: "transly-root",
      title: "翻译选中文本：\"%s\"",
      contexts: ["selection"]
    });
  });
}

async function handleContextMenu(info, tab) {
  if (!tab || !tab.id) return;
  const menuMap = {
    "translate-page": "TRANSLY_APPLY",
    "translate-whole-page": "TRANSLY_APPLY_WHOLE",
    "translate-page-end": "TRANSLY_TRANSLATE_TO_END",
    "toggle-only-translation": "TRANSLY_TOGGLE_ONLY_TRANSLATION",
    "toggle-mask": "TRANSLY_TOGGLE_MASK"
  };
  if (info.menuItemId === "open-side-panel") {
    await openSidePanel(tab);
    return;
  }
  if (info.menuItemId === "translate-selection") {
    await chrome.tabs.sendMessage(tab.id, {
      type: "TRANSLY_TRANSLATE_SELECTION",
      text: info.selectionText || ""
    });
    return;
  }
  const type = menuMap[info.menuItemId];
  if (type) await chrome.tabs.sendMessage(tab.id, { type });
}

async function handleCommand(command, tab) {
  const activeTab = tab && tab.id ? tab : await getActiveTab();
  if (!activeTab || !activeTab.id) return;
  const commandMap = {
    toggleTranslatePage: "TRANSLY_APPLY",
    toggleTranslateTheMainPage: "TRANSLY_APPLY",
    toggleTranslateTheWholePage: "TRANSLY_APPLY_WHOLE",
    toggleTranslateToThePageEndImmediately: "TRANSLY_TRANSLATE_TO_END",
    toggleOnlyTransation: "TRANSLY_TOGGLE_ONLY_TRANSLATION",
    toggleTranslationMask: "TRANSLY_TOGGLE_MASK",
    translateInputBox: "TRANSLY_TRANSLATE_INPUT"
  };
  if (command === "toggleSidePanel") {
    await openSidePanel(activeTab);
    return;
  }
  const type = commandMap[command];
  if (type) await chrome.tabs.sendMessage(activeTab.id, { type });
}

async function openSidePanel(tab) {
  if (!chrome.sidePanel || !chrome.sidePanel.open) {
    throw new Error("Chrome side panel API is unavailable");
  }
  if (tab && tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
    return;
  }
  const activeTab = await getActiveTab();
  if (activeTab && activeTab.id) {
    await chrome.sidePanel.open({ tabId: activeTab.id });
    return;
  }
  const window = await chrome.windows.getCurrent();
  await chrome.sidePanel.open({ windowId: window.id });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function broadcastSettings(settings, exceptTabId) {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  for (const tab of tabs) {
    if (!tab.id || tab.id === exceptTabId) continue;
    chrome.tabs.sendMessage(tab.id, { type: "TRANSLY_SETTINGS_CHANGED", settings }).catch(() => {});
  }
}

async function translateMessage(message, sender) {
  const settings = await readSettingsForTranslation(message.settings);
  const text = core.normalizeText(message.text);
  const url = message.url || message.pageUrl || message.href || (sender && sender.tab && sender.tab.url) || "";
  const providerPlan = resolveAvailableProviderPlan(settings);
  const providerOrder = providerPlan.providerOrder;
  const validationProvider = providerOrder[0] || settings.provider;
  const validation = core.validateTranslationRequest({
    text,
    url,
    settings: { ...settings, provider: validationProvider },
    forceTranslateWhenMixedLanguage: Boolean(message.forceTranslateWhenMixedLanguage)
  });
  const attempts = [];

  for (const entry of providerPlan.entries) {
    const provider = entry.provider;
    if (!entry.readiness.ok) {
      attempts.push({ provider, status: "skipped", error: entry.readiness.error });
      continue;
    }
    try {
      const payload = await translateWithProvider(provider, validation.text, validation.settings, url);
      const usedProvider = payload.provider || provider;
      attempts.push({ provider: usedProvider, status: "success" });
      const failedAttempts = attempts.filter((attempt) => attempt.status === "failed");
      const warnings = [
        payload.warning,
        failedAttempts.length
          ? failedAttempts.map((attempt) => `${attempt.provider}: ${attempt.error}`).join("; ")
          : ""
      ].filter(Boolean);
      const translatedText = core.applyGlossaryToTranslation(
        payload.text,
        validation.text,
        validation.settings,
        url
      );
      return {
        ...payload,
        text: translatedText,
        provider: usedProvider,
        engineName: payload.engineName,
        providerOrder,
        attempts,
        statusMessage: `翻译成功：${payload.engineName || usedProvider}`,
        warning: warnings.length ? warnings.join("; ") : undefined
      };
    } catch (error) {
      attempts.push({
        provider,
        status: "failed",
        error: sanitizeTranslationError(error, validation.settings)
      });
    }
  }

  const summary = attempts.map((attempt) => `${attempt.provider}: ${attempt.error || attempt.status}`).join("; ");
  throw new Error(summary || "所有翻译服务均不可用");
}

function resolveAvailableProviderPlan(settings) {
  const candidates = [];
  addProviderCandidate(candidates, settings && settings.provider);
  core.resolveProviderOrder(settings).forEach((provider) => addProviderCandidate(candidates, provider));

  const providerOrder = [];
  const entries = [];
  for (const provider of candidates) {
    const readiness = providerReadiness(provider, settings);
    entries.push({ provider, readiness });
    if (readiness.ok) {
      providerOrder.push(provider);
    }
  }
  return { providerOrder, entries };
}

function addProviderCandidate(candidates, provider) {
  const normalized = String(provider || "").trim().toLowerCase();
  if (normalized && !candidates.includes(normalized)) candidates.push(normalized);
}

function sanitizeTranslationError(error, settings) {
  const engineSecrets = settings && Array.isArray(settings.serviceEngines)
    ? settings.serviceEngines.map((engine) => engine.apiKey)
    : [];
  return core.sanitizeErrorMessage(error.message || String(error), [
    settings && settings.customApiKey,
    ...engineSecrets
  ]);
}

async function readSettingsForTranslation(incomingSettings) {
  const [syncStored, localStored] = await Promise.all([
    chrome.storage.sync.get([SETTINGS_KEY]),
    chrome.storage.local.get([SECRET_KEY, GLOSSARY_KEY, ENGINE_SECRET_KEY])
  ]);
  const incoming = { ...(incomingSettings || {}) };
  delete incoming.customApiKey;
  const engineSource =
    incoming.serviceEngines ||
    (syncStored[SETTINGS_KEY] && syncStored[SETTINGS_KEY].serviceEngines) ||
    [];
  return core.normalizeSettings({
    ...(syncStored[SETTINGS_KEY] || {}),
    ...incoming,
    customApiKey: localStored[SECRET_KEY] || "",
    serviceEngines: mergeEngineSecrets(engineSource, localStored[ENGINE_SECRET_KEY] || {}),
    customGlossaryTerms:
      localStored[GLOSSARY_KEY] ||
      incoming.customGlossaryTerms ||
      (syncStored[SETTINGS_KEY] && syncStored[SETTINGS_KEY].customGlossaryTerms) ||
      []
  });
}

function mergeEngineSecrets(serviceEngines, secrets) {
  const secretMap = secrets && typeof secrets === "object" ? secrets : {};
  return core.normalizeServiceEngines(serviceEngines || []).map((engine) => ({
    ...engine,
    apiKey: engine.apiKey || secretMap[engine.id] || ""
  }));
}

function providerReadiness(provider, settings) {
  const engine = core.resolveServiceEngine(provider, settings);
  if (!engine) {
    return { ok: false, error: "翻译服务未配置" };
  }
  if (engine.type === "demo" || engine.provider === "demo") {
    if (settings.provider === engine.id || settings.provider === "demo" || settings.fallbackToDemo) {
      return { ok: true };
    }
    return { ok: false, error: "演示回退未开启" };
  }
  if (!engine.enabled) {
    return { ok: false, error: "翻译服务已停用" };
  }
  if (engine.type === "microsoft" || engine.provider === "microsoft") {
    if (!engine.apiKey) {
      return { ok: false, error: "Microsoft 需要 API Key，已跳过未鉴权回退" };
    }
  }
  if ((engine.type === "openai-compatible" || engine.type === "custom-json") && !(engine.endpoint || settings.customEndpoint)) {
    return { ok: false, error: "自定义接口未配置" };
  }
  return { ok: true };
}

async function translateWithProvider(provider, text, settings, url) {
  const engine = core.resolveServiceEngine(provider, settings);
  if (!engine) throw new Error(`翻译服务未配置：${provider}`);
  if (engine.type === "google" || engine.provider === "google") return translateWithGoogle(text, settings, engine, url);
  if (engine.type === "microsoft" || engine.provider === "microsoft") return translateWithMicrosoft(text, settings, engine, url);
  if (engine.type === "openai-compatible" || engine.type === "custom-json" || engine.provider === "custom") {
    return translateWithCustomProvider(text, settings, url, engine);
  }
  if (engine.type === "demo" || engine.provider === "demo") {
    return {
      text: core.buildDemoTranslation(text, settings.targetLanguage),
      provider: engine.id,
      engineName: engine.name
    };
  }
  throw new Error(`不支持的翻译服务：${provider}`);
}

async function translateWithGoogle(text, settings, engine, pageUrl) {
  const requestText = core.applyGlossaryToSourceText(text, settings, pageUrl);
  const url = core.buildGoogleTranslateUrl(requestText, settings.targetLanguage, settings.sourceLanguage);
  if (!url.startsWith(GOOGLE_TRANSLATE_ORIGIN)) {
    throw new Error("Unexpected Google translate endpoint");
  }

  const response = await fetch(url, {
    method: "GET",
    credentials: "omit"
  });
  if (!response.ok) {
    throw await buildHttpError("Google translate failed", response);
  }
  const payload = await response.json();
  return {
    text: core.extractGoogleTranslateResponse(payload),
    provider: "google",
    engineName: "Google"
  };
}

async function translateWithMicrosoft(text, settings, engine, pageUrl) {
  if (!engine.apiKey) {
    throw new Error("Microsoft 需要 API Key，无法使用未鉴权端点");
  }
  const requestText = core.applyGlossaryToSourceText(text, settings, pageUrl);
  const request = core.buildMicrosoftTranslateRequest(requestText, settings.targetLanguage, settings.sourceLanguage);
  if (!request.url.startsWith(MICROSOFT_TRANSLATE_ORIGIN)) {
    throw new Error("Unexpected Microsoft translate endpoint");
  }

  const response = await fetch(request.url, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Ocp-Apim-Subscription-Key": engine.apiKey
    },
    body: request.body
  });
  if (!response.ok) {
    throw await buildHttpError("Microsoft translate failed", response);
  }
  const payload = await response.json();
  return {
    text: core.extractMicrosoftTranslateResponse(payload),
    provider: engine.id || "microsoft",
    engineName: engine.name || "Microsoft"
  };
}

async function buildHttpError(prefix, response) {
  const status = response && response.status ? response.status : "unknown";
  const statusText = response && response.statusText ? ` ${response.statusText}` : "";
  const body = await readErrorBodySnippet(response);
  return new Error(`${prefix}: ${status}${statusText}${body ? ` - ${body}` : ""}`);
}

async function readErrorBodySnippet(response) {
  if (!response || typeof response.text !== "function") return "";
  try {
    return String(await response.text()).replace(/\s+/g, " ").trim().slice(0, 240);
  } catch (error) {
    return "";
  }
}

async function translateWithCustomProvider(text, settings, url, engine) {
  const endpoint = engine.endpoint || settings.customEndpoint;
  if (!endpoint) {
    throw new Error("自定义接口地址为空");
  }

  const headers = { "Content-Type": "application/json" };
  const apiKey = engine.apiKey || settings.customApiKey;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const prepared = prepareCustomProviderSegments(text, engine);
  const translations = [];
  for (let index = 0; index < prepared.segments.length; index += 1) {
    await enforceCustomProviderRateLimit(engine);
    const segment = prepared.segments[index];
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(buildCustomProviderBody(segment, settings, url, engine, {
        segmentIndex: index + 1,
        segmentCount: prepared.segments.length,
        originalLength: prepared.originalLength,
        truncated: prepared.truncated
      }))
    });

    if (!response.ok) {
      throw await buildHttpError("自定义接口请求失败", response);
    }

    const payload = await response.json();
    translations.push(core.extractProviderTranslation(payload));
  }

  return {
    text: translations.join("\n"),
    provider: engine.id || "custom",
    engineName: engine.name || engine.id || "custom",
    warning: prepared.truncated
      ? buildCustomProviderTruncationWarning(prepared, engine)
      : undefined
  };
}

function buildCustomProviderTruncationWarning(prepared, engine = {}) {
  const label = engine.name || engine.id || "自定义翻译服务";
  const omittedLength = Math.max(0, Number(prepared.omittedLength) || 0);
  return `${label} 原文超过本地分段上限，已翻译前 ${prepared.segments.length} 段，约 ${omittedLength} 个字符未发送。`;
}

function buildCustomProviderBody(text, settings, url, engine = {}, segmentMeta = {}) {
  const glossary = core.resolveGlossaryTerms(text, settings, url);
  const glossaryInstruction = core.buildGlossaryInstruction(text, settings, url);
  const endpoint = engine.endpoint || settings.customEndpoint;
  const assistantInstruction = buildCustomAssistantInstruction(engine, url, segmentMeta);
  const shouldUseChatBody =
    isChatCompletionsEndpoint(endpoint) ||
    (engine.type === "openai-compatible" && (engine.model || /\/v\d+\//i.test(endpoint)));
  if (shouldUseChatBody) {
    const label = core.languageLabel(settings.targetLanguage);
    const templateVars = {
      text,
      to: label,
      from: settings.sourceLanguage === "auto" ? "auto" : core.languageLabel(settings.sourceLanguage),
      glossary: glossaryInstruction,
      strategy: engine.strategy || "general",
      strategy_instruction: buildStrategyInstruction(engine.strategy),
      ai_context: buildAiContextInstruction(engine, url),
      segment_instruction: buildSegmentInstruction(segmentMeta),
      imt_style_guide: engine.richText
        ? "Preserve inline links, code spans, list rhythm, and paragraph breaks when possible."
        : ""
    };
    return {
      model: engine.model || settings.customModel || "gpt-4o-mini",
      temperature: Number.isFinite(Number(engine.temperature)) ? Number(engine.temperature) : 0.1,
      messages: [
        {
          role: "system",
          content: [
            renderPrompt(
              engine.systemPrompt ||
                "You are a translation engine. Translate the user text into {{to}}. {{glossary}} Return only the translated text without explanation.",
              templateVars
            ),
            assistantInstruction
          ].filter(Boolean).join("\n")
        },
        {
          role: "user",
          content: renderPrompt(selectUserPrompt(text, engine), templateVars)
        }
      ]
    };
  }
  return {
    text,
    sourceLanguage: settings.sourceLanguage,
    targetLanguage: settings.targetLanguage,
    glossary,
    strategy: engine.strategy || "general",
    aiContext: engine.aiContext
      ? {
          url: url || "",
          instruction: buildAiContextInstruction(engine, url)
        }
      : false,
    segment: {
      index: segmentMeta.segmentIndex || 1,
      count: segmentMeta.segmentCount || 1,
      originalLength: segmentMeta.originalLength || String(text || "").length,
      truncated: Boolean(segmentMeta.truncated)
    },
    instruction: assistantInstruction
  };
}

function prepareCustomProviderSegments(text, engine = {}) {
  const source = String(text || "");
  const maxTextLength = Math.max(1, Math.floor(Number(engine.maxTextLength) || source.length || 1));
  const maxSegments = Math.max(1, Math.floor(Number(engine.maxSegments) || 1));
  if (source.length <= maxTextLength) {
    return {
      segments: [source],
      originalLength: source.length,
      truncated: false
    };
  }

  const segments = [];
  let remaining = source;
  while (remaining && segments.length < maxSegments) {
    const splitAt = findCustomSegmentBoundary(remaining, maxTextLength);
    const segment = remaining.slice(0, splitAt).trim();
    if (segment) segments.push(segment);
    remaining = remaining.slice(splitAt).trimStart();
  }

  return {
    segments: segments.length ? segments : [source.slice(0, maxTextLength).trim()],
    originalLength: source.length,
    truncated: remaining.trim().length > 0,
    omittedLength: remaining.trim().length
  };
}

function findCustomSegmentBoundary(text, maxTextLength) {
  if (text.length <= maxTextLength) return text.length;
  const window = text.slice(0, maxTextLength);
  const minimum = Math.floor(maxTextLength * 0.55);
  const boundaryPatterns = [/\n\s*\n/g, /[.!?。！？]\s+/g, /\n/g, /\s+/g];
  for (const pattern of boundaryPatterns) {
    let match;
    let boundary = -1;
    while ((match = pattern.exec(window))) {
      const candidate = match.index + match[0].length;
      if (candidate >= minimum) boundary = candidate;
    }
    if (boundary >= minimum) return boundary;
  }
  return maxTextLength;
}

async function enforceCustomProviderRateLimit(engine = {}) {
  const limit = Math.floor(Number(engine.maxRequestsPerMinute) || 0);
  if (limit <= 0) return;
  const key = engine.id || engine.endpoint || "custom";
  const now = Date.now();
  const storedLog = await readRateLimitLog();
  const recent = (customProviderRequestLog.get(key) || storedLog[key] || [])
    .filter((timestamp) => Number.isFinite(timestamp) && now - timestamp < CUSTOM_RATE_LIMIT_WINDOW_MS);
  if (recent.length >= limit) {
    throw new Error(`自定义接口已达到限流：${limit} 次/分钟，请稍后重试`);
  }
  recent.push(now);
  customProviderRequestLog.set(key, recent);
  await writeRateLimitLog({ ...storedLog, [key]: recent });
}

async function readRateLimitLog() {
  if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== "function") {
    return {};
  }
  try {
    const stored = await chrome.storage.local.get([RATE_LIMIT_KEY]);
    return stored && typeof stored[RATE_LIMIT_KEY] === "object" && stored[RATE_LIMIT_KEY]
      ? stored[RATE_LIMIT_KEY]
      : {};
  } catch (error) {
    return {};
  }
}

async function writeRateLimitLog(log) {
  if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.set !== "function") {
    return;
  }
  try {
    await chrome.storage.local.set({ [RATE_LIMIT_KEY]: log });
  } catch (error) {
    // The in-memory limiter above still protects the active service worker.
  }
}

function buildCustomAssistantInstruction(engine = {}, url, segmentMeta = {}) {
  return [
    buildStrategyInstruction(engine.strategy),
    buildAiContextInstruction(engine, url),
    buildSegmentInstruction(segmentMeta)
  ].filter(Boolean).join("\n");
}

function buildStrategyInstruction(strategy) {
  const normalized = String(strategy || "general").trim().toLowerCase();
  const instructions = {
    technical: "Use precise technical terminology and keep product names, code, commands, and API names unchanged unless a glossary says otherwise.",
    social: "Keep the tone natural, concise, and suitable for social posts while preserving intent.",
    academic: "Use formal academic wording and preserve citations, terms, and paragraph structure.",
    subtitle: "Use short subtitle-friendly sentences and keep timing-friendly line rhythm.",
    general: "Translate faithfully and naturally for general reading."
  };
  return instructions[normalized] || instructions.general;
}

function buildAiContextInstruction(engine = {}, url) {
  if (!engine.aiContext) return "";
  const contextUrl = url ? ` Context URL: ${url}` : "";
  return `Use available page context to resolve pronouns and domain terms, but translate only the provided text.${contextUrl}`;
}

function buildSegmentInstruction(segmentMeta = {}) {
  const count = Number(segmentMeta.segmentCount) || 1;
  if (count <= 1 && !segmentMeta.truncated) return "";
  const parts = [];
  if (count > 1) {
    parts.push(`Segment ${segmentMeta.segmentIndex || 1} of ${count}: translate this segment independently while keeping continuity with adjacent segments.`);
  }
  if (segmentMeta.truncated) {
    parts.push("The original text exceeded this engine limit and was truncated after the configured maximum segments.");
  }
  return parts.join(" ");
}

function selectUserPrompt(text, engine) {
  const hasParagraphs = /\n\s*\n/.test(String(text || ""));
  if (hasParagraphs) {
    return engine.multiParagraphPrompt || "Translate to {{to}}:\n\n{{text}}";
  }
  return engine.singleParagraphPrompt || "Translate to {{to}} (output translation only):\n\n{{text}}";
}

function renderPrompt(template, values) {
  return String(template || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key] || "") : "";
  }).trim();
}

function isChatCompletionsEndpoint(endpoint) {
  try {
    return /\/chat\/completions\/?$/i.test(new URL(endpoint).pathname);
  } catch (error) {
    return /\/chat\/completions\/?$/i.test(String(endpoint || ""));
  }
}
