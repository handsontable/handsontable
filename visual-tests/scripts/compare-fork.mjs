/**
 * Compares screenshots against the golden records without any credentials.
 *
 * Fork and Dependabot pull requests run on a downgraded token and receive no
 * Actions secrets, so they cannot authenticate against R2. Guarding the
 * comparison away would delete visual review for every external contributor,
 * which the fork-guard rules in the root `AGENTS.md` forbid.
 *
 * The bucket is public-read — that is what makes the report URLs work — so a
 * fork can read the golden records over plain HTTPS, diff locally, and publish
 * nothing. It writes the same `.reg/out.json` and `.reg/index.html` that
 * `reg-suit run` produces, so `visual-gate.mjs` gates both paths identically.
 * What a fork does not get is the hosted report URL and the pull request
 * comment, both of which need write access it does not have.
 *
 * Usage: node visual-tests/scripts/compare-fork.mjs <base-branch>
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

const CONCURRENCY = 16;
const ROOT = join(import.meta.dirname, '..');
const WORKING_DIR = join(ROOT, '.reg');
const EXPECTED_DIR = join(WORKING_DIR, 'expected');

const [baseBranch] = process.argv.slice(2);
const domain = process.env.VISUAL_REPORT_DOMAIN;

if (!baseBranch || !domain) {
  console.error('Usage: node visual-tests/scripts/compare-fork.mjs <base-branch>');
  console.error('VISUAL_REPORT_DOMAIN must be set.');
  process.exitCode = 1;
}

if (baseBranch && domain) {
  const goldenUrl = `https://${domain}/base/${baseBranch}`;
  const manifestResponse = await fetch(`${goldenUrl}/out.json`);

  if (!manifestResponse.ok) {
    console.error(`No golden records for "${baseBranch}" at ${goldenUrl}/out.json `
      + `(HTTP ${manifestResponse.status}).`);
    console.error('A build of that branch has to publish its golden records first.');
    process.exitCode = 1;
  } else {
    const manifest = await manifestResponse.json();
    const items = manifest.actualItems ?? [];

    console.log(`Downloading ${items.length} golden records from ${goldenUrl} …`);

    const queue = [...items];
    const failures = [];

    const worker = async() => {
      while (queue.length > 0) {
        const item = queue.pop();
        const response = await fetch(`${goldenUrl}/actual/${item}`);

        if (!response.ok) {
          failures.push(`${item} (HTTP ${response.status})`);
          continue;
        }

        const target = join(EXPECTED_DIR, item);

        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, Buffer.from(await response.arrayBuffer()));
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    if (failures.length > 0) {
      console.error(`Could not download ${failures.length} golden records, for example:`);
      failures.slice(0, 5).forEach(f => console.error(`  ${f}`));
      process.exitCode = 1;
    } else {
      console.log('Comparing …');

      const exitCode = await new Promise((resolve) => {
        spawn('npx', [
          '--no', 'reg-cli',
          join(ROOT, 'screenshots'),
          EXPECTED_DIR,
          join(WORKING_DIR, 'diff'),
          '-R', join(WORKING_DIR, 'index.html'),
          '-J', join(WORKING_DIR, 'out.json'),
          '-I', // never fail here; visual-gate.mjs owns the verdict
        ], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' })
          .on('close', resolve);
      });

      if (exitCode !== 0) {
        console.error(`reg-cli exited with ${exitCode}.`);
        process.exitCode = 1;
      }
    }
  }
}
