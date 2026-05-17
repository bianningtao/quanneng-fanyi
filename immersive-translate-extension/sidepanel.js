const core = window.TranslyCore;
const SETTINGS_KEY = "translySettings";
const SECRET_KEY = "translyCustomApiKey";
const UI_LANGUAGE = "zh-CN";

const controls = {
  pageDomain: document.querySelector("#pageDomain"),
  enabled: document.querySelector("#enabled"),
  autoTranslate: document.querySelector("#autoTranslate"),
  sourceLanguage: document.querySelector("#sourceLanguage"),
  targetLanguage: document.querySelector("#targetLanguage"),
  maxBlocks: document.querySelector("#maxBlocks"),
  concurrency: document.querySelector("#concurrency"),
  displayMode: document.querySelector("#displayMode"),
  translationTheme: document.querySelector("#translationTheme"),
  floatingBallEnabled: document.querySelector("#floatingBallEnabled"),
  hoverTranslateEnabled: document.querySelector("#hoverTranslateEnabled"),
  selectionTranslateEnabled: document.querySelector("#selectionTranslateEnabled"),
  tripleSpaceEnabled: document.querySelector("#tripleSpaceEnabled"),
  translationMaskEnabled: document.querySelector("#translationMaskEnabled"),
  visibleOnly: document.querySelector("#visibleOnly"),
  ruleSummary: document.querySelector("#ruleSummary"),
  userRules: document.querySelector("#userRules"),
  blockedDomains: document.querySelector("#blockedDomains"),
  provider: document.querySelector("#provider"),
  customProviderSettings: document.querySelector("#customProviderSettings"),
  customEndpoint: document.querySelector("#customEndpoint"),
  customApiKey: document.querySelector("#customApiKey"),
  fallbackToDemo: document.querySelector("#fallbackToDemo"),
  sameLanguageCheck: document.querySelector("#sameLanguageCheck"),
  sensitiveTextFilter: document.querySelector("#sensitiveTextFilter"),
  textInput: document.querySelector("#textInput"),
  textOutput: document.querySelector("#textOutput"),
  translateText: document.querySelector("#translateText"),
  saveSettings: document.querySelector("#saveSettings"),
  openOptions: document.querySelector("#openOptions"),
  translatePage: document.querySelector("#translatePage"),
  translateWholePage: document.querySelector("#translateWholePage"),
  translateToEnd: document.querySelector("#translateToEnd"),
  clearTranslations: document.querySelector("#clearTranslations"),
  status: document.querySelector("#status")
};

let activeTab = null;
let currentSettings = core.createDefaultSettings();

initSidePanel();

async function initSidePanel() {
  bindTabs();
  bindActions();
  currentSettings = await loadSettings();
  applySettings(currentSettings);
  await refreshPageInfo();
  setStatus("就绪");
}

function bindTabs() {
  document.querySelectorAll("[data-tab-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-tab-target");
      document.querySelectorAll("[data-tab-target]").forEach((tab) => {
        tab.classList.toggle("is-active", tab.getAttribute("data-tab-target") === target);
      });
      document.querySelectorAll("[data-panel-tab]").forEach((panel) => {
        panel.classList.toggle("is-active", panel.getAttribute("data-panel-tab") === target);
      });
    });
  });
}

function bindActions() {
  const saveOnChange = [
    "enabled",
    "autoTranslate",
    "sourceLanguage",
    "targetLanguage",
    "maxBlocks",
    "concurrency",
    "displayMode",
    "translationTheme",
    "floatingBallEnabled",
    "hoverTranslateEnabled",
    "selectionTranslateEnabled",
    "tripleSpaceEnabled",
    "translationMaskEnabled",
    "visibleOnly",
    "provider",
    "customEndpoint",
    "customApiKey",
    "fallbackToDemo",
    "blockedDomains",
    "sameLanguageCheck",
    "sensitiveTextFilter"
  ];
  saveOnChange.forEach((name) => {
    controls[name].addEventListener("change", persistSettings);
    controls[name].addEventListener("input", debounce(persistSettings, 250));
  });

  controls.saveSettings.addEventListener("click", persistSettings);
  controls.userRules.addEventListener("change", persistSettings);
  controls.userRules.addEventListener("input", debounce(validateRulesOnly, 250));
  controls.translatePage.addEventListener("click", () => sendToActiveTab("TRANSLY_APPLY"));
  controls.translateWholePage.addEventListener("click", () => sendToActiveTab("TRANSLY_APPLY_WHOLE"));
  controls.translateToEnd.addEventListener("click", () => sendToActiveTab("TRANSLY_TRANSLATE_TO_END"));
  controls.clearTranslations.addEventListener("click", () => sendToActiveTab("TRANSLY_CLEAR"));
  controls.translateText.addEventListener("click", translateFreeText);
  controls.openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());
  controls.provider.addEventListener("change", () => updateProviderFields(controls.provider.value));
}

