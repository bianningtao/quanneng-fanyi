importScripts("content-core.js");

const core = self.TranslyCore;
const SETTINGS_KEY = "translySettings";
const SECRET_KEY = "translyCustomApiKey";
const GLOSSARY_KEY = "translyCustomGlossaryTerms";
const ENGINE_SECRET_KEY = "translyServiceEngineSecrets";
const GOOGLE_TRANSLATE_ORIGIN = "https://translate.googleapis.com";
const MICROSOFT_TRANSLATE_ORIGIN = "https://api-edge.cognitive.microsofttranslator.com";

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
      title: "Transly 沉浸式翻译",
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
  const providerOrder = core.resolveProviderOrder(settings);
  const validationProvider = providerOrder[0] || settings.provider;
  const validation = core.validateTranslationRequest({
    text,
    url,
    settings: { ...settings, provider: validationProvider }
  });
  const attempts = [];

  for (const provider of providerOrder) {
    const readiness = providerReadiness(provider, validation.settings);
    if (!readiness.ok) {
      attempts.push({ provider, status: "skipped", error: readiness.error });
      continue;
    }
    try {
      const payload = await translateWithProvider(provider, validation.text, validation.settings, url);
      const usedProvider = payload.provider || provider;
      attempts.push({ provider: usedProvider, status: "success" });
      const failedAttempts = attempts.filter((attempt) => attempt.status === "failed");
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
        providerOrder,
        attempts,
        warning: failedAttempts.length
          ? failedAttempts.map((attempt) => `${attempt.provider}: ${attempt.error}`).join("; ")
          : undefined
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
  if ((engine.type === "openai-compatible" || engine.type === "custom-json") && !(engine.endpoint || settings.customEndpoint)) {
    return { ok: false, error: "自定义接口未配置" };
  }
  if (engine.type === "demo" && settings.provider !== engine.id && settings.provider !== "demo" && !settings.fallbackToDemo) {
    return { ok: false, error: "演示回退未开启" };
  }
  if (!engine.enabled && provider !== settings.provider && engine.type !== "demo") {
    return { ok: false, error: "翻译服务已隐藏" };
  }
  return { ok: true };
}

async function translateWithProvider(provider, text, settings, url) {
  const engine = core.resolveServiceEngine(provider, settings);
  if (!engine) throw new Error(`翻译服务未配置：${provider}`);
  if (engine.type === "google" || engine.provider === "google") return translateWithGoogle(text, settings, engine);
  if (engine.type === "microsoft" || engine.provider === "microsoft") return translateWithMicrosoft(text, settings, engine);
  if (engine.type === "openai-compatible" || engine.type === "custom-json" || engine.provider === "custom") {
    return translateWithCustomProvider(text, settings, url, engine);
  }
  if (engine.type === "demo" || engine.provider === "demo") {
    return {
      text: core.buildDemoTranslation(text, settings.targetLanguage),
      provider: engine.id
    };
  }
  throw new Error(`不支持的翻译服务：${provider}`);
}

async function translateWithGoogle(text, settings) {
  const url = core.buildGoogleTranslateUrl(text, settings.targetLanguage, settings.sourceLanguage);
  if (!url.startsWith(GOOGLE_TRANSLATE_ORIGIN)) {
    throw new Error("Unexpected Google translate endpoint");
  }

  const response = await fetch(url, {
    method: "GET",
    credentials: "omit"
  });
  if (!response.ok) {
    throw new Error(`Google translate failed: ${response.status}`);
  }
  const payload = await response.json();
  return {
    text: core.extractGoogleTranslateResponse(payload),
    provider: "google"
  };
}

async function translateWithMicrosoft(text, settings, engine) {
  const request = core.buildMicrosoftTranslateRequest(text, settings.targetLanguage, settings.sourceLanguage);
  if (!request.url.startsWith(MICROSOFT_TRANSLATE_ORIGIN)) {
    throw new Error("Unexpected Microsoft translate endpoint");
  }

  const response = await fetch(request.url, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: request.body
  });
  if (!response.ok) {
    throw new Error(`Microsoft translate failed: ${response.status}`);
  }
  const payload = await response.json();
  return {
    text: core.extractMicrosoftTranslateResponse(payload),
    provider: engine.id || "microsoft"
  };
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

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(buildCustomProviderBody(text, settings, url, engine))
  });

  if (!response.ok) {
    throw new Error(`自定义接口请求失败：${response.status}`);
  }

  const payload = await response.json();
  return {
    text: core.extractProviderTranslation(payload),
    provider: engine.id || "custom"
  };
}

function buildCustomProviderBody(text, settings, url, engine = {}) {
  const glossary = core.resolveGlossaryTerms(text, settings, url);
  const glossaryInstruction = core.buildGlossaryInstruction(text, settings, url);
  const endpoint = engine.endpoint || settings.customEndpoint;
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
          content: renderPrompt(
            engine.systemPrompt ||
              "You are a translation engine. Translate the user text into {{to}}. {{glossary}} Return only the translated text without explanation.",
            templateVars
          )
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
    glossary
  };
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
