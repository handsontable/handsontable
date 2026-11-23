import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../../.github/scripts/lib/repo-root.mjs';
import { EVIDENCE_CHECKS } from '../../tests/lib/a11y-evidence.mjs';
import { SITE_CHECK_KINDS } from '../../tests/lib/a11y-site-checks.mjs';
import {
  BUDGET, CLASSES_FILE, HOME_FILES, POINTER_FILES, SITE_FINDING_KINDS, SKILL_FILE, classRow, classTags,
  collectSkillProblems, knownChecks, lineCount, readSkillInputs, sectionBullets,
} from '../a11y-skill-rules.mjs';

// The accessibility skill binds its rules to defect classes (`.claude/skills/handsontable-a11y/rules.json`), and every
// cluster of the findings catalog names one (`defectClass` in tests/a11y/issues.json). This test keeps the places
// that name a class or point at a rule in step, and keeps SKILL.md within its budget, so the learning routine and a person editing by hand
// meet the same gate: the committed tree first, then one planted failure per rule on a copy of the real inputs, so a
// check that stops firing fails here rather than passing everything.

const committed = () => structuredClone(readSkillInputs(repoRoot()));
const classOf = (inputs, id) => inputs.rules.classes.find(entry => entry.id === id);
// A file path goes into a RegExp as literal text: every metacharacter is escaped, the backslash included, so a
// Windows separator or a dot in a name cannot widen what the pattern matches.
const escapeRegExp = text => text.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');

/**
 * Runs the checks on a copy of the committed inputs after a change, and asserts that a problem names what was planted.
 *
 * @param {(inputs: object) => void} plant Changes the copy.
 * @param {RegExp} expected What one of the problems must say.
 */
function assertPlanted(plant, expected) {
  const inputs = committed();

  plant(inputs);

  const problems = collectSkillProblems(inputs);

  assert.ok(problems.some(problem => expected.test(problem)),
    `expected a problem matching ${expected}; got:\n${problems.join('\n')}`);
}

test('the committed skill, its class table, rules.json, the home files and the catalog agree', () => {
  const inputs = committed();

  assert.ok(inputs.rules.classes.length > 10 && inputs.catalog.clusters.length > 50,
    'read the classes and the clusters');
  assert.deepEqual(collectSkillProblems(inputs), []);
});

test('SKILL.md stays within its line budget and its build-rule budget, and rules.json cannot raise either', () => {
  const { skill } = committed();
  const rules = sectionBullets(skill, '## Build rules');

  assert.ok(lineCount(skill) <= BUDGET.skillLines && rules.length > 0 && rules.length <= BUDGET.buildRules,
    `the committed SKILL.md: ${lineCount(skill)} lines, ${rules.length} build rules`);
  assert.equal(lineCount('a\nb\n'), 2, 'lines are counted as wc -l counts them');

  // Lines added after the build rules leave the rule count alone and break the line budget only.
  assertPlanted((inputs) => {
    inputs.skill += 'filler\n'.repeat(BUDGET.skillLines);
  }, /SKILL\.md has \d+ lines, over the budget of 120/);
  // One more tagged rule than the budget, at the end of the section.
  assertPlanted((inputs) => {
    const extra = Array.from({ length: BUDGET.buildRules }, (_, index) => `- **Rule ${index}.** Planted. [C03]`)
      .join('\n');

    inputs.skill = inputs.skill.replace('\n## Fixing a finding', `${extra}\n\n## Fixing a finding`);
  }, /SKILL\.md has \d+ build rules, over the budget of 20/);

  // A rule written with another list marker would escape the budget and the tags, so the marker itself is refused.
  for (const rule of ['* Untagged star rule.', '+ Untagged plus rule.', '1. Untagged numbered rule.']) {
    assertPlanted((inputs) => {
      inputs.skill = inputs.skill.replace('\n## Fixing a finding', `${rule}\n\n## Fixing a finding`);
    }, new RegExp(`the build rule "${escapeRegExp(rule)}…" starts with another list marker`));
  }
  // The routine may edit rules.json, never this test's module: a raised budget there is refused.
  assertPlanted((inputs) => {
    inputs.rules.budget.skillLines = 200;
  }, /"budget" must be \{"skillLines":120,"buildRules":20\}/);
});

test('a class has a rule unless it is record-only, and a record-only class has none', () => {
  assertPlanted((inputs) => {
    classOf(inputs, 'C09').rule = null;
  }, /class C09 has no rule and is not record-only/);
  assertPlanted((inputs) => {
    classOf(inputs, 'C09').rule = '  ';
  }, /class C09 has no rule and is not record-only/);
  assertPlanted((inputs) => {
    classOf(inputs, 'C16').rule = 'A screen reader reads everything.';
  }, /class C16 is record-only, so its "rule" is null/);
});

