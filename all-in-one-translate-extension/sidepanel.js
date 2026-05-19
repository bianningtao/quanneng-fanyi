const core = window.TranslyCore;
const SETTINGS_KEY = "translySettings";
const SECRET_KEY = "translyCustomApiKey";
const GLOSSARY_KEY = "translyCustomGlossaryTerms";
const UI_LANGUAGE = "zh-CN";
const MAX_DOCUMENT_FILE_BYTES = 1024 * 1024;
const MAX_DOCUMENT_SEGMENTS = 240;

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
  fileDropZone: document.querySelector("#fileDropZone"),
  documentFileInput: document.querySelector("#documentFileInput"),
  fileMeta: document.querySelector("#fileMeta"),
  fileSourcePreview: document.querySelector("#fileSourcePreview"),
  fileTranslationPreview: document.querySelector("#fileTranslationPreview"),
  translateFile: document.querySelector("#translateFile"),
  capturePageSubtitles: document.querySelector("#capturePageSubtitles"),
  downloadSourceFileTranslation: document.querySelector("#downloadSourceFileTranslation"),
  downloadFileTranslation: document.querySelector("#downloadFileTranslation"),
  downloadBilingualFileTranslation: document.querySelector("#downloadBilingualFileTranslation"),
  clearFileTranslation: document.querySelector("#clearFileTranslation"),
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
let selectedDocument = null;
let translatedDocument = null;

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
  controls.documentFileInput.addEventListener("change", () => {
    const [file] = Array.from(controls.documentFileInput.files || []);
    if (file) handleDocumentFile(file);
  });
  controls.fileDropZone.addEventListener("dragover", handleFileDragOver);
  controls.fileDropZone.addEventListener("dragleave", handleFileDragLeave);
  controls.fileDropZone.addEventListener("drop", handleFileDrop);
  controls.capturePageSubtitles.addEventListener("click", capturePageSubtitles);
  controls.translateFile.addEventListener("click", translateSelectedDocument);
  controls.downloadSourceFileTranslation.addEventListener("click", () => downloadTranslatedDocument("source"));
  controls.downloadFileTranslation.addEventListener("click", () => downloadTranslatedDocument("translated"));
  controls.downloadBilingualFileTranslation.addEventListener("click", () => downloadTranslatedDocument("bilingual"));
  controls.clearFileTranslation.addEventListener("click", clearSelectedDocument);
  controls.openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());
  controls.provider.addEventListener("change", () => updateProviderFields(controls.provider.value));
}

