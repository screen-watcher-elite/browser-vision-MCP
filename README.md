# BrowserVision MCP 👁️🌐

[![Security](https://img.shields.io/badge/Security-Deterministic_Firewall_Active-10b981?style=for-the-badge&logo=shield&logoColor=white)](#-security--anti-injection-firewall)
[![Protocol](https://img.shields.io/badge/Protocol-Model_Context_Protocol_1.6.0-8b5cf6?style=for-the-badge&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge)](LICENSE)

> An autonomous, high-speed **Browser Computer-Use & Vision MCP Server** engineered with a **Deterministic Security & Anti-Injection Firewall** for Antigravity IDE, Claude, and local AI models.

Unlike standard browser agents that blindly follow web page prompts or leak credentials, **BrowserVision MCP** wraps browser interactions in strict deterministic safeguards, protecting both cloud and small local models from indirect prompt injection, credential exfiltration, and destructive actions.

Powered by your locally installed **Google Chrome** or **Microsoft Edge** browser via `puppeteer-core`.

---

## 🛡️ Security & Anti-Injection Firewall

| Defense Layer | Threat Vector Blocked | Deterministic Protection |
| :--- | :--- | :--- |
| **Expedition Pinning** | Rogue redirects and phishing. | `browser_set_expedition`: Strictly restricts navigation to an allowed domain whitelist. |
| **Credential Firewall** | Accidental API key or password leaks. | RegEx scanner on `browser_type`: Intercepts Anthropic (`sk-ant-`), OpenAI, Google (`AIza`), GitHub PATs, and private keys. |
| **Injection Scrubber** | Invisible prompt hijacking payloads. | Purges elements styled with `opacity: 0`, `font-size: 0px`, or offscreen `-9999px` text tricks. |
| **Destructive Action Interceptor** | Accidental "Delete Account" or "Drop Table" clicks. | Detects destructive keywords and requires explicit `bypassSecurity: true` confirmation. |
| **Untrusted Data Envelopes** | Injected text masquerading as system prompts. | Encloses DOM content in `<UNTRUSTED_EXTERNAL_WEB_DATA>` XML fences with warning banners. |

---

## ⚡ Key Capabilities

- **👁️ Native Visual Perception**: Captures high-resolution viewport or full-page screenshots and returns base64 image data directly into the model's visual context.
- **🎯 Computer-Use Precision**: Supports clicking by CSS selector or absolute $(x, y)$ coordinate clicks.
- **⌨️ Keyboard & Text Inputs**: Full typing and input control with clear, delay, and credential protection.
- **🧠 Page Script Execution**: Evaluates JavaScript directly within the web page context (`window` globals, matrix states, DOM querying).
- **📋 Console Log Inspection**: Captures all browser runtime exceptions and `console.log/warn/error` messages for instant frontend debugging.
- **🚀 Zero Binary Downloads**: Connects immediately to system Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) or Edge.

---

## 🛠️ Tools Exposed

| Tool | Parameters | Description |
|---|---|---|
| `browser_set_expedition` | `goal`, `allowedDomains`, `strictMode` | Pin active goal and whitelist allowed root domains. |
| `browser_get_security_status` | *(none)* | Inspect active expedition boundary and count of blocked attacks. |
| `browser_open` | `url`, `waitUntil`, `timeout` | Launch browser and navigate with domain whitelist enforcement. |
| `browser_screenshot` | `fullPage`, `savePath` | Capture screenshot returning visual image for multimodal agents. |
| `browser_click` | `selector`, `x`, `y`, `bypassSecurity` | Click on DOM elements or coordinate points with destructive action interceptor. |
| `browser_type` | `selector`, `text`, `clear`, `delay`, `bypassSecurity` | Type strings into inputs with credential leakage scanning. |
| `browser_evaluate` | `script` | Run arbitrary JS and return serialized results. |
| `browser_get_dom` | `mode`, `selector` | Extract HTML or interactive UI element map wrapped in XML fences. |
| `browser_scroll` | `direction`, `amount` | Scroll page up or down. |
| `browser_console_logs` | *(none)* | View browser runtime console errors and warnings. |
| `browser_close` | *(none)* | Gracefully terminate browser session. |

---

## 🔌 Connecting to Antigravity IDE / Claude Desktop

Add to your `mcp_config.json`:

```json
{
  "mcpServers": {
    "browser-vision": {
      "command": "node",
      "args": ["C:/Users/Ashutosh/PSL2/browser-vision-mcp/dist/index.js"]
    }
  }
}
```

---

## 📜 License
Apache-2.0 © [Ashutosh Subhash Chikane (@screen-watcher-elite)](https://github.com/screen-watcher-elite)
