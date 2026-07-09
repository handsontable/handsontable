#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook (Edit|Write). Two jobs, both scoped to stay fast:
 *   1. Record the edited path to a per-session list, so the Stop hook knows what
 *      the turn touched (a Stop hook receives no file path).
 *   2. If a spec was edited, lint it (`eslint --fix`) and feed lint errors back
 *      to the model via exit 2, so determinism rules are applied at authoring
 *      time.
 *
 * Reads the tool payload as JSON on stdin (there is no $CLAUDE_TOOL_FILE_PATH).
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { sessionEditsFile } from './session.mjs';

/**
 * Read all of stdin synchronously.
 *
 * @returns {string} Raw stdin contents (empty string if none).
 */
function readStdin() {
  try {
    return spawnSync('cat', { stdio: ['inherit', 'pipe', 'ignore'], encoding: 'utf8' }).stdout || '';
  } catch {
    return '';
  }
}

const raw = readStdin();
let payload = {};

try {
  payload = JSON.parse(raw);
} catch { /* no/!json stdin — nothing to do */ }

const file = payload?.tool_input?.file_path;

if (!file) {
  process.exit(0);
}

const sessionId = payload?.session_id || 'default';
const editsFile = sessionEditsFile(sessionId);

try {
  mkdirSync(path.dirname(editsFile), { recursive: true });
  appendFileSync(editsFile, `${file}\n`);
} catch { /* recording is best-effort */ }

// Lint edited specs only — running the full typed ESLint on every core .ts edit
// is too slow for the edit loop.
if (/\.(spec|unit)\.[jt]sx?$/.test(file)) {
  const res = spawnSync('npx', ['eslint', '--fix', file], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  const output = `${res.stdout || ''}${res.stderr || ''}`;
  // Only block on genuine rule violations. A parsing error or eslint's own error
  // (status 2) means no applicable config for this file type — do not blame the
  // model for that. Both the frozen Jasmine suite (handsontable/.eslintrc.js)
  // and the Playwright tier (tests/.eslintrc.cjs) now have configs, so real
  // determinism violations DO surface here and block; the guard only covers
  // file types that still lack a config.
  const configGap = res.status === 2 || /Parsing error/i.test(output);

  if (res.status === 1 && !configGap) {
    process.stderr.write(`Lint errors in ${file}:\n${output}`);
    process.exit(2);
  }
}

process.exit(0);
