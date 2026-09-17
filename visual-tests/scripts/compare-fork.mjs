/**
 * Compares screenshots against the golden records without any credentials.
 *
 * Fork and Dependabot pull requests run on a downgraded token and receive no
 * Actions secrets, so they cannot authenticate against R2. Guarding the
 * comparison away would delete visual review for every external contributor,
 * which the fork-guard rules in `.ai/CI.md` forbid.
 *
 * The bucket is public-read — that is what makes the report URLs work — so a
 * fork can read the golden records over plain HTTPS, diff locally, and publish
 * nothing. It downloads only the records of the tier this build rendered
 * (`lib/visual-tiers.mjs`) — the same subset `compare.mjs` prunes the fetched
 * goldens to — so a pr-tier render is not reported as having deleted every
 * variant it did not render. It writes the same `.reg/out.json` and
 * `.reg/index.html` that `reg-suit run` produces, so `visual-gate.mjs` gates
 * both paths identically.
 * What a fork does not get is the hosted report URL and the pull request
 * comment, both of which need write access it does not have.
 *
 * Usage: node visual-tests/scripts/compare-fork.mjs [expected-key]
 */

import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { toleranceFlags } from '../lib/tolerance-flags.mjs';
import { isInTier } from '../lib/visual-tiers.mjs';
import { getTier } from './utils/utils.mjs';

const CONCURRENCY = 16;
const ROOT = join(import.meta.dirname, '..');
const WORKING_DIR = join(ROOT, '.reg');
const EXPECTED_DIR = join(WORKING_DIR, 'expected');
const ACTUAL_DIR = join(WORKING_DIR, 'actual');

// The workflow already exports the key, so read it rather than re-deriving the
// scheme here; argv stays as a convenience for running this by hand.
const expectedKey = process.env.REG_EXPECTED_KEY
  || (process.argv[2] ? `base/${process.argv[2]}` : '');
const domain = process.env.VISUAL_REPORT_DOMAIN;

// Golden PNGs are served with a 4-hour max-age and the keys are rewritten in
// place, so a fresh manifest can otherwise be paired with stale cached images.
const cacheBuster = process.env.GITHUB_RUN_ID || String(Date.now());

// The tier the render job used, resolved the way `compare.mjs` resolves it, so
// the downloaded subset matches what `screenshots/` holds. Resolved before the
// fetch: an unknown VISUAL_TIER is a configuration error, not a network one.
const tier = getTier();

/**
 * Read the comparison tolerances from `regconfig.json` so both comparison paths
 * apply the same ones. The mapping itself lives in `lib/tolerance-flags.mjs`,
 * shared with the stability matrix; hard-coding it here would let this path
 * drift into failing on antialiasing noise that a same-repo run tolerates.
 *
 * @returns {Promise<string[]>} `reg-cli` flags.
 */
async function readToleranceFlags() {
  let config;

  try {
    config = JSON.parse(await readFile(join(ROOT, 'regconfig.json'), 'utf-8'));
  } catch (error) {
    // Comparing at different tolerances than the same-repo path would produce a
    // verdict nobody can reproduce, so stop rather than silently use defaults.
    throw new Error(`Could not read regconfig.json for comparison tolerances: ${error.message}`);
  }

  return toleranceFlags(config);
}

/**
 * Resolve a manifest entry inside the expected directory.
 *
 * The manifest is remote input, so a `../`-style entry would otherwise write
 * outside the working directory.
 *
 * @param {string} item Path from the manifest.
 * @returns {string|null} Absolute path, or `null` when it escapes.
 */
function safeTarget(item) {
  const target = resolve(EXPECTED_DIR, item);

  return target.startsWith(EXPECTED_DIR + sep) ? target : null;
}