async function loadSettings() {
  const [stored, secret, customGlossaryTerms] = await Promise.all([
    chrome.storage.sync.get([SETTINGS_KEY]),
    chrome.storage.local.get([SECRET_KEY]),
    chrome.storage.local.get([GLOSSARY_KEY])
  ]);
  const syncSettings = stored[SETTINGS_KEY] || {};
  return core.normalizeSettings({
    ...syncSettings,
    customApiKey: secret[SECRET_KEY] || "",
    customGlossaryTerms:
      customGlossaryTerms[GLOSSARY_KEY] ||
      syncSettings.customGlossaryTerms ||
      []
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
  notifyActiveTab("TRANSLY_SETTINGS_CHANGED", { settings: runtimeSettings(settings) });
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
  return { ...settings, customApiKey: "", customGlossaryTerms: [] };
}

function runtimeSettings(settings) {
  return { ...publicSettings(settings), customGlossaryTerms: settings.customGlossaryTerms };
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

function handleFileDragOver(event) {
  event.preventDefault();
  controls.fileDropZone.classList.add("is-dragging");
}

function handleFileDragLeave() {
  controls.fileDropZone.classList.remove("is-dragging");
}

function handleFileDrop(event) {
  event.preventDefault();
  controls.fileDropZone.classList.remove("is-dragging");
  const [file] = Array.from((event.dataTransfer && event.dataTransfer.files) || []);
  if (file) handleDocumentFile(file);
}

async function handleDocumentFile(file) {
  try {
    if (file.size > MAX_DOCUMENT_FILE_BYTES) {
      throw new Error("文件超过 1MB，请先拆分后再翻译");
    }
    const rawText = await readFileAsText(file);
    selectedDocument = parseDocumentForTranslation(file.name, rawText);
    if (selectedDocument.segments.length > MAX_DOCUMENT_SEGMENTS) {
      throw new Error(`文件分段过多（${selectedDocument.segments.length} 段），请拆分到 ${MAX_DOCUMENT_SEGMENTS} 段以内`);
    }
    translatedDocument = null;
    controls.fileSourcePreview.value = buildSourcePreview(selectedDocument);
    controls.fileTranslationPreview.value = "";
    resetFileDownloadControls();
    updateFileDownloadControls();
    controls.fileMeta.innerHTML = buildFileMeta(selectedDocument);
    setStatus("文件已读取");
  } catch (error) {
    selectedDocument = null;
    translatedDocument = null;
    controls.fileMeta.textContent = error.message || String(error);
    controls.fileSourcePreview.value = "";
    controls.fileTranslationPreview.value = "";
    resetFileDownloadControls();
    setStatus("文件读取失败");
  }
}

async function capturePageSubtitles() {
  controls.capturePageSubtitles.disabled = true;
  setStatus("正在抓取当前页面字幕...");
  try {
    await refreshPageInfo();
    if (!activeTab || !activeTab.id) throw new Error("未找到当前标签页");
    const response = await chrome.tabs.sendMessage(activeTab.id, {
      type: "TRANSLY_CAPTURE_PLAYER_SUBTITLES"
    });
    if (!response || response.ok === false) {
      throw new Error((response && response.error) || "未识别到可下载字幕");
    }
    const capturedDocument = loadCapturedSubtitleDocument(response);
    if (capturedDocument.segments.length > MAX_DOCUMENT_SEGMENTS) {
      throw new Error(`字幕分段过多（${capturedDocument.segments.length} 段），请换用更短的视频片段`);
    }
    selectedDocument = capturedDocument;
    translatedDocument = null;
    controls.documentFileInput.value = "";
    controls.fileSourcePreview.value = buildSourcePreview(selectedDocument);
    controls.fileTranslationPreview.value = "";
    resetFileDownloadControls();
    updateFileDownloadControls();
    controls.fileMeta.innerHTML = buildFileMeta(selectedDocument);
    setStatus(`已抓取字幕：${selectedDocument.segments.length} 条`);
  } catch (error) {
    setStatus(error.message || "字幕抓取失败");
  } finally {
    controls.capturePageSubtitles.disabled = false;
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error || new Error("文件读取失败")));
    reader.readAsText(file, "utf-8");
  });
}

async function translateSelectedDocument() {
  if (!selectedDocument) {
    setStatus("请先选择 .txt/.md/.srt/.vtt 文件");
    return;
  }
  const settings = (await persistSettings()) || currentSettings;
  const sourceSegments = selectedDocument.segments.filter((segment) =>
    core.shouldTranslateTextBlock(segment.text, settings, {
      targetLanguage: settings.targetLanguage
    })
  );
  if (!sourceSegments.length) {
    translatedDocument = null;
    resetFileDownloadControls();
    controls.fileTranslationPreview.value = "文件中没有可翻译文本";
    setStatus("文件中没有可翻译文本");
    return;
  }

  controls.translateFile.disabled = true;
  resetFileDownloadControls();
  controls.fileTranslationPreview.value = "翻译中...";
  try {
    const translations = await translateDocumentSegments(sourceSegments, settings, (done, total) => {
      setStatus(`文件翻译中 ${done}/${total}`);
    });
    translatedDocument = buildTranslatedDocument(selectedDocument, translations);
    controls.fileTranslationPreview.value = translatedDocument.preview;
    updateFileDownloadControls();
    setStatus(translations.warning || `文件翻译完成：${translations.length} 段`);
  } catch (error) {
    translatedDocument = null;
    resetFileDownloadControls();
    controls.fileTranslationPreview.value = error.message || String(error);
    setStatus("文件翻译失败");
  } finally {
    controls.translateFile.disabled = false;
  }
}

async function translateDocumentSegments(segments, settings, onProgress) {
  const translations = [];
  const failures = [];
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    try {
      const response = await chrome.runtime.sendMessage({
        type: "TRANSLY_TRANSLATE",
        text: segment.text,
        settings: publicSettings(settings)
      });
      if (!response || response.ok === false) {
        throw new Error((response && response.error) || "翻译失败");
      }
      translations.push({ id: segment.id, text: response.text || "" });
    } catch (error) {
      failures.push({ id: segment.id, error: error.message || String(error) });
    }
    if (onProgress) onProgress(index + 1, segments.length);
  }
  if (failures.length && failures.length >= segments.length) {
    throw new Error(`所有分段翻译失败：${failures[0].error}`);
  }
  if (failures.length) {
    translations.warning = `${failures.length} 段翻译失败，已保留原文`;
  }
  return translations;
}

