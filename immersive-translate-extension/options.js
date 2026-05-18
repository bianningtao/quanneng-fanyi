const core = window.TranslyCore;
const SETTINGS_KEY = "translySettings";
const SECRET_KEY = "translyCustomApiKey";
const GLOSSARY_KEY = "translyCustomGlossaryTerms";
const READY_PROVIDERS = new Set(["google", "custom", "demo"]);

const controls = {
  enabled: document.querySelector("#enabled"),
  autoTranslate: document.querySelector("#autoTranslate"),
  targetLanguage: document.querySelector("#targetLanguage"),
  provider: document.querySelector("#provider"),
  interfaceLanguage: document.querySelector("#interfaceLanguage"),
  visibleOnly: document.querySelector("#visibleOnly"),
  sameLanguageCheck: document.querySelector("#sameLanguageCheck"),
  sensitiveTextFilter: document.querySelector("#sensitiveTextFilter"),
  maxBlocks: document.querySelector("#maxBlocks"),
  concurrency: document.querySelector("#concurrency"),
  displayMode: document.querySelector("#displayMode"),
  translationTheme: document.querySelector("#translationTheme"),
  sameLanguageBackground: document.querySelector("#sameLanguageBackground"),
  alwaysTranslateDomains: document.querySelector("#alwaysTranslateDomains"),
  neverAutoTranslateDomains: document.querySelector("#neverAutoTranslateDomains"),
  neverTranslateLanguages: document.querySelector("#neverTranslateLanguages"),
  alwaysTranslateLanguages: document.querySelector("#alwaysTranslateLanguages"),
  blockedDomains: document.querySelector("#blockedDomains"),
  providerFallbackOrder: document.querySelector("#providerFallbackOrder"),
  customEndpoint: document.querySelector("#customEndpoint"),
  customApiKey: document.querySelector("#customApiKey"),
  customModel: document.querySelector("#customModel"),
  fallbackToDemo: document.querySelector("#fallbackToDemo"),
  tripleSpaceEnabled: document.querySelector("#tripleSpaceEnabled"),
  selectionTranslateEnabled: document.querySelector("#selectionTranslateEnabled"),
  hoverTranslateEnabled: document.querySelector("#hoverTranslateEnabled"),
  videoSubtitleEnabled: document.querySelector("#videoSubtitleEnabled"),
  videoSubtitleYouTubeEnabled: document.querySelector("#videoSubtitleYouTubeEnabled"),
  videoSubtitleGenericEnabled: document.querySelector("#videoSubtitleGenericEnabled"),
  videoSubtitleMode: document.querySelector("#videoSubtitleMode"),
  videoSubtitleProvider: document.querySelector("#videoSubtitleProvider"),
  glossaryEnabled: document.querySelector("#glossaryEnabled"),
  glossaryPresetGrid: document.querySelector("#glossaryPresetGrid"),
  glossaryCustomTerms: document.querySelector("#glossaryCustomTerms"),
  glossaryPreview: document.querySelector("#glossaryPreview"),
  translationMaskEnabled: document.querySelector("#translationMaskEnabled"),
  floatingBallEnabled: document.querySelector("#floatingBallEnabled"),
  floatingBallCompact: document.querySelector("#floatingBallCompact"),
  floatingBallBlockedDomains: document.querySelector("#floatingBallBlockedDomains"),
  userRules: document.querySelector("#userRules"),
  settingsJson: document.querySelector("#settingsJson"),
  saveSettings: document.querySelector("#saveSettings"),
  clearCache: document.querySelector("#clearCache"),
  resetSettings: document.querySelector("#resetSettings"),
  testService: document.querySelector("#testService"),
  exportSettings: document.querySelector("#exportSettings"),
  importSettings: document.querySelector("#importSettings"),
  saveStatus: document.querySelector("#saveStatus"),
  serviceStatus: document.querySelector("#serviceStatus"),
  stylePreview: document.querySelector("#stylePreview"),
  sectionTitle: document.querySelector("#sectionTitle")
};

const sectionTitles = {
  basic: "基本设置",
  service: "翻译服务",
  glossary: "术语库",
  siteRules: "站点规则",
  input: "输入框翻译",
  selection: "划词翻译",
  hover: "鼠标悬停",
  subtitle: "视频字幕",
  floating: "悬浮球",
  shortcuts: "快捷键",
  importExport: "导入/导出",
  about: "关于"
};

let currentSettings = createDefaultOptionSettings();
let saveTimer = null;

initOptions();

