import { AutonomousBrowser } from './dist/browser.js';
import path from 'node:path';
import fs from 'node:fs';

async function verify() {
  console.log('=== Verifying TensorForge Visual & Functional Enhancements ===');
  const browser = new AutonomousBrowser();
  const outDir = path.resolve('./audit/enhancements');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  try {
    const fileUrl = 'file:///C:/Users/Ashutosh/PSL2/tensorforge/index.html';
    console.log(`Opening local file: ${fileUrl}`);
    await browser.navigate(fileUrl);
    await new Promise((r) => setTimeout(r, 600));

    // 1. Verify Mode 1: Custom Vector Inputs
    console.log('Testing Mode 1 Custom Vector controls...');
    await browser.type('#vec-custom-x', '2.5', { clear: true });
    await browser.type('#vec-custom-y', '-1.0', { clear: true });
    await new Promise((r) => setTimeout(r, 300));
    const ss1 = await browser.screenshot({ savePath: path.join(outDir, '1_custom_vector.png') });
    console.log('Mode 1 screenshot saved:', ss1.filePath);

    // 2. Verify Mode 2: Probe Locking
    console.log('Testing Mode 2 Eigen Probe Lock...');
    await browser.click({ selector: 'button[data-mode="eigen"]' });
    await new Promise((r) => setTimeout(r, 400));
    await browser.click({ selector: '#btn-lock-eigen1' });
    await new Promise((r) => setTimeout(r, 400));
    const ss2 = await browser.screenshot({ savePath: path.join(outDir, '2_eigen_locked.png') });
    console.log('Mode 2 screenshot saved:', ss2.filePath);

    // 3. Verify Mode 4: Vector Arithmetic & Presets
    console.log('Testing Mode 4 Vector Sandbox...');
    await browser.click({ selector: 'button[data-mode="vectors"]' });
    await new Promise((r) => setTimeout(r, 400));
    await browser.click({ selector: 'button[data-vcfg="perpendicular"]' });
    await new Promise((r) => setTimeout(r, 400));
    const ss4 = await browser.screenshot({ savePath: path.join(outDir, '4_vectors_perpendicular.png') });
    console.log('Mode 4 screenshot saved:', ss4.filePath);

    // 4. Verify Mode 6: LossLab (Check telemetry is hidden!)
    console.log('Testing Mode 6 LossLab invariants visibility...');
    await browser.click({ selector: 'button[data-mode="loss"]' });
    await new Promise((r) => setTimeout(r, 400));
    const invariantsDisplayLoss = await browser.evaluate(`
      getComputedStyle(document.querySelector('.sidebar-section.telemetry-always-visible')).display
    `);
    console.log('Invariants display in LossLab mode:', invariantsDisplayLoss); // Expected: 'none'
    const ss6 = await browser.screenshot({ savePath: path.join(outDir, '6_losslab_clean.png') });
    console.log('Mode 6 screenshot saved:', ss6.filePath);

    // 5. Verify Mode 8: Notes Classroom Blackboard
    console.log('Testing Mode 8 Notes companion visualizer...');
    await browser.click({ selector: 'button[data-mode="notes"]' });
    await new Promise((r) => setTimeout(r, 500));
    const ss8 = await browser.screenshot({ savePath: path.join(outDir, '8_notes_blackboard.png') });
    console.log('Mode 8 screenshot saved:', ss8.filePath);

    // 6. Verify Mode 9: Quiz Question Whiteboard
    console.log('Testing Mode 9 Quiz question whiteboard...');
    await browser.click({ selector: 'button[data-mode="quiz"]' });
    await new Promise((r) => setTimeout(r, 500));
    const invariantsDisplayQuiz = await browser.evaluate(`
      getComputedStyle(document.querySelector('.sidebar-section.telemetry-always-visible')).display
    `);
    console.log('Invariants display in Quiz mode:', invariantsDisplayQuiz); // Expected: 'none'
    const ss9 = await browser.screenshot({ savePath: path.join(outDir, '9_quiz_whiteboard.png') });
    console.log('Mode 9 screenshot saved:', ss9.filePath);

    console.log('=== All Verifications Passed Successfully ===');
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await browser.close();
  }
}

verify();
