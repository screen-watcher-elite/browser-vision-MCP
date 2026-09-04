#!/usr/bin/env node
/**
 * Browser Vision MCP Server
 *
 * An autonomous browser automation and visual computer-use MCP server.
 * Uses local Google Chrome or Microsoft Edge binaries via puppeteer-core,
 * bypassing external driver download issues and providing fast, reliable visual perception.
 *
 * Tools:
 *   - browser_open: Navigate to an HTTP or file:// URL
 *   - browser_screenshot: Take high-resolution screenshot (returns base64 image for visual models)
 *   - browser_click: Click elements by CSS selector or (x, y) coordinate
 *   - browser_type: Input text into fields or trigger key presses
 *   - browser_evaluate: Execute arbitrary JavaScript in the page context
 *   - browser_get_dom: Extract HTML or interactive UI element map
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
  version: '1.0.0',
});

let browserInstance: AutonomousBrowser | null = null;

function getBrowser(): AutonomousBrowser {
  if (!browserInstance) {
    browserInstance = new AutonomousBrowser();
  }
  return browserInstance;
}

// ── Tool 1: Open / Navigate Browser ──────────────────────────────────────────

server.tool(
  'browser_open',
  'Open the browser and navigate to a specified URL (supports http://, https://, and local file:/// URLs).',
  {
    url: z.string().describe('The URL to navigate to (e.g. "https://screen-watcher-elite.github.io/tensorforge/" or "file:///C:/...")'),
    waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2']).default('domcontentloaded').describe('Navigation wait condition'),
    timeout: z.number().default(30000).describe('Timeout in milliseconds'),
  },
  async ({ url, waitUntil, timeout }) => {
    try {
      const browser = getBrowser();
      const res = await browser.navigate(url, { waitUntil, timeout });
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
  'Click on a web page element using either a CSS selector or absolute (x, y) screen coordinates.',
  {
    selector: z.string().optional().describe('CSS selector of the element to click (e.g. "#btn-eigen", "button.active")'),
    x: z.number().optional().describe('Optional X coordinate on the page viewport to click'),
    y: z.number().optional().describe('Optional Y coordinate on the page viewport to click'),
  },
  async ({ selector, x, y }) => {
    try {
      const browser = getBrowser();
      await browser.click({ selector, x, y });
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
  'Type text into a specified input field, textarea, or contenteditable element.',
  {
    selector: z.string().describe('CSS selector of the input element'),
    text: z.string().describe('The text string to type'),
    clear: z.boolean().default(false).describe('Whether to clear existing text before typing'),
    delay: z.number().default(20).describe('Typing delay per keystroke in milliseconds'),
  },
  async ({ selector, text, clear, delay }) => {
    try {
      const browser = getBrowser();
      await browser.type(selector, text, { clear, delay });
      return {
        content: [
          {
            type: 'text' as const,
            text: `Successfully typed "${text}" into selector: "${selector}"`,
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
            text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Evaluation failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// ── Tool 6: Get DOM / Interactive Elements ───────────────────────────────────

server.tool(
  'browser_get_dom',
  'Extract either the HTML content of the page/element, or retrieve a list of all interactive elements (buttons, links, inputs, coordinates).',
  {
    mode: z.enum(['html', 'interactive_elements']).default('interactive_elements').describe('Extraction mode'),
    selector: z.string().optional().describe('Optional CSS selector when mode is "html"'),
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
              text: JSON.stringify(elements, null, 2),
            },
          ],
        };
      } else {
        const html = await browser.getDom(selector);
        return {
          content: [
            {
              type: 'text' as const,
              text: html.slice(0, 10000) + (html.length > 10000 ? '\n...[truncated]' : ''),
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
            text: `Failed to get DOM: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// ── Tool 7: Scroll Viewport ──────────────────────────────────────────────────

server.tool(
  'browser_scroll',
  'Scroll the web page up or down.',
  {
    direction: z.enum(['up', 'down']).default('down').describe('Direction to scroll'),
    amount: z.number().default(400).describe('Amount to scroll in pixels'),
  },
  async ({ direction, amount }) => {
    try {
      const browser = getBrowser();
      await browser.scroll(direction, amount);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Scrolled ${direction} by ${amount}px`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Scroll failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// ── Tool 8: Inspect Console Logs ─────────────────────────────────────────────

server.tool(
  'browser_console_logs',
  'Retrieve all captured console output (logs, warnings, errors) and uncaught JavaScript page exceptions.',
  {},
  async () => {
    try {
      const browser = getBrowser();
      const logs = browser.getLogs();
      return {
        content: [
          {
            type: 'text' as const,
            text: logs.length > 0 ? JSON.stringify(logs, null, 2) : 'No console messages recorded.',
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to fetch logs: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// ── Tool 9: Close Browser Session ────────────────────────────────────────────

server.tool(
  'browser_close',
  'Close the active browser session and release system resources.',
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
            text: 'Browser session successfully closed.',
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

// ── Start Server via Standard I/O ────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[BrowserVisionMCP] Server running via stdio transport.');
}

main().catch((err) => {
  console.error('[BrowserVisionMCP] Fatal startup error:', err);
  process.exit(1);
});
