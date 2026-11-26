import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rewrites } from '../src/lib/safety.mjs';
import { REPORT_CLASSES, buildPlan, loadManifests, validateRule } from '../src/manifest.mjs';
import { describeRules, transformFile } from '../src/runner.mjs';
import { inPlainProject, migrate } from './helpers/plain-project.mjs';

const manifests = await loadManifests();
const RANGE = ['--from', '17.1', '--to', '18.1'];
const ONLY_NUMBRO = ['--only', '18.0.0/numbro-pattern'];
const PACKAGE = '{ "dependencies": { "handsontable": "^17.1.0" } }\n';
const HEAD = 'import Handsontable from \'handsontable\';\n';
const REVIEW_ONLY = `${HEAD}new Handsontable(document.body, { columns: [{ type: 'date' }] });\n`;
const NUMERIC = '{ type: \'numeric\', numericFormat: { pattern: \'0,0\' } }';
const MANUAL = `${HEAD}new Handsontable(document.body, { columns: [${NUMERIC}] });\n`;
const BOTH = `${HEAD}new Handsontable(document.body, { columns: [{ type: 'date' }, ${NUMERIC}] });\n`;
const BAD = `${HEAD}const = ;\n`;

/**
 * The rules of the shipped manifests that report `review`: the behavior changed there, and the code may already be
 * right. Every other report rule is `manual`: the code stops working, throws, is removed, or is deprecated. A change
 * of this table is a decision about what a project must do, so it is made on purpose, in the rule and here.
 */
const REVIEW = [
  '18.0.0/date-default-format',
  '18.0.0/time-default-format',
  '18.1.0/column-move-hooks',
  '18.1.0/sanitizer-source',
  '18.1.0/sanitizer-new-sources',
  '19.0.0/before-init-option',
  '19.0.0/width-outside-reference',
  '19.0.0/get-copyable-data',
  '19.0.0/col-to-prop-null',
  '19.0.0/undo-false',
  '19.0.0/editor-false',
  '19.0.0/data-provider-row-id-dot',
  '19.0.0/col-widths-null',
  '19.0.0/vue-handsontable-get-value-props',
  '19.0.0/row-heights-exact',
  '19.0.0/checked-menu-item-property',
  '19.0.0/dropdown-strict-false',
  '19.0.0/data-schema-without-columns',
  '19.0.0/editor-set-value',
  '19.0.0/after-render-engine-write',
  '19.0.0/hook-set-to-null',
  '19.0.0/frozen-columns-drag-and-unfreeze-hooks',
  '19.0.0/update-settings-data-provider',
  '19.0.0/update-settings-data-schema',
  '19.0.0/custom-borders-menu-color',
  '19.0.0/height-auto',
  '19.0.0/sizes-physical-index',
  '19.0.0/get-copyable-source-data',
];

describe('the class of a rule that only reports', () => {
  const rules = manifests.flatMap(manifest => manifest.rules);

  it('is review for the rules of the table and manual for every other report rule', () => {
    const reported = rules.filter(rule => !rewrites(rule));
    const review = reported.filter(rule => rule.severity === 'review').map(rule => rule.id).sort();

    assert.deepEqual(review, [...REVIEW].sort());
    assert.ok(reported.filter(rule => rule.severity !== 'review').every(rule => [undefined, 'manual', 'warning']
      .includes(rule.severity)));
  });

  it('is never set on a rule that rewrites', () => {
    assert.deepEqual(rules.filter(rule => rewrites(rule) && 'severity' in rule).map(rule => rule.id), []);
  });

  it('shows in the rows of --list: the class of a report rule, and null for a rule that rewrites', () => {
    const plan = buildPlan(manifests);
    const rows = describeRules(plan);
    const byId = new Map(rows.map(row => [row.id, row]));

    assert.equal(byId.get('18.0.0/date-default-format').severity, 'review');
    assert.equal(byId.get('18.0.0/numbro-pattern').severity, 'manual');
    assert.equal(byId.get('18.0.0/type-autofill-direction').severity, 'manual');
    assert.equal(byId.get('18.0.0/common-imports').severity, null);
    assert.ok(rows.filter(row => row.mode === 'rewrite').every(row => row.severity === null));
  });

  it('keeps the two rules of a twin pair, and the two of a merge key, in one class', () => {
    const byId = new Map(manifests.flatMap(manifest => manifest.rules).map(rule => [rule.id, rule]));
    const classOf = rule => rule.severity ?? 'manual';

    for (const rule of byId.values()) {
      for (const twin of rule.twins ?? []) {
        assert.equal(classOf(rule), classOf(byId.get(twin)), `${rule.id} and its twin ${twin}`);
      }
    }

    const byKey = new Map();

    for (const rule of byId.values()) {
      if (rule.kind === 'detect' && rule.mergeKey) {
        byKey.set(rule.mergeKey, [...(byKey.get(rule.mergeKey) ?? []), classOf(rule)]);
      }
    }

    for (const [key, classes] of byKey) {
      assert.equal(new Set(classes).size, 1, `rules of the merge key ${key}`);
    }
  });
});

