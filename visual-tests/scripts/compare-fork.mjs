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

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

const CONCURRENCY = 16;
const ROOT = join(import.meta.dirname, '..');
const WORKING_DIR = join(ROOT, '.reg');
const EXPECTED_DIR = join(WORKING_DIR, 'expected');

const [baseBranch] = process.argv.slice(2);
const domain = process.env.VISUAL_REPORT_DOMAIN;

/**
 * Read the comparison tolerances from `regconfig.json` so both comparison paths
 * apply the same ones. Hard-coding them here would let the fork path drift into
 * failing on antialiasing noise that a same-repo run tolerates.
 *
 * @returns {Promise<string[]>} `reg-cli` flags.
 */
async function toleranceFlags() {
  const config = JSON.parse(await readFile(join(ROOT, 'regconfig.json'), 'utf-8'));
  const core = config.core ?? {};
  const flags = [];

  if (core.enableAntialias) {
    flags.push('-A');
  }

  if (core.thresholdPixel !== undefined) {
    flags.push('-S', String(core.thresholdPixel));
  }

  if (core.thresholdRate !== undefined) {
    flags.push('-T', String(core.thresholdRate));
  }

  if (core.matchingThreshold !== undefined) {
    flags.push('-M', String(core.matchingThreshold));
  }

  return flags;
}

if (!baseBranch || !domain) {
  console.error('Usage: node visual-tests/scripts/compare-fork.mjs <base-branch>');
  console.error('VISUAL_REPORT_DOMAIN must be set.');
  process.exitCode = 1;
}

if (baseBranch && domain) {
  const goldenUrl = `https://${domain}/base/${baseBranch}`;
  let manifestResponse;

  try {
    manifestResponse = await fetch(`${goldenUrl}/out.json`);
  } catch (error) {
    console.error(`Could not reach ${goldenUrl}/out.json: ${error.message}`);
    process.exitCode = 1;
  }

  if (manifestResponse && manifestResponse.status !== 404 && !manifestResponse.ok) {
    // A 403/429/5xx is not "no baseline yet". Reporting it as one would send
    // someone debugging a red check off after a baseline that already exists.
    console.error('Unexpected response fetching the golden records manifest: '
      + `HTTP ${manifestResponse.status} from ${goldenUrl}/out.json.`);
    process.exitCode = 1;
  } else if (manifestResponse && manifestResponse.status === 404) {
    // Seeding needs write credentials this run does not have, so leave the
    // baseline to a same-repo build and let the pull request through rather
    // than blocking an external contributor on missing infrastructure.
    console.log(`No golden records for "${baseBranch}" at ${goldenUrl}/out.json `
      + `(HTTP ${manifestResponse.status}).`);
    console.log('Skipping the comparison: a same-repo build has to seed the baseline first.');
  } else if (manifestResponse) {
    const manifest = await manifestResponse.json();
    const items = manifest.actualItems ?? [];

    console.log(`Downloading ${items.length} golden records from ${goldenUrl} …`);

    const queue = [...items];
    const failures = [];

    const worker = async() => {
      while (queue.length > 0) {
        const item = queue.pop();
        let response;

        try {
          response = await fetch(`${goldenUrl}/actual/${item}`);
        } catch (error) {
          failures.push(`${item} (${error.message})`);
          continue;
        }

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

      const flags = await toleranceFlags();

      console.log(`Comparing with tolerances: ${flags.join(' ') || '(none configured)'}`);

      const exitCode = await new Promise((resolve) => {
        spawn('npx', [
          '--no', 'reg-cli',
          join(ROOT, 'screenshots'),
          EXPECTED_DIR,
          join(WORKING_DIR, 'diff'),
          '-R', join(WORKING_DIR, 'index.html'),
          '-J', join(WORKING_DIR, 'out.json'),
          '-I', // never fail here; visual-gate.mjs owns the verdict
          ...flags,
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