test('every enforcing check is a known check id, and runs where the class says it does', () => {
  const checks = knownChecks();

  assert.ok(checks.has('keyboard-walker') && checks.has('docs-structure') && checks.has('axe') && checks.has('none'),
    'the known checks hold the evidence checks, the site checks, the scans and the tiers');

  // The short suite's flag decides where a check beyond axe runs, so a check that joins or leaves it moves its classes.
  for (const [id, check] of Object.entries(EVIDENCE_CHECKS)) {
    assert.deepEqual(checks.get(id), check.pullRequest === true ? ['pull-request'] : ['weekly', 'none'], id);
  }

  assert.ok(checks.get('pointer').includes('pull-request') && checks.get('forced-colors-motion').includes('weekly'),
    'the registry has a check in the short suite and one outside it');

  assertPlanted((inputs) => {
    classOf(inputs, 'C09').enforcedBy[0].check = 'pointr';
  }, /class C09, enforcedBy 1 names "pointr", which is not a known check/);
  // A check of the short suite reports on the pull request: a class that calls it weekly sends a fix to the audit.
  assertPlanted((inputs) => {
    classOf(inputs, 'C09').enforcedBy[0].runs = 'weekly';
  }, /class C09, enforcedBy 1: "pointer" runs pull-request, not "weekly"/);
  // A check outside the short suite runs in the weekly audit only: a class that says the pull request misleads a fix.
  assertPlanted((inputs) => {
    classOf(inputs, 'C11').enforcedBy[0].runs = 'pull-request';
  }, /class C11, enforcedBy 1: "forced-colors-motion" runs weekly or none, not "pull-request"/);
  assertPlanted((inputs) => {
    classOf(inputs, 'C09').enforcedBy.push({ check: 'none', runs: 'none' });
  }, /class C09: "none" says no check enforces the rule, so it stands alone/);
  assertPlanted((inputs) => {
    classOf(inputs, 'C09').enforcedBy = [];
  }, /class C09: "enforcedBy" must list at least one check/);
});

test('classes.md and rules.json list the same classes, row for row', () => {
  const { rules, classesDoc } = committed();

  assert.ok(classesDoc.includes(classRow(classOf({ rules }, 'C09'))), 'a class reads as its row');

  assertPlanted((inputs) => {
    inputs.classesDoc = inputs.classesDoc.split('\n').filter(line => !line.startsWith('| C09 |')).join('\n');
  }, /classes\.md has no row for C09, which .*rules\.json lists/);
  assertPlanted((inputs) => {
    inputs.classesDoc += '| C99 | Planted | none | skill | A rule. | none | 0 |\n';
  }, /classes\.md has a row for C99, which .*rules\.json does not list/);
  // A second row for a class: a map keyed by id keeps the last, so a stale copy below the right one would read as the row.
  assertPlanted((inputs) => {
    inputs.classesDoc += `${classRow(classOf(inputs, 'C09'))}\n`;
  }, /classes\.md has more than one row for C09/);
  // A rule edited in rules.json alone: the table shows the old text, and the message prints the row to copy.
  assertPlanted((inputs) => {
    classOf(inputs, 'C09').rule = 'A control acts on release.';
  }, /the row of C09 differs from .*rules\.json; it reads\n\| C09 \|.*A control acts on release\. \|/);
});

test('every catalog cluster names a class rules.json lists, and a record-only one only when it is not a defect', () => {
  const cluster = (inputs, id) => inputs.catalog.clusters.find(entry => entry.id === id);

  assertPlanted((inputs) => {
    delete cluster(inputs, 'menu-semantics').defectClass;
  }, /cluster "menu-semantics" has no "defectClass"/);
  assertPlanted((inputs) => {
    cluster(inputs, 'menu-semantics').defectClass = 'C99';
  }, /cluster "menu-semantics" names the class "C99", which .*rules\.json does not list/);
  assertPlanted((inputs) => {
    cluster(inputs, 'reader-golden-drift').defectClass = 'C02';
  }, /cluster "reader-golden-drift" is not a defect \(notDefect\), so its class is a record-only one, not C02/);
  assertPlanted((inputs) => {
    cluster(inputs, 'menu-semantics').defectClass = 'C16';
  }, /cluster "menu-semantics" names the record-only class C16, which is for a cluster with notDefect/);
});

