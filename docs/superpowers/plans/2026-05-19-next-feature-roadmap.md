# 全能翻译下一阶段实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不破坏当前网页翻译、悬浮球、侧栏和发布流程的前提下，继续补齐站点规则可视化、文档/PDF/图片 OCR 翻译、音频识别与字幕下载能力。

**Architecture:** 按能力分成独立分支推进：P1 先完善站点规则与翻译命中算法，P2 增加文件/OCR 翻译入口，P3 增加字幕下载和音频识别。所有任务复用现有 `content-core.js` 的设置规范、`background.js` 的翻译服务调度、`options.js` 的设置页框架和 `sidepanel.js` 的侧边栏入口。

**Tech Stack:** Chrome Extension MV3, Vanilla JavaScript, Chrome Storage, Content Script, Side Panel, Offscreen/Worker where useful, optional Tesseract.js/Web Speech/remote ASR adapter behind settings.

---

## 分支策略

- P1 使用 `feature/site-rule-builder`。
- P2 使用 `feature/document-ocr-translation`。
- P3 使用 `feature/audio-subtitle-workflow`。
- 每个分支都从公开仓库当前 `main` 或最新稳定功能分支切出，不使用 `codex/` 前缀。
- `process/` 和 `tests/` 继续保持本地忽略，不提交到远程。

## 当前文件边界

- Modify: `all-in-one-translate-extension/content-core.js`，统一设置默认值、规则结构、翻译服务和文本筛选算法。
- Modify: `all-in-one-translate-extension/content-script.js`，网页正文采集、动态内容监听、悬浮球、字幕注入。
- Modify: `all-in-one-translate-extension/background.js`，翻译服务调度、文件/OCR/ASR 请求中转、失败回退。
- Modify: `all-in-one-translate-extension/options.html`，新增设置页表单区域。
- Modify: `all-in-one-translate-extension/options.js`，新增设置交互、导入导出、测试按钮、规则编辑器。
- Modify: `all-in-one-translate-extension/options.css`，新增站点规则、OCR、字幕/音频设置样式。
- Modify: `all-in-one-translate-extension/sidepanel.html`，新增文件/图片/PDF/字幕入口。
- Modify: `all-in-one-translate-extension/sidepanel.js`，实现侧边栏文件选择、预览、结果展示。
- Modify: `all-in-one-translate-extension/sidepanel.css`，调整文件翻译和字幕工具 UI。
- Modify: `all-in-one-translate-extension/manifest.json`，只在 P2/P3 真正需要时增加权限。
- Modify: `README.md`，补充新功能使用方式和限制说明。
- Test: `tests/core_behavior.test.js`，覆盖设置规范、规则匹配、翻译候选筛选。
- Test: `tests/dom_translation_behavior.test.js`，覆盖动态网站、Twitter/Reddit/GitHub 类页面命中。
- Test: `tests/options_service_semantics.test.js`，覆盖设置页保存/导入导出。
- Test: New local-only `tests/document_ocr_behavior.test.js`。
- Test: New local-only `tests/audio_subtitle_behavior.test.js`。

## P1: 站点规则可视化与通用翻译算法

**目标:** 解决 Twitter、Reddit、GitHub 这类动态站点“页面部分中文但英文正文/评论不翻译”的问题，并让用户不用写 JSON 也能配置站点规则。

**优先级:** 最高。这个直接影响核心体验。

### Task 1: 规则数据模型升级

- [ ] 在 `all-in-one-translate-extension/content-core.js` 中扩展用户规则结构：
  - `name`
  - `matches`
  - `includeSelectors`
  - `excludeSelectors`
  - `stayOriginalSelectors`
  - `dynamicMode`
  - `minTextLength`
  - `forceTranslateWhenMixedLanguage`
  - `translateShadowDom`
- [ ] 保持旧字段 `selectors` 兼容，保存时映射为 `includeSelectors`。
- [ ] 在 `tests/core_behavior.test.js` 增加规则归一化测试。
- [ ] 运行 `node tests/core_behavior.test.js all-in-one-translate-extension/content-core.js`，预期 PASS。
- [ ] 提交：`feat(rules): normalize visual site rules`。

