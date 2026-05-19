const core = window.TranslyCore;
const SETTINGS_KEY = "translySettings";
const SECRET_KEY = "translyCustomApiKey";
const GLOSSARY_KEY = "translyCustomGlossaryTerms";
const UI_LANGUAGE = "zh-CN";

const controls = {
  enabled: document.querySelector("#enabled"),
  sourceLanguage: document.querySelector("#sourceLanguage"),
  targetLanguage: document.querySelector("#targetLanguage"),
  displayMode: document.querySelector("#displayMode"),
  provider: document.querySelector("#provider"),
  selectionTranslateEnabled: document.querySelector("#selectionTranslateEnabled"),
  hoverTranslateEnabled: document.querySelector("#hoverTranslateEnabled"),
  floatingBallEnabled: document.querySelector("#floatingBallEnabled"),
  autoTranslate: document.querySelector("#autoTranslate"),
  translatePage: document.querySelector("#translatePage"),
  translateWholePage: document.querySelector("#translateWholePage"),
  toggleOnlyTranslation: document.querySelector("#toggleOnlyTranslation"),
  toggleTranslationMask: document.querySelector("#toggleTranslationMask"),
  clearTranslations: document.querySelector("#clearTranslations"),
  openSidePanel: document.querySelector("#openSidePanel"),
  openOptions: document.querySelector("#openOptions"),
  textTranslate: document.querySelector("#textTranslate"),
  versionLabel: document.querySelector("#versionLabel"),
  status: document.querySelector("#status")
};

const persistControlNames = [
  "enabled",
  "sourceLanguage",
  "targetLanguage",
  "displayMode",
  "provider",
  "selectionTranslateEnabled",
  "hoverTranslateEnabled",
  "floatingBallEnabled",
  "autoTranslate"
];

let currentSettings = core.createDefaultSettings();
let currentTabUrl = "";
let currentHost = "";

initPopup();

async function initPopup() {
  const [settings, tabInfo] = await Promise.all([loadSettings(), loadActiveTabInfo()]);
  currentSettings = settings;
  currentTabUrl = tabInfo.url;
  currentHost = tabInfo.host;
  applySettingsToForm(currentSettings);
  bindForm();
  renderVersion();
  setStatus(core.getUiMessages(UI_LANGUAGE).ready);
}

async function loadActiveTabInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab && tab.url ? tab.url : "";
    return { url, host: normalizeHostnameFromUrl(url) };
  } catch (error) {
    return { url: "", host: "" };
  }
}

async function loadSettings() {
  const [stored, secret, customGlossaryTerms] = await Promise.all([
    chrome.storage.sync.get([SETTINGS_KEY]),
    chrome.storage.local.get([SECRET_KEY]),
    chrome.storage.local.get([GLOSSARY_KEY])
  ]);
  const syncSettings = stored[SETTINGS_KEY] || {};
  const settings = core.normalizeSettings({
    ...syncSettings,
    customApiKey: secret[SECRET_KEY] || "",
    customGlossaryTerms:
      customGlossaryTerms[GLOSSARY_KEY] ||
      syncSettings.customGlossaryTerms ||
      []
  });
  await chrome.storage.sync.set({ [SETTINGS_KEY]: publicSettings(settings) });
  return settings;
}

function bindForm() {
  persistControlNames.forEach((name) => {
    const control = controls[name];
    if (!control) return;
    control.addEventListener("change", persistForm);
    control.addEventListener("input", debounce(persistForm, 250));
  });

  bindAction("translatePage", async () => {
    await persistForm();
    sendToActiveTab("TRANSLY_APPLY");
  });

  bindAction("clearTranslations", () => {
    sendToActiveTab("TRANSLY_CLEAR");
  });

  bindAction("translateWholePage", async () => {
    await persistForm();
    sendToActiveTab("TRANSLY_APPLY_WHOLE");
  });

  bindAction("toggleOnlyTranslation", async () => {
    await persistForm();
    sendToActiveTab("TRANSLY_TOGGLE_ONLY_TRANSLATION");
  });

  bindAction("toggleTranslationMask", async () => {
    await persistForm();
    sendToActiveTab("TRANSLY_TOGGLE_MASK");
  });

  bindAction("openSidePanel", async () => {
    await persistForm();
    openSidePanel();
  });

  bindAction("openOptions", async () => {
    await persistForm();
    openOptionsPage();
  });

  bindAction("textTranslate", async () => {
    await persistForm();
    setStatus("已打开侧栏，可使用文本翻译");
    openSidePanel();
  });
}

function bindAction(name, handler) {
  const control = controls[name];
  if (!control) return;
  control.addEventListener("click", handler);
}

function applySettingsToForm(settings) {
  controls.enabled.checked = settings.enabled;
  controls.sourceLanguage.value = settings.sourceLanguage;
  controls.targetLanguage.value = settings.targetLanguage;
  controls.displayMode.value = settings.displayMode;
  controls.provider.value = settings.provider;
  controls.selectionTranslateEnabled.checked = settings.selectionTranslateEnabled;
  controls.hoverTranslateEnabled.checked = settings.hoverTranslateEnabled;
  controls.floatingBallEnabled.checked = currentHost
    ? settings.floatingBallEnabled && !domainListIncludes(settings.floatingBallBlockedDomains, currentHost)
    : settings.floatingBallEnabled;
  controls.autoTranslate.checked = currentTabUrl
    ? core.shouldAutoTranslateUrl(currentTabUrl, settings)
    : settings.autoTranslate;
}

