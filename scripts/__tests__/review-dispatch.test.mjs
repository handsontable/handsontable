import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../../.github/scripts/lib/repo-root.mjs';

// The review checklists live once, in `.claude/skills/handsontable-code-review/references/`,
// and three dispatch surfaces send reviewers there: the Claude reviewer agent and the two
// Bugbot context files (root and core). A dimension that reaches the skill but not those
// surfaces is invisible to every review they dispatch -- the tests dimension first landed
// that way (caught in the review of PR #13347). This pins each surface, and the skill's own
// workflow step, to the full reference list, so the next dimension cannot ship half-wired.
//
// Text-based, not Markdown-parsed: a citation is the reference's repo path
// (`references/<name>.md`), which every surface already spells out in full.

const root = repoRoot();
const SKILL_DIR = '.claude/skills/handsontable-code-review';
const DISPATCH_SURFACES = [
  `${SKILL_DIR}/SKILL.md`,
  '.claude/agents/handsontable-reviewer.md',
  '.cursor/BUGBOT.md',
  'handsontable/.cursor/BUGBOT.md',
];
// The dimensions the skill is known to ship. A positive control for the directory read
// below: an empty or misread `references/` would otherwise make every surface pass vacuously.
const KNOWN_DIMENSIONS = ['architecture.md', 'code-quality.md', 'performance-a11y.md', 'tests.md'];

const read = rel => readFileSync(path.join(root, rel), 'utf8');

/**
 * Lists the reference files (`*.md`) the code-review skill ships, sorted by name.
 *
 * @returns {string[]} The reference file names.
 */
function referenceFiles() {
  return readdirSync(path.join(root, SKILL_DIR, 'references'))
    .filter(name => name.endsWith('.md'))
    .sort();
}

/**
 * Names the reference files a dispatch surface does not cite by path.
 *
 * @param {string} source The dispatch surface's content.
 * @param {string[]} references The reference file names the skill ships.
 * @returns {string[]} The reference file names the surface omits.
 */
function missingCitations(source, references) {
  return references.filter(name => !source.includes(`references/${name}`));
}

test('the code-review skill ships every known dimension reference', () => {
  const shipped = referenceFiles();

  for (const name of KNOWN_DIMENSIONS) {
    assert.ok(shipped.includes(name), `${SKILL_DIR}/references/${name} is missing`);
  }
});

for (const surface of DISPATCH_SURFACES) {
  test(`${surface} cites every code-review reference file by path`, () => {
    const missing = missingCitations(read(surface), referenceFiles());

    assert.deepEqual(
      missing,
      [],
      `${surface} does not point reviewers at: ${missing.map(n => `references/${n}`).join(', ')}. `
        + 'A review dimension lives in the skill AND in every dispatch surface, or the reviews '
        + 'those surfaces dispatch never see it.',
    );
  });
}

test('missingCitations reports only the references a surface omits', () => {
  const source = 'read references/architecture.md and references/tests.md';

  assert.deepEqual(
    missingCitations(source, ['architecture.md', 'code-quality.md', 'tests.md']),
    ['code-quality.md'],
  );
  assert.deepEqual(missingCitations(source, ['architecture.md', 'tests.md']), []);
  // A bare file name is not a citation: the surfaces spell the repo path so a reader can open it.
  assert.deepEqual(missingCitations('see tests.md', ['tests.md']), ['tests.md']);
});