describe('the "severity" field of a rule', () => {
  const base = { id: '18.0.0/x', kind: 'methodRemove', methods: ['a'], receiver: 'any', safe: false };

  it('takes manual or review on a rule that only reports', () => {
    assert.deepEqual(REPORT_CLASSES, ['manual', 'review']);
    assert.deepEqual(validateRule({ ...base, severity: 'review' }, '18.0.0'), []);
    assert.deepEqual(validateRule({ ...base, severity: 'manual' }, '18.0.0'), []);
    assert.deepEqual(validateRule({ id: '18.0.0/x',
      kind: 'exportRemoved',
      source: 'a',
      name: 'B',
      advice: 'Use C.',
      severity: 'review' }, '18.0.0'), []);
  });

  it('refuses any other value, and refuses a rule that rewrites', () => {
    assert.match(validateRule({ ...base, severity: 'warning' }, '18.0.0')[0],
      /"severity" must be one of manual, review/);
    assert.match(validateRule({ ...base, severity: 'high' }, '18.0.0')[0], /"severity" must be one of/);
    assert.match(validateRule({ ...base, severity: 'review', safe: true }, '18.0.0')[0], /always "manual"/);
    assert.match(validateRule({ ...base, severity: 3 }, '18.0.0')[0], /"severity" must be of type string/);
  });

  it('is checked by the detect rule on its own, which also takes warning', () => {
    const detect = { id: '18.0.0/x', kind: 'detect', match: { import: 'a' }, files: ['js'], message: 'Check it.' };

    assert.deepEqual(validateRule({ ...detect, severity: 'review' }, '18.0.0'), []);
  });
});

describe('a rule that only reports turns its manual entries into review entries', () => {
  const rule = {
    id: '18.0.0/x',
    kind: 'methodRemove',
    methods: ['saveManualColumnWidths'],
    receiver: 'any',
    advice: 'Check the call.',
    safe: false,
    version: '18.0.0',
    guideUrl: null,
  };
  const source = 'import Handsontable from \'handsontable\';\nconst hot = new Handsontable(document.body, {});\n'
    + 'hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths();\n';

  /**
   * Run the rule on the source.
   *
   * @param {object} fields Fields to set on the rule.
   * @returns {Promise<{entries: object[], output: string}>} The outcome.
   */
  async function runRule(fields) {
    const plan = buildPlan([{ version: '18.0.0', rules: [{ ...rule, ...fields }] }]);

    return transformFile({ filePath: 'a.js', source, plan, options: {} });
  }

  it('reports the entry as review, and leaves the TODO marker the same as for a manual entry', async() => {
    const review = await runRule({ severity: 'review' });
    const manual = await runRule({});

    assert.deepEqual(review.entries.map(entry => entry.severity), ['review']);
    assert.deepEqual(manual.entries.map(entry => entry.severity), ['manual']);
    assert.equal(review.entries[0].marked, true);
    assert.equal(review.output, manual.output);
    assert.match(review.output, /TODO\(handsontable-codemod 18\.0\.0\/x\)/);
  });
});