function downloadTranslatedDocument(kind = "translated") {
  if (kind === "source") {
    const sourceOutput = buildSourceDocumentOutput(selectedDocument);
    if (!hasDownloadableContent(sourceOutput)) {
      setStatus("没有可下载原文");
      return;
    }
    downloadDocumentOutput(sourceOutput);
    return;
  }
  if (!translatedDocument) {
    setStatus("请先翻译文件");
    return;
  }
  const output = getDocumentDownloadOutput(kind);
  if (!hasDownloadableContent(output)) {
    setStatus("没有可下载内容");
    return;
  }
  downloadDocumentOutput(output);
}

function downloadDocumentOutput(output) {
  const blob = new Blob([output.content], { type: output.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = output.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  setStatus(`已下载：${output.filename}`);
}

function clearSelectedDocument() {
  selectedDocument = null;
  translatedDocument = null;
  controls.documentFileInput.value = "";
  controls.fileMeta.textContent = "尚未选择文件";
  controls.fileSourcePreview.value = "";
  controls.fileTranslationPreview.value = "";
  resetFileDownloadControls();
  setStatus("已清空文件");
}

function parseDocumentForTranslation(filename, rawText) {
  const extension = getFileExtension(filename);
  const text = stripUtf8Bom(String(rawText || ""));
  if (!["txt", "md", "srt", "vtt"].includes(extension)) {
    throw new Error("仅支持 .txt、.md、.srt、.vtt 文件");
  }
  if (!text.trim()) {
    throw new Error("文件内容为空");
  }
  if (extension === "srt" || extension === "vtt") {
    const cues = extension === "srt" ? parseSrt(text) : parseVtt(text);
    if (!cues.length) throw new Error("未识别到字幕时间轴");
    return {
      filename,
      extension,
      kind: "subtitle",
      format: extension,
      rawText: text,
      cues,
      segments: cues.map((cue, index) => ({ id: cue.id || String(index + 1), text: cue.text }))
    };
  }
  return {
    filename,
    extension,
    kind: "text",
    rawText: text,
    segments: segmentPlainText(text).map((segment, index) => ({ id: String(index + 1), text: segment }))
  };
}

function loadCapturedSubtitleDocument(capture) {
  const filename = String(capture && capture.filename ? capture.filename : "page-captions.vtt");
  const content = capture && capture.content
    ? String(capture.content)
    : core.buildWebVttFromSubtitleCues(capture && capture.cues);
  const documentData = parseDocumentForTranslation(filename, content);
  documentData.sourceLabel = String((capture && capture.sourceLabel) || "当前网页播放器字幕");
  documentData.pageUrl = String((capture && capture.url) || "");
  documentData.capturedAt = new Date().toISOString();
  return documentData;
}

function parseSrt(text) {
  return splitSubtitleBlocks(text).map((block, index) => {
    const lines = block.split(/\r?\n/);
    const identifier = /^\d+$/.test(lines[0] || "") ? lines.shift() : String(index + 1);
    const timingLineIndex = lines.findIndex((line) => /-->/u.test(line));
    if (timingLineIndex < 0) return null;
    const timing = lines[timingLineIndex].trim();
    const textLines = lines.slice(timingLineIndex + 1).filter((line) => line.trim());
    if (!textLines.length) return null;
    return {
      id: identifier,
      start: timing.split(/-->/u)[0].trim(),
      end: timing.split(/-->/u).slice(1).join("-->").trim(),
      timing,
      text: textLines.join("\n")
    };
  }).filter(Boolean);
}

function parseVtt(text) {
  return splitSubtitleBlocks(text)
    .filter((block) => !/^WEBVTT(?:\s|$)/iu.test(block.trim()))
    .map((block, index) => {
      const lines = block.split(/\r?\n/).filter((line) => !/^(NOTE|STYLE|REGION)(?:\s|$)/u.test(line.trim()));
      if (!lines.length) return null;
      let identifier = "";
      let timingLine = lines[0].trim();
      let textStart = 1;
      if (!/-->/u.test(timingLine) && lines[1] && /-->/u.test(lines[1])) {
        identifier = timingLine;
        timingLine = lines[1].trim();
        textStart = 2;
      }
      if (!/-->/u.test(timingLine)) return null;
      const textLines = lines.slice(textStart).filter((line) => line.trim());
      if (!textLines.length) return null;
      return {
        id: identifier || String(index + 1),
        identifier,
        timing: timingLine,
        text: textLines.join("\n")
      };
    })
    .filter(Boolean);
}

function splitSubtitleBlocks(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/u)
    .map((block) => block.trim())
    .filter(Boolean);
}

function segmentPlainText(text, maxLength = 1200) {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n{2,}/u).map((paragraph) => paragraph.trim()).filter(Boolean);
  const segments = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxLength) {
      segments.push(paragraph);
      continue;
    }
    splitLongText(paragraph, maxLength).forEach((chunk) => segments.push(chunk));
  }
  return segments;
}

