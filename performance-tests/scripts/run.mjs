// Orchestrator: build Handsontable UMD, copy dist + styles into fixtures/, run Playwright scenarios.
//
// Usage:
//   node scripts/run.mjs                    # run scenarios, generate report
//   PERF_MODE=golden  node scripts/run.mjs  # run scenarios, save golden snapshots
//   PERF_MODE=compare node scripts/run.mjs  # run scenarios, compare to golden

import { exec } from 'node:child_process';
import { readdir, mkdir, copyFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const ROOT = join(import.meta.dirname, '..');
const HOT_DIR = join(ROOT, '..', 'handsontable');
const FIXTURES_DIR = join(ROOT, 'fixtures');

const WORKSPACE_ROOT = join(ROOT, '..');

const exists = p => access(p).then(() => true, () => false);

async function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  const { stdout, stderr } = await execAsync(cmd, { ...opts, maxBuffer: 50 * 1024 * 1024 });

  if (stdout) { console.log(stdout); }
  if (stderr) { console.error(stderr); }
}

// 1. Install workspace dependencies (provides cross-env-shell, webpack, etc.)
console.log('\n=== Installing workspace dependencies ===\n');
await run('PUPPETEER_SKIP_DOWNLOAD=true pnpm install', { cwd: WORKSPACE_ROOT });

// 2. Install performance-tests own dependencies
console.log('\n=== Installing performance-tests dependencies ===\n');
await run('npm install', { cwd: ROOT });

// 3. Build Handsontable UMD + languages
console.log('\n=== Building Handsontable UMD ===\n');
await run('npm run build:umd', { cwd: HOT_DIR });
await run('npm run build:languages', { cwd: HOT_DIR });

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

// 6. Run Playwright tests
console.log('\n=== Running performance scenarios ===\n');
await run('npx playwright test', { cwd: ROOT });

// 7. If golden mode, copy snapshots
const mode = process.env.PERF_MODE;

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
