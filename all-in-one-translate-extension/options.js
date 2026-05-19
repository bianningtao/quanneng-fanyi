const core = window.TranslyCore;
const SETTINGS_KEY = "translySettings";
const SECRET_KEY = "translyCustomApiKey";
const GLOSSARY_KEY = "translyCustomGlossaryTerms";
const ENGINE_SECRET_KEY = "translyServiceEngineSecrets";
const READY_PROVIDERS = new Set(["google", "microsoft", "custom", "demo"]);

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
  translationTextColor: document.querySelector("#translationTextColor"),
  translationBackgroundColor: document.querySelector("#translationBackgroundColor"),
  translationFontScale: document.querySelector("#translationFontScale"),
  translationMaxWidth: document.querySelector("#translationMaxWidth"),
  translationFontFamily: document.querySelector("#translationFontFamily"),
  stylePresetGrid: document.querySelector("#stylePresetGrid"),
  alwaysTranslateDomains: document.querySelector("#alwaysTranslateDomains"),
  neverAutoTranslateDomains: document.querySelector("#neverAutoTranslateDomains"),
  neverTranslateLanguages: document.querySelector("#neverTranslateLanguages"),
  alwaysTranslateLanguages: document.querySelector("#alwaysTranslateLanguages"),
  blockedDomains: document.querySelector("#blockedDomains"),
  providerFallbackOrder: document.querySelector("#providerFallbackOrder"),
  engineList: document.querySelector("#engineList"),
  engineDetail: document.querySelector("#engineDetail"),
  compareEngines: document.querySelector("#compareEngines"),
  addCustomEngine: document.querySelector("#addCustomEngine"),
  setDefaultEngine: document.querySelector("#setDefaultEngine"),
  engineEnabled: document.querySelector("#engineEnabled"),
  engineName: document.querySelector("#engineName"),
  engineType: document.querySelector("#engineType"),
  engineStrategy: document.querySelector("#engineStrategy"),
  engineEndpoint: document.querySelector("#engineEndpoint"),
  engineApiKey: document.querySelector("#engineApiKey"),
  engineModel: document.querySelector("#engineModel"),
  engineAiContext: document.querySelector("#engineAiContext"),
  engineRichText: document.querySelector("#engineRichText"),
  engineSystemPrompt: document.querySelector("#engineSystemPrompt"),
  engineMultiPrompt: document.querySelector("#engineMultiPrompt"),
  engineSinglePrompt: document.querySelector("#engineSinglePrompt"),
  engineMaxRequestsPerMinute: document.querySelector("#engineMaxRequestsPerMinute"),
  engineMaxTextLength: document.querySelector("#engineMaxTextLength"),
  engineMaxSegments: document.querySelector("#engineMaxSegments"),
  engineTemperature: document.querySelector("#engineTemperature"),
  engineTitle: document.querySelector("#engineTitle"),
  engineMeta: document.querySelector("#engineMeta"),
  engineDescription: document.querySelector("#engineDescription"),
  customEndpoint: document.querySelector("#customEndpoint"),
  customApiKey: document.querySelector("#customApiKey"),
  customModel: document.querySelector("#customModel"),
  fallbackToDemo: document.querySelector("#fallbackToDemo"),
  fallbackOrderStatus: document.querySelector("#fallbackOrderStatus"),
  tripleSpaceEnabled: document.querySelector("#tripleSpaceEnabled"),
  selectionTranslateEnabled: document.querySelector("#selectionTranslateEnabled"),
  hoverTranslateEnabled: document.querySelector("#hoverTranslateEnabled"),
  videoSubtitleEnabled: document.querySelector("#videoSubtitleEnabled"),
  videoSubtitleYouTubeEnabled: document.querySelector("#videoSubtitleYouTubeEnabled"),
  videoSubtitleGenericEnabled: document.querySelector("#videoSubtitleGenericEnabled"),
  videoSubtitleMode: document.querySelector("#videoSubtitleMode"),
  videoSubtitleProvider: document.querySelector("#videoSubtitleProvider"),
  videoSubtitleFontScale: document.querySelector("#videoSubtitleFontScale"),
  videoSubtitleTextColor: document.querySelector("#videoSubtitleTextColor"),
  videoSubtitleBackgroundColor: document.querySelector("#videoSubtitleBackgroundColor"),
  videoSubtitleTextShadow: document.querySelector("#videoSubtitleTextShadow"),
  subtitlePreview: document.querySelector("#subtitlePreview"),
  glossaryEnabled: document.querySelector("#glossaryEnabled"),
  glossaryPresetGrid: document.querySelector("#glossaryPresetGrid"),
  glossaryCustomTerms: document.querySelector("#glossaryCustomTerms"),
  glossaryPreview: document.querySelector("#glossaryPreview"),
  translationMaskEnabled: document.querySelector("#translationMaskEnabled"),
  floatingBallEnabled: document.querySelector("#floatingBallEnabled"),
  floatingBallCompact: document.querySelector("#floatingBallCompact"),
  floatingBallHoverOnly: document.querySelector("#floatingBallHoverOnly"),
  floatingBallClickAction: document.querySelector("#floatingBallClickAction"),
  floatingBallPosition: document.querySelector("#floatingBallPosition"),
  floatingBallOpacity: document.querySelector("#floatingBallOpacity"),
  floatingBallBlockedDomains: document.querySelector("#floatingBallBlockedDomains"),
  siteRuleList: document.querySelector("#siteRuleList"),
  addSiteRule: document.querySelector("#addSiteRule"),
  reloadSiteRules: document.querySelector("#reloadSiteRules"),
  syncSiteRuleJson: document.querySelector("#syncSiteRuleJson"),
  deleteSiteRule: document.querySelector("#deleteSiteRule"),
  siteRuleEditorTitle: document.querySelector("#siteRuleEditorTitle"),
  siteRuleId: document.querySelector("#siteRuleId"),
  siteRuleName: document.querySelector("#siteRuleName"),
  siteRuleMatches: document.querySelector("#siteRuleMatches"),
  siteRuleIncludeSelectors: document.querySelector("#siteRuleIncludeSelectors"),
  siteRuleExcludeSelectors: document.querySelector("#siteRuleExcludeSelectors"),
  siteRuleStayOriginalSelectors: document.querySelector("#siteRuleStayOriginalSelectors"),
  siteRuleMinTextLength: document.querySelector("#siteRuleMinTextLength"),
  siteRuleDynamicMode: document.querySelector("#siteRuleDynamicMode"),
  siteRuleJsonStatus: document.querySelector("#siteRuleJsonStatus"),
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
let activeEngineId = "google";
let activeSiteRuleIndex = -1;
let userRulesJsonDirty = false;
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
    control.addEventListener("change", () => {
      if (control.type === "color") {
        control.dataset.colorEmpty = "false";
        updateColorControl(control);
      }
      if (name === "provider") {
        const selectedProvider = control.value;
        selectEngine(selectedProvider);
        controls.provider.value = selectedProvider;
        promoteEngineInOrder(selectedProvider);
      }
      if (name === "providerFallbackOrder") {
        syncPreferredProviderFromFallbackOrder();
      }
      updateFallbackOrderFeedback();
      persistFromForm();
    });
    control.addEventListener("input", () => {
      if (control.type === "color") {
        control.dataset.colorEmpty = "false";
        updateColorControl(control);
      }
      updatePreview();
      if (name === "providerFallbackOrder") updateFallbackOrderFeedback();
      scheduleSave();
    });
  });

  document.querySelectorAll("[data-color-clear], [data-color-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      const controlId = button.getAttribute("data-color-clear") || button.getAttribute("data-color-reset");
      const control = document.querySelector(`#${controlId}`);
      if (!control) return;
      if (button.hasAttribute("data-color-clear")) {
        setColorControl(control, "");
      } else {
        setColorControl(control, button.getAttribute("data-color-value") || control.dataset.defaultColor || "#000000");
      }
      updatePreview();
      persistFromForm();
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
      promoteEngineInOrder(provider);
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

  if (controls.stylePresetGrid) {
    controls.stylePresetGrid.addEventListener("click", (event) => {
      const button = event.target && event.target.closest("[data-theme-choice]");
      if (!button) return;
      controls.translationTheme.value = button.getAttribute("data-theme-choice");
      updatePreview();
      persistFromForm();
    });
  }

  if (controls.engineList) {
    controls.engineList.addEventListener("click", (event) => {
      const button = event.target && event.target.closest("[data-engine-id]");
      if (!button) return;
      commitActiveEngineForm();
      selectEngine(button.getAttribute("data-engine-id"));
      persistFromForm();
    });
  }

  controls.saveSettings.addEventListener("click", () => persistFromForm(true));
  controls.provider.addEventListener("change", () => {
    const selectedProvider = controls.provider.value;
    selectEngine(selectedProvider);
    controls.provider.value = selectedProvider;
    updateProviderFields(selectedProvider);
    updateServiceTiles(selectedProvider);
    updateFallbackOrderFeedback();
  });
  controls.addCustomEngine.addEventListener("click", addCustomEngine);
  controls.compareEngines.addEventListener("click", compareEngines);
  controls.setDefaultEngine.addEventListener("click", () => {
    const engine = core.resolveServiceEngine(activeEngineId, currentSettings);
    if (!engine || !isEngineRunnable(engine)) {
      const reason = engineReadiness(engine).label;
      controls.serviceStatus.textContent = `该服务暂不能设为当前首选：${reason}`;
      return;
    }
    controls.provider.value = activeEngineId;
    promoteEngineInOrder(activeEngineId);
    persistFromForm(true);
  });
  controls.clearCache.addEventListener("click", clearCache);
  controls.resetSettings.addEventListener("click", resetSettings);
  controls.testService.addEventListener("click", testService);
  controls.exportSettings.addEventListener("click", exportSettings);
  controls.importSettings.addEventListener("click", importSettings);
  bindSiteRuleEditor();
}

