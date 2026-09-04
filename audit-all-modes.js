import { AutonomousBrowser } from './dist/browser.js';
import path from 'node:path';
import fs from 'node:fs';

const MODES = [
  { id: 'transform', name: '1_2d_matrix' },
  { id: 'eigen', name: '2_eigen' },
  { id: 'mult', name: '3_matrix_mult' },
  { id: 'vectors', name: '4_vectors' },
  { id: '3d', name: '5_3d_space' },
  { id: 'loss', name: '6_losslab' },
  { id: 'autograd', name: '7_autograd' },
  { id: 'notes', name: '8_notes' },
  { id: 'quiz', name: '9_quiz' }
];

async function runAudit() {
  console.log('=== Starting Thorough Visual & Functional Audit of TensorForge ===');
  const browser = new AutonomousBrowser();
  const auditDir = path.resolve('./audit');
  if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });

  const auditReport = [];

  try {
    const baseUrl = 'https://screen-watcher-elite.github.io/tensorforge/';
    console.log(`Loading: ${baseUrl}`);
    await browser.navigate(baseUrl, { waitUntil: 'networkidle0' });

    for (const m of MODES) {
      console.log(`\n--- Auditing Mode: ${m.name} (${m.id}) ---`);
      
      // Click mode tab
      await browser.click({ selector: `button[data-mode="${m.id}"]` });
      // Small pause for transitions
      await new Promise((r) => setTimeout(r, 600));

      const screenshotPath = path.join(auditDir, `${m.name}.png`);
      const ss = await browser.screenshot({ savePath: screenshotPath });
      console.log(`Saved screenshot to: ${screenshotPath} (${ss.width}x${ss.height})`);

      // Inspect mode state and check for any layout issues
      const telemetry = await browser.evaluate(`
        ({
          activePanel: document.querySelector('.mode-panel.active')?.id,
          sidebarScrollHeight: document.querySelector('.control-sidebar')?.scrollHeight,
          sidebarClientHeight: document.querySelector('.control-sidebar')?.clientHeight,
          invariantsVisible: getComputedStyle(document.querySelector('.sidebar-section.telemetry-always-visible') || document.body).display !== 'none',
          bodyOverflowX: document.body.scrollWidth > window.innerWidth,
          canvasWidth: document.getElementById('matrix-canvas')?.width,
          canvasHeight: document.getElementById('matrix-canvas')?.height,
        })
      `);

      const logs = browser.getLogs().filter(l => l.type === 'error' || l.type === 'uncaught-error');

      auditReport.push({
        mode: m.id,
        name: m.name,
        screenshot: screenshotPath,
        telemetry,
        errors: logs.length > 0 ? logs : 'none'
      });
      console.log('Telemetry:', telemetry);
    }

    fs.writeFileSync(path.join(auditDir, 'audit_report.json'), JSON.stringify(auditReport, null, 2));
    console.log('\n=== Visual Audit Completed Successfully ===');
  } catch (err) {
    console.error('Audit encountered error:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
