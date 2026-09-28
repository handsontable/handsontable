import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The visual suite's decision rule — a screenshot proves pixels only, in addition to, never instead
// of a Playwright assertion; one capture per visual state; a new feature gets its own demo route — is
// one paragraph in visual-tests/AGENTS.md, and every surface an author reads before writing a spec
// links to it. Measured on 2026-09-17 (the counts the documents quote were re-measured on 2026-09-18),
// before the paragraph existed: both visual skills and visual-tests/AGENTS.md sent authors to
// `examples/next/docs/` while `visual-tests/scripts/run-tests.mjs` serves `examples/next/visual-tests`;
// visual-tests/README.md taught a `locator.screenshot()` the lint bans at `error` two screens below the
// only sentence that said "one screenshot per state"; and no surface said what earns a capture at all,
// so 57 of 112 specs hold more than one. Each of those is a sentence that drifts silently — nothing
// reads a skill or an AGENTS.md but the next author. So the rule is pinned to one file, every surface
// to a link, and the enforcement map (G7) to the two hook scripts whose behavior it describes, so that
// the map cannot say "never a hook" after a hook starts running visual specs.
//
// Text-based, like fork-guards.test.mjs: no Markdown parser is a dependency of the repo root. Two
// constraints of the text approach, so a false failure is recognized for what it is: `section()`
// matches a heading line after trimming trailing whitespace and skips fenced code blocks when it looks
// for the next heading, but a fence must open and close on lines that start with three backticks or
// three tildes.

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');

const RULE_FILE = 'visual-tests/AGENTS.md';
// The phrase every linking surface must carry verbatim. Dash-free on purpose: every surface writes em
// dashes, the budget marker writes an en dash, and a marker containing either would need one spelling
// per file.
const MARKER = 'in addition to, never instead of';
// The link every surface carries, section name included. The bare path is not enough: the root
// AGENTS.md routing table and the visual-testing skill's Tiers sentence named `visual-tests/AGENTS.md`
// before the rule existed, so a pin on the path alone stayed green when the sentence lost its link
// (measured: removing "; the rule is `visual-tests/AGENTS.md` → Decision rule" from either file
// failed nothing). The PR template writes the link inside an HTML comment, without backticks.
const LINK = '`visual-tests/AGENTS.md` → Decision rule';
const PLAIN_LINK = 'visual-tests/AGENTS.md → Decision rule';
// The canonical paragraph's opening clause — the one string that must occur in exactly one file.
const CANONICAL = 'asserts pixels no DOM or API probe can express';
const CANONICAL_SENTENCES = [
  CANONICAL,
  MARKER,
  'One capture per distinct visual state',
  'never the shared `/` demo',
];

// Every surface that links to the rule, with the phrases it must carry. The pr-creation skill's body
// block mirrors the template bullet verbatim (a separate test below), so it needs the marker only.
const SURFACES = [
  ['handsontable/.ai/TESTING.md', [MARKER, LINK]],
  ['AGENTS.md', [MARKER, LINK]],
  ['.claude/skills/visual-testing/SKILL.md', [MARKER, LINK, 'examples/next/visual-tests/']],
  ['.claude/skills/creating-visual-test-examples/SKILL.md', [MARKER, LINK, 'examples/next/visual-tests/']],
  ['.github/PULL_REQUEST_TEMPLATE.md', [MARKER, PLAIN_LINK]],
  ['.claude/skills/pr-creation/SKILL.md', [MARKER]],
  ['.claude/skills/handsontable-code-review/references/tests.md', [MARKER, LINK]],
  ['.ai/LOCAL-ENFORCEMENT.md', [MARKER, LINK]],
];

// The two hook scripts the enforcement map describes as never running a visual spec. Both spawn
// Playwright from `tests/`; a visual run would need the built example apps and the port-8082 server.
const HOOKS = ['scripts/pre-push.mjs', 'scripts/claude/stop.mjs'];
// How a hook would name the visual package if it started running its specs: a spec path, a regex on
// the package, or a quoted path (a `cwd`, a spec list). A comment stays free to say "the visual tier"
// or to write `visual-tests/` in backticks; one that spells out a spec path trips the pin, and the
// failure message says so.
const HOOK_MUST_NOT_NAME = [
  'visual-tests/tests',
  String.raw`visual-tests\/`,
  "'visual-tests",
  '"visual-tests',
];

