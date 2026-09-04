import { AutonomousBrowser } from './dist/browser.js';
import path from 'node:path';

async function test() {
  console.log('--- Testing Autonomous Browser with Local Chrome ---');
  const browser = new AutonomousBrowser();
  
  try {
    const url = 'https://screen-watcher-elite.github.io/tensorforge/#a=1.50&b=0.50&c=0.50&d=1.20&m=transform';
    console.log(`Navigating to: ${url}`);
    const nav = await browser.navigate(url);
    console.log('Navigation result:', nav);

    const title = await browser.evaluate('document.title');
    console.log('Page Title:', title);

    const matrixValues = await browser.evaluate(`
      ({
        a: document.getElementById('mat-a')?.value,
        b: document.getElementById('mat-b')?.value,
        c: document.getElementById('mat-c')?.value,
        d: document.getElementById('mat-d')?.value,
        det: document.getElementById('telemetry-det')?.textContent,
        trace: document.getElementById('telemetry-trace')?.textContent,
      })
    `);
    console.log('DOM Matrix & Telemetry values:', matrixValues);

    const screenshotPath = path.resolve('./live-tensorforge-screenshot.png');
    console.log(`Capturing screenshot to: ${screenshotPath}`);
    const ss = await browser.screenshot({ savePath: screenshotPath });
    console.log(`Screenshot saved successfully! Width: ${ss.width}, Height: ${ss.height}, Size: ${ss.base64.length} base64 chars.`);

    console.log('Interactive elements sample:');
    const elements = await browser.getInteractiveElements();
    console.log(`Found ${elements.length} interactive elements on the page.`);
    console.log('First 5 elements:', elements.slice(0, 5));

    console.log('--- Test Completed Successfully! ---');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
  }
}

test();
