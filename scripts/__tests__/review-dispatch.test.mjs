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
// Text-based, not Markdown-parsed: a citation is a path a reader can open. A surface outside
// the skill spells the repo path (`.claude/skills/handsontable-code-review/references/<name>`);
// the skill's own `SKILL.md` may use the skill-relative `references/<name>`, which resolves
// beside it. Another skill's `references/` folder never counts -- two skills ship one, and a
// bare `references/<name>` substring would accept a citation of the wrong skill's file.
//
// A citation is not the whole story: the reviewer agent carries a one-line summary beside each
// path, and a summary can drift from its reference (the JSDoc link rule did, when #13339 moved
// the reference to `{@link}` and the agent still said `[[LINK]]`). The last test pins the one
// pair with two literal forms to name.

const root = repoRoot();
const SKILL_DIR = '.claude/skills/handsontable-code-review';
const REVIEWER_AGENT = '.claude/agents/handsontable-reviewer.md';
const DISPATCH_SURFACES = [
  `${SKILL_DIR}/SKILL.md`,
  REVIEWER_AGENT,
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
 * Escapes a literal string for use inside a regular expression.
 *
 * @param {string} literal The text to match verbatim.
 * @returns {string} The escaped pattern.
 */
function escapeRegExp(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tells whether a dispatch surface cites one code-review reference file by a path a reader can open.
 *
 * The repo path counts everywhere. The skill-relative `references/<name>` counts only inside the
 * skill's own directory, and only when nothing path-like precedes it -- `<other>/references/<name>`
 * is a different skill's file.
 *
 * @param {string} surface The dispatch surface's repo path.
 * @param {string} source The dispatch surface's content.
 * @param {string} name The reference file name.
 * @returns {boolean} Whether the surface cites the reference.
 */
function cites(surface, source, name) {
  if (source.includes(`${SKILL_DIR}/references/${name}`)) {
    return true;
  }
  if (!surface.startsWith(`${SKILL_DIR}/`)) {
    return false;
  }

  return new RegExp(`(?<![\\w/-])references/${escapeRegExp(name)}`).test(source);
}

/**
 * Names the reference files a dispatch surface does not cite by path.
 *
 * @param {string} surface The dispatch surface's repo path.
 * @param {string} source The dispatch surface's content.
 * @param {string[]} references The reference file names the skill ships.
 * @returns {string[]} The reference file names the surface omits.
 */
function missingCitations(surface, source, references) {
  return references.filter(name => !cites(surface, source, name));
}

/**
 * Finds the line that states the JSDoc link rule: the one naming both link forms.
 *
 * @param {string} text A reference or dispatch surface.
 * @returns {string|undefined} The line, or undefined when no line names both forms.
 */
function jsdocLinkRuleLine(text) {
  return text.split('\n').find(line => line.includes('{@link') && line.includes('[['));
}

/**
 * Reads which JSDoc link form a line prescribes: the form it does not negate.
 *
 * A negation is `never` or `not` followed, before any other backtick, by the backtick-quoted form.
 *
 * @param {string} line A line that names both forms.
 * @returns {'{@link}'|'[[...]]'|null} The prescribed form, or null when the line negates neither or both.
 */
function prescribedLinkForm(line) {
  const negatesLink = /\b(?:never|not)\b[^`]*`\{@link/.test(line);
  const negatesTypeDoc = /\b(?:never|not)\b[^`]*`\[\[/.test(line);

  if (negatesLink === negatesTypeDoc) {
    return null;
  }

  return negatesLink ? '[[...]]' : '{@link}';
}

test('the code-review skill ships every known dimension reference', () => {
  const shipped = referenceFiles();

  for (const name of KNOWN_DIMENSIONS) {
    assert.ok(shipped.includes(name), `${SKILL_DIR}/references/${name} is missing`);
  }
});

for (const surface of DISPATCH_SURFACES) {
  test(`${surface} cites every code-review reference file by path`, () => {
    const missing = missingCitations(surface, read(surface), referenceFiles());

    assert.deepEqual(
      missing,
      [],
      `${surface} does not point reviewers at: ${missing.map(n => `${SKILL_DIR}/references/${n}`).join(', ')}. `
        + 'A review dimension lives in the skill AND in every dispatch surface, or the reviews '
        + 'those surfaces dispatch never see it.',
    );
  });
}

test('missingCitations reports only the references a surface omits', () => {
  const source = `read ${SKILL_DIR}/references/architecture.md and ${SKILL_DIR}/references/tests.md`;

  assert.deepEqual(
    missingCitations(REVIEWER_AGENT, source, ['architecture.md', 'code-quality.md', 'tests.md']),
    ['code-quality.md'],
  );
  assert.deepEqual(missingCitations(REVIEWER_AGENT, source, ['architecture.md', 'tests.md']), []);
  // A bare file name is not a citation: the surfaces spell a path so a reader can open it.
  assert.deepEqual(missingCitations(REVIEWER_AGENT, 'see tests.md', ['tests.md']), ['tests.md']);
});

test('the skill-relative path counts inside the skill only', () => {
  const skillFile = `${SKILL_DIR}/SKILL.md`;

  assert.deepEqual(missingCitations(skillFile, 'apply `references/tests.md`', ['tests.md']), []);
  assert.deepEqual(missingCitations(skillFile, `apply ${SKILL_DIR}/references/tests.md`, ['tests.md']), []);
  // Outside the skill the same text resolves to nothing a reader can open.
  assert.deepEqual(missingCitations(REVIEWER_AGENT, 'apply `references/tests.md`', ['tests.md']), ['tests.md']);
});

test('another skill\'s references folder is not a citation', () => {
  const otherSkill = '.claude/skills/handsontable-playwright-e2e/references/tests.md';

  // The hole the bare-substring match left open: this text contains `references/tests.md`.
  assert.ok(otherSkill.includes('references/tests.md'));
  assert.deepEqual(missingCitations(REVIEWER_AGENT, `read ${otherSkill}`, ['tests.md']), ['tests.md']);
  assert.deepEqual(missingCitations(`${SKILL_DIR}/SKILL.md`, `read ${otherSkill}`, ['tests.md']), ['tests.md']);
});

test(`${REVIEWER_AGENT} summarizes the JSDoc link rule the way references/code-quality.md states it`, () => {
  const referenceLine = jsdocLinkRuleLine(read(`${SKILL_DIR}/references/code-quality.md`));
  const summaryLine = jsdocLinkRuleLine(read(REVIEWER_AGENT));

  // Positive controls: both files still state the rule with both forms on one line. If either
  // stops, this check has nothing to compare and must move with the text, not pass silently.
  assert.ok(referenceLine, `${SKILL_DIR}/references/code-quality.md no longer names both JSDoc link forms on one line`);
  assert.ok(summaryLine, `${REVIEWER_AGENT} no longer summarizes the JSDoc link rule beside its reference path`);

  const prescribed = prescribedLinkForm(referenceLine);

  assert.ok(prescribed, `cannot read which link form the reference prescribes from: ${referenceLine}`);
  assert.equal(
    prescribedLinkForm(summaryLine),
    prescribed,
    `${REVIEWER_AGENT} tells reviewers the opposite of references/code-quality.md about JSDoc links. `
      + `Reference: ${referenceLine.trim()} | Summary: ${summaryLine.trim()}`,
  );
});

test('prescribedLinkForm reads the form a line negates', () => {
  // The reference before and after #13339, and the agent summary that drifted from it.
  assert.equal(prescribedLinkForm('Use `[[MY_LINK]]` syntax for links, not `{@link MY_LINK}`.'), '[[...]]');
  assert.equal(
    prescribedLinkForm('Cross-reference with `{@link Core#getCellMeta}`, never TypeDoc\'s `[[Target]]`.'),
    '{@link}',
  );
  assert.equal(prescribedLinkForm('JSDoc (Markdown links `[[LINK]]`, not `{@link}`; no `<br>`)'), '[[...]]');
  // A line that negates neither form, or both, prescribes nothing.
  assert.equal(prescribedLinkForm('`{@link}` and `[[Target]]` both appear in the codebase'), null);
  assert.equal(prescribedLinkForm('never `{@link}`, and never `[[Target]]`'), null);
});