function isActionControl(name) {
  return [
    "saveSettings",
    "clearCache",
    "resetSettings",
    "testService",
    "compareEngines",
    "addCustomEngine",
    "setDefaultEngine",
    "engineList",
    "engineDetail",
    "engineTitle",
    "engineMeta",
    "engineDescription",
    "exportSettings",
    "importSettings",
    "saveStatus",
    "serviceStatus",
    "fallbackOrderStatus",
    "stylePreview",
    "subtitlePreview",
    "stylePresetGrid",
    "siteRuleList",
    "addSiteRule",
    "reloadSiteRules",
    "syncSiteRuleJson",
    "deleteSiteRule",
    "siteRuleEditorTitle",
    "siteRuleJsonStatus",
    "sectionTitle",
    "settingsJson"
  ].includes(name);
}

async function loadSettings() {
  const [stored, secret, customGlossaryTerms, engineSecrets] = await Promise.all([
    storageGet("sync", SETTINGS_KEY),
    storageGet("local", SECRET_KEY),
    storageGet("local", GLOSSARY_KEY),
    storageGet("local", ENGINE_SECRET_KEY)
  ]);
  const engineSource = (stored && stored.serviceEngines) || [];
  return reconcileServiceSettings(normalizeOptionSettings({
    ...(stored || {}),
    customApiKey: secret || "",
    serviceEngines: mergeEngineSecrets(engineSource, engineSecrets || {}),
    customGlossaryTerms: customGlossaryTerms || (stored && stored.customGlossaryTerms) || []
  }));
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
  setColorControl(controls.translationTextColor, settings.translationTextColor);
  setColorControl(controls.translationBackgroundColor, settings.translationBackgroundColor);
  controls.translationFontScale.value = settings.translationFontScale;
  controls.translationMaxWidth.value = settings.translationMaxWidth || "";
  controls.translationFontFamily.value = settings.translationFontFamily;
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
  renderSubtitleProviderOptions(settings);
  controls.videoSubtitleProvider.value = settings.videoSubtitleProvider;
  controls.videoSubtitleFontScale.value = settings.videoSubtitleFontScale;
  setColorControl(controls.videoSubtitleTextColor, settings.videoSubtitleTextColor);
  setColorControl(controls.videoSubtitleBackgroundColor, settings.videoSubtitleBackgroundColor);
  controls.videoSubtitleTextShadow.checked = settings.videoSubtitleTextShadow;
  controls.glossaryEnabled.checked = settings.glossaryEnabled;
  controls.glossaryCustomTerms.value = formatGlossaryTerms(settings.customGlossaryTerms);
  renderGlossaryPresetGrid(settings);
  controls.translationMaskEnabled.checked = settings.translationMaskEnabled;
  controls.floatingBallEnabled.checked = settings.floatingBallEnabled;
  controls.floatingBallCompact.checked = settings.floatingBallCompact;
  controls.floatingBallHoverOnly.checked = settings.floatingBallHoverOnly;
  controls.floatingBallClickAction.value = settings.floatingBallClickAction;
  controls.floatingBallPosition.value = settings.floatingBallPosition;
  controls.floatingBallOpacity.value = settings.floatingBallOpacity;
  controls.floatingBallBlockedDomains.value = settings.floatingBallBlockedDomains.join("\n");
  controls.userRules.value = JSON.stringify(settings.userRules || [], null, 2);
  renderSiteRuleEditor(settings.userRules || [], activeSiteRuleIndex);
  renderStylePresetGrid(settings);
  updatePreview();
  renderEngineList(settings);
  selectEngine(settings.provider);
  updateServiceTiles(settings.provider);
  updateProviderFields(settings.provider);
  updateFallbackOrderFeedback(settings);
}

