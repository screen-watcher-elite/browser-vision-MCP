# BrowserVision MCP 👁️🌐

> An autonomous, high-speed **Browser Computer-Use & Vision MCP Server** for Antigravity IDE and Claude.

Unlike standard browser agents that rely on remote Playwright/Chromium driver downloads (which frequently trigger 404 mirror errors or network timeouts), **BrowserVision MCP** directly pilots your locally installed **Google Chrome** or **Microsoft Edge** browser via `puppeteer-core`.

---

## ⚡ Key Capabilities

- **👁️ Native Visual Perception**: Captures high-resolution viewport or full-page screenshots and returns base64 image data directly into the model's visual context.
- **🎯 Computer-Use Precision**: Supports clicking by CSS selector or absolute $(x, y)$ coordinate clicks.
- **⌨️ Keyboard & Text Inputs**: Full typing and input control with clear and delay options.
- **🧠 Page Script Execution**: Evaluates JavaScript directly within the web page context (`window` globals, matrix states, DOM querying).
- **📋 Console Log Inspection**: Captures all browser runtime exceptions and `console.log/warn/error` messages for instant frontend debugging.
- **🚀 Zero Binary Downloads**: Connects immediately to system Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) or Edge.

---

## 🛠️ Tools Exposed

| Tool | Parameters | Description |
|---|---|---|
| `browser_open` | `url`, `waitUntil`, `timeout` | Launch browser and navigate to web or `file:///` URLs. |
| `browser_screenshot` | `fullPage`, `savePath` | Capture screenshot returning visual image for multimodal agents. |
| `browser_click` | `selector`, `x`, `y` | Click on DOM elements or coordinate points. |
| `browser_type` | `selector`, `text`, `clear`, `delay` | Type strings into inputs or textareas. |
| `browser_evaluate` | `script` | Run arbitrary JS and return serialized results. |
| `browser_get_dom` | `mode`, `selector` | Extract HTML or interactive UI element bounding boxes. |
| `browser_scroll` | `direction`, `amount` | Scroll page up or down. |
| `browser_console_logs` | *(none)* | View browser runtime console errors and warnings. |
| `browser_close` | *(none)* | Gracefully terminate browser session. |

---

## 🔌 Connecting to Antigravity IDE

### Method 1: Automatic Workspace Plugin (Recommended)
This workspace is already pre-configured with the plugin in `.agents/plugins/browser-vision/`:
- `plugin.json`
- `mcp_config.json`

### Method 2: Antigravity IDE Settings UI
1. In the Antigravity IDE top bar or left sidebar, click **Additional Options (...)** → **MCP Servers**.
2. Click **Add Server**:
   - **Name**: `browser-vision`
   - **Command**: `node`
   - **Args**: `C:/Users/Ashutosh/PSL2/browser-vision-mcp/dist/index.js`
3. Click **Save & Connect**.