test('every build rule names its classes, and every class names the file that holds its rule', () => {
  const { skill } = committed();

  assert.deepEqual(classTags('Acts on release. [C06, C09] and [C03]'), ['C06', 'C09', 'C03']);
  assert.ok(sectionBullets(skill, '## Build rules').every(rule => classTags(rule).length > 0));
  assert.deepEqual(Object.keys(HOME_FILES), ['skill', 'docs']);

  assertPlanted((inputs) => {
    inputs.skill = inputs.skill.replace('`aria-hidden="true"`. [C03]', '`aria-hidden="true"`.');
  }, /the build rule "\*\*Native element first.*names no class/);
  assertPlanted((inputs) => {
    inputs.skill = inputs.skill.replace('the exception. [C09]', 'the exception. [C14]');
  }, /the build rule "\*\*A control acts on release.*names C14, which is not a class whose home is the skill/);
  // C11 is tagged by one rule only: untagging it leaves the class without a rule in the skill.
  assertPlanted((inputs) => {
    inputs.skill = inputs.skill.replace('(1.4.1). [C11]', '(1.4.1). [C08]');
  }, /no build rule names C11, a class whose home is the skill/);
  assertPlanted((inputs) => {
    inputs.homes.docs = inputs.homes.docs.replace('[C14]', '');
  }, /docs\/AGENTS\.md does not name C14, a class whose home is "docs"/);
});

test('the skill and its class table hold rules, not records: no task id and no date', () => {
  assertPlanted((inputs) => {
    inputs.skill += 'Fixed in DEV-1234.\n';
  }, new RegExp(`${escapeRegExp(SKILL_FILE)}:\\d+ names a task id \\(DEV-1234\\)`));
  assertPlanted((inputs) => {
    inputs.classesDoc += 'Seen on 2026-11-17.\n';
  }, new RegExp(`${escapeRegExp(CLASSES_FILE)}:\\d+ holds a date \\(2026-11-17\\)`));
});

test('rules.json keeps its shape: ids, homes, criteria, strikes and the not-preventable list', () => {
  assertPlanted((inputs) => {
    classOf(inputs, 'C09').home = 'grid';
  }, /class C09: "home" must be one of skill, docs, website, record-only/);
  assertPlanted((inputs) => {
    classOf(inputs, 'C09').wcag.push('4.1.1');
  }, /class C09: "wcag" must list WCAG 2\.2 criteria/);
  assertPlanted((inputs) => {
    classOf(inputs, 'C10').id = 'C09';
  }, /class C09: the id is used twice/);
  assertPlanted((inputs) => {
    classOf(inputs, 'C09').name = 'Press | release';
  }, /class C09: "name" must say what the class is, with no pipe/);
  assertPlanted((inputs) => {
    classOf(inputs, 'C09').strikes.push({ cluster: 'drag-and-press-activation', audit: '17 November', pullRequest: 1 });
  }, /class C09, strike 1: "audit" must be the date of the audit that found it/);
  assertPlanted((inputs) => {
    inputs.rules.notPreventable.push({ cluster: 'reader-silent-step' });
  }, /notPreventable 1: "reason" must be why no rule can prevent it/);
  assertPlanted((inputs) => {
    inputs.rules.classes.push({
      id: 'C18',
      name: 'Planted',
      wcag: [],
      home: 'skill',
      rule: 'A rule.',
      enforcedBy: [{ check: 'none', runs: 'none' }],
      strikes: [],
      extra: true,
    });
  }, /class C18 has an unknown field "extra"/);
});

test('the classes account for the catalog: every check a cluster is found by, and every cluster a record names', () => {
  const cluster = (inputs, id) => inputs.catalog.clusters.find(entry => entry.id === id);

  // `grid-roles` is found by the grid's axe scan and by the docs and website scans of the pages that embed a grid.
  assertPlanted((inputs) => {
    classOf(inputs, 'C02').enforcedBy = classOf(inputs, 'C02').enforcedBy.filter(item => item.check !== 'docs-axe');
  }, /class C02: its cluster "grid-roles" is found by docs-axe, which its "enforcedBy" does not list/);
  // A match that lists several checks is satisfied by any one of them, and the triage run counts for none.
  assertPlanted((inputs) => {
    classOf(inputs, 'C06').enforcedBy = classOf(inputs, 'C06').enforcedBy
      .filter(item => item.check !== 'keyboard-walker');
  }, /class C06: its cluster "formula-help-panel-focus-stop" is found by tree-snapshots or keyboard-walker/);
  assertPlanted((inputs) => {
    classOf(inputs, 'C09').strikes.push({ cluster: 'no-such-cluster', audit: '2026-11-23', pullRequest: 1 });
  }, /class C09, strike 1 names "no-such-cluster", which tests\/a11y\/issues\.json does not hold/);
  assertPlanted((inputs) => {
    classOf(inputs, 'C09').strikes.push({ cluster: 'menu-semantics', audit: '2026-11-23', pullRequest: 1 });
  }, /class C09, strike 1 names "menu-semantics", a cluster of C02/);
  assertPlanted((inputs) => {
    inputs.rules.notPreventable.push({ cluster: 'no-such-cluster', reason: 'Planted.' });
  }, /notPreventable 1 names "no-such-cluster", which tests\/a11y\/issues\.json does not hold/);
  // A site match that names its finding kinds and no check holds its class to the site check that writes them.
  assertPlanted((inputs) => {
    classOf(inputs, 'C08').enforcedBy = classOf(inputs, 'C08').enforcedBy
      .filter(item => !item.check.endsWith('-focus-contrast'));
  }, /class C08: its cluster "docs-focus-indicator-contrast" is found by docs-focus-contrast/);
  assertPlanted((inputs) => {
    classOf(inputs, 'C10').enforcedBy = classOf(inputs, 'C10').enforcedBy.filter(item => item.check !== 'docs-reflow');
  }, /class C10: its cluster "docs-content-reflow" is found by docs-reflow/);
  assertPlanted((inputs) => {
    classOf(inputs, 'C15').enforcedBy = [{ check: 'none', runs: 'none' }];
  }, /class C15: its cluster "website-newsletter-label" is found by website-forms/);
  // A finding kind the map does not know would let its cluster's class off, so the catalog may not name one.
  assertPlanted((inputs) => {
    cluster(inputs, 'docs-heading-skips').match[0].kinds = ['heading-order-planted'];
  }, /cluster "docs-heading-skips" matches the site finding kind "heading-order-planted", which SITE_FINDING_KINDS/);
  // A cluster moved to another class carries its checks' demands with it.
  assertPlanted((inputs) => {
    cluster(inputs, 'drag-and-press-activation').defectClass = 'C14';
  }, /class C14: its cluster "drag-and-press-activation" is found by pointer/);
});

test('every pointer line still points, and a build rule it quotes exists', () => {
  const { pointers } = committed();

  assert.equal(Object.keys(POINTER_FILES).length, 10, 'the pointer files: eight point at the skill, two at the docs');
  assert.ok(Object.values(pointers).every(text => text.length > 0), 'read every pointer file');

  assertPlanted((inputs) => {
    const file = '.claude/skills/react-wrapper-dev/SKILL.md';

    inputs.pointers[file] = inputs.pointers[file].replace('"Only the user moves focus"', '"Never move the focus"');
  }, /react-wrapper-dev\/SKILL\.md quotes the build rule "Never move the focus", which .*SKILL\.md does not have/);
  // A rule renamed in the skill orphans every quote of its old lead.
  assertPlanted((inputs) => {
    inputs.skill = inputs.skill.replace('**Only the user moves focus.**', '**Focus moves only for the user.**');
  }, /vue-wrapper-dev\/SKILL\.md quotes the build rule "Only the user moves focus"/);
  assertPlanted((inputs) => {
    const file = '.claude/skills/visual-testing/SKILL.md';

    inputs.pointers[file] = inputs.pointers[file].replaceAll('`handsontable-a11y` skill', 'accessibility skill');
  }, /visual-testing\/SKILL\.md does not point at the `handsontable-a11y` skill/);
  assertPlanted((inputs) => {
    const file = '.claude/skills/writing-docs-pages/SKILL.md';

    inputs.pointers[file] = inputs.pointers[file].replace('"Accessible pages"', '"Accessibility"');
  }, /writing-docs-pages\/SKILL\.md does not point at `docs\/AGENTS\.md`, "Accessible pages"/);
});

test('every site finding kind maps to a site check whose spec can write it', () => {
  const root = repoRoot();
  const read = file => readFileSync(path.join(root, file), 'utf8');
  // A spec writes a kind itself or through a `tests/lib` module it imports; a kind several specs can reach (the shared
  // contrast and layout modules) is mapped to the check whose criteria it evidences.
  const reachable = (spec) => {
    const text = read(`tests/a11y/sites/${spec}`);
    const modules = [...text.matchAll(/from '\.\.\/\.\.\/lib\/([^']+)'/g)].map(([, file]) => read(`tests/lib/${file}`));

    return [text, ...modules].join('\n');
  };

  for (const [kind, siteKind] of Object.entries(SITE_FINDING_KINDS)) {
    assert.ok(Object.hasOwn(SITE_CHECK_KINDS, siteKind), `${kind} maps to "${siteKind}", not a site check kind`);
    assert.ok(reachable(SITE_CHECK_KINDS[siteKind].spec).includes(`'${kind}'`),
      `${kind}: ${SITE_CHECK_KINDS[siteKind].spec} and the modules it imports never write it`);
  }

  const { catalog } = committed();
  const siteKinds = catalog.clusters.flatMap(entry => entry.match)
    .filter(match => ['docs-checks', 'website-checks'].includes(match.source)).flatMap(match => match.kinds ?? []);

  assert.ok(siteKinds.length > 30, 'the catalog matches site findings by kind');
  assert.deepEqual(siteKinds.filter(kind => !Object.hasOwn(SITE_FINDING_KINDS, kind)), []);
});
