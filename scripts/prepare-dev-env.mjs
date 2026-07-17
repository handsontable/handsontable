#!/usr/bin/env node
/**
 * Root `prepare` script — runs on every `pnpm install` at the workspace root.
 * Sets up the local dev environment so enforcement works out of the box:
 *   1. `lefthook install` — wires the pre-commit / pre-push git hooks.
 *   2. Sync `.claude/skills/` → `.cursor/rules/` — Cursor devs get the same
 *      guidance as Claude without a manual step (the .mdc files are gitignored,
 *      generated artifacts).
 *
 * Best-effort by design: a failure prints a loud warning but never breaks the
 * install (CI installs too, where hooks and Cursor rules are irrelevant — CI
 * gates are the authoritative mirror). Skipped entirely when CI is set.
 */
import { spawnSync } from 'node:child_process';

// npx/npm are .cmd shims on Windows; spawnSync needs a shell there or it ENOENTs
// (lefthook would then never install and Windows devs would get no local hooks).
const WIN = process.platform === 'win32';

if (process.env.CI) {
  process.exit(0);
}

/**
 * Run a step, warning loudly on failure without failing the install.
 *
 * @param {string} label Human-readable step name.
 * @param {string[]} cmd Command and args.
 * @returns {void}
 */
function step(label, cmd) {
  const res = spawnSync(cmd[0], cmd.slice(1), { stdio: 'inherit', shell: WIN });

  if (res.status !== 0) {
    console.warn(`\n⚠️  prepare: "${label}" failed (${cmd.join(' ')}). ` +
      'Local enforcement may be incomplete — run it manually. CI gates still apply.\n');
  }
}

step('install git hooks (lefthook)', ['npx', '--no', 'lefthook', 'install']);
step('sync skills to Cursor rules', ['node', 'scripts/sync-skills-to-cursor.mjs']);
