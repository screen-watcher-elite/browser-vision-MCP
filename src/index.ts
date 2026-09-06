#!/usr/bin/env node
/**
 * Browser Vision MCP Server
 *
 * An autonomous browser automation and visual computer-use MCP server.
 * Uses local Google Chrome or Microsoft Edge binaries via puppeteer-core,
 * bypassing external driver download issues and providing fast, reliable visual perception.
 *
 * Security Features:
 *   - Expedition goal pinning and domain whitelisting
 *   - Credential regex firewall (blocks API keys & private keys from leaking)
 *   - Destructive action interception (delete, wipe, purge)
 *   - Invisible text and indirect prompt injection scrubber
 *
 * Tools:
 *   - browser_set_expedition: Pin active goal and allowed domain boundary
 *   - browser_get_security_status: Telemetry of blocked injection and leakage attacks
 *   - browser_open: Navigate to an HTTP or file:// URL with domain boundary checks
 *   - browser_screenshot: Take high-resolution screenshot (returns base64 image for visual models)
 *   - browser_click: Click elements by CSS selector or (x, y) coordinate with safety checks
 *   - browser_type: Input text into fields with credential leakage protection
 *   - browser_evaluate: Execute arbitrary JavaScript in the page context
 *   - browser_get_dom: Extract HTML or interactive UI element map wrapped in XML fences
 *   - browser_console_logs: Inspect browser console logs & uncaught errors
 *   - browser_scroll: Scroll the page up/down
 *   - browser_close: Terminate browser session
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import path from 'node:path';
import { AutonomousBrowser } from './browser.js';

const server = new McpServer({
  name: 'browser-vision-mcp',
  version: '1.1.0',
});

let browserInstance: AutonomousBrowser | null = null;

function getBrowser(): AutonomousBrowser {
  if (!browserInstance) {
    browserInstance = new AutonomousBrowser();
  }
  return browserInstance;
}

// ── Security Tools ──────────────────────────────────────────────────────────

server.tool(
  'browser_set_expedition',
  'Pins the active goal and restricts navigation to a whitelisted list of domains. Protects against indirect prompt injection and unauthorized browsing.',
  {
    goal: z.string().describe('The core objective of the expedition (e.g. "Explore TensorForge")'),
    allowedDomains: z.array(z.string()).describe('List of allowed root domains (e.g. ["screen-watcher-elite.github.io"])'),
    strictMode: z.boolean().default(true).describe('Whether to strictly block navigation outside allowed domains'),
  },
  async ({ goal, allowedDomains, strictMode }) => {
    try {
      const browser = getBrowser();
      const res = browser.setExpedition(goal, allowedDomains, strictMode);
      return {
        content: [
          {
            type: 'text' as const,
            text: `🛡️ Expedition Boundary Pinned Successfully:\n- Goal: "${res.currentGoal}"\n- Allowed Domains: [${res.allowedDomains.join(', ')}]\n- Strict Mode: ${res.strictMode}`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Failed to set expedition: ${err instanceof Error ? err.message : String(err)}` }],
      };
    }
  }
);

server.tool(
  'browser_get_security_status',
  'Inspects the active security status, current expedition goal, allowed domains, and count of blocked attacks.',
  {},
  async () => {
    try {
      const browser = getBrowser();
      const status = browser.getSecurityStatus();
      return {
        content: [
          {
            type: 'text' as const,
            text: [
              `🛡️ Browser Vision Security Telemetry:`,
              `- Active Goal: ${status.expedition.currentGoal ? `"${status.expedition.currentGoal}"` : 'None (Open mode)'}`,
              `- Whitelisted Domains: [${status.expedition.allowedDomains.join(', ')}]`,
              `- Strict Mode: ${status.expedition.strictMode}`,
              `- Blocked Cross-Domain Navigations: ${status.expedition.blockedNavigationCount}`,
              `- Blocked Destructive Clicks: ${status.expedition.blockedDestructiveCount}`,
              `- Blocked Credential Leak Attempts: ${status.credentialFirewall.blockedAttempts}`,
            ].join('\n'),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Failed to get security status: ${err instanceof Error ? err.message : String(err)}` }],
      };
    }
  }
);

// ── Tool 1: Open / Navigate Browser ──────────────────────────────────────────

server.tool(
  'browser_open',
  'Open the browser and navigate to a specified URL (supports http://, https://, and local file:/// URLs) with domain boundary checks, SSRF guard, and phishing protection.',
  {
    url: z.string().describe('The URL to navigate to (e.g. "https://screen-watcher-elite.github.io/tensorforge/" or "file:///C:/...")'),
    waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2']).default('domcontentloaded').describe('Navigation wait condition'),
    timeout: z.number().default(30000).describe('Timeout in milliseconds'),
    allowLocalhost: z.boolean().default(false).describe('Allow navigation to local addresses (localhost / 127.0.0.1) for local web development'),
  },
  async ({ url, waitUntil, timeout, allowLocalhost }) => {
    try {
      const browser = getBrowser();
      const res = await browser.navigate(url, { waitUntil, timeout, allowLocalhost });
      return {
        content: [
          {
            type: 'text' as const,
            text: `Successfully navigated to ${res.url} (HTTP status: ${res.status ?? 200})`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to open URL: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// ── Tool 2: Capture Visual Screenshot ────────────────────────────────────────

server.tool(
  'browser_screenshot',
  'Capture a visual screenshot of the current browser page. Returns an image for vision models and optionally writes the file to disk.',
  {
    fullPage: z.boolean().default(false).describe('Whether to capture the entire scrollable page height'),
    savePath: z.string().optional().describe('Optional absolute path where PNG image should be saved to disk'),
  },
  async ({ fullPage, savePath }) => {
    try {
      const browser = getBrowser();
      const defaultPath = savePath || path.resolve(process.cwd(), 'browser-screenshot.png');
      const result = await browser.screenshot({ fullPage, savePath: defaultPath });

      return {
        content: [
          {
            type: 'text' as const,
            text: `Screenshot captured (${result.width}x${result.height}px). Saved to: ${result.filePath || defaultPath}`,
          },
          {
            type: 'image' as const,
            data: result.base64,
            mimeType: result.mimeType,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to capture screenshot: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// ── Tool 3: Click Element or Coordinates ─────────────────────────────────────

server.tool(
  'browser_click',
  'Click on a web page element using either a CSS selector or absolute (x, y) screen coordinates. Intercepts destructive actions and payment transactions.',
  {
    selector: z.string().optional().describe('CSS selector of the element to click (e.g. "#btn-eigen", "button.active")'),
    x: z.number().optional().describe('Optional X coordinate on the page viewport to click'),
    y: z.number().optional().describe('Optional Y coordinate on the page viewport to click'),
    bypassSecurity: z.boolean().default(false).describe('Explicitly confirm potentially destructive actions (delete, wipe)'),
    allowFinancialAction: z.boolean().default(false).describe('Explicitly confirm financial transactions or checkouts (pay, buy now, purchase)'),
  },
  async ({ selector, x, y, bypassSecurity, allowFinancialAction }) => {
    try {
      const browser = getBrowser();
      await browser.click({ selector, x, y }, { bypassSecurity, allowFinancialAction });
      return {
        content: [
          {
            type: 'text' as const,
            text: selector ? `Successfully clicked selector: "${selector}"` : `Successfully clicked coordinate (${x}, ${y})`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Click failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// ── Tool 4: Type Text into Inputs ────────────────────────────────────────────

server.tool(
  'browser_type',
  'Type text into a specified input field, textarea, or contenteditable element with credential leakage protection.',
  {
    selector: z.string().describe('CSS selector of the input element'),
    text: z.string().describe('The text string to type'),
    clear: z.boolean().default(false).describe('Whether to clear existing text before typing'),
    delay: z.number().default(20).describe('Typing delay per keystroke in milliseconds'),
    bypassSecurity: z.boolean().default(false).describe('Bypass credential pattern check (use with caution)'),
  },
  async ({ selector, text, clear, delay, bypassSecurity }) => {
    try {
      const browser = getBrowser();
      await browser.type(selector, text, { clear, delay, bypassSecurity });
      return {
        content: [
          {
            type: 'text' as const,
            text: `Successfully typed into selector: "${selector}"`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Typing failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// ── Tool 5: Evaluate JavaScript in Page Context ──────────────────────────────

server.tool(
  'browser_evaluate',
  'Execute custom JavaScript code directly in the browser page context and return the result.',
  {
    script: z.string().describe('JavaScript expression or function to evaluate (e.g. "document.title", "window.TensorForge.getMatrix()")'),
  },
  async ({ script }) => {
    try {
      const browser = getBrowser();
      const result = await browser.evaluate(script);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Evaluation result:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `JavaScript evaluation failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// ── Tool 6: Extract DOM Content or Interactive Map ───────────────────────────

server.tool(
  'browser_get_dom',
  'Inspect the live DOM structure wrapped in security XML envelopes: either raw HTML or structured JSON map of interactive elements.',
  {
    mode: z.enum(['html', 'interactive_elements']).default('interactive_elements').describe('Extraction format'),
    selector: z.string().optional().describe('Optional CSS selector to scope the HTML extraction'),
  },
  async ({ mode, selector }) => {
    try {
      const browser = getBrowser();
      if (mode === 'interactive_elements') {
        const elements = await browser.getInteractiveElements();
        return {
          content: [
            {
              type: 'text' as const,
              text: `Found ${elements.length} interactive elements:\n\n${JSON.stringify(elements, null, 2)}`,
            },
          ],
        };
      } else {
        const html = await browser.getDom(selector);
        return {
          content: [
            {
              type: 'text' as const,
              text: html,
            },
          ],
        };
      }
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to inspect DOM: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// ── Tool 7: Browser Console Logs ─────────────────────────────────────────────

server.tool(
  'browser_console_logs',
  'Read captured console logs, runtime errors, and uncaught exceptions from the client-side browser context.',
  {},
  async () => {
    try {
      const browser = getBrowser();
      const logs = browser.getConsoleLogs();
      if (logs.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No console logs captured yet for the active page session.',
            },
          ],
        };
      }

      const formatted = logs
        .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}]: ${l.text}`)
        .join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: `Captured ${logs.length} console log entries:\n\n${formatted}`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to retrieve console logs: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// ── Tool 8: Scroll Page ──────────────────────────────────────────────────────

server.tool(
  'browser_scroll',
  'Scroll the active page viewport up or down by a specified pixel amount.',
  {
    direction: z.enum(['down', 'up']).default('down').describe('Direction to scroll the page'),
    amount: z.number().default(400).describe('Scroll distance in pixels'),
  },
  async ({ direction, amount }) => {
    try {
      const browser = getBrowser();
      await browser.scroll(direction, amount);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Scrolled page ${direction} by ${amount}px.`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to scroll page: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// ── Tool 9: Close Browser ────────────────────────────────────────────────────

server.tool(
  'browser_close',
  'Cleanly close the active browser session and release memory resources.',
  {},
  async () => {
    try {
      if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Browser session terminated cleanly.',
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to close browser: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// ── Server Boot ─────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Browser Vision MCP Server v1.1 (Security Shield Active) running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in Browser Vision MCP:', error);
  process.exit(1);
});