async function persistFromForm(forceStatus) {
  window.clearTimeout(saveTimer);
  try {
    const settings = collectSettings();
    currentSettings = settings;
    reflectServiceControls(settings);
    await Promise.all([
      storageSet("sync", SETTINGS_KEY, publicSettings(settings)),
      storageSet("local", SECRET_KEY, settings.customApiKey),
      storageSet("local", GLOSSARY_KEY, settings.customGlossaryTerms),
      storageSet("local", ENGINE_SECRET_KEY, collectEngineSecrets(settings))
    ]);
    updateServiceTiles(settings.provider);
    renderEngineList(settings);
    updateFallbackOrderFeedback(settings);
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
  commitActiveEngineForm();
  commitActiveSiteRuleForm();
  const rules = parseUserRules();
  return reconcileServiceSettings(normalizeOptionSettings({
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
    translationTextColor: readColorControl(controls.translationTextColor),
    translationBackgroundColor: readColorControl(controls.translationBackgroundColor),
    translationFontScale: controls.translationFontScale.value,
    translationMaxWidth: controls.translationMaxWidth.value,
    translationFontFamily: controls.translationFontFamily.value,
    alwaysTranslateDomains: parseLines(controls.alwaysTranslateDomains.value),
    neverAutoTranslateDomains: parseLines(controls.neverAutoTranslateDomains.value),
    neverTranslateLanguages: parseLines(controls.neverTranslateLanguages.value),
    alwaysTranslateLanguages: parseLines(controls.alwaysTranslateLanguages.value),
    blockedDomains: parseLines(controls.blockedDomains.value),
    providerFallbackOrder: parseLines(controls.providerFallbackOrder.value),
    serviceEngines: currentSettings.serviceEngines,
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
    videoSubtitleFontScale: controls.videoSubtitleFontScale.value,
    videoSubtitleTextColor: readColorControl(controls.videoSubtitleTextColor),
    videoSubtitleBackgroundColor: readColorControl(controls.videoSubtitleBackgroundColor),
    videoSubtitleTextShadow: controls.videoSubtitleTextShadow.checked,
    glossaryEnabled: controls.glossaryEnabled.checked,
    enabledGlossaryIds: selectedGlossaryIds(),
    customGlossaryTerms: core.normalizeGlossaryTerms(controls.glossaryCustomTerms.value),
    translationMaskEnabled: controls.translationMaskEnabled.checked,
    floatingBallEnabled: controls.floatingBallEnabled.checked,
    floatingBallCompact: controls.floatingBallCompact.checked,
    floatingBallHoverOnly: controls.floatingBallHoverOnly.checked,
    floatingBallClickAction: controls.floatingBallClickAction.value,
    floatingBallPosition: controls.floatingBallPosition.value,
    floatingBallOpacity: controls.floatingBallOpacity.value,
    floatingBallBlockedDomains: parseLines(controls.floatingBallBlockedDomains.value),
    userRules: rules
  }));
}

function normalizeOptionSettings(input) {
  input = input || {};
  const normalized = core.normalizeSettings(input);
  const serviceEngines = core.normalizeServiceEngines(input.serviceEngines || normalized.serviceEngines || [], normalized);
  return {
    ...normalized,
    sameLanguageBackground: ["none", "soft", "slate"].includes(input.sameLanguageBackground)
      ? input.sameLanguageBackground
      : "none",
    alwaysTranslateDomains: core.normalizeDomainList(input.alwaysTranslateDomains || []),
    neverAutoTranslateDomains: core.normalizeDomainList(input.neverAutoTranslateDomains || []),
    neverTranslateLanguages: parseLanguageLines(input.neverTranslateLanguages || []),
    alwaysTranslateLanguages: parseLanguageLines(input.alwaysTranslateLanguages || []),
    serviceEngines,
    providerFallbackOrder: core.normalizeProviderOrder(input.providerFallbackOrder || normalized.providerFallbackOrder || [], serviceEngines),
    videoSubtitleProvider: normalizeSubtitleProvider(input.videoSubtitleProvider, serviceEngines, normalized.videoSubtitleProvider)
  };
}

function createDefaultOptionSettings() {
  return reconcileServiceSettings(normalizeOptionSettings(core.createDefaultSettings()));
}

function reconcileServiceSettings(settings) {
  const serviceEngines = settings.serviceEngines || [];
  const preferredFromOrder = firstEnabledEngineId(settings.providerFallbackOrder, settings);
  const currentEngine = core.resolveServiceEngine(settings.provider, settings);
  const currentProvider = currentEngine && isEngineRunnable(currentEngine) ? currentEngine.id : "";
  const provider = preferredFromOrder || currentProvider || firstEnabledEngineId(serviceEngines.map((engine) => engine.id), settings) || settings.provider;
  return {
    ...settings,
    provider,
    providerFallbackOrder: promoteOrder(provider, settings.providerFallbackOrder),
    videoSubtitleProvider: normalizeSubtitleProvider(settings.videoSubtitleProvider, serviceEngines, "default")
  };
}

function firstEnabledEngineId(order, settings) {
  const seen = new Set();
  for (const item of order || []) {
    const engine = core.resolveServiceEngine(item, settings);
    if (!engine || seen.has(engine.id)) continue;
    seen.add(engine.id);
    if (isEngineRunnable(engine)) return engine.id;
  }
  return "";
}

function promoteOrder(engineId, order) {
  const normalizedId = String(engineId || "").trim();
  if (!normalizedId) return order || [];
  return [normalizedId, ...(order || []).filter((item) => item !== normalizedId)];
}

function normalizeSubtitleProvider(value, serviceEngines, fallback = "default") {
  const selected = String(value || "").trim();
  if (selected === "default") return "default";
  const enabledEngine = (serviceEngines || []).find((engine) =>
    isEngineRunnable(engine) && (engine.id === selected || engine.provider === selected)
  );
  if (enabledEngine) return enabledEngine.id;
  return fallback === "default" ? "default" : normalizeSubtitleProvider(fallback, serviceEngines, "default");
}

function engineReadiness(engine) {
  if (!engine) return { ready: false, label: "未配置" };
  if (!engine.enabled) return { ready: false, label: "已停用" };
  if ((engine.type === "microsoft" || engine.provider === "microsoft") && !engine.apiKey) {
    return { ready: false, label: "需 API Key" };
  }
  if (
    (engine.type === "openai-compatible" || engine.type === "custom-json" || engine.provider === "custom") &&
    !engine.endpoint
  ) {
    return { ready: false, label: "未配置 Endpoint" };
  }
  return { ready: true, label: "可用" };
}

function isEngineRunnable(engine) {
  return engineReadiness(engine).ready;
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

function renderStylePresetGrid(settings) {
  if (!controls.stylePresetGrid) return;
  const activeTheme = settings.translationTheme || "muted";
  controls.stylePresetGrid.innerHTML = core.getTranslationThemeOptions()
    .map((option) => `
      <button class="style-preset-card ${option.id === activeTheme ? "is-active" : ""}" type="button" data-theme-choice="${escapeHtml(option.id)}">
        <span class="style-preset-sample" data-theme="${escapeHtml(option.id)}">长夜将至，我从今开始守望。</span>
        <strong>${escapeHtml(option.label)}</strong>
      </button>
    `)
    .join("");
}

function bindSiteRuleEditor() {
  if (!controls.siteRuleList) return;
  [
    controls.siteRuleId,
    controls.siteRuleName,
    controls.siteRuleMatches,
    controls.siteRuleIncludeSelectors,
    controls.siteRuleExcludeSelectors,
    controls.siteRuleStayOriginalSelectors,
    controls.siteRuleMinTextLength,
    controls.siteRuleDynamicMode
  ].forEach((control) => {
    control.addEventListener("input", () => {
      userRulesJsonDirty = false;
    }, true);
    control.addEventListener("change", () => {
      userRulesJsonDirty = false;
    }, true);
  });

  controls.siteRuleList.addEventListener("click", (event) => {
    const button = event.target && event.target.closest("[data-site-rule-index]");
    if (!button) return;
    try {
      commitActiveSiteRuleForm();
      persistFromForm();
      renderSiteRuleEditor(readSiteRulesForEditor(), Number(button.getAttribute("data-site-rule-index")));
    } catch (error) {
      setSiteRuleStatus(error.message, true);
    }
  });

  controls.addSiteRule.addEventListener("click", () => {
    try {
      const rules = readSiteRulesForEditor();
      rules.push(createEmptySiteRule(rules.length));
      setUserRulesJson(rules);
      renderSiteRuleEditor(rules, rules.length - 1);
      setSiteRuleStatus("已新增规则，请填写域名和包含选择器后保存。");
    } catch (error) {
      setSiteRuleStatus(error.message, true);
    }
  });

  controls.reloadSiteRules.addEventListener("click", () => {
    try {
      const rules = readSiteRulesForEditor();
      renderSiteRuleEditor(rules, activeSiteRuleIndex);
      setSiteRuleStatus(`已从 JSON 读取 ${rules.length} 条规则。`);
    } catch (error) {
      setSiteRuleStatus(error.message, true);
    }
  });

  controls.syncSiteRuleJson.addEventListener("click", () => {
    try {
      commitActiveSiteRuleForm();
      renderSiteRuleEditor(readSiteRulesForEditor(), activeSiteRuleIndex);
      persistFromForm(true);
    } catch (error) {
      setSiteRuleStatus(error.message, true);
    }
  });

  controls.deleteSiteRule.addEventListener("click", () => {
    try {
      const rules = readSiteRulesForEditor();
      if (activeSiteRuleIndex < 0 || activeSiteRuleIndex >= rules.length) return;
      rules.splice(activeSiteRuleIndex, 1);
      const nextIndex = Math.min(activeSiteRuleIndex, rules.length - 1);
      setUserRulesJson(rules);
      renderSiteRuleEditor(rules, nextIndex);
      persistFromForm(true);
    } catch (error) {
      setSiteRuleStatus(error.message, true);
    }
  });

  controls.userRules.addEventListener("change", () => {
    try {
      renderSiteRuleEditor(readSiteRulesForEditor(), activeSiteRuleIndex);
      userRulesJsonDirty = false;
    } catch (error) {
      setSiteRuleStatus(error.message, true);
    }
  });
  controls.userRules.addEventListener("input", () => {
    userRulesJsonDirty = true;
    setSiteRuleStatus("JSON 已修改，保存会以 JSON 内容为准；点击“从 JSON 刷新”更新上方表单。");
  });
}

function renderSiteRuleEditor(rules = [], preferredIndex = activeSiteRuleIndex) {
  if (!controls.siteRuleList) return;
  const safeRules = Array.isArray(rules) ? rules : [];
  const nextIndex = preferredIndex >= 0 && preferredIndex < safeRules.length
    ? preferredIndex
    : (safeRules.length ? 0 : -1);
  activeSiteRuleIndex = nextIndex;
  controls.siteRuleList.innerHTML = safeRules.length
    ? safeRules.map((rule, index) => renderSiteRuleButton(rule, index, index === nextIndex)).join("")
    : `<div class="site-rule-empty">还没有站点规则。点击“新增规则”开始配置。</div>`;

  if (nextIndex < 0) {
    setSiteRuleFormDisabled(true);
    controls.siteRuleEditorTitle.textContent = "未选择规则";
    fillSiteRuleForm({
      id: "",
      name: "",
      matches: [],
      includeSelectors: [],
      excludeSelectors: [],
      stayOriginalSelectors: [],
      minTextLength: 0,
      dynamicMode: "auto"
    });
    setSiteRuleStatus("站点规则会保存在 userRules 中，旧 JSON 字段会继续保留。");
    return;
  }

  setSiteRuleFormDisabled(false);
  const rule = normalizeRuleForEditor(safeRules[nextIndex]);
  controls.siteRuleEditorTitle.textContent = rule.name || rule.id || `规则 ${nextIndex + 1}`;
  fillSiteRuleForm(rule);
  setSiteRuleStatus(`正在编辑第 ${nextIndex + 1} 条规则，共 ${safeRules.length} 条。`);
}

function renderSiteRuleButton(rule, index, active) {
  const normalized = normalizeRuleForEditor(rule);
  const title = normalized.name || normalized.id || `规则 ${index + 1}`;
  const matchSummary = normalized.matches.length ? normalized.matches.join(" / ") : "未填写域名";
  const selectorCount = normalized.includeSelectors.length;
  const dynamicLabel = dynamicModeLabel(normalized.dynamicMode);
  return `
    <button class="site-rule-row ${active ? "is-active" : ""}" type="button" data-site-rule-index="${index}">
      <span>
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(matchSummary)}</small>
      </span>
      <i>${escapeHtml(selectorCount)} 个选择器 · ${escapeHtml(dynamicLabel)}</i>
    </button>
  `;
}

function fillSiteRuleForm(rule) {
  controls.siteRuleId.value = rule.id || "";
  controls.siteRuleName.value = rule.name || "";
  controls.siteRuleMatches.value = rule.matches.join("\n");
  controls.siteRuleIncludeSelectors.value = rule.includeSelectors.join("\n");
  controls.siteRuleExcludeSelectors.value = rule.excludeSelectors.join("\n");
  controls.siteRuleStayOriginalSelectors.value = rule.stayOriginalSelectors.join("\n");
  controls.siteRuleMinTextLength.value = rule.minTextLength || "";
  controls.siteRuleDynamicMode.value = rule.dynamicMode || "auto";
}

function setSiteRuleFormDisabled(disabled) {
  [
    controls.siteRuleId,
    controls.siteRuleName,
    controls.siteRuleMatches,
    controls.siteRuleIncludeSelectors,
    controls.siteRuleExcludeSelectors,
    controls.siteRuleStayOriginalSelectors,
    controls.siteRuleMinTextLength,
    controls.siteRuleDynamicMode,
    controls.syncSiteRuleJson,
    controls.deleteSiteRule
  ].forEach((control) => {
    if (control) control.disabled = disabled;
  });
}

function commitActiveSiteRuleForm() {
  if (!controls.siteRuleList || activeSiteRuleIndex < 0) return;
  if (userRulesJsonDirty) return;
  const rules = readSiteRulesForEditor();
  if (activeSiteRuleIndex >= rules.length) return;
  const previous = rules[activeSiteRuleIndex] || {};
  const includeSelectors = parseLines(controls.siteRuleIncludeSelectors.value);
  const minTextLength = Math.min(500, Math.max(0, Math.round(Number(controls.siteRuleMinTextLength.value) || 0)));
  rules[activeSiteRuleIndex] = {
    ...previous,
    id: controls.siteRuleId.value.trim() || previous.id || `custom-${activeSiteRuleIndex + 1}`,
    name: controls.siteRuleName.value.trim(),
    matches: parseLines(controls.siteRuleMatches.value),
    includeSelectors,
    selectors: includeSelectors.slice(),
    excludeSelectors: parseLines(controls.siteRuleExcludeSelectors.value),
    stayOriginalSelectors: parseLines(controls.siteRuleStayOriginalSelectors.value),
    minTextLength,
    dynamicMode: ["auto", "off", "eager"].includes(controls.siteRuleDynamicMode.value)
      ? controls.siteRuleDynamicMode.value
      : "auto"
  };
  setUserRulesJson(rules);
}

function readSiteRulesForEditor() {
  const raw = controls.userRules.value.trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("站点规则 JSON 必须是数组");
  return parsed;
}

function setUserRulesJson(rules) {
  controls.userRules.value = JSON.stringify(rules, null, 2);
  userRulesJsonDirty = false;
}

function normalizeRuleForEditor(rule) {
  const source = rule && typeof rule === "object" ? rule : {};
  const includeSelectors = siteRuleListValue(
    source.includeSelectors && siteRuleListValue(source.includeSelectors).length
      ? source.includeSelectors
      : source.selectors
  );
  return {
    ...source,
    id: String(source.id || "").trim(),
    name: String(source.name || "").trim(),
    matches: siteRuleListValue(source.matches),
    includeSelectors,
    excludeSelectors: siteRuleListValue(source.excludeSelectors),
    stayOriginalSelectors: siteRuleListValue(source.stayOriginalSelectors),
    minTextLength: Math.min(500, Math.max(0, Math.round(Number(source.minTextLength) || 0))),
    dynamicMode: ["auto", "off", "eager"].includes(source.dynamicMode) ? source.dynamicMode : "auto"
  };
}

function siteRuleListValue(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : parseLines(value);
}

function createEmptySiteRule(index) {
  return {
    id: `custom-${index + 1}`,
    name: "新站点规则",
    matches: [],
    includeSelectors: ["article", "main", "p"],
    selectors: ["article", "main", "p"],
    excludeSelectors: ["nav", "header", "footer", "button"],
    stayOriginalSelectors: ["pre", "code"],
    minTextLength: 8,
    dynamicMode: "auto"
  };
}

function dynamicModeLabel(value) {
  if (value === "eager") return "积极适配";
  if (value === "off") return "关闭动态";
  return "自动动态";
}

function setSiteRuleStatus(message, isError) {
  if (!controls.siteRuleJsonStatus) return;
  controls.siteRuleJsonStatus.textContent = message || "";
  controls.siteRuleJsonStatus.classList.toggle("is-error", Boolean(isError));
}

function renderEngineList(settings = currentSettings) {
  if (!controls.engineList) return;
  syncProviderOptions(settings);
  const activeId = activeEngineId || settings.provider || "google";
  const groups = [
    { id: "free", title: "通用可用服务" },
    { id: "custom", title: "自定义服务" }
  ];
  controls.engineList.innerHTML = groups
    .map((group) => {
      const engines = (settings.serviceEngines || []).filter((engine) => engine.group === group.id);
      if (!engines.length) return "";
      return `
        <div class="engine-group">
          <div class="engine-group-title">${escapeHtml(group.title)}</div>
          ${engines.map((engine) => renderEngineButton(engine, activeId, settings)).join("")}
        </div>
      `;
    })
    .join("");
}

function renderEngineButton(engine, activeId, settings) {
  const readiness = engineReadiness(engine);
  const isDefault = readiness.ready && (settings.provider === engine.id || (settings.provider === engine.provider && engine.id === engine.provider));
  const state = readiness.label;
  return `
    <button class="engine-row ${engine.id === activeId ? "is-active" : ""} ${readiness.ready ? "" : "is-disabled"}" type="button" data-engine-id="${escapeHtml(engine.id)}">
      <span class="engine-icon">${escapeHtml(engineIcon(engine))}</span>
      <span>
        <strong>${escapeHtml(engine.name)}</strong>
        <small>${escapeHtml(engine.id)} · ${escapeHtml(state)}${isDefault ? " · 当前默认" : ""}</small>
      </span>
      <i aria-hidden="true"></i>
    </button>
  `;
}

function engineIcon(engine) {
  if (engine.provider === "google") return "G";
  if (engine.provider === "microsoft") return "M";
  if (engine.provider === "demo") return "D";
  return "AI";
}

function syncProviderOptions(settings) {
  if (!controls.provider) return;
  controls.provider.textContent = "";
  const enabledEngines = (settings.serviceEngines || []).filter((engine) => isEngineRunnable(engine));
  enabledEngines.forEach((engine) => {
    const option = document.createElement("option");
    option.value = engine.id;
    option.textContent = engine.name;
    controls.provider.appendChild(option);
  });
  if (!enabledEngines.length) {
    const option = document.createElement("option");
    option.value = settings.provider || "google";
    option.textContent = "无可用翻译服务";
    option.disabled = true;
    controls.provider.appendChild(option);
  }
  controls.provider.value = settings.provider;
}

function renderSubtitleProviderOptions(settings = currentSettings) {
  if (!controls.videoSubtitleProvider) return;
  const selected = normalizeSubtitleProvider(controls.videoSubtitleProvider.value || settings.videoSubtitleProvider, settings.serviceEngines || []);
  controls.videoSubtitleProvider.textContent = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "default";
  defaultOption.textContent = "跟随网页翻译";
  controls.videoSubtitleProvider.appendChild(defaultOption);
  (settings.serviceEngines || []).filter((engine) => isEngineRunnable(engine)).forEach((engine) => {
    const option = document.createElement("option");
    option.value = engine.id;
    option.textContent = engine.name;
    controls.videoSubtitleProvider.appendChild(option);
  });
  controls.videoSubtitleProvider.value = normalizeSubtitleProvider(selected, settings.serviceEngines || []);
}

function selectEngine(engineId) {
  const engine = core.resolveServiceEngine(engineId, currentSettings) || core.resolveServiceEngine("google", currentSettings);
  if (!engine) return;
  activeEngineId = engine.id;
  const readiness = engineReadiness(engine);
  controls.engineTitle.textContent = engine.name;
  controls.engineMeta.textContent = readiness.ready && currentSettings.provider === engine.id
    ? "当前首选"
    : readiness.ready
      ? (engine.group === "custom" ? "自定义服务" : "通用服务")
      : readiness.label;
  controls.engineDescription.textContent = engine.description || "可在翻译备份流程中使用。";
  controls.setDefaultEngine.disabled = !readiness.ready;
  controls.engineEnabled.checked = engine.enabled;
  controls.engineName.value = engine.name;
  controls.engineType.value = engine.type;
  controls.engineStrategy.value = engine.strategy || "general";
  controls.engineEndpoint.value = engine.endpoint || "";
  controls.engineApiKey.value = engine.apiKey || "";
  controls.engineModel.value = engine.model || "";
  controls.engineAiContext.checked = Boolean(engine.aiContext);
  controls.engineRichText.checked = engine.richText !== false;
  controls.engineSystemPrompt.value = engine.systemPrompt || "";
  controls.engineMultiPrompt.value = engine.multiParagraphPrompt || "";
  controls.engineSinglePrompt.value = engine.singleParagraphPrompt || "";
  controls.engineMaxRequestsPerMinute.value = engine.maxRequestsPerMinute;
  controls.engineMaxTextLength.value = engine.maxTextLength;
  controls.engineMaxSegments.value = engine.maxSegments;
  controls.engineTemperature.value = engine.temperature;
  if (engine.id === "custom") {
    controls.customEndpoint.value = engine.endpoint || "";
    controls.customApiKey.value = engine.apiKey || "";
    controls.customModel.value = engine.model || "";
  }
  updateProviderFields(engine.id);
  renderEngineList(currentSettings);
}

function commitActiveEngineForm() {
  if (!controls.engineName || !currentSettings.serviceEngines) return;
  const index = currentSettings.serviceEngines.findIndex((engine) => engine.id === activeEngineId);
  if (index < 0) return;
  const previous = currentSettings.serviceEngines[index];
  const next = {
    ...previous,
    enabled: controls.engineEnabled.checked,
    name: controls.engineName.value,
    type: controls.engineType.value,
    provider: providerForEngineType(controls.engineType.value, previous.provider),
    group: controls.engineType.value === "google" || controls.engineType.value === "microsoft" || controls.engineType.value === "demo" ? "free" : "custom",
    strategy: controls.engineStrategy.value,
    endpoint: controls.engineEndpoint.value,
    apiKey: controls.engineApiKey.value,
    model: controls.engineModel.value,
    aiContext: controls.engineAiContext.checked,
    richText: controls.engineRichText.checked,
    systemPrompt: controls.engineSystemPrompt.value,
    multiParagraphPrompt: controls.engineMultiPrompt.value,
    singleParagraphPrompt: controls.engineSinglePrompt.value,
    maxRequestsPerMinute: controls.engineMaxRequestsPerMinute.value,
    maxTextLength: controls.engineMaxTextLength.value,
    maxSegments: controls.engineMaxSegments.value,
    temperature: controls.engineTemperature.value
  };
  const engines = currentSettings.serviceEngines.slice();
  engines[index] = next;
  if (next.id === "custom") {
    currentSettings.customEndpoint = next.endpoint;
    currentSettings.customApiKey = next.apiKey;
    currentSettings.customModel = next.model;
  }
  currentSettings.serviceEngines = core.normalizeServiceEngines(engines, currentSettings);
}

function providerForEngineType(type, fallback) {
  if (type === "google") return "google";
  if (type === "microsoft") return "microsoft";
  if (type === "demo") return "demo";
  return fallback === "custom" ? "custom" : "custom";
}

function addCustomEngine() {
  commitActiveEngineForm();
  const usedIds = new Set((currentSettings.serviceEngines || []).map((engine) => engine.id));
  let index = 1;
  let id = "custom-1";
  while (usedIds.has(id)) {
    index += 1;
    id = `custom-${index}`;
  }
  const engine = {
    id,
    provider: "custom",
    type: "openai-compatible",
    group: "custom",
    name: `自定义服务 ${index}`,
    description: "兼容 OpenAI Chat Completions 的自定义翻译服务。",
    enabled: true,
    endpoint: "",
    apiKey: "",
    model: "gpt-4o-mini",
    strategy: "general",
    aiContext: false,
    richText: true,
    systemPrompt: "You are a professional {{to}} native translator. {{glossary}}",
    multiParagraphPrompt: "Translate to {{to}}:\n\n{{text}}",
    singleParagraphPrompt: "Translate to {{to}} (output translation only):\n\n{{text}}",
    maxRequestsPerMinute: 5,
    maxTextLength: 1200,
    maxSegments: 4,
    temperature: 0.1
  };
  currentSettings.serviceEngines = core.normalizeServiceEngines([
    ...(currentSettings.serviceEngines || []),
    engine
  ], currentSettings);
  const order = parseLines(controls.providerFallbackOrder.value);
  if (!order.includes(id)) controls.providerFallbackOrder.value = [...order, id].join("\n");
  selectEngine(id);
  persistFromForm(true);
}

function promoteEngineInOrder(engineId) {
  controls.providerFallbackOrder.value = promoteOrder(engineId, parseLines(controls.providerFallbackOrder.value)).join("\n");
}

function syncPreferredProviderFromFallbackOrder() {
  const settings = normalizeOptionSettings({
    ...currentSettings,
    providerFallbackOrder: parseLines(controls.providerFallbackOrder.value)
  });
  const preferred = firstEnabledEngineId(settings.providerFallbackOrder, settings);
  if (preferred) {
    selectEngine(preferred);
    controls.provider.value = preferred;
  }
}

function reflectServiceControls(settings) {
  syncProviderOptions(settings);
  controls.provider.value = settings.provider;
  controls.providerFallbackOrder.value = settings.providerFallbackOrder.join("\n");
  renderSubtitleProviderOptions(settings);
  controls.videoSubtitleProvider.value = settings.videoSubtitleProvider;
}

function updateFallbackOrderFeedback(settings = currentSettings) {
  if (!controls.fallbackOrderStatus) return;
  const draftOrder = parseLines(controls.providerFallbackOrder.value);
  const known = [];
  const disabled = [];
  const unknown = [];
  const duplicate = [];
  const seen = new Set();
  draftOrder.forEach((item) => {
    const engine = core.resolveServiceEngine(item, settings);
    if (!engine) {
      unknown.push(item);
      return;
    }
    if (seen.has(engine.id)) {
      duplicate.push(item);
      return;
    }
    seen.add(engine.id);
    if (isEngineRunnable(engine)) known.push(engine);
    else disabled.push({ engine, reason: engineReadiness(engine).label });
  });
  const effective = known.map((engine) => engine.name).join(" → ");
  const lines = [
    effective ? `实际尝试顺序：${effective}` : "没有可用服务，请至少启用一个翻译服务。",
    disabled.length ? `不可用会跳过：${disabled.map((item) => `${item.engine.id}（${item.reason}）`).join(", ")}` : "",
    unknown.length ? `未知 ID 已忽略：${unknown.join(", ")}` : "",
    duplicate.length ? `重复项已忽略：${duplicate.join(", ")}` : ""
  ].filter(Boolean);
  controls.fallbackOrderStatus.textContent = lines.join("\n");
}

function serviceLabel(provider, settings = currentSettings) {
  const engine = core.resolveServiceEngine(provider, settings);
  if (!engine) return provider || "未知服务";
  return `${engine.name} (${engine.id})`;
}

async function compareEngines() {
  const settings = await persistFromForm();
  if (!settings || !hasRuntimeMessaging()) {
    controls.serviceStatus.textContent = "当前环境无法调用扩展后台对比服务";
    return;
  }
  const engines = settings.serviceEngines.filter((engine) => isEngineRunnable(engine)).slice(0, 5);
  controls.serviceStatus.textContent = "对比中...";
  const lines = [];
  for (const engine of engines) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "TRANSLY_TRANSLATE",
        text: "Hello, this is an all-in-one translation engine comparison.",
        url: "https://example.com/translator-compare",
        settings: runtimeSettings({
          ...settings,
          provider: engine.id,
          providerFallbackOrder: [engine.id],
          fallbackToDemo: engine.provider === "demo"
        })
      });
      if (!response || response.ok === false) throw new Error((response && response.error) || "失败");
      lines.push(`${engine.name}: ${core.normalizeText(response.text).slice(0, 48)}`);
    } catch (error) {
      lines.push(`${engine.name}: ${core.sanitizeErrorMessage(error.message || String(error), [engine.apiKey])}`);
    }
  }
  controls.serviceStatus.textContent = lines.join("\n");
}