if (!expectedKey || !domain) {
  console.error('Usage: node visual-tests/scripts/compare-fork.mjs [expected-key]');
  console.error('REG_EXPECTED_KEY (or an argument) and VISUAL_REPORT_DOMAIN must be set.');
  process.exitCode = 1;
} else {
  const goldenUrl = `https://${domain}/${expectedKey}`;
  let manifestResponse;

  try {
    manifestResponse = await fetch(`${goldenUrl}/out.json`);
  } catch (error) {
    console.error(`Could not reach ${goldenUrl}/out.json: ${error.message}`);
    process.exitCode = 1;
  }

  if (manifestResponse && manifestResponse.status === 404) {
    // Seeding needs write credentials this run does not have, so leave the
    // baseline to a same-repo build and let the pull request through rather
    // than blocking an external contributor on missing infrastructure.
    console.log(`No golden records for "${expectedKey}" at ${goldenUrl}/out.json.`);
    console.log('Skipping the comparison: a same-repo build has to seed the baseline first.');
  } else if (manifestResponse && !manifestResponse.ok) {
    // A 403/429/5xx is not "no baseline yet". Reporting it as one would send
    // someone debugging a red check off after a baseline that already exists.
    console.error('Unexpected response fetching the golden records manifest: '
      + `HTTP ${manifestResponse.status} from ${goldenUrl}/out.json.`);
    process.exitCode = 1;
  } else if (manifestResponse) {
    let manifest;

    try {
      manifest = await manifestResponse.json();
    } catch (error) {
      console.error(
        `The golden records manifest at ${goldenUrl}/out.json is not valid JSON: ${error.message}`
      );
      process.exitCode = 1;
    }

    const items = Array.isArray(manifest?.actualItems) ? manifest.actualItems : null;
    const inTier = items ? items.filter(item => isInTier(item, tier.prefixes)) : [];

    if (manifest && (items === null || items.length === 0)) {
      // Treating this as an empty baseline would report every screenshot as new
      // and block with a verdict indistinguishable from a real regression — on
      // the one path that gets no pull request comment to explain it.
      console.error(`The golden records manifest at ${goldenUrl}/out.json lists no screenshots.`);
      console.error('Refusing to compare against an empty baseline; it is more likely truncated '
        + 'or malformed than genuinely empty.');
      process.exitCode = 1;
    } else if (items && inTier.length === 0) {
      // The goldens exist, so this is not the bootstrap path — but none of them
      // is a variant this tier renders. Every tier renders `main` and
      // `main-dark`, so no tier can seed such a baseline: it is an older golden
      // layout or one left half-written by a killed seed, and comparing against
      // it would report every screenshot as new with the same unexplained
      // verdict as above.
      console.error(`Tier "${tier.name}": the golden records at ${goldenUrl} hold none of this tier's `
        + `variants (${tier.prefixes.join(', ')}).`);
      console.error('That is an older golden layout or a half-written baseline, not a subset; a seed-tier '
        + 'build of the base branch has to replace it before this tier can be compared.');
      process.exitCode = 1;
    } else if (items) {
      console.log(`Tier "${tier.name}": comparing ${inTier.length} of ${items.length} golden records.`);
      console.log(`Downloading ${inTier.length} golden records from ${goldenUrl} …`);

      const queue = [...inTier];
      const failures = [];

      const worker = async() => {
        while (queue.length > 0) {
          const item = queue.pop();
          const target = safeTarget(item);

          if (!target) {
            failures.push(`${item} (path escapes the expected directory)`);
            continue;
          }

          let response;

          try {
            response = await fetch(`${goldenUrl}/actual/${item}?v=${cacheBuster}`);
          } catch (error) {
            failures.push(`${item} (${error.message})`);
            continue;
          }

          if (!response.ok) {
            failures.push(`${item} (HTTP ${response.status})`);
            continue;
          }

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
        // reg-cli embeds image paths relative to the report, so pointing it at
        // `../screenshots` would leave every "actual" pane broken in the
        // uploaded artifact — the only report this path produces. reg-suit
        // copies into `.reg/actual` for the same reason; match its layout.
        await cp(join(ROOT, 'screenshots'), ACTUAL_DIR, { recursive: true });

        const flags = await readToleranceFlags();

        console.log(`Comparing with tolerances: ${flags.join(' ') || '(none configured)'}`);

        const exitCode = await new Promise((resolve_) => {
          spawn('npx', [
            '--no', 'reg-cli',
            ACTUAL_DIR,
            EXPECTED_DIR,
            join(WORKING_DIR, 'diff'),
            '-R', join(WORKING_DIR, 'index.html'),
            '-J', join(WORKING_DIR, 'out.json'),
            '-I', // never fail here; visual-gate.mjs owns the verdict
            ...flags,
          ], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' })
            .on('close', resolve_);
        });

        if (exitCode !== 0) {
          console.error(`reg-cli exited with ${exitCode}.`);
          process.exitCode = 1;
        }
      }
    }
  }
}
