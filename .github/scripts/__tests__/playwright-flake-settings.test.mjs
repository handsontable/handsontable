import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// tests/AGENTS.md ("Where a flake goes"): a Playwright `flaky` outcome reaches the cross-run ledger
// (.github/workflows/test-health.yml, logic in ../lib/test-health.mjs) only because the leg goes red.
// e2e.yml uploads the report the ledger reads on `failure()` or a quarantined flake, nothing else.
// So one-token edits to the CI settings in tests/playwright.config.ts blind the ledger while every
// suite stays green. tests/e2e/quarantine-policy.spec.ts writes its own synthetic config, so it does
// not guard the real one; test-health.test.mjs pins only the report path. This pins the settings.
//
// Text-based, like the report-path pin: the tooling job installs no dependencies, so the config
// (and Playwright's `defineConfig`) cannot be imported.

const CONFIG = 'tests/playwright.config.ts';
const LEDGER_DOC = 'See tests/AGENTS.md, "Where a flake goes".';

// Comments are dropped so a commented-out setting neither satisfies the pin nor counts as a second
// one. A line comment must follow whitespace or start the line, which keeps `http://` intact.
const code = readFileSync(path.join(repoRoot(), CONFIG), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|\s)\/\/.*$/gm, '$1');

/**
 * Returns the value of every `key:` property in the config, whitespace-normalized. A second
 * match is a duplicate key or a per-project override (Playwright's `TestProject` takes `retries`
 * too), and either one decides what CI runs, so the pin expects exactly one.
 *
 * @param {string} key The config property name.
 * @returns {string[]} The property values in source order.
 */
function settingValues(key) {
  return [...code.matchAll(new RegExp(`\\b${key}\\s*:\\s*([^,\\n}]+)`, 'g'))]
    .map(([, value]) => value.trim().replace(/\s+/g, ' '));
}

const PINS = [
  {
    key: 'failOnFlakyTests',
    value: '!!process.env.CI',
    why: 'Without it a test that fails and then passes on retry leaves the leg green, e2e.yml uploads '
      + 'no Playwright report (it uploads only on failure() or a quarantined flake), and the '
      + 'test-health ledger never records the flake.',
  },
  {
    key: 'retries',
    value: 'process.env.CI ? 1 : 0',
    why: 'CI keeps exactly one retry: with none, every flake is recorded as a plain failure, and the '
      + 'ledger\'s needsTicket flags plain failures only once they recur on 2+ branches, so a flake that '
      + 'recurs on one branch never asks for a ticket (and the on-first-retry trace and video are never '
      + 'captured).',
  },
  {
    key: 'forbidOnly',
    value: '!!process.env.CI',
    why: 'Without it a committed test.only makes a CI leg run only the focused test and pass, silently '
      + 'skipping the rest of the suite.',
  },
];

PINS.forEach(({ key, value, why }) => {
  test(`${CONFIG} sets \`${key}: ${value}\` exactly once`, () => {
    const found = settingValues(key);
    const described = found.length > 0 ? found.map(v => `\`${key}: ${v}\``).join(', ') : 'none';

    assert.deepEqual(found, [value],
      `${CONFIG} must set \`${key}: ${value}\` exactly once (found ${described}). ${why} ${LEDGER_DOC}`);
  });
});