function collectEngineSecrets(settings) {
  const output = {};
  (settings.serviceEngines || []).forEach((engine) => {
    if (engine.apiKey) output[engine.id] = engine.apiKey;
  });
  return output;
}

function mergeEngineSecrets(serviceEngines, secrets) {
  const secretMap = secrets && typeof secrets === "object" ? secrets : {};
  return core.normalizeServiceEngines(serviceEngines || []).map((engine) => ({
    ...engine,
    apiKey: engine.apiKey || secretMap[engine.id] || ""
  }));
}

function stripEngineSecrets(settings) {
  return {
    ...settings,
    serviceEngines: (settings.serviceEngines || []).map((engine) => ({ ...engine, apiKey: "" }))
  };
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
  return { ...stripEngineSecrets(settings), customApiKey: "", customGlossaryTerms: [] };
}

function runtimeSettings(settings) {
  return { ...settings, customGlossaryTerms: settings.customGlossaryTerms };
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
    storageRemove("local", GLOSSARY_KEY),
    storageRemove("local", ENGINE_SECRET_KEY)
  ]);
  applySettings(currentSettings);
  setStatus("已重置为默认设置");
}

async function testService() {
  const settings = await persistFromForm();
  if (!settings) return;
  const engine = core.resolveServiceEngine(activeEngineId || settings.provider, settings);
  if (!engine) {
    controls.serviceStatus.textContent = "测试失败：该服务当前不可用，当前版本尚不能测试";
    return;
  }
  if (!engine.enabled) {
    controls.serviceStatus.textContent = `测试失败：${engine.name} (${engine.id}) 已停用，请先启用后再测试。`;
    return;
  }
  if (!hasRuntimeMessaging()) {
    controls.serviceStatus.textContent = "当前是静态预览环境，无法调用扩展后台测试";
    return;
  }

  controls.serviceStatus.textContent = "测试中...";
  try {
    const runtimeOrder = promoteOrder(engine.id, settings.providerFallbackOrder);
    const response = await chrome.runtime.sendMessage({
      type: "TRANSLY_TRANSLATE",
      text: "Hello, this is an all-in-one translation service test.",
      url: "https://example.com/translator-service-test",
      settings: runtimeSettings({
        ...settings,
        provider: engine.id,
        providerFallbackOrder: runtimeOrder,
        fallbackToDemo: engine.provider === "demo" || settings.fallbackToDemo
      })
    });
    if (!response || response.ok === false) {
      controls.serviceStatus.textContent = formatServiceTestResult(response || {}, engine, settings, false);
      return;
    }
    controls.serviceStatus.textContent = formatServiceTestResult(response, engine, settings, true);
  } catch (error) {
    controls.serviceStatus.textContent = [
      `测试失败：${serviceLabel(engine.id, settings)}`,
      `原因：${core.sanitizeErrorMessage(error.message || String(error), [settings.customApiKey, engine.apiKey])}`
    ].join("\n");
  }
}