async function persistForm() {
  const siteAwareSettings = applyCurrentSiteSwitches(currentSettings);
  const settings = core.normalizeSettings({
    ...siteAwareSettings,
    enabled: controls.enabled.checked,
    interfaceLanguage: UI_LANGUAGE,
    sourceLanguage: controls.sourceLanguage.value,
    targetLanguage: controls.targetLanguage.value,
    displayMode: controls.displayMode.value,
    provider: controls.provider.value,
    selectionTranslateEnabled: controls.selectionTranslateEnabled.checked,
    hoverTranslateEnabled: controls.hoverTranslateEnabled.checked,
    floatingBallEnabled: siteAwareSettings.floatingBallEnabled,
    autoTranslate: siteAwareSettings.autoTranslate,
    floatingBallBlockedDomains: siteAwareSettings.floatingBallBlockedDomains,
    alwaysTranslateDomains: siteAwareSettings.alwaysTranslateDomains,
    neverAutoTranslateDomains: siteAwareSettings.neverAutoTranslateDomains
  });

  currentSettings = settings;
  await Promise.all([
    chrome.storage.sync.set({ [SETTINGS_KEY]: publicSettings(settings) }),
    chrome.storage.local.set({ [SECRET_KEY]: settings.customApiKey })
  ]);
  notifyActiveTab("TRANSLY_SETTINGS_CHANGED", { settings: runtimeSettings(settings) });
  setStatus(core.getUiMessages(UI_LANGUAGE).saved);
  return settings;
}

function applyCurrentSiteSwitches(settings) {
  if (!currentHost) {
    return {
      ...settings,
      floatingBallEnabled: controls.floatingBallEnabled.checked,
      autoTranslate: controls.autoTranslate.checked
    };
  }
  const next = { ...settings };
  next.floatingBallEnabled = controls.floatingBallEnabled.checked ? true : settings.floatingBallEnabled;
  next.floatingBallBlockedDomains = controls.floatingBallEnabled.checked
    ? removeDomainFromList(settings.floatingBallBlockedDomains, currentHost)
    : addDomainToList(settings.floatingBallBlockedDomains, currentHost);
  next.alwaysTranslateDomains = controls.autoTranslate.checked
    ? addDomainToList(settings.alwaysTranslateDomains, currentHost)
    : removeDomainFromList(settings.alwaysTranslateDomains, currentHost);
  next.neverAutoTranslateDomains = controls.autoTranslate.checked
    ? removeDomainFromList(settings.neverAutoTranslateDomains, currentHost)
    : addDomainToList(settings.neverAutoTranslateDomains, currentHost);
  next.autoTranslate = settings.autoTranslate;
  return next;
}

function normalizeHostnameFromUrl(url) {
  try {
    return new URL(String(url || "")).hostname.replace(/^www\./, "").toLowerCase();
  } catch (error) {
    return "";
  }
}

function domainListIncludes(list, domain) {
  return Array.isArray(list) && list.includes(domain);
}

function addDomainToList(list, domain) {
  const values = Array.isArray(list) ? list : [];
  if (!domain || values.includes(domain)) return values;
  return [...values, domain];
}

function removeDomainFromList(list, domain) {
  const values = Array.isArray(list) ? list : [];
  if (!domain) return values;
  return values.filter((item) => item !== domain);
}

function publicSettings(settings) {
  return { ...settings, customApiKey: "", customGlossaryTerms: [] };
}

function runtimeSettings(settings) {
  return { ...publicSettings(settings), customGlossaryTerms: settings.customGlossaryTerms };
}

async function sendToActiveTab(type) {
  currentSettings = await loadSettings();
  const messages = core.getUiMessages(UI_LANGUAGE);
  try {
    setStatus(type.startsWith("TRANSLY_APPLY") ? `${messages.translating}...` : "处理中...");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error("未找到当前标签页");
    const response = await chrome.tabs.sendMessage(tab.id, { type });
    if (!response || response.ok === false) {
      throw new Error((response && response.error) || messages.pageDidNotRespond);
    }
    if (type === "TRANSLY_CLEAR") {
      setStatus(messages.cleared);
    } else if (type.startsWith("TRANSLY_APPLY")) {
      setStatus(response.cleared ? "已切换回原文" : `${messages.translated} ${response.translated || 0}`);
    } else {
      setStatus(messages.ready);
    }
  } catch (error) {
    setStatus(error.message || String(error));
  }
}

async function openSidePanel() {
  try {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        await chrome.sidePanel.open({ tabId: tab.id });
        window.close();
        return;
      }
    }
    const response = await chrome.runtime.sendMessage({ type: "TRANSLY_OPEN_SIDE_PANEL" });
    if (!response || response.ok === false) throw new Error((response && response.error) || "无法打开侧边栏");
    window.close();
  } catch (error) {
    setStatus(error.message || String(error));
  }
}

async function openOptionsPage() {
  try {
    await chrome.runtime.openOptionsPage();
    window.close();
  } catch (error) {
    setStatus(error.message || String(error));
  }
}

async function notifyActiveTab(type, payload) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) await chrome.tabs.sendMessage(tab.id, { type, ...payload });
  } catch (error) {
    // chrome:// and extension pages cannot receive content-script messages.
  }
}

function renderVersion() {
  if (!controls.versionLabel || !chrome.runtime || !chrome.runtime.getManifest) return;
  controls.versionLabel.textContent = `v${chrome.runtime.getManifest().version}`;
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
