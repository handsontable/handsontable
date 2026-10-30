// Orchestrator: build Handsontable UMD, copy dist + styles into fixtures/, run Playwright scenarios.
//
// Usage:
//   node scripts/run.mjs                    # run scenarios, generate report
//   PERF_MODE=golden  node scripts/run.mjs  # run scenarios, save golden snapshots
//   PERF_MODE=compare node scripts/run.mjs  # run scenarios, compare to golden
//   PERF_MODE=compare PERF_GATED=1 node scripts/run.mjs  # ...and re-run the failing ones, as CI does

import { exec, spawn } from 'node:child_process';
import { readdir, mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { exists } from '../lib/fs-utils.mjs';
import { runWithConfirmPass } from '../lib/confirm-pass.mjs';

const execAsync = promisify(exec);

const ROOT = join(import.meta.dirname, '..');
const HOT_DIR = join(ROOT, '..', 'handsontable');
const FIXTURES_DIR = join(ROOT, 'fixtures');

const WORKSPACE_ROOT = join(ROOT, '..');

async function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  const { stdout, stderr } = await execAsync(cmd, { ...opts, maxBuffer: 50 * 1024 * 1024 });

  if (stdout) {
    console.log(stdout);
  }

  if (stderr) {
    console.error(stderr);
  }
}

// 1. Install workspace dependencies (provides cross-env-shell, webpack, etc.)
console.log('\n=== Installing workspace dependencies ===\n');
await run('pnpm install', {
  cwd: WORKSPACE_ROOT,
  env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: 'true' },
});

// 2. Install performance-tests own dependencies
console.log('\n=== Installing performance-tests dependencies ===\n');
await run('npm install', { cwd: ROOT });

// 3. Build Handsontable UMD + languages — unless the caller already provides a
// built dist (HOT_PREBUILT=1: the PR pipeline downloads the shared UMD build
// artifact, so rebuilding here would duplicate work and could even measure a
// differently-produced bundle than the one the test jobs used).
if (process.env.HOT_PREBUILT) {
  console.log('\n=== Using prebuilt Handsontable dist (HOT_PREBUILT=1) ===\n');
} else {
  console.log('\n=== Building Handsontable UMD ===\n');
  await run('npm run build:umd', { cwd: HOT_DIR });
  await run('npm run build:languages', { cwd: HOT_DIR });
}

// 4. Copy dist + styles into fixtures/
console.log('\n=== Copying build artifacts to fixtures/ ===\n');
await mkdir(FIXTURES_DIR, { recursive: true });

const distDir = join(HOT_DIR, 'dist');
const stylesDir = join(HOT_DIR, 'styles');

for (const file of await readdir(distDir)) {
  if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.map')) {
    await copyFile(join(distDir, file), join(FIXTURES_DIR, file));
  }
}

// Copy CSS files from styles/
if (await exists(stylesDir)) {
  for (const file of await readdir(stylesDir)) {
    if (file.endsWith('.css') || file.endsWith('.map')) {
      await copyFile(join(stylesDir, file), join(FIXTURES_DIR, file));
    }
  }
}

// 5. Install Playwright chromium (idempotent)
console.log('\n=== Installing Playwright Chromium ===\n');
await run('npx playwright install chromium', { cwd: ROOT });

/**
 * Runs Playwright, streaming its output so the GitHub Actions log shows progress.
 *
 * @param {string[]} [files] -- spec files to run; all of them when empty
 * @param {Record<string, string>} [env] -- added to this process's environment
 * @returns {Promise<void>}
 */
function runPlaywright(files = [], env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['playwright', 'test', ...files], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...env },
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Playwright exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

// 6. Run Playwright tests. 7. On a pull request run the gate acts on, re-run the scenarios it failed,
// and let the verdict stand only for those that fail again (lib/gate.mjs, CONFIRM_MAX_SCENARIOS). The
// re-run's own global teardown writes the final reports and verdict.
console.log('\n=== Running performance scenarios ===\n');
await runWithConfirmPass({ outputDir: join(ROOT, 'output'), env: process.env, runPlaywright });

const mode = process.env.PERF_MODE;

// 8. If golden mode, copy snapshots
if (mode === 'golden') {
  const goldenDir = join(ROOT, 'golden');
  const snapshotsSource = join(ROOT, 'output', 'snapshots.json');

  if (await exists(snapshotsSource)) {
    await mkdir(goldenDir, { recursive: true });
    await copyFile(snapshotsSource, join(goldenDir, 'snapshots.json'));
    console.log('\n=== Golden snapshots saved to golden/snapshots.json ===\n');
  } else {
    console.error('\nWARN: output/snapshots.json not found -- golden snapshot not saved\n');
  }
}

console.log('\n=== Done ===\n');