// The exact sentences the rule replaced. Exact strings, not paraphrases: a pin on a whole paragraph
// misses the next rewording, a pin on the one wrong path or the one banned call does not.
const ABSENT = [
  ['.claude/skills/visual-testing/SKILL.md', [
    'You can take multiple screenshots per test',
    'create a new example in `examples/next/docs/`',
    'example creation in examples/next/docs/',
    'examples/next/docs/js',
  ]],
  ['.claude/skills/creating-visual-test-examples/SKILL.md', [
    'standalone examples in examples/next/docs/',
    'examples/next/docs/js',
    'or documentation demos',
  ]],
  [RULE_FILE, ['Examples for testing live in `examples/next/docs/`']],
  ['visual-tests/README.md', ['dropdownMenu.screenshot(', 'visual-tests/tests/.empty-test-template.ts']],
  ['handsontable/.ai/TESTING.md', ['Playwright functional + visual projects']],
];

/**
 * Slice one Markdown section: from its heading line to the next heading of the same or a higher
 * level. The fork-guards idiom (slice a bullet to the next `\n- `) applied to headings, so an
 * assertion about a section cannot be satisfied by text that lives in a different one.
 *
 * Line-based on purpose. A heading line with trailing whitespace still matches, and a `# comment`
 * inside a fenced code block does not end the section — both produced a false failure with a
 * misleading "lost: …" message when the slicer was a plain `indexOf`. Fences are recognized by a line
 * starting with three backticks or three tildes (any length, no indentation deeper than three
 * spaces); that is how every fence in the pinned documents is written.
 *
 * @param {string} text The whole document.
 * @param {string} heading The heading line, e.g. `## Decision rule` — its `#` count sets the level.
 * @param {string} file The document's path, for the failure message.
 * @returns {string} The section text, heading included.
 */