### Task 2: 动态站点文本候选算法

- [ ] 修改 `all-in-one-translate-extension/content-script.js` 的候选采集逻辑：
  - 总是优先扫描可见文本块。
  - 对 `article`, `[data-testid="tweetText"]`, `[slot="text-body"]`, `[data-click-id="text"]`, markdown 容器等语义节点加权。
  - 混合语言页面不再因为页面主语言接近目标语言就整体跳过。
  - 已翻译节点避免重复包裹，动态新增节点进入队列。
- [ ] 修改 `content-core.js` 增加 `shouldTranslateTextBlock(text, settings, context)`，将语言判断和敏感文本过滤放到核心层。
- [ ] 在 `tests/dom_translation_behavior.test.js` 增加 Twitter/Reddit 混合语言夹具。
- [ ] 运行 `node tests/dom_translation_behavior.test.js`，预期 PASS。
- [ ] 提交：`fix(content): translate mixed-language dynamic feeds`。

### Task 3: 站点规则可视化编辑器

- [ ] 在 `all-in-one-translate-extension/options.html` 增加“站点规则”页面：
  - 规则列表。
  - 域名匹配输入。
  - 包含/排除/保持原文选择器输入。
  - 动态页面开关。
  - “从当前页面拾取元素”按钮。
  - JSON 高级视图折叠区。
- [ ] 在 `options.js` 实现增删改、保存、恢复默认、导入导出。
- [ ] 在 `options.css` 添加紧凑的规则卡片和选择器 chips。
- [ ] 在 `tests/options_service_semantics.test.js` 增加规则保存与兼容测试。
- [ ] 运行 `node tests/options_service_semantics.test.js`，预期 PASS。
- [ ] 提交：`feat(options): add visual site rule builder`。

### Task 4: 规则拾取器

- [ ] 在 `content-script.js` 增加临时拾取模式：
  - options 页面发送 `TRANSLY_PICK_SELECTOR`。
  - 当前页面 hover 时高亮元素。
  - 点击后返回稳定 CSS selector。
  - Escape 退出。
- [ ] 在 `options.js` 接收 selector 并填入规则编辑器。
- [ ] 在本地 Playwright/Chrome 测试里使用后台测试页面验证，不抢占用户主 Chrome 窗口。
- [ ] 提交：`feat(rules): pick selectors from current page`。

## P2: 文档/PDF/图片 OCR 翻译

**目标:** 先做可控范围：文本文件、PDF 文本层、图片 OCR。复杂 PDF 排版重建不作为第一版目标。

**优先级:** 中高。用户明确需要，但实现体积和权限要谨慎。

### Task 5: 文件翻译入口与结果面板

- [ ] 在 `sidepanel.html` 增加“文件/图片”标签页：
  - 文件拖拽区。
  - 文件类型识别。
  - 源文本预览。
  - 译文预览。
  - 下载 `.txt` / `.md` 按钮。
- [ ] 在 `sidepanel.js` 支持 `.txt`, `.md`, `.srt`, `.vtt` 读取并分段翻译。
- [ ] 在 `background.js` 复用现有翻译服务回退顺序。
- [ ] 增加 `tests/document_ocr_behavior.test.js` 覆盖文本文件分段。
- [ ] 提交：`feat(files): translate text subtitle files`。

### Task 6: PDF 文本层翻译

- [ ] 评估是否引入 `pdfjs-dist`，优先使用轻量构建并记录包体变化。
- [ ] 在 `sidepanel.js` 增加 PDF 文本抽取。
- [ ] 翻译结果先输出为 Markdown，不做原 PDF 覆写。
- [ ] README 标明第一版支持 PDF 文本层，不支持扫描版 PDF 排版还原。
- [ ] 增加本地测试 PDF 夹具，测试放入 `tests/fixtures/` 且不提交远程。
- [ ] 提交：`feat(files): extract and translate pdf text layer`。

### Task 7: 图片 OCR 翻译

- [ ] 增加 OCR 服务配置：
  - 本地 OCR：可选 Tesseract.js。
  - 自定义 OCR API：用户填 endpoint/key。
  - 关闭默认远程上传，避免隐私误伤。
