/**
 * Writes the visual compare record for the flake ledger (`../lib/visual-compare-record.mjs`).
 *
 * Runs as its own step of `visual.yml`'s Compare job, right after the two comparison steps, so the
 * credentialed and the credential-free paths both leave a record. It reads `.reg/out.json` and the snapshot
 * keys, hashes each changed and new item's render in `.reg/actual/` (reg-suit copies `screenshots/` there on
 * the credentialed path; `compare-fork.mjs` copies it on the other), stamps the items a live quarantine entry
 * covers, and writes `.reg/visual-compare-<tier>-<sha>.json` for the upload step.
 *
 * It never fails the job. The record is evidence for the ledger, not a verdict, so a problem writing it is a
 * `::warning` and a missing record, never a red Compare over an otherwise fine build.
 *
 * Usage: node visual-tests/scripts/compare-record.mjs
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildRecord, recordFileName } from '../lib/visual-compare-record.mjs';
import { quarantineLookup } from '../lib/visual-quarantine.mjs';
import { readQuarantineEntries } from './utils/quarantine.mjs';

const PACKAGE_ROOT = join(import.meta.dirname, '..');
const REG_DIR = join(PACKAGE_ROOT, '.reg');

try {
  let report = null;

  try {
    report = JSON.parse(readFileSync(join(REG_DIR, 'out.json'), 'utf8'));
  } catch (error) {
    // A bootstrap run, or a comparison step that died: the record says nothing was compared.
    console.log(`No comparison result read (${error.message}); the record lists no items.`);
  }

  const crossBrowserSpecs = readdirSync(join(PACKAGE_ROOT, 'tests', 'cross-browser'))
    .filter(name => name.endsWith('.spec.ts'))
    .map(name => name.slice(0, -'.spec.ts'.length));
  const hashOf = (item) => {
    const file = join(REG_DIR, 'actual', item);

    return existsSync(file) ? createHash('sha256').update(readFileSync(file)).digest('hex') : null;
  };
  const tier = process.env.VISUAL_TIER || 'unknown';
  // A pull request's own head, not the merge commit GitHub builds: the ledger and a reader comparing two
  // runs both think in the commit the author pushed.
  const sha = process.env.HEAD_SHA || process.env.GITHUB_SHA || '';
  const record = buildRecord({
    report,
    tier,
    keys: { expected: process.env.REG_EXPECTED_KEY ?? '', actual: process.env.REG_ACTUAL_KEY ?? '' },
    run: {
      branch: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || '',
      sha,
      event: process.env.GITHUB_EVENT_NAME ?? '',
      runId: process.env.GITHUB_RUN_ID ?? '',
      runAttempt: Number(process.env.GITHUB_RUN_ATTEMPT ?? 1),
    },
    crossBrowserSpecs,
    hashOf,
    quarantineOf: quarantineLookup(readQuarantineEntries(process.env.VISUAL_QUARANTINE_FILE), new Date()),
  });
  const file = join(REG_DIR, recordFileName(tier, sha));

  mkdirSync(REG_DIR, { recursive: true });
  writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
  console.log(`Visual compare record: ${record.items.length} differing item(s) of `
    + `${record.counts.passed + record.counts.changed + record.counts.new} compared, written to ${file}.`);
} catch (error) {
  console.log(`::warning title=Visual compare record::No record was written for the flake ledger: ${error.message}`);
}