async function loadSettings() {
  const [stored, secret] = await Promise.all([
    chrome.storage.sync.get([SETTINGS_KEY]),
    chrome.storage.local.get([SECRET_KEY])
  ]);
  return core.normalizeSettings({
    ...(stored[SETTINGS_KEY] || {}),
    customApiKey: secret[SECRET_KEY] || ""
  });
}

function applySettings(settings) {
  controls.enabled.checked = settings.enabled;
  controls.autoTranslate.checked = settings.autoTranslate;
  controls.sourceLanguage.value = settings.sourceLanguage;
  controls.targetLanguage.value = settings.targetLanguage;
  controls.maxBlocks.value = settings.maxBlocks;
  controls.concurrency.value = settings.concurrency;
  controls.displayMode.value = settings.displayMode;
  controls.translationTheme.value = settings.translationTheme;
  controls.floatingBallEnabled.checked = settings.floatingBallEnabled;
  controls.hoverTranslateEnabled.checked = settings.hoverTranslateEnabled;
  controls.selectionTranslateEnabled.checked = settings.selectionTranslateEnabled;
  controls.tripleSpaceEnabled.checked = settings.tripleSpaceEnabled;
  controls.translationMaskEnabled.checked = settings.translationMaskEnabled;
  controls.visibleOnly.checked = settings.visibleOnly;
  controls.provider.value = settings.provider;
  controls.customEndpoint.value = settings.customEndpoint;
  controls.customApiKey.value = settings.customApiKey;
  controls.fallbackToDemo.checked = settings.fallbackToDemo;
  updateProviderFields(settings.provider);
  controls.sameLanguageCheck.checked = settings.sameLanguageCheck;
  controls.sensitiveTextFilter.checked = settings.sensitiveTextFilter;
  controls.blockedDomains.value = (settings.blockedDomains || []).join("\n");
  controls.userRules.value = JSON.stringify(settings.userRules || [], null, 2);
}

async function persistSettings() {
  const rules = parseUserRules();
  if (!rules.ok) {
    setStatus(rules.error);
    return null;
  }
  const settings = core.normalizeSettings({
    ...currentSettings,
    interfaceLanguage: UI_LANGUAGE,
    enabled: controls.enabled.checked,
    autoTranslate: controls.autoTranslate.checked,
    sourceLanguage: controls.sourceLanguage.value,
    targetLanguage: controls.targetLanguage.value,
    maxBlocks: controls.maxBlocks.value,
    concurrency: controls.concurrency.value,
    displayMode: controls.displayMode.value,
    translationTheme: controls.translationTheme.value,
    floatingBallEnabled: controls.floatingBallEnabled.checked,
    hoverTranslateEnabled: controls.hoverTranslateEnabled.checked,
    selectionTranslateEnabled: controls.selectionTranslateEnabled.checked,
    tripleSpaceEnabled: controls.tripleSpaceEnabled.checked,
    translationMaskEnabled: controls.translationMaskEnabled.checked,
    visibleOnly: controls.visibleOnly.checked,
    provider: controls.provider.value,
    customEndpoint: controls.customEndpoint.value,
    customApiKey: controls.customApiKey.value,
    fallbackToDemo: controls.fallbackToDemo.checked,
    sameLanguageCheck: controls.sameLanguageCheck.checked,
    sensitiveTextFilter: controls.sensitiveTextFilter.checked,
    blockedDomains: parseDomainLines(controls.blockedDomains.value),
    userRules: rules.value
  });

  currentSettings = settings;
  await Promise.all([
    chrome.storage.sync.set({ [SETTINGS_KEY]: publicSettings(settings) }),
    chrome.storage.local.set({ [SECRET_KEY]: settings.customApiKey })
  ]);
  notifyActiveTab("TRANSLY_SETTINGS_CHANGED", { settings: publicSettings(settings) });
  await refreshPageInfo();
  setStatus("已保存");
  return settings;
}