function section(text, heading, file) {
  const lines = text.split('\n');
  const start = lines.findIndex(line => line.trimEnd() === heading);

  assert.notEqual(start, -1, `${file} has no "${heading}" heading`);

  const level = heading.match(/^#+/)[0].length;
  const isFence = line => /^ {0,3}(`{3,}|~{3,})/.test(line);
  let inFence = false;
  let end = lines.length;

  // The next heading at this level or above ends the section; a deeper heading is part of it, and so
  // is anything inside a fence.
  for (let i = start + 1; i < lines.length; i += 1) {
    if (isFence(lines[i])) {
      inFence = !inFence;
    } else if (!inFence) {
      const hashes = lines[i].match(/^(#{1,6}) /);

      if (hashes && hashes[1].length <= level) {
        end = i;
        break;
      }
    }
  }

  return lines.slice(start, end).join('\n');
}

/**
 * Count the occurrences of a substring.
 *
 * @param {string} text The text to search.
 * @param {string} needle The substring to count.
 * @returns {number} How many times it occurs.
 */
function count(text, needle) {
  return text.split(needle).length - 1;
}

/**
 * How many times a `##` heading with this exact name occurs.
 *
 * Whitespace-tolerant the way {@link section} is, and for the same reason: a heading that picks up a
 * trailing space is still that heading to a reader and to every Markdown renderer. A byte-exact
 * `\n## Name\n` count would drop to 0 there, and an assertion that reads "more than one" would then
 * fire on a file that has exactly one — sending the next debugger to hunt a duplicate that does not
 * exist. Counting trimmed lines cannot produce that inverted diagnosis.
 *
 * @param {string} text The document.
 * @param {string} name The heading name, without the `## `.
 * @returns {number} How many headings carry it.
 */
function countHeadings(text, name) {
  return text.split('\n').filter(line => line.trimEnd() === `## ${name}`).length;
}

test('the decision rule is one paragraph in visual-tests/AGENTS.md, and no surface copies it', () => {
  const rule = section(read(RULE_FILE), '## Decision rule', RULE_FILE);

  for (const sentence of CANONICAL_SENTENCES) {
    assert.ok(rule.includes(sentence), `${RULE_FILE}'s Decision rule lost: "${sentence}"`);
  }

  // A copy drifts the moment one of the two is edited, and nothing would notice which one is the
  // rule. Every surface carries a sentence and a link; the paragraph itself occurs once in the repo's
  // authoring surfaces.
  const copies = [...SURFACES.map(([file]) => file), RULE_FILE, 'visual-tests/README.md', 'CONTRIBUTING.md', '.ai/CI.md']
    .filter(file => read(file).includes(CANONICAL));

  assert.deepEqual(copies, [RULE_FILE],
    'the decision-rule paragraph is copied instead of linked — keep it in visual-tests/AGENTS.md only');
  const ruleHeadings = countHeadings(read(RULE_FILE), 'Decision rule');

  assert.equal(ruleHeadings, 1,
    `${RULE_FILE} must carry exactly one "## Decision rule" heading (found ${ruleHeadings}). `
    + 'Two would let the surfaces link to whichever one the reader scrolls to first; none means the '
    + 'paragraph moved and every link into it is now dangling.');
});

test('every authoring surface carries the marker sentence and links to the rule', () => {
  // A surface that drops the sentence or the link sends its readers to no rule at all — the drift the
  // header describes. The link is pinned with its section name, not as a bare path (see LINK).
  for (const [file, phrases] of SURFACES) {
    const text = read(file);

    for (const phrase of phrases) {
      assert.ok(text.includes(phrase), `${file} no longer carries "${phrase}" — it stopped linking to the decision rule`);
    }
  }
});

test('the sentences the rule replaced are gone', () => {
  for (const [file, phrases] of ABSENT) {
    const text = read(file);

    for (const phrase of phrases) {
      assert.ok(!text.includes(phrase), `${file} still says "${phrase}" — the sentence the decision rule replaced is back`);
    }
  }

  // The README names the template a new spec starts from; the path must exist, or the next author
  // is sent to a file that moved (it lived at tests/.empty-test-template.ts once and the README kept
  // saying so after it moved under multi-frameworks/).
  const readme = read('visual-tests/README.md');
  const template = readme.match(/`\.\/(visual-tests\/tests\/[^`]*\.empty-test-template\.ts)`/);

  assert.ok(template, 'visual-tests/README.md no longer names the spec template to copy');
  assert.ok(existsSync(path.join(root, template[1])), `visual-tests/README.md names ${template[1]}, which does not exist`);
});

test('the PR template and the pr-creation copy carry the visual test-evidence bullet after the bug-fix line', () => {
  const bullet = '- Visual spec added/modified (`visual-tests/tests/**/*.spec.ts`';
  const bugFix = 'the spec that fails without this fix:';
  const template = read('.github/PULL_REQUEST_TEMPLATE.md');
  // The same ````markdown block pr-template-skill-sync.test.mjs compares; that test reads headings and
  // checklist lines only, so a plain bullet is exactly the drift it does not see.
  const body = read('.claude/skills/pr-creation/SKILL.md').match(/````markdown\n([\s\S]*?)\n````/);

  assert.ok(body, 'the pr-creation skill must embed the body template in a ````markdown block');

  for (const [name, text] of [['.github/PULL_REQUEST_TEMPLATE.md', template], ['the pr-creation skill body template', body[1]]]) {
    const bulletAt = text.indexOf(bullet);
    const bugFixAt = text.indexOf(bugFix);

    assert.notEqual(bulletAt, -1, `${name} lacks the visual test-evidence bullet`);
    assert.notEqual(bugFixAt, -1, `${name} lacks the bug-fix test-evidence line`);
    // redSpecFieldMissing (presence-warnings.mjs) reads the line after the bug-fix line: a sibling item
    // means "nothing written", free text means an answer. The visual bullet must stay a sibling AFTER
    // it, never a line the detector would read as the bug-fix answer.
    assert.ok(bulletAt > bugFixAt, `${name}: the visual bullet must follow the bug-fix line (redSpecFieldMissing reads the next sibling)`);
    assert.ok(text.includes(`${bullet}, only for pixels no DOM probe can express — ${MARKER} the E2E above):`),
      `${name}: the visual bullet's wording drifted from the template's`);
  }

  // The golden-budget marker is documented in the template's HTML comment block — inside a comment so
  // pr-template-skill-sync.test.mjs's heading and checklist comparison is untouched, and so the
  // template itself never carries a live marker.
  const comment = template.slice(template.indexOf('<!--\nVisual budget:'), template.indexOf('-->', template.indexOf('<!--\nVisual budget:')));

  assert.ok(comment.includes('[visual budget: N – reason]'), 'the PR template no longer documents the [visual budget: N – reason] marker in its comment block');
  assert.ok(comment.includes('OUTSIDE any HTML comment'), 'the PR template no longer says the budget marker is inert inside a comment');
});

test('the enforcement map describes the hooks as they are', () => {
  const enforcement = read('.ai/LOCAL-ENFORCEMENT.md');
  const map = section(enforcement, "### The visual tier's enforcement map", '.ai/LOCAL-ENFORCEMENT.md');

  for (const phrase of [
    'Anything syntactic is lint',
    'needs a rendered `out.json` is CI-only',
    'never a hook',
    'visual-tests/.eslintrc.js',
    'scripts/lint-files.mjs',
    'lint.yml',
    'visual.yml',
    '8082',
    'changedPlaywrightSpecs',
    // Owned by the capture lint (G4); required so the map cannot drop the rule once it has landed.
    'capture after an unasserted action',
  ]) {
    assert.ok(map.includes(phrase), `the visual tier's enforcement map in .ai/LOCAL-ENFORCEMENT.md lost: "${phrase}"`);
  }

  // The determinism table has exactly one Visual row, and that row names the capture lint too, so the
  // guardrail that lands it extends the row instead of adding a second one.
  const rows = enforcement.split('\n').filter(line => line.startsWith('| Visual ('));

  assert.equal(rows.length, 1, 'the determinism table in .ai/LOCAL-ENFORCEMENT.md must carry exactly one Visual row');
  assert.ok(rows[0].includes('visual-tests/.eslintrc.js'), 'the Visual determinism row no longer names visual-tests/.eslintrc.js');
  assert.ok(rows[0].includes('capture after an unasserted action'), 'the Visual determinism row no longer names the capture-after-unasserted-action rule');

  // Cross-check the hook claims against the code, so the map cannot rot. The lint claim: the hook lint
  // scope covers visual-tests/(src|tests). Exact source substrings, not regexes over regexes.
  assert.ok(read('scripts/lint-files.mjs').includes(String.raw`/^visual-tests\/(src|tests)\//`),
    'the hook lint scope in scripts/lint-files.mjs no longer covers visual-tests/(src|tests); the enforcement map says it does');

  // The "never a hook" claim, from both sides. The positive side: `changedPlaywrightSpecs` keeps its
  // tests/e2e/ filter and the Stop hook keeps importing it rather than growing a filter of its own.
  // The positive side alone was a presence test — it stayed green when a hook gained a SEPARATE
  // visual-spec runner beside the e2e one (measured: a `changedVisualSpecs` appended to pre-push.mjs
  // failed nothing, and stop.mjs was never read). So the negative side: neither hook names the visual
  // package in any form a runner would need, and every Playwright it spawns runs from `tests/`.
  assert.ok(read('scripts/pre-push.mjs').includes(String.raw`/^tests\/e2e\/.+\.spec\.ts$/`),
    'changedPlaywrightSpecs in scripts/pre-push.mjs no longer scopes to tests/e2e — the enforcement map in .ai/LOCAL-ENFORCEMENT.md says a visual spec is never a hook');
  assert.ok(/import \{[^}]*\bchangedPlaywrightSpecs\b[^}]*\} from '\.\.\/pre-push\.mjs'/.test(read('scripts/claude/stop.mjs')),
    'scripts/claude/stop.mjs no longer imports changedPlaywrightSpecs from scripts/pre-push.mjs — the enforcement map says the Stop hook shares that filter');

  for (const file of HOOKS) {
    const source = read(file);

    for (const needle of HOOK_MUST_NOT_NAME) {
      assert.ok(!source.includes(needle),
        `${file} names the visual package (${needle}) — the enforcement map in .ai/LOCAL-ENFORCEMENT.md says a visual spec is never a hook; `
        + 'a visual run belongs to the pull request\'s Visual / Compare job (say "the visual tier" in prose)');
    }

    // Each spawn statement, from its call to the first `);` after it — enough to hold its options
    // object, since no argument in these files closes a call before a `;`.
    const statements = [...source.matchAll(/\bspawn(?:Sync)?\(/g)]
      .map(({ index }) => {
        const close = source.indexOf(');', index);

        return source.slice(index, close === -1 ? undefined : close + 2);
      });
    const playwrightRuns = statements.filter(statement => statement.includes('playwright'));

    assert.ok(playwrightRuns.length > 0, `${file} no longer spawns Playwright at all; the enforcement map describes the run it makes from tests/`);

    for (const run of playwrightRuns) {
      assert.equal(count(run, 'cwd:'), 1, `${file}: a Playwright spawn must set exactly one cwd\n${run}`);
      assert.ok(run.includes("cwd: path.join(root, 'tests')"),
        `${file}: a Playwright spawn no longer runs from tests/ — the enforcement map in .ai/LOCAL-ENFORCEMENT.md says a visual spec is never a hook\n${run}`);
    }
  }
});

