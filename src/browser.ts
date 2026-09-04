import puppeteer, { Browser, Page } from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

// Known Windows browser executable locations
const CANDIDATE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  process.env.CHROME_PATH || '',
  process.env.BROWSER_PATH || '',
].filter(Boolean);

export function findBrowserExecutable(): string {
  for (const p of CANDIDATE_PATHS) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  throw new Error(
    'No supported browser (Google Chrome or Microsoft Edge) found in default paths. ' +
      'Please set the CHROME_PATH or BROWSER_PATH environment variable.'
  );
}

export interface BrowserOptions {
  headless?: boolean;
  viewport?: { width: number; height: number };
  executablePath?: string;
}

export interface ScreenshotResult {
  filePath?: string;
  base64: string;
  mimeType: 'image/png';
  width: number;
  height: number;
}

export class AutonomousBrowser {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private consoleLogs: Array<{ type: string; text: string; timestamp: string }> = [];
  private executablePath: string;

  constructor(executablePath?: string) {
    this.executablePath = executablePath || findBrowserExecutable();
  }

  public async ensurePage(options: BrowserOptions = {}): Promise<Page> {
    if (this.page && !this.page.isClosed()) {
      return this.page;
    }

    if (!this.browser || !this.browser.connected) {
      console.error(`[Browser] Launching binary: ${this.executablePath}`);
      this.browser = await puppeteer.launch({
        executablePath: this.executablePath,
        headless: options.headless ?? true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1280,800',
        ],
      });
    }

    const pages = await this.browser.pages();
    this.page = pages.length > 0 ? pages[0] : await this.browser.newPage();

    const vp = options.viewport || { width: 1280, height: 800 };
    await this.page.setViewport(vp);

    // Track console output for debugging client web applications
    this.consoleLogs = [];
    this.page.on('console', (msg) => {
      this.consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
      });
      // Print to stderr so MCP JSON-RPC on stdout remains clean
      console.error(`[Browser Console ${msg.type()}]: ${msg.text()}`);
    });

    this.page.on('pageerror', (err: unknown) => {
      const errStr = err instanceof Error ? err.stack || err.message : String(err);
      this.consoleLogs.push({
        type: 'uncaught-error',
        text: errStr,
        timestamp: new Date().toISOString(),
      });
      console.error(`[Browser PageError]: ${errStr}`);
    });

    return this.page;
  }

  public async navigate(
    url: string,
    options: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'; timeout?: number } = {}
  ): Promise<{ status: number | null; url: string }> {
    const page = await this.ensurePage();
    const response = await page.goto(url, {
      waitUntil: options.waitUntil || 'domcontentloaded',
      timeout: options.timeout || 30000,
    });

    return {
      status: response ? response.status() : 200,
      url: page.url(),
    };
  }

  public async screenshot(options: {
    fullPage?: boolean;
    savePath?: string;
  } = {}): Promise<ScreenshotResult> {
    const page = await this.ensurePage();
    const buffer = await page.screenshot({
      fullPage: options.fullPage ?? false,
      type: 'png',
    });

    const uint8Array = new Uint8Array(buffer);
    const base64 = Buffer.from(uint8Array).toString('base64');
    const vp = page.viewport() || { width: 1280, height: 800 };

    let filePath: string | undefined = undefined;
    if (options.savePath) {
      const dir = path.dirname(options.savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(options.savePath, uint8Array);
      filePath = path.resolve(options.savePath);
    }

    return {
      filePath,
      base64,
      mimeType: 'image/png',
      width: vp.width,
      height: vp.height,
    };
  }

  public async click(selectorOrCoords: { selector?: string; x?: number; y?: number }): Promise<void> {
    const page = await this.ensurePage();
    if (typeof selectorOrCoords.x === 'number' && typeof selectorOrCoords.y === 'number') {
      await page.mouse.click(selectorOrCoords.x, selectorOrCoords.y);
    } else if (selectorOrCoords.selector) {
      await page.waitForSelector(selectorOrCoords.selector, { timeout: 8000 });
      await page.click(selectorOrCoords.selector);
    } else {
      throw new Error('Either selector or x & y coordinates must be provided to click.');
    }
  }

  public async type(selector: string, text: string, options: { clear?: boolean; delay?: number } = {}): Promise<void> {
    const page = await this.ensurePage();
    await page.waitForSelector(selector, { timeout: 8000 });
    if (options.clear) {
      await page.click(selector, { clickCount: 3 });
      await page.keyboard.press('Backspace');
    }
    await page.type(selector, text, { delay: options.delay || 20 });
  }

  public async evaluate<T = unknown>(script: string): Promise<T> {
    const page = await this.ensurePage();
    return (await page.evaluate(script)) as T;
  }

  public async getDom(selector?: string): Promise<string> {
    const page = await this.ensurePage();
    if (selector) {
      const html = await page.$eval(selector, (el) => el.outerHTML);
      return html;
    }
    return await page.content();
  }

  public async getInteractiveElements(): Promise<
    Array<{ tagName: string; id?: string; className?: string; text?: string; selector: string; rect: { x: number; y: number; width: number; height: number } }>
  > {
    const page = await this.ensurePage();
    return await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>('button, a, input, select, textarea, [role="button"], canvas'));
      return elements.map((el) => {
        const r = el.getBoundingClientRect();
        const id = el.id ? `#${el.id}` : '';
        const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '';
        const tag = el.tagName.toLowerCase();
        const selector = id || `${tag}${cls}` || tag;
        return {
          tagName: tag,
          id: el.id || undefined,
          className: (el.className as string) || undefined,
          text: (el.textContent || '').trim().slice(0, 50) || undefined,
          selector,
          rect: {
            x: Math.round(r.x),
            y: Math.round(r.y),
            width: Math.round(r.width),
            height: Math.round(r.height),
          },
        };
      });
    });
  }

  public async scroll(direction: 'down' | 'up', amount = 400): Promise<void> {
    const page = await this.ensurePage();
    await page.evaluate(
      (dir, amt) => {
        window.scrollBy(0, dir === 'down' ? amt : -amt);
      },
      direction,
      amount
    );
  }

  public getLogs(): Array<{ type: string; text: string; timestamp: string }> {
    return [...this.consoleLogs];
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
