import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { modeOf, requiresSafe, rewrites } from '../src/lib/safety.mjs';
import { VERSIONS_DIR, buildPlan, loadManifest, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { createRegistry } from '../src/transforms/index.mjs';

/**
 * The code of a text: no comment and no white space. A comment can move when a TODO lands next to it, and a TODO
 * is the one thing a rule that is not safe may add.
 *
 * @param {string} text File text.
 * @returns {string} The text without comments and white space.
 */
function codeOf(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/\s+/g, '');
}

/**
 * One kind, the fixture that exercises it, and the options that fixture needs.
 *
 * `version` defaults to 18.0.0. A kind that only reports is run with `safe: true` forced on, to pin that its kind alone keeps
 * it from editing.
 *
 * @type {Array<{kind: string, fixture: string, phase?: 1|2, version?: string}>}
 */
const KINDS = [
  { kind: 'optionRename', fixture: 'options-export-file' },
  { kind: 'optionMove', fixture: 'options-vanilla-js' },
  { kind: 'optionRemove', fixture: 'options-vanilla-js' },
  { kind: 'importSource', fixture: 'common-imports-basic' },
  { kind: 'exportRename', fixture: 'plugin-type-renames' },
  { kind: 'namespaceType', fixture: 'namespace-types' },
  { kind: 'cssVariable', fixture: 'css-var-rename-scss' },
  { kind: 'themeToken', fixture: 'theme-token-rename' },
  { kind: 'methodRemove', fixture: 'methods-resize-state-removed' },
  { kind: 'methodMove', fixture: 'methods-undo-moved' },
  { kind: 'callUnwrap', fixture: 'sanitize-call' },
  { kind: 'dependency', fixture: 'dependencies-bump-and-add', phase: 2 },
  { kind: 'detect', fixture: 'detect-numbro-pattern' },
  { kind: 'exportRemoved', fixture: 'plugin-settings-removed' },
  { kind: 'custom', fixture: 'sanitizer-source-report', version: '18.1.0' },
];

describe('the safe contract helpers', () => {
  it('rewrites only for a rule that states safe: true and is not report-only by kind', () => {
    assert.equal(rewrites({ kind: 'optionRename', safe: true }), true);
    assert.equal(rewrites({ kind: 'optionRename', safe: false }), false);
    assert.equal(rewrites({ kind: 'optionRename' }), false, 'nothing defaults to a rewrite');
    assert.equal(rewrites({ kind: 'detect', safe: true }), false);
    assert.equal(rewrites({ kind: 'exportRemoved', safe: true }), false);
  });

  it('names the mode of a rule for --list', () => {
    assert.equal(modeOf({ kind: 'cssVariable', safe: true }), 'rewrite');
    assert.equal(modeOf({ kind: 'cssVariable', safe: false }), 'report');
    assert.equal(modeOf({ kind: 'detect', safe: false }), 'report');
  });

  it('asks every kind but detect and exportRemoved to state safe', () => {
    assert.deepEqual(['detect', 'exportRemoved', 'optionRemove', 'custom', 'dependency'].map(requiresSafe),
      [false, false, true, true, true]);
  });
});

describe('the runner enforces the contract', () => {
  /**
   * Run a transform that reports one `changed` entry for rule `a`, whose `safe` is given.
   *
   * @param {boolean} safe The rule's `safe`.
   * @param {'changed'|'manual'} severity Severity the transform reports.
   * @returns {Promise<object>} The `transformFile` result.
   */
  function runFake(safe, severity) {
    const rule = { id: '18.0.0/a', kind: 'cssVariable', version: '18.0.0', guideUrl: null, safe };
    const registry = createRegistry([{
      kinds: ['cssVariable'],
      fileKinds: ['css'],
      apply(ctx) {
        ctx.report({ ruleId: rule.id, severity, message: 'x' });
      },
    }]);

    return transformFile({
      filePath: 'a.css',
      source: ':root { --ht-x: 1px; }\n',
      plan: buildPlan([{ version: '18.0.0', rules: [rule] }]),
      registry,
    });
  }

  it('turns a changed entry of a rule that is not safe into a transform error', async() => {
    const result = await runFake(false, 'changed');

    assert.equal(result.changed, false);
    assert.equal(result.entries[0].ruleId, 'transform-error');
    assert.match(result.entries[0].message, /18\.0\.0\/a is not safe/);
  });

  it('lets a safe rule change code and any rule report manual work', async() => {
    assert.equal((await runFake(true, 'changed')).entries[0].ruleId, '18.0.0/a');
    assert.equal((await runFake(false, 'manual')).entries[0].severity, 'manual');
  });
});