function formatServiceTestResult(response, requestedEngine, settings, ok) {
  const provider = response.provider || "未知服务";
  const translation = core.normalizeText(response.text || "").slice(0, 120);
  const attempts = Array.isArray(response.attempts)
    ? response.attempts.map((attempt) => {
        const status = attempt.status || (attempt.ok === false ? "failed" : "ok");
        const error = attempt.error ? `(${core.sanitizeErrorMessage(attempt.error, [requestedEngine.apiKey, settings.customApiKey])})` : "";
        return `${attempt.provider}:${status}${error}`;
      }).join(" → ")
    : "";
  return [
    ok ? "测试成功" : "测试失败",
    `测试目标：${serviceLabel(requestedEngine.id, settings)}`,
    `实际服务：${serviceLabel(provider, settings)}`,
    attempts ? `链路：${attempts}` : "",
    !ok && response.error ? `原因：${core.sanitizeErrorMessage(response.error, [settings.customApiKey, requestedEngine.apiKey])}` : "",
    response.warning ? `警告：${core.sanitizeErrorMessage(response.warning, [settings.customApiKey, requestedEngine.apiKey])}` : "",
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
    currentSettings = reconcileServiceSettings(normalizeOptionSettings({
      ...imported,
      customApiKey: currentSettings.customApiKey
    }));
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
  controls.stylePreview.style.setProperty("--preview-translation-color", readColorControl(controls.translationTextColor) || "");
  controls.stylePreview.style.setProperty("--preview-translation-bg", readColorControl(controls.translationBackgroundColor) || "");
  controls.stylePreview.style.setProperty(
    "--preview-translation-scale",
    String(Math.max(70, Math.min(160, Number(controls.translationFontScale.value || 100))) / 100)
  );
  controls.stylePreview.style.setProperty(
    "--preview-translation-max-width",
    controls.translationMaxWidth.value ? `${controls.translationMaxWidth.value}px` : "100%"
  );
  controls.stylePreview.style.setProperty(
    "--preview-translation-font-family",
    previewFontStack(controls.translationFontFamily.value)
  );
  if (controls.stylePresetGrid) {
    controls.stylePresetGrid.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.classList.toggle("is-active", button.getAttribute("data-theme-choice") === controls.translationTheme.value);
    });
  }
  updateSubtitlePreview();
}

