# 全能翻译

全能翻译是一个独立的 Chrome Manifest V3 网页翻译插件，目标是提供低侵入的双语阅读、划词翻译、悬停翻译、输入框翻译、视频字幕翻译、站点规则和可配置翻译引擎。

> 当前项目为浏览器插件，不依赖任何外部前端项目代码。源码位于 `all-in-one-translate-extension/`。

## 截图

### 弹窗

![弹窗](docs/screenshots/popup.png)

### 设置中心

![设置中心](docs/screenshots/options.png)

### 侧边栏

![侧边栏](docs/screenshots/sidepanel.png)

### 悬浮球

![悬浮球](docs/screenshots/floating-dock.png)

### 悬浮球设置

![悬浮球设置](docs/screenshots/floating-settings.png)

## 功能

- 网页段落级双语翻译：支持双语对照、仅译文、仅原文悬停、替换原文、仅悬停等显示方式。
- 翻译样式：支持弱化侧线、下划线、波浪线、引用线、高亮、背景、阴影、模糊学习模式、自定义字号、宽度、字体和颜色板选色。
- 翻译引擎：内置 Google 网页翻译、Microsoft 翻译接口、自定义 JSON API、OpenAI-compatible `/chat/completions` API 和演示模式。
- 备份流程：可自定义翻译服务顺序，前一个服务失败后自动尝试下一个可用服务。
- 站点规则：内置 GitHub、X/Twitter、Reddit、StackOverflow、Medium、YouTube 等常见网站规则，尽量避开导航、按钮、文件名、代码、日期和计数器。
- 术语库：内置多组常用术语库，也支持用户自定义术语和按域名生效。
- 划词翻译：选中文本后显示轻量浮层翻译。
- 鼠标悬停翻译：悬停到文本片段时显示译文。
- 输入框翻译：在输入框中快速触发翻译，适合写回复、评论和消息。
- 视频字幕翻译：监听可见字幕文本，支持双语字幕或仅译文字幕，并可配置字号、颜色、背景和阴影。
- 悬浮球：页面右侧快捷入口，支持隐藏、缩小、透明度、固定位置和点击行为设置。
- Chrome 侧边栏：提供文本翻译、网页翻译、站点规则、服务设置等快捷操作。
- 快捷键和右键菜单：支持页面翻译、整页翻译、侧边栏、输入框翻译、划词翻译等操作。

## 安装使用

目前这是源码版插件，可以通过 Chrome 的“加载已解压的扩展程序”安装。

1. 下载或克隆本仓库。
2. 打开 Chrome，进入 `chrome://extensions/`。
3. 打开右上角“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本仓库中的 `all-in-one-translate-extension/` 文件夹。
6. 浏览器工具栏会出现“全能翻译”图标。

## 基本教程

### 翻译网页

1. 打开任意外文网页。
2. 点击页面右侧悬浮球的翻译按钮，或点击浏览器工具栏中的插件图标。
3. 插件会优先翻译可见内容，滚动页面时继续处理新出现的文本。
4. 再次点击翻译按钮可以切回原文。

### 设置翻译服务

1. 打开插件设置页。
2. 进入“翻译服务”。
3. 选择默认服务，或添加自定义 OpenAI-compatible 接口。
4. 在“翻译备份流程”里按行调整服务顺序。
5. 点击“测试服务”确认当前服务可用。

### 调整译文样式

1. 打开设置页的“基本设置”。
2. 选择“显示模式”和“译文显示样式”。
3. 如需自定义颜色，使用颜色板选择；选择后会显示色块和十六进制值。
4. 调整字体缩放、最大宽度和字体族。

### 配置字幕翻译

1. 打开设置页的“视频字幕”。
2. 启用视频字幕翻译。
3. 选择字幕显示模式、翻译服务、字号、颜色、背景和阴影。
4. 在 YouTube 或常见 HTML5 播放器页面播放带字幕的视频。

### 添加术语

1. 打开设置页的“术语库”。
2. 启用内置术语库，例如科技、Web3、编程、金融、法律等。
3. 在自定义术语中添加 JSON 规则，可按域名限定生效范围。

## 自定义 API

普通 JSON API 请求格式：

```json
{
  "text": "Hello",
  "sourceLanguage": "auto",
  "targetLanguage": "zh-CN",
  "glossary": [
    { "source": "LLM", "target": "大语言模型", "note": "", "domains": [] }
  ]
}
```

可接受响应：

```json
{ "text": "你好" }
```

也兼容 `translatedText`、`translation`、`result`、`data.text`、`data.translatedText`、`data.translation`。

OpenAI-compatible 引擎可配置 `/chat/completions` 地址，插件会发送 `model`、`temperature`、`messages`、术语约束和提示词。

## 隐私说明

- 同步设置保存在 `chrome.storage.sync`。
- API Key、自定义引擎密钥、自定义术语保存在 `chrome.storage.local`。
- 导出设置不会包含本地密钥。
- 默认 Google 网页翻译会向 Google 翻译接口发送待翻译文本；自定义接口会向用户配置的服务发送待翻译文本。

## 项目结构

```text
.
├── docs/screenshots/              # README 截图
├── all-in-one-translate-extension/ # Chrome 插件源码
│   ├── manifest.json
│   ├── background.js
│   ├── content-core.js
│   ├── content-script.js
│   ├── options.html
│   ├── popup.html
│   └── sidepanel.html
```

本地开发记录和验证脚本保存在工作区的 `process/`、`tests/` 目录中，这两个目录默认不提交到远端。