async function initOptions() {
  bindNavigation();
  bindForm();
  currentSettings = await loadSettings();
  applySettings(currentSettings);
  setStatus("已载入设置");
}

function bindNavigation() {
  document.querySelectorAll("[data-section-target]").forEach((button) => {
    button.addEventListener("click", () => showSection(button.getAttribute("data-section-target")));
  });
}

function showSection(sectionName) {
  document.querySelectorAll("[data-section-target]").forEach((button) => {
    button.classList.toggle("is-active", button.getAttribute("data-section-target") === sectionName);
  });
  document.querySelectorAll("[data-section]").forEach((section) => {
    section.classList.toggle("is-active", section.getAttribute("data-section") === sectionName);
  });
  controls.sectionTitle.textContent = sectionTitles[sectionName] || "设置";
}

function bindForm() {
  Object.entries(controls).forEach(([name, control]) => {
    if (!control || isActionControl(name)) return;
    control.addEventListener("change", () => persistFromForm());
    control.addEventListener("input", () => {
      updatePreview();
      scheduleSave();
    });
  });

  document.querySelectorAll("[data-provider-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const provider = button.getAttribute("data-provider-choice");
      if (!READY_PROVIDERS.has(provider)) {
        controls.serviceStatus.textContent = `${button.querySelector("strong").textContent} 暂未接入`;
        return;
      }
      controls.provider.value = provider;
      updateServiceTiles(provider);
      updateProviderFields(provider);
      persistFromForm();
    });
  });

  if (controls.glossaryPresetGrid) {
    controls.glossaryPresetGrid.addEventListener("change", (event) => {
      const checkbox = event.target && event.target.closest("[data-glossary-id]");
      if (!checkbox) return;
      const card = checkbox.closest(".glossary-card");
      if (card) card.classList.toggle("is-enabled", checkbox.checked);
    });
  }

  controls.saveSettings.addEventListener("click", () => persistFromForm(true));
  controls.provider.addEventListener("change", () => updateProviderFields(controls.provider.value));
  controls.clearCache.addEventListener("click", clearCache);
  controls.resetSettings.addEventListener("click", resetSettings);
  controls.testService.addEventListener("click", testService);
  controls.exportSettings.addEventListener("click", exportSettings);
  controls.importSettings.addEventListener("click", importSettings);
}

function isActionControl(name) {
  return [
    "saveSettings",
    "clearCache",
    "resetSettings",
    "testService",
    "exportSettings",
    "importSettings",
    "saveStatus",
    "serviceStatus",
    "stylePreview",
    "sectionTitle",
    "settingsJson"
  ].includes(name);
}

async function loadSettings() {
  const [stored, secret, customGlossaryTerms] = await Promise.all([
    storageGet("sync", SETTINGS_KEY),
    storageGet("local", SECRET_KEY),
    storageGet("local", GLOSSARY_KEY)
  ]);
  return normalizeOptionSettings({
    ...(stored || {}),
    customApiKey: secret || "",
    customGlossaryTerms: customGlossaryTerms || (stored && stored.customGlossaryTerms) || []
  });
}

