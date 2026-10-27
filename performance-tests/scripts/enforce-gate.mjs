#!/usr/bin/env node
//
// The performance gate's enforce step: reads output/verdict.json and the pull request's description,
// prints the annotation, and sets the exit code. The judgement is lib/gate-enforce.mjs.
//
// Environment:
//   PERF_PR_BODY_FILE  the LIVE description, written by the workflow's github-script step
//   PERF_PR_BODY       the event payload's description, used only when the live read failed
//
// Usage: node performance-tests/scripts/enforce-gate.mjs

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GATE_VERDICT_FILE, formatGateNotice } from '../lib/gate.mjs';
import { enforcement } from '../lib/gate-enforce.mjs';

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

/**
 * @returns {Promise<string>} the live description, else the payload's, else ''
 */
async function readBody() {
  if (process.env.PERF_PR_BODY_FILE) {
    try {
      return await readFile(process.env.PERF_PR_BODY_FILE, 'utf8');
    } catch {
      // The live read was skipped or failed: fall back to the payload below.
    }
  }

  return process.env.PERF_PR_BODY ?? '';
}

const verdict = await readVerdict();
const { exitCode, lines } = enforcement({ verdict, body: await readBody() });

// One per pull request run, with the final verdict (after any confirm re-run): the warn period is
// counted from these lines.
if (verdict) {
  console.log(formatGateNotice(verdict));
}

for (const line of lines) {
  console.log(line);
}

process.exitCode = exitCode;