function splitLongText(text, maxLength) {
  const chunks = [];
  let remaining = String(text || "").trim();
  while (remaining) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }
    const boundary = findSegmentBoundary(remaining, maxLength);
    chunks.push(remaining.slice(0, boundary).trim());
    remaining = remaining.slice(boundary).trimStart();
  }
  return chunks.filter(Boolean);
}

function findSegmentBoundary(text, maxLength) {
  const windowText = text.slice(0, maxLength);
  const minimum = Math.floor(maxLength * 0.55);
  const patterns = [/\n/u, /[.!?。！？]\s+/gu, /[,;，；]\s+/gu, /\s+/gu];
  for (const pattern of patterns) {
    let match;
    let boundary = -1;
    while ((match = pattern.exec(windowText))) {
      const candidate = match.index + match[0].length;
      if (candidate >= minimum) boundary = candidate;
    }
    if (boundary >= minimum) return boundary;
  }
  return maxLength;
}

function buildTranslatedDocument(documentData, translations) {
  const translationMap = new Map(translations.map((entry) => [entry.id, entry.text]));
  if (documentData.kind === "subtitle") {
    const mimeType = documentData.format === "vtt" ? "text/vtt;charset=utf-8" : "application/x-subrip;charset=utf-8";
    const translatedContent = serializeTranslatedSubtitle(documentData.cues, translationMap, documentData.format);
    const bilingualContent = serializeBilingualSubtitle(documentData.cues, translationMap, documentData.format);
    const sourceOutput = buildSourceDocumentOutput(documentData);
    return {
      isSubtitle: true,
      content: bilingualContent,
      preview: bilingualContent,
      filename: buildDownloadFilename(documentData.filename, `.bilingual.${documentData.format}`),
      mimeType,
      outputs: {
        translated: {
          content: translatedContent,
          filename: buildDownloadFilename(documentData.filename, `.translated.${documentData.format}`),
          mimeType
        },
        bilingual: {
          content: bilingualContent,
          filename: buildDownloadFilename(documentData.filename, `.bilingual.${documentData.format}`),
          mimeType
        },
        source: sourceOutput
      }
    };
  }
  const content = documentData.segments.map((segment) => translationMap.get(segment.id) || segment.text).join("\n\n");
  const extension = documentData.extension === "md" ? ".md" : ".txt";
  return {
    isSubtitle: false,
    content,
    preview: content,
    filename: buildDownloadFilename(documentData.filename, `.translated${extension}`),
    mimeType: documentData.extension === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8",
    outputs: {
      source: buildSourceDocumentOutput(documentData),
      translated: {
        content,
        filename: buildDownloadFilename(documentData.filename, `.translated${extension}`),
        mimeType: documentData.extension === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8"
      }
    }
  };
}

function buildSourceDocumentOutput(documentData) {
  if (!documentData) return null;
  if (documentData.kind === "subtitle") {
    const format = documentData.format || "vtt";
    return {
      content: String(documentData.rawText || ""),
      filename: buildDownloadFilename(documentData.filename, `.source.${format}`),
      mimeType: format === "vtt" ? "text/vtt;charset=utf-8" : "application/x-subrip;charset=utf-8"
    };
  }
  const extension = documentData.extension === "md" ? ".md" : ".txt";
  return {
    content: String(documentData.rawText || ""),
    filename: buildDownloadFilename(documentData.filename, `.source${extension}`),
    mimeType: documentData.extension === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8"
  };
}

function serializeBilingualSubtitle(cues, translationMap, format) {
  const blocks = cues.map((cue, index) => {
    const translated = getSubtitleTranslation(cue, translationMap);
    const lines = [];
    if (format === "srt") {
      lines.push(String(index + 1));
    } else if (cue.identifier) {
      lines.push(cue.identifier);
    }
    lines.push(cue.timing);
    lines.push(...cue.text.split(/\n/u));
    if (translated) lines.push(...String(translated).split(/\n/u));
    return lines.join("\n");
  });
  return `${format === "vtt" ? "WEBVTT\n\n" : ""}${blocks.join("\n\n")}\n`;
}