function applySettings(settings) {
  controls.enabled.checked = settings.enabled;
  controls.autoTranslate.checked = settings.autoTranslate;
  controls.targetLanguage.value = settings.targetLanguage;
  controls.provider.value = settings.provider;
  controls.interfaceLanguage.value = settings.interfaceLanguage;
  controls.visibleOnly.checked = settings.visibleOnly;
  controls.sameLanguageCheck.checked = settings.sameLanguageCheck;
  controls.sensitiveTextFilter.checked = settings.sensitiveTextFilter;
  controls.maxBlocks.value = settings.maxBlocks;
  controls.concurrency.value = settings.concurrency;
  controls.displayMode.value = settings.displayMode;
  controls.translationTheme.value = settings.translationTheme;
  controls.sameLanguageBackground.value = settings.sameLanguageBackground;
  controls.alwaysTranslateDomains.value = settings.alwaysTranslateDomains.join("\n");
  controls.neverAutoTranslateDomains.value = settings.neverAutoTranslateDomains.join("\n");
  controls.neverTranslateLanguages.value = settings.neverTranslateLanguages.join("\n");
  controls.alwaysTranslateLanguages.value = settings.alwaysTranslateLanguages.join("\n");
  controls.blockedDomains.value = settings.blockedDomains.join("\n");
  controls.providerFallbackOrder.value = settings.providerFallbackOrder.join("\n");
  controls.customEndpoint.value = settings.customEndpoint;
  controls.customApiKey.value = settings.customApiKey;
  controls.customModel.value = settings.customModel;
  controls.fallbackToDemo.checked = settings.fallbackToDemo;
  controls.tripleSpaceEnabled.checked = settings.tripleSpaceEnabled;
  controls.selectionTranslateEnabled.checked = settings.selectionTranslateEnabled;
  controls.hoverTranslateEnabled.checked = settings.hoverTranslateEnabled;
  controls.videoSubtitleEnabled.checked = settings.videoSubtitleEnabled;
  controls.videoSubtitleYouTubeEnabled.checked = settings.videoSubtitleYouTubeEnabled;
  controls.videoSubtitleGenericEnabled.checked = settings.videoSubtitleGenericEnabled;
  controls.videoSubtitleMode.value = settings.videoSubtitleMode;
  controls.videoSubtitleProvider.value = settings.videoSubtitleProvider;
  controls.glossaryEnabled.checked = settings.glossaryEnabled;
  controls.glossaryCustomTerms.value = formatGlossaryTerms(settings.customGlossaryTerms);
  renderGlossaryPresetGrid(settings);
  controls.translationMaskEnabled.checked = settings.translationMaskEnabled;
  controls.floatingBallEnabled.checked = settings.floatingBallEnabled;
  controls.floatingBallCompact.checked = settings.floatingBallCompact;
  controls.floatingBallBlockedDomains.value = settings.floatingBallBlockedDomains.join("\n");
  controls.userRules.value = JSON.stringify(settings.userRules || [], null, 2);
  updatePreview();
  updateServiceTiles(settings.provider);
  updateProviderFields(settings.provider);
}

async function persistFromForm(forceStatus) {
  window.clearTimeout(saveTimer);
  try {
    const settings = collectSettings();
    currentSettings = settings;
    await Promise.all([
      storageSet("sync", SETTINGS_KEY, publicSettings(settings)),
      storageSet("local", SECRET_KEY, settings.customApiKey),
      storageSet("local", GLOSSARY_KEY, settings.customGlossaryTerms)
    ]);
    updateServiceTiles(settings.provider);
    notifySettingsChanged(runtimeSettings(settings));
    if (forceStatus) setStatus("已保存");
    else setStatus("已自动保存");
    return settings;
  } catch (error) {
    setStatus(error.message || String(error), true);
    return null;
  }
}

function scheduleSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => persistFromForm(), 350);
}

function collectSettings() {
  const rules = parseUserRules();
  return normalizeOptionSettings({
    ...currentSettings,
    enabled: controls.enabled.checked,
    autoTranslate: controls.autoTranslate.checked,
    targetLanguage: controls.targetLanguage.value,
    provider: controls.provider.value,
    interfaceLanguage: controls.interfaceLanguage.value,
    visibleOnly: controls.visibleOnly.checked,
    sameLanguageCheck: controls.sameLanguageCheck.checked,
    sensitiveTextFilter: controls.sensitiveTextFilter.checked,
    maxBlocks: controls.maxBlocks.value,
    concurrency: controls.concurrency.value,
    displayMode: controls.displayMode.value,
    translationTheme: controls.translationTheme.value,
    sameLanguageBackground: controls.sameLanguageBackground.value,
    alwaysTranslateDomains: parseLines(controls.alwaysTranslateDomains.value),
    neverAutoTranslateDomains: parseLines(controls.neverAutoTranslateDomains.value),
    neverTranslateLanguages: parseLines(controls.neverTranslateLanguages.value),
    alwaysTranslateLanguages: parseLines(controls.alwaysTranslateLanguages.value),
    blockedDomains: parseLines(controls.blockedDomains.value),
    providerFallbackOrder: parseLines(controls.providerFallbackOrder.value),
    customEndpoint: controls.customEndpoint.value,
    customApiKey: controls.customApiKey.value,
    customModel: controls.customModel.value,
    fallbackToDemo: controls.fallbackToDemo.checked,
    tripleSpaceEnabled: controls.tripleSpaceEnabled.checked,
    selectionTranslateEnabled: controls.selectionTranslateEnabled.checked,
    hoverTranslateEnabled: controls.hoverTranslateEnabled.checked,
    videoSubtitleEnabled: controls.videoSubtitleEnabled.checked,
    videoSubtitleYouTubeEnabled: controls.videoSubtitleYouTubeEnabled.checked,
    videoSubtitleGenericEnabled: controls.videoSubtitleGenericEnabled.checked,
    videoSubtitleMode: controls.videoSubtitleMode.value,
    videoSubtitleProvider: controls.videoSubtitleProvider.value,
    glossaryEnabled: controls.glossaryEnabled.checked,
    enabledGlossaryIds: selectedGlossaryIds(),
    customGlossaryTerms: core.normalizeGlossaryTerms(controls.glossaryCustomTerms.value),
    translationMaskEnabled: controls.translationMaskEnabled.checked,
    floatingBallEnabled: controls.floatingBallEnabled.checked,
    floatingBallCompact: controls.floatingBallCompact.checked,
    floatingBallBlockedDomains: parseLines(controls.floatingBallBlockedDomains.value),
    userRules: rules
  });
}