describe('every shipped rule states what it does', () => {
  it('has a boolean safe, and a removal advisory never claims to rewrite', async() => {
    for (const manifest of await loadManifests()) {
      for (const rule of manifest.rules) {
        assert.equal(typeof rule.safe, 'boolean', `${rule.id}: safe`);

        if (rule.removed === true) {
          assert.equal(rule.safe, false, `${rule.id}: a removal advisory only leaves a TODO or a report`);
        }

        if (!requiresSafe(rule.kind)) {
          assert.equal(rule.safe, false, `${rule.id}: ${rule.kind} only reports`);
        }
      }
    }
  });

  it('lists a rule that has to stay a report only for a reason its note or message gives', async() => {
    const manifest = await loadManifest(join(VERSIONS_DIR, '18.0.0'));
    const renames = manifest.rules.filter(rule => rule.kind === 'exportRename' && rule.safe === false);

    assert.ok(renames.length >= 5);
    renames.forEach(rule => assert.ok(rule.note, `${rule.id}: say what changes in the type`));
  });
});

describe('a rule that is not safe never edits code', () => {
  for (const entry of KINDS) {
    it(`${entry.kind}: only reports, and leaves nothing but TODO comments behind`, async() => {
      const version = entry.version ?? '18.0.0';
      const manifest = await loadManifest(join(VERSIONS_DIR, version));
      const reportOnly = !requiresSafe(entry.kind);
      const rules = manifest.rules.filter(rule => rule.kind === entry.kind)
        .map(rule => ({ ...rule, safe: reportOnly }));
      const dir = join(VERSIONS_DIR, version, '__fixtures__', entry.fixture);
      const file = (await readdir(dir)).find(name => /^input\./.test(name));
      const input = await readFile(join(dir, file), 'utf8');
      const optionsText = await readFile(join(dir, 'options.json'), 'utf8').catch(() => '{}');
      const fixtureOptions = JSON.parse(optionsText);
      const result = await transformFile({
        filePath: file,
        source: input,
        plan: buildPlan([{ ...manifest, rules }]),
        options: { aggressive: Boolean(fixtureOptions.aggressive) },
        facts: new Set(fixtureOptions.facts ?? []),
        phase: entry.phase ?? 1,
      });
      const severities = new Set(result.entries.map(item => item.severity));

      assert.equal(result.entries.some(item => item.ruleId === 'transform-error'), false,
        result.entries.map(item => item.message).join('\n'));
      assert.equal(severities.has('changed'), false, 'a rule that is not safe reported a change');
      assert.equal(severities.has('manual'), true, 'it should still say what is left to do');
      assert.equal(codeOf(result.output), codeOf(input));
    });
  }

  it('optionRemove leaves the property and, with todo: false, no comment either', async() => {
    const rule = {
      id: '18.0.0/x',
      kind: 'optionRemove',
      safe: false,
      todo: false,
      name: 'gone',
      advice: 'Gone in 18.0.',
      version: '18.0.0',
      guideUrl: null,
    };
    const source = 'import Handsontable from \'handsontable\';\nnew Handsontable(el, { a: 1, gone: true });\n';
    const plan = buildPlan([{ version: '18.0.0', rules: [rule] }]);
    const result = await transformFile({ filePath: 'a.js', source, plan });

    assert.equal(result.output, source);
    assert.deepEqual(result.entries.map(item => item.severity), ['manual']);
    assert.match(result.entries[0].message, /Remove the gone property\. Gone in 18\.0\./);
  });

  it('optionRemove with todo on leaves a TODO before the property it keeps', async() => {
    const rule = {
      id: '18.0.0/x',
      kind: 'optionRemove',
      safe: false,
      name: 'gone',
      advice: 'Gone in 18.0.',
      version: '18.0.0',
      guideUrl: null,
    };
    const source = 'import Handsontable from \'handsontable\';\nnew Handsontable(el, {\n  a: 1,\n  gone: true,\n});\n';
    const plan = buildPlan([{ version: '18.0.0', rules: [rule] }]);
    const result = await transformFile({ filePath: 'a.js', source, plan });

    assert.match(result.output, /\/\/ TODO\(handsontable-codemod 18\.0\.0\/x\): Gone in 18\.0\.\n\s+gone: true/);
    assert.doesNotMatch(result.output, /Deleted/);
  });
});