function parseUserRules() {
  const raw = controls.userRules.value.trim();
  if (!raw) return { ok: true, value: [] };
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { ok: false, error: "自定义规则必须是数组" };
    return { ok: true, value: core.normalizeUserRules(parsed) };
  } catch (error) {
    return { ok: false, error: `规则 JSON 无效：${error.message}` };
  }
}

function parseDomainLines(value) {
  return core.normalizeDomainList(
    String(value || "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
  );
}

function validateRulesOnly() {
  const result = parseUserRules();
  if (!result.ok) setStatus(result.error);
}

function publicSettings(settings) {
  return { ...settings, customApiKey: "" };
}

function updateProviderFields(provider) {
  const isCustom = provider === "custom";
  controls.customProviderSettings.hidden = !isCustom;
  [controls.customEndpoint, controls.customApiKey, controls.fallbackToDemo].forEach((control) => {
    control.disabled = !isCustom;
  });
}

async function refreshPageInfo() {
  activeTab = await getActiveTab();
  if (!activeTab) {
    controls.pageDomain.textContent = "未找到当前标签页";
    return;
  }
  let pageInfo = null;
  try {
    pageInfo = await chrome.tabs.sendMessage(activeTab.id, { type: "TRANSLY_GET_PAGE_INFO" });
  } catch (error) {
    pageInfo = null;
  }
  const url = activeTab.url || "";
  const rule = core.getSiteRule(url, currentSettings.userRules);
  const hostname = safeHostname(url);
  controls.pageDomain.textContent = hostname || "当前页面";
  controls.ruleSummary.innerHTML = [
    "<strong>站点规则</strong>",
    `<span>当前站点：${escapeHtml(hostname || "未知")}</span>`,
    `<span>命中规则：${escapeHtml((pageInfo && pageInfo.ruleId) || rule.id)}</span>`,
    `<span>翻译选择器：${rule.selectors.length} 个，排除选择器：${rule.excludeSelectors.length} 个</span>`,
    `<span>已插入译文：${(pageInfo && pageInfo.translatedCount) || 0} 段</span>`
  ].join("");
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function sendToActiveTab(type) {
  await persistSettings();
  activeTab = activeTab || (await getActiveTab());
  if (!activeTab || !activeTab.id) {
    setStatus("未找到当前标签页");
    return;
  }
  try {
    setStatus(type.startsWith("TRANSLY_APPLY") ? "翻译中..." : "处理中...");
    const response = await chrome.tabs.sendMessage(activeTab.id, { type });
    if (!response || response.ok === false) throw new Error((response && response.error) || "页面未响应");
    await refreshPageInfo();
    if (response.cleared) {
      setStatus("已切换回原文");
    } else {
      setStatus(type.startsWith("TRANSLY_APPLY") ? `已翻译 ${response.translated || 0} 段` : "完成");
    }
  } catch (error) {
    setStatus(error.message || String(error));
  }
}

async function notifyActiveTab(type, payload) {
  try {
    activeTab = activeTab || (await getActiveTab());
    if (activeTab && activeTab.id) await chrome.tabs.sendMessage(activeTab.id, { type, ...payload });
  } catch (error) {
    // Restricted pages cannot receive content-script messages.
  }
}

async function translateFreeText() {
  const settings = (await persistSettings()) || currentSettings;
  const text = core.normalizeText(controls.textInput.value);
  if (!core.isTranslatableText(text)) {
    controls.textOutput.textContent = "请输入可翻译文本";
    return;
  }
  controls.textOutput.textContent = "翻译中...";
  const response = await chrome.runtime.sendMessage({
    type: "TRANSLY_TRANSLATE",
    text,
    settings: publicSettings(settings)
  });
  controls.textOutput.textContent =
    response && response.ok ? response.text : (response && response.error) || "翻译失败";
}

function safeHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (error) {
    return "";
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setStatus(text) {
  controls.status.textContent = text;
}

function debounce(fn, delay) {
  let timer = null;
  return function debounced() {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(), delay);
  };
}
