#!/usr/bin/env node
//
// The performance gate's enforce step: reads output/verdict.json, exports the `verdict` output that
// performance.yml's `approve` job keys on, prints the annotation, and sets the exit code. The
// judgement is lib/gate-enforce.mjs.
//
// Usage: node performance-tests/scripts/enforce-gate.mjs

import { appendFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GATE_VERDICT_FILE, formatGateNotice } from '../lib/gate.mjs';
import { OUTCOMES, describeFailure, enforcement } from '../lib/gate-enforce.mjs';

const VERDICT_PATH = join(import.meta.dirname, '..', 'output', GATE_VERDICT_FILE);

/**
 * @returns {Promise<object | null>} the verdict, or null when the file is missing or unreadable
 */
async function readVerdict() {
  try {
    return JSON.parse(await readFile(VERDICT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

const verdict = await readVerdict();
const result = enforcement({ verdict });

// Written BEFORE the exit code is set, so every run that gets this far exports a verdict: an unset
// output skips `approve`, which is only safe on a run that is red anyway.
if (process.env.GITHUB_OUTPUT) {
  // What regressed, on one line, for the comment the `approve` job writes once a reviewer approved.
  const summary = result.outcome === OUTCOMES.REGRESSED
    ? describeFailure(verdict).replace(/[\r\n]+/g, ' ')
    : '';

  await appendFile(process.env.GITHUB_OUTPUT, `verdict=${result.outcome}\nsummary=${summary}\n`);
}

// One per pull request run, with the final verdict (after any confirm re-run): the warn period is
// counted from these lines.
if (verdict) {
  console.log(formatGateNotice(verdict));
}

for (const line of result.lines) {
  console.log(line);
}

process.exitCode = result.exitCode;