function updateSubtitlePreview() {
  if (!controls.subtitlePreview) return;
  const line = controls.subtitlePreview.querySelector(".subtitle-preview-lines em");
  if (!line) return;
  const scale = Math.max(70, Math.min(220, Number(controls.videoSubtitleFontScale.value || 110))) / 100;
  const color = readColorControl(controls.videoSubtitleTextColor) || "#ffd2e5";
  const background = readColorControl(controls.videoSubtitleBackgroundColor) || "";
  controls.subtitlePreview.style.setProperty("--subtitle-preview-scale", String(scale));
  controls.subtitlePreview.style.setProperty("--subtitle-preview-color", color);
  controls.subtitlePreview.style.setProperty("--subtitle-preview-background", background || "transparent");
  line.classList.toggle("has-background", Boolean(background));
  line.classList.toggle("has-shadow", controls.videoSubtitleTextShadow.checked);
}

function setColorControl(control, value) {
  if (!control) return;
  const color = normalizePaletteColorValue(value);
  if (color) {
    control.value = color;
    control.dataset.colorEmpty = "false";
  } else {
    control.value = normalizePaletteColorValue(control.dataset.defaultColor) || "#000000";
    control.dataset.colorEmpty = "true";
  }
  updateColorControl(control);
}

function readColorControl(control) {
  if (!control || control.dataset.colorEmpty === "true") return "";
  return normalizePaletteColorValue(control.value);
}