- [ ] 在 `sidepanel.js` 支持图片预览、OCR 文本区、手动修正后翻译。
- [ ] 在 `background.js` 增加 OCR 请求中转和敏感文本保护。
- [ ] 增加 `tests/document_ocr_behavior.test.js` 的 OCR mock 测试。
- [ ] 提交：`feat(ocr): translate image text with configurable ocr`。

## P3: 音频识别与字幕下载

**目标:** 先做字幕下载和已有字幕翻译，再做音频识别。直接浏览器录制网页音频涉及权限和跨站限制，必须放在后面谨慎做。

**优先级:** 中。依赖 P2 的字幕文件处理和已有字幕翻译稳定性。

### Task 8: 字幕样式与下载能力

- [ ] 在 `content-script.js` 保留字幕原文和译文队列。
- [ ] 为当前视频页提供“下载字幕”动作：
  - `.srt`
  - `.vtt`
  - 双语 `.srt`
- [ ] 在 `sidepanel.html` 增加字幕工具按钮。
- [ ] 在 `options.html` 保留字幕字号、颜色、背景、阴影、位置设置，颜色均使用颜色板选择并显示色块和哈希值。
- [ ] 增加 `tests/audio_subtitle_behavior.test.js` 覆盖 SRT/VTT 序列化。
- [ ] 提交：`feat(subtitles): export bilingual subtitles`。

### Task 9: YouTube/通用播放器字幕稳定性

- [ ] 在 `content-script.js` 区分 YouTube caption window、普通 WebVTT 字幕层、HTML 自定义字幕层。
- [ ] 只翻译真实字幕文本，不翻译播放器按钮、广告标签、控制栏。
- [ ] 增加 subtitle cache，避免每帧重复请求。
- [ ] 提交：`fix(subtitles): stabilize video subtitle translation`。

### Task 10: 音频识别适配层

- [ ] 在 `content-core.js` 增加 `speechRecognitionProvider` 设置：
  - `browser`
  - `customApi`
  - `disabled`
- [ ] 在 `background.js` 增加 ASR adapter：
  - Web Speech 可用性检测。
  - 自定义 API 上传前显示确认。
  - 返回时间轴文本。
- [ ] 在 `options.html` 增加“音频识别”配置页，默认关闭。
- [ ] 在 README 明确浏览器权限、隐私边界和网站限制。
- [ ] 提交：`feat(asr): add configurable speech recognition adapter`。

## 并行安排

- Agent A: P1 Task 1-2，负责核心规则模型和动态正文采集。
- Agent B: P1 Task 3-4，负责站点规则可视化 UI 和拾取器。
- Agent C: P2 Task 5，负责文件翻译入口，先不碰 PDF/OCR。
- Main Agent: 负责接口对齐、冲突合并、统一测试和提交。
- P3 暂不和 P1 同时开大改，等字幕导出 Task 8 可以在 P2 文件字幕支持完成后启动。

## 验证命令

```bash
node tests/core_behavior.test.js all-in-one-translate-extension/content-core.js
node tests/dom_translation_behavior.test.js
node tests/options_service_semantics.test.js
node tests/document_ocr_behavior.test.js
node tests/audio_subtitle_behavior.test.js
bash tests/chrome_extension_validation.sh
node --check all-in-one-translate-extension/background.js
node --check all-in-one-translate-extension/content-core.js
node --check all-in-one-translate-extension/content-script.js
node --check all-in-one-translate-extension/options.js
node --check all-in-one-translate-extension/sidepanel.js
git diff --check
```

## 完成标准

- Twitter/X、Reddit、GitHub Dashboard 等混合语言动态页面能稳定翻译英文正文和评论。
- 站点规则可以通过 UI 创建、编辑、删除、导入导出，不需要用户手写 JSON。
- 文本文件和字幕文件可在侧边栏翻译并下载结果。
- PDF 文本层和图片 OCR 有明确入口、隐私提示和失败回退。
- 字幕翻译支持下载，样式可通过设置页调整。
- 新增权限最小化，README 明确说明每项能力的限制。
- `process/` 与 `tests/` 不进入远程仓库。