test('every AGENTS.md section a lint message points at exists, and the guardrails section exists once', () => {
  const agents = read(RULE_FILE);
  const headings = agents.split('\n').filter(line => line.startsWith('## ')).map(line => line.slice(3));
  const libDir = path.join(root, 'visual-tests/lib');
  const sources = ['visual-tests/.eslintrc.js', ...readdirSync(libDir).filter(f => f.endsWith('.mjs')).map(f => `visual-tests/lib/${f}`)];
  let pointers = 0;

  for (const file of sources) {
    // `visual-tests/AGENTS.md (Determinism)` is the form the lint messages use; a renamed heading
    // would send the author of a failing spec to a section that no longer exists.
    for (const [, name] of read(file).matchAll(/AGENTS\.md \(([^)]+)\)/g)) {
      pointers += 1;
      assert.ok(headings.some(heading => heading === name || heading.startsWith(`${name}:`) || heading.startsWith(`${name} `)),
        `${file} points at visual-tests/AGENTS.md (${name}), which is not a ## heading there`);
    }
  }

  // Without a floor this guarantee is self-cancelling: reword the lint messages out of the
  // `AGENTS.md (Name)` form, or move `visual-tests/lib`, and `matchAll` yields nothing, the loop
  // asserts zero times, and the test stays green while pointing at nothing. Five pointers exist
  // today across the lint config and the lib modules; the floor only has to prove the scan found
  // the shape at all.
  assert.ok(sources.length >= 3, `only ${sources.length} sources scanned — visual-tests/lib moved?`);
  assert.ok(pointers >= 3,
    `only ${pointers} "AGENTS.md (Name)" pointers found; the lint messages no longer use that form, `
    + 'so this test is guarding nothing');

  const guardrailHeadings = countHeadings(agents, 'Guardrails against bloat and flakes');

  assert.equal(guardrailHeadings, 1,
    `${RULE_FILE} must carry exactly one "## Guardrails against bloat and flakes" heading `
    + `(found ${guardrailHeadings}) — every later guardrail rewrites its own bullet there`);

  const guardrails = section(agents, '## Guardrails against bloat and flakes', RULE_FILE);

  for (const bullet of ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7']) {
    assert.ok(guardrails.includes(`**${bullet} ·`), `${RULE_FILE}'s guardrails section lost its ${bullet} bullet`);
  }
});

test('the creating-visual-test-examples skill is scoped to the visual-tests example tree', () => {
  const skill = read('.claude/skills/creating-visual-test-examples/SKILL.md');

  // The suite serves examples/next/visual-tests only (run-tests.mjs); the docs tree is another skill's.
  // Both trees have a demo/ directory, which is how the wrong glob attached the wrong skill for a year.
  assert.match(skill, /^path: examples\/next\/visual-tests\/\*\*$/m,
    'creating-visual-test-examples must be scoped to examples/next/visual-tests/** — the docs tree belongs to creating-docs-examples');
  assert.ok(read('scripts/sync-skills-to-cursor.mjs').includes("'creating-visual-test-examples': ['examples/next/visual-tests/**']"),
    'the Cursor GLOB_MAP for creating-visual-test-examples must match the skill frontmatter: examples/next/visual-tests/**');
});