function serializeTranslatedSubtitle(cues, translationMap, format) {
  const blocks = cues.map((cue, index) => {
    const translated = getSubtitleTranslation(cue, translationMap) || cue.text;
    const lines = [];
    if (format === "srt") {
      lines.push(String(index + 1));
    } else if (cue.identifier) {
      lines.push(cue.identifier);
    }
    lines.push(cue.timing);
    lines.push(...String(translated).split(/\n/u));
    return lines.join("\n");
  });
  return `${format === "vtt" ? "WEBVTT\n\n" : ""}${blocks.join("\n\n")}\n`;
}

function getSubtitleTranslation(cue, translationMap) {
  const translated = translationMap instanceof Map
    ? translationMap.get(cue.id)
    : translationMap[cue.id];
  return String(translated || "").trim();
}

function resetFileDownloadControls() {
  controls.downloadSourceFileTranslation.disabled = true;
  controls.downloadFileTranslation.disabled = true;
  controls.downloadFileTranslation.textContent = "下载译文";
  controls.downloadBilingualFileTranslation.disabled = true;
  controls.downloadBilingualFileTranslation.hidden = true;
}

function updateFileDownloadControls() {
  const translatedOutput = getDocumentDownloadOutput("translated");
  const bilingualOutput = getDocumentDownloadOutput("bilingual");
  const sourceOutput = buildSourceDocumentOutput(selectedDocument);
  controls.downloadSourceFileTranslation.textContent = selectedDocument && selectedDocument.kind === "subtitle"
    ? "下载原文字幕"
    : "下载原文";
  controls.downloadSourceFileTranslation.disabled = !hasDownloadableContent(sourceOutput);
  controls.downloadFileTranslation.textContent = translatedDocument && translatedDocument.isSubtitle ? "下载译文字幕" : "下载译文";
  controls.downloadFileTranslation.disabled = !hasDownloadableContent(translatedOutput);
  controls.downloadBilingualFileTranslation.hidden = !(translatedDocument && translatedDocument.isSubtitle);
  controls.downloadBilingualFileTranslation.disabled = !hasDownloadableContent(bilingualOutput);
}

function getDocumentDownloadOutput(kind) {
  if (!translatedDocument) return null;
  if (translatedDocument.outputs && translatedDocument.outputs[kind]) return translatedDocument.outputs[kind];
  if (kind === "translated") return translatedDocument;
  return null;
}

function hasDownloadableContent(output) {
  return Boolean(output && String(output.content || "").trim() && output.filename && output.mimeType);
}

function buildSourcePreview(documentData) {
  if (documentData.kind === "subtitle") {
    return documentData.cues
      .slice(0, 20)
      .map((cue, index) => `${index + 1}\n${cue.timing}\n${cue.text}`)
      .join("\n\n");
  }
  return documentData.rawText.slice(0, 12000);
}

function buildFileMeta(documentData) {
  const label = documentData.kind === "subtitle" ? "字幕" : "文本";
  return [
    `<strong>${escapeHtml(documentData.filename)}</strong>`,
    documentData.sourceLabel ? `<span>来源：${escapeHtml(documentData.sourceLabel)}</span>` : "",
    `<span>${label}文件，${documentData.segments.length} 个待翻译分段</span>`,
    documentData.kind === "subtitle" ? "<span>下载将保留时间轴，可输出原文字幕、译文字幕或双语字幕。</span>" : ""
  ].filter(Boolean).join("");
}

function buildDownloadFilename(filename, suffix) {
  const sourceName = String(filename || "transly-output").split(/[\\/]/u).pop() || "transly-output";
  const cleaned = sourceName
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 120);
  const base = (cleaned.replace(/\.[^.]+$/u, "").replace(/^\.+$/u, "") || "transly-output");
  return `${base}${suffix}`;
}

function getFileExtension(filename) {
  const match = String(filename || "").toLowerCase().match(/\.([a-z0-9]+)$/u);
  return match ? match[1] : "";
}

function stripUtf8Bom(text) {
  return String(text || "").replace(/^\uFEFF/u, "");
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

window.TranslyDocumentTools = {
  parseDocumentForTranslation,
  parseSrt,
  parseVtt,
  segmentPlainText,
  serializeBilingualSubtitle,
  serializeTranslatedSubtitle,
  buildTranslatedDocument,
  buildSourceDocumentOutput,
  loadCapturedSubtitleDocument,
  buildDownloadFilename,
  translateDocumentSegments
};
