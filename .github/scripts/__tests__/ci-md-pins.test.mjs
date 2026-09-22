import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// .ai/CI.md line 3 promises that "most entries are pinned by a test that fails with the reason; each
// entry names it". Nothing checked the names. A pin test renamed or deleted leaves its bullet pointing
// at a file that does not exist, and the reader who goes looking for the reason finds nothing — the
// drift the status-function bullet describes ("only inside the workflows that already got it right,
// which is why it did not travel"), but on the document meant to make rules travel. This resolves
// every `*.test.mjs` / `*.unit.js` a bullet names against the checkout, and pins the visual
// guardrails bullet (the one entry that indexes a whole series) to the pin tests it names.
//
// Text-based, like fork-guards.test.mjs: no Markdown parser is a dependency of the repo root.

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');
const ciMd = read('.ai/CI.md');

// Bullets are one physical line each (the fork-guard bullet's YAML block is indented, so it never
// starts a new bullet).
const bullets = ciMd.split('\n').filter(line => line.startsWith('- '));

// Where a bare basename resolves: every directory the root `test:tooling` glob covers, plus the core
// package's unit tests, which `handsontable/scripts/tasks.json` runs and CI.md cites by basename.
const packageJson = JSON.parse(read('package.json'));
const toolingDirs = packageJson.scripts['test:tooling'].split(' ')
  .filter(part => part.includes('__tests__'))
  .map(part => path.dirname(part));
const TEST_DIRS = [...new Set([...toolingDirs, 'handsontable/test/__tests__'])];

/**
 * Resolve a test-file mention to a repo-relative path, or null when nothing matches.
 *
 * @param {string} mention The backticked name as CI.md wrote it — a path, or a bare basename.
 * @returns {string|null} The first matching repo-relative path.
 */
function resolveMention(mention) {
  if (mention.includes('/')) {
    return existsSync(path.join(root, mention)) ? mention : null;
  }

  return TEST_DIRS.map(dir => path.join(dir, mention)).find(candidate => existsSync(path.join(root, candidate))) ?? null;
}

test('the tooling glob still covers the directories basenames resolve against', () => {
  // The resolver's directory list is derived, not hardcoded; if the glob shrinks to nothing that
  // includes __tests__ the resolver would accept nothing and every basename would fail confusingly.
  assert.ok(TEST_DIRS.includes('.github/scripts/__tests__'), 'the root test:tooling glob no longer covers .github/scripts/__tests__');
  assert.ok(TEST_DIRS.length >= 3, `expected several test directories in the root test:tooling glob, got ${TEST_DIRS.join(', ')}`);
});

test('every test file a bullet in .ai/CI.md names exists', () => {
  // A renamed pin silently orphans its bullet; nothing else reads these names.
  //
  // The two floors below are VACUITY guards, not counts anybody maintains. `.ai/CI.md` only ever
  // grows, so a floor set well under today's total never needs touching — it fires when the parsing
  // breaks (a heading style change that stops the bullet split from matching, a regex that stops
  // extracting names), which would otherwise leave the loop iterating zero times and the test green
  // while checking nothing. Raise them only if they ever fire for a real shrink.
  assert.ok(bullets.length >= 17, `.ai/CI.md lost its bullets (${bullets.length} found)`);

  const mentions = new Map();

  for (const bullet of bullets) {
    // A mention may carry a line suffix (`foo.test.mjs:26-28`), as CI.md writes for workflow files
    // today; the suffix is dropped before the name is resolved, so a suffixed mention is checked
    // instead of silently skipped. `*.unit.ts` is a unit test too (root AGENTS.md, checklist item 1).
    for (const [, mention] of bullet.matchAll(/`([A-Za-z0-9_./-]+\.(?:test\.mjs|unit\.[jt]s|test\.js))(?::[\d,-]+)?`/g)) {
      mentions.set(mention, bullet.slice(0, 80));
    }
  }

  assert.ok(mentions.size >= 10, `.ai/CI.md names fewer test files than expected (${mentions.size}); the extraction regex or the document drifted`);

  for (const [mention, opening] of mentions) {
    assert.ok(resolveMention(mention),
      `.ai/CI.md names ${mention} (bullet "${opening}…") but no such file exists in the checkout — a renamed or deleted pin left the bullet pointing at nothing`);
  }
});

test('the visual guardrails bullet names its pin tests and the section that indexes the series', () => {
  const start = ciMd.indexOf("- **The visual suite's guardrails");

  assert.notEqual(start, -1, '.ai/CI.md has no visual guardrails bullet');

  const end = ciMd.indexOf('\n- ', start + 1);
  const bullet = ciMd.slice(start, end === -1 ? undefined : end);

  // The only two pins the series ships in the docs PR; later guardrails rewrite their bullet in
  // visual-tests/AGENTS.md instead of editing this document, so this list stays short by design.
  for (const pin of ['visual-decision-rule.test.mjs', 'ci-md-pins.test.mjs']) {
    assert.ok(bullet.includes(pin), `the visual guardrails bullet in .ai/CI.md no longer names ${pin}`);
  }

  for (const anchor of ['visual-tests/AGENTS.md', 'Decision rule', 'Guardrails against bloat and flakes', "The visual tier's enforcement map"]) {
    assert.ok(bullet.includes(anchor), `the visual guardrails bullet in .ai/CI.md no longer points at "${anchor}"`);
  }

  // It sits next to the other visual bullet (the approval environment), as the status-function bullet
  // was placed between manual-qa and the visual gate: topical position, not appended at the end.
  const approvalAt = ciMd.indexOf("- **The visual gate's approval is the `visual-approval` environment");

  assert.notEqual(approvalAt, -1, '.ai/CI.md has no visual-approval bullet');
  // The next bullet after the approval one starts exactly where ours does (`\n- ` is one before `- `).
  assert.equal(ciMd.indexOf('\n- ', approvalAt + 1) + 1, start,
    'the visual guardrails bullet must directly follow the visual-approval bullet in .ai/CI.md');
});