function updateColorControl(control) {
  const output = document.querySelector(`#${control.id}Label`);
  if (!output) return;
  const empty = control.dataset.colorEmpty === "true";
  output.textContent = empty ? control.dataset.emptyLabel || "默认" : normalizePaletteColorValue(control.value);
  output.style.borderColor = empty ? "" : normalizePaletteColorValue(control.value);
}

function normalizePaletteColorValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const short = normalized.match(/^#([0-9a-f]{3})$/i);
  if (short) {
    return `#${short[1].split("").map((char) => `${char}${char}`).join("")}`;
  }
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : "";
}

function previewFontStack(family) {
  if (family === "serif") return 'Georgia, "Times New Roman", serif';
  if (family === "sans") return 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  if (family === "mono") return 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
  if (family === "rounded") return 'ui-rounded, "SF Pro Rounded", "Nunito Sans", system-ui, sans-serif';
  if (family === "system") return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  return "";
}

function updateServiceTiles(provider) {
  document.querySelectorAll("[data-provider-choice]").forEach((button) => {
    button.classList.toggle("is-selected", button.getAttribute("data-provider-choice") === provider);
  });
  renderEngineList(currentSettings);
}

function updateProviderFields(provider) {
  const engine = core.resolveServiceEngine(provider, currentSettings);
  const isCustom = Boolean(engine && (engine.type === "openai-compatible" || engine.type === "custom-json" || engine.provider === "custom"));
  const isMicrosoft = Boolean(engine && (engine.type === "microsoft" || engine.provider === "microsoft"));
  const customPanel = document.querySelector("#customProviderSettings");
  if (customPanel) customPanel.hidden = !(isCustom || isMicrosoft);
  [
    controls.customEndpoint,
    controls.customModel,
    controls.engineEndpoint,
    controls.engineModel,
    controls.engineAiContext,
    controls.engineRichText,
    controls.engineSystemPrompt,
    controls.engineMultiPrompt,
    controls.engineSinglePrompt,
    controls.engineMaxRequestsPerMinute,
    controls.engineMaxTextLength,
    controls.engineMaxSegments,
    controls.engineTemperature
  ].forEach((control) => {
    if (control) control.disabled = !isCustom;
  });
  [controls.customApiKey, controls.engineApiKey].forEach((control) => {
    if (control) control.disabled = !(isCustom || isMicrosoft);
  });
  if (controls.engineType) controls.engineType.disabled = Boolean(engine && engine.locked);
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