function normalizeOptionSettings(input) {
  const normalized = core.normalizeSettings(input || {});
  return {
    ...normalized,
    sameLanguageBackground: ["none", "soft", "slate"].includes(input.sameLanguageBackground)
      ? input.sameLanguageBackground
      : "none",
    alwaysTranslateDomains: core.normalizeDomainList(input.alwaysTranslateDomains || []),
    neverAutoTranslateDomains: core.normalizeDomainList(input.neverAutoTranslateDomains || []),
    neverTranslateLanguages: parseLanguageLines(input.neverTranslateLanguages || []),
    alwaysTranslateLanguages: parseLanguageLines(input.alwaysTranslateLanguages || []),
    providerFallbackOrder: core.normalizeProviderOrder(input.providerFallbackOrder || [])
  };
}

function createDefaultOptionSettings() {
  return normalizeOptionSettings(core.createDefaultSettings());
}

function parseLines(value) {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseLanguageLines(value) {
  const values = Array.isArray(value) ? value : parseLines(value);
  return values
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item) => core.normalizeLanguageCode(item))
    .filter(Boolean);
}

function selectedGlossaryIds() {
  if (!controls.glossaryPresetGrid) return currentSettings.enabledGlossaryIds || [];
  return Array.from(controls.glossaryPresetGrid.querySelectorAll("[data-glossary-id]:checked"))
    .map((input) => input.getAttribute("data-glossary-id"))
    .filter(Boolean);
}

function formatGlossaryTerms(terms) {
  const normalizedTerms = core.normalizeGlossaryTerms(terms);
  if (normalizedTerms.some((term) => term.note || term.domains.length)) {
    return JSON.stringify(normalizedTerms, null, 2);
  }
  return normalizedTerms.map((term) => `${term.source} => ${term.target}`).join("\n");
}

