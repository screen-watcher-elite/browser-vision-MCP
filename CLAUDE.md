# BrowserVision MCP — Project Guidelines for Claude Code

> Architectural conventions, browser automation standards, and vision testing notes for Claude Code when maintaining or extending **BrowserVision MCP**.

---

## 🧭 Project Mission & Overview

**BrowserVision MCP** is an autonomous browser automation, computer-use, and visual inspection Model Context Protocol (MCP) server. Built to empower Claude Code with visual perception and interaction capabilities using local Google Chrome and Microsoft Edge binaries via `puppeteer-core`.

It solves browser driver download and version mismatch issues by automatically discovering existing system browser installations and connecting over DevTools Protocol (CDP) for high-speed, 100% offline-ready automation.

---

## 🏗️ Architecture & File Structure

```
browser-vision-mcp/
├── CLAUDE.md             # Project guidelines and memory for Claude Code
├── .claude/              # Claude Code project settings and memory
│   ├── settings.json     # Permitted tools and environment settings
│   └── project_context.md# Architecture memory & browser automation notes
├── src/
│   ├── index.ts          # McpServer initialization & tool handlers (Stdio transport)
│   └── browser.ts        # Core AutonomousBrowser driver wrapping puppeteer-core
├── dist/                 # Compiled JavaScript output
├── audit/                # Multi-mode audit reports & screenshot artifacts
├── audit-all-modes.js    # Automated multi-tab verification script
├── verify-enhancements.js# Regression testing suite
├── package.json          # Dependencies & build scripts
├── tsconfig.json         # NodeNext TypeScript configuration
└── README.md             # Public documentation & tool catalog
```

---

## 👁️ Automation & Vision Guidelines

1. **Local Binary Priority**: Automatically detect and launch local Google Chrome or Microsoft Edge binaries without downloading heavy external Chromium distributions.
2. **Visual Inspection First**: Return standard base64 image data in MCP tool responses so multimodal models can perceive live page layouts directly.
3. **Robust Error Handling**: Handle navigation timeouts, dynamic DOM mutations, and unexpected popups gracefully without hanging the MCP server process.
4. **Clean Session Teardown**: Ensure browser processes and orphan chrome child processes are cleanly killed when sessions close.