describe('--fail-on-manual', () => {
  it('exits 0 for a run that leaves only entries to review, with and without the flag', async() => {
    await inPlainProject({ 'package.json': PACKAGE, 'a.js': REVIEW_ONLY }, async(dir) => {
      const flag = await migrate(dir, [...RANGE, '--dry-run', '--only', '18.0.0/date-default-format',
        '--fail-on-manual']);
      const plain = await migrate(dir, [...RANGE, '--dry-run', '--only', '18.0.0/date-default-format']);

      assert.match(flag.stdout, /0 manual steps, 1 to review, 0 warnings\.$/m);
      assert.equal(flag.status, 0, flag.stderr);
      assert.equal(plain.status, 0);
    });
  });

  it('exits 3 for a run that leaves a manual step, and 0 without the flag', async() => {
    await inPlainProject({ 'package.json': PACKAGE, 'a.js': MANUAL }, async(dir) => {
      const flag = await migrate(dir, [...RANGE, ...ONLY_NUMBRO, '--dry-run', '--fail-on-manual']);
      const plain = await migrate(dir, [...RANGE, ...ONLY_NUMBRO, '--dry-run']);
      const json = await migrate(dir, [...RANGE, ...ONLY_NUMBRO, '--dry-run', '--fail-on-manual', '--json']);

      assert.equal(flag.status, 3);
      assert.match(flag.stderr, /1 manual step left, so the exit code is 3 \(--fail-on-manual\)\./);
      assert.equal(plain.status, 0);
      assert.equal(JSON.parse(json.stdout).exitCode, 3);
      assert.equal(json.status, 3);
    });
  });

  it('counts a run that wrote its files, not only a dry run', async() => {
    await inPlainProject({ 'package.json': PACKAGE, 'a.js': MANUAL }, async(dir) => {
      const first = await migrate(dir, [...RANGE, ...ONLY_NUMBRO, '--fail-on-manual']);
      const second = await migrate(dir, [...RANGE, ...ONLY_NUMBRO, '--fail-on-manual']);

      assert.equal(first.status, 3);
      // The marker of the first run stays in the code, and the entry is still reported.
      assert.equal(second.status, 3);
    });
  });

  it('exits 0 when nothing is left, and a warning alone never causes 3', async() => {
    const files = { 'package.json': PACKAGE, 'a.js': 'export const a = 1;\n', 'a.less': '@import "handsontable";\n' };

    await inPlainProject(files,
      async(dir) => {
        const { status, stdout } = await migrate(dir, [...RANGE, '--fail-on-manual']);

        assert.match(stdout, /0 manual steps, 0 to review, 1 warning\.$/m);
        assert.equal(status, 0);
      });
  });

  it('keeps exit code 1 when a file could not be parsed, and exit code 2 for a refusal', async() => {
    await inPlainProject({ 'package.json': PACKAGE, 'a.js': MANUAL, 'bad.js': BAD },
      async(dir) => {
        const failed = await migrate(dir, [...RANGE, ...ONLY_NUMBRO, '--dry-run', '--fail-on-manual']);
        const refused = await migrate(dir, ['--only', 'nope', ...RANGE, '--fail-on-manual']);

        assert.equal(failed.status, 1);
        assert.equal(refused.status, 2);
      });
  });

  it('keeps exit code 1 when the report file cannot be written, and 130 for an interrupted run', async() => {
    await inPlainProject({ 'package.json': PACKAGE, 'a.js': MANUAL }, async(dir) => {
      const report = await migrate(dir, [...RANGE, '--dry-run', '--fail-on-manual', '--report', 'r.md'], {
        writeReport: async() => {
          throw new Error('disk full');
        },
      });
      const controller = new AbortController();

      controller.abort();

      const stopped = await migrate(dir, [...RANGE, '--fail-on-manual'], { signal: controller.signal });

      assert.equal(report.status, 1);
      assert.equal(stopped.status, 130);
    });
  });

  it('has no effect on --list', async() => {
    const { status } = await migrate(process.cwd(), ['--list', '--from', '17.1', '--fail-on-manual']);

    assert.equal(status, 0);
  });
});

describe('the lines after a run say what to do with the entries to review', () => {
  it('names the spots to review next to the manual steps, and the search for the markers', async() => {
    await inPlainProject({ 'package.json': PACKAGE, 'a.js': BOTH }, async(dir) => {
      const { stdout } = await migrate(dir, [...RANGE, ...ONLY_NUMBRO, '--only', '18.0.0/date-default-format']);

      assert.match(stdout,
        /^Next: work through the 1 manual step in the report\. All of them are marked in the code\.$/m);
      assert.match(stdout, new RegExp('^Next: look at the 1 spot to review in the report\\. The behavior changed '
        + 'there, and your code may already be right\\. All of them are marked in the code\\.$', 'm'));
      assert.match(stdout, /^Next: find the markers with: git grep "TODO\(handsontable-codemod"$/m);
    });
  });
});