function renderGlossaryPresetGrid(settings) {
  if (!controls.glossaryPresetGrid) return;
  const enabledIds = new Set(settings.enabledGlossaryIds || []);
  controls.glossaryPresetGrid.innerHTML = core.getBuiltInGlossaryBanks()
    .map((bank) => {
      const checked = enabledIds.has(bank.id);
      const examples = bank.terms.slice(0, 3).map((term) => `${term.source}→${term.target}`).join(" / ");
      return `
        <label class="glossary-card ${checked ? "is-enabled" : ""}">
          <span>
            <strong>${escapeHtml(bank.name)}</strong>
            <span>${escapeHtml(bank.description)}</span>
          </span>
          <input type="checkbox" data-glossary-id="${escapeHtml(bank.id)}" ${checked ? "checked" : ""}>
          <small>${escapeHtml(bank.terms.length)} 个术语 · ${escapeHtml(examples)}</small>
        </label>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseUserRules() {
  const raw = controls.userRules.value.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("自定义站点规则必须是数组");
    return core.normalizeUserRules(parsed);
  } catch (error) {
    throw new Error(`规则 JSON 无效：${error.message}`);
  }
}

function publicSettings(settings) {
  return { ...settings, customApiKey: "", customGlossaryTerms: [] };
}

function runtimeSettings(settings) {
  return { ...publicSettings(settings), customGlossaryTerms: settings.customGlossaryTerms };
}

async function clearCache() {
  await storageRemove("local", "translyTranslationCache");
  setStatus("已清除本地译文缓存");
}

async function resetSettings() {
  if (!window.confirm("确定重置所有设置吗？自定义 API Key 也会从本机移除。")) return;
  currentSettings = createDefaultOptionSettings();
  await Promise.all([
    storageSet("sync", SETTINGS_KEY, publicSettings(currentSettings)),
    storageRemove("local", SECRET_KEY),
    storageRemove("local", GLOSSARY_KEY)
  ]);
  applySettings(currentSettings);
  setStatus("已重置为默认设置");
}

async function testService() {
  const settings = await persistFromForm();
  if (!settings) return;
  if (!READY_PROVIDERS.has(settings.provider)) {
    controls.serviceStatus.textContent = "该服务当前不可用，当前版本尚不能测试";
    return;
  }
  if (!hasRuntimeMessaging()) {
    controls.serviceStatus.textContent = "当前是静态预览环境，无法调用扩展后台测试";
    return;
  }

  controls.serviceStatus.textContent = "测试中...";
  try {
    const response = await chrome.runtime.sendMessage({
      type: "TRANSLY_TRANSLATE",
      text: "Hello, this is a Transly service test.",
      url: "https://example.com/transly-service-test",
      settings: runtimeSettings(settings)
    });
    if (!response || response.ok === false) {
      throw new Error((response && response.error) || "服务测试失败");
    }
    controls.serviceStatus.textContent = formatServiceTestResult(response);
  } catch (error) {
    controls.serviceStatus.textContent = core.sanitizeErrorMessage(error.message || String(error), [
      settings.customApiKey
    ]);
  }
}

function formatServiceTestResult(response) {
  const provider = response.provider || "未知服务";
  const translation = core.normalizeText(response.text || "").slice(0, 120);
  const attempts = Array.isArray(response.attempts)
    ? response.attempts.map((attempt) => `${attempt.provider}:${attempt.status}`).join(" → ")
    : "";
  return [
    `测试成功：${provider}`,
    attempts ? `链路：${attempts}` : "",
    translation ? `译文：${translation}` : ""
  ].filter(Boolean).join("\n");
}

function exportSettings() {
  const settings = collectSettings();
  controls.settingsJson.value = JSON.stringify(publicSettings(settings), null, 2);
  showSection("importExport");
  setStatus("已导出设置，API Key 未包含在 JSON 中");
}

async function importSettings() {
  try {
    const raw = controls.settingsJson.value.trim();
    if (!raw) throw new Error("请先粘贴设置 JSON");
    const imported = JSON.parse(raw);
    currentSettings = normalizeOptionSettings({
      ...imported,
      customApiKey: currentSettings.customApiKey
    });
    applySettings(currentSettings);
    await persistFromForm(true);
    setStatus("已导入设置");
  } catch (error) {
    setStatus(`导入失败：${error.message}`, true);
  }
}

function updatePreview() {
  if (!controls.stylePreview) return;
  controls.stylePreview.dataset.theme = controls.translationTheme.value;
  controls.stylePreview.dataset.sameLanguage = controls.sameLanguageBackground.value;
}

function updateServiceTiles(provider) {
  document.querySelectorAll("[data-provider-choice]").forEach((button) => {
    button.classList.toggle("is-selected", button.getAttribute("data-provider-choice") === provider);
  });
}

function updateProviderFields(provider) {
  const isCustom = provider === "custom";
  const customPanel = document.querySelector("#customProviderSettings");
  if (customPanel) customPanel.hidden = !isCustom;
  [controls.customEndpoint, controls.customApiKey, controls.customModel].forEach((control) => {
    if (control) control.disabled = !isCustom;
  });
}

async function notifySettingsChanged(settings) {
  if (!hasRuntimeMessaging()) return;
  try {
    await chrome.runtime.sendMessage({
      type: "TRANSLY_SETTINGS_CHANGED",
      settings
    });
  } catch (error) {
    // Options pages can be opened on restricted browser screens where no content script is available.
  }
}

async function storageGet(area, key) {
  if (hasChromeStorage(area)) {
    const stored = await chrome.storage[area].get([key]);
    return stored[key];
  }
  const raw = window.localStorage.getItem(`${area}:${key}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return raw;
  }
}

async function storageSet(area, key, value) {
  if (hasChromeStorage(area)) {
    await chrome.storage[area].set({ [key]: value });
    return;
  }
  window.localStorage.setItem(`${area}:${key}`, JSON.stringify(value));
}

async function storageRemove(area, key) {
  if (hasChromeStorage(area)) {
    await chrome.storage[area].remove([key]);
    return;
  }
  window.localStorage.removeItem(`${area}:${key}`);
}

function hasChromeStorage(area) {
  return Boolean(window.chrome && chrome.storage && chrome.storage[area]);
}

function hasRuntimeMessaging() {
  return Boolean(window.chrome && chrome.runtime && chrome.runtime.sendMessage);
}

function setStatus(text, isError) {
  controls.saveStatus.textContent = text;
  controls.saveStatus.classList.toggle("is-error", Boolean(isError));
}
