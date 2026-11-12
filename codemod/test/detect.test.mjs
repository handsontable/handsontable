import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { PACKAGE_ROOT, VERSIONS_DIR, buildPlan, loadManifest } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { COLLAPSE_AFTER, stringsIn, validateDetectRule } from '../src/transforms/detect.mjs';
import { anchorsOf } from './helpers/guide-anchors.mjs';
import { parse } from './helpers/parse.mjs';

/**
 * Build a `detect` rule with working defaults.
 *
 * @param {object} fields Fields that differ from the defaults.
 * @returns {object} The rule, shaped like a loaded manifest rule.
 */
function rule(fields) {
  return {
    id: 'x/r',
    kind: 'detect',
    version: 'x',
    safe: false,
    guideUrl: null,
    files: ['js'],
    message: 'm',
    ...fields,
  };
}

/**
 * Run one rule over a file.
 *
 * @param {object} detectRule A rule from `rule()`.
 * @param {string} source File text.
 * @param {string} [filePath] File name, which picks the adapter.
 * @param {Set<string>} [facts] Shared facts.
 * @returns {Promise<{skipped: string|null, changed: boolean, lines: Array<number|null>, entries: object[]}>} The
 * outcome with the reported lines.
 */
async function run(detectRule, source, filePath = 'a.ts', facts = new Set()) {
  const plan = { versions: [{ version: 'x', rules: [detectRule] }], rulesById: new Map([[detectRule.id, detectRule]]) };
  const result = await transformFile({ filePath, source, plan, facts });

  return { ...result, lines: result.entries.map(entry => entry.line) };
}

const HOT = 'import Handsontable from "handsontable";\n';

describe('shipped detect rules', () => {
  for (const version of ['18.0.0', '18.1.0']) {
    it(`are valid and point at a heading of the ${version} guide`, async() => {
      const manifest = await loadManifest(join(VERSIONS_DIR, version));
      const guide = await readFile(join(PACKAGE_ROOT, '..', manifest.guide.source), 'utf8');
      const anchors = anchorsOf(guide);
      const rules = manifest.rules.filter(item => item.kind === 'detect');

      assert.ok(rules.length > 0);

      for (const item of rules) {
        assert.deepEqual(validateDetectRule(item), [], item.id);
        assert.equal(item.safe, false, item.id);
        assert.doesNotMatch(item.message, /—/, item.id);

        if (item.guide) {
          assert.ok(anchors.has(item.guide), `${item.id} anchor ${item.guide}`);
        }
      }

      for (const item of manifest.rules.filter(candidate => candidate.kind === 'custom' && candidate.guide)) {
        assert.ok(anchors.has(item.guide), `${item.id} anchor ${item.guide}`);
      }
    });
  }

  it('lists the 18.0 and 18.1 rule ids', async() => {
    const ids = async version => (await loadManifest(join(VERSIONS_DIR, version))).rules
      .filter(item => item.kind === 'detect' || item.id.includes('sanitizer')).map(item => item.id).sort();

    assert.deepEqual(await ids('18.0.0'), [
      '18.0.0/helper-typings-only',
      '18.0.0/html-without-sanitizer',
      '18.0.0/moment-date-format',
      '18.0.0/moment-time-format',
      '18.0.0/numbro-pattern',
      '18.0.0/pikaday-leftovers',
      '18.0.0/wrapper-dom-selectors',
    ]);
    assert.deepEqual(await ids('18.1.0'), [
      '18.1.0/column-move-hooks',
      '18.1.0/license-key-missing',
      '18.1.0/loading-markup',
      '18.1.0/pikaday-theme-leftovers',
      '18.1.0/sanitizer-new-sources',
      '18.1.0/sanitizer-source',
      '18.1.0/synthetic-header-mousedown',
    ]);
  });
});

describe('validateDetectRule', () => {
  it('accepts a minimal rule', () => {
    assert.deepEqual(validateDetectRule(rule({ match: { regex: 'x' }, files: ['css'] })), []);
  });

  it('reports a missing message, bad files, severity, requires, and an unknown field', () => {
    const problems = validateDetectRule({
      files: ['js', 'json'],
      severity: 'loud',
      requires: 'sometimes',
      match: { property: 'a', nope: 1 },
    }).join('\n');

    assert.match(problems, /"message" is required/);
    assert.match(problems, /"files" must be/);
    assert.match(problems, /"severity" must be/);
    assert.match(problems, /"requires" must be/);
    assert.match(problems, /unknown field "nope"/);
  });

  it('wants exactly one matcher per object and a js-only matcher only with js files', () => {
    assert.match(validateDetectRule(rule({ match: { property: 'a', call: 'b' } })).join(), /exactly one matcher/);
    assert.match(validateDetectRule(rule({ match: {} })).join(), /exactly one matcher/);
    assert.match(validateDetectRule(rule({ match: { property: 'a' }, files: ['js', 'css'] })).join(),
      /reads js only/);
    assert.match(validateDetectRule(rule({ match: { anyOf: [] } })).join(), /non-empty array/);
  });

  it('rejects an invalid pattern and flags other than i, m, s, u', () => {
    assert.match(validateDetectRule(rule({ match: { string: '(' } })).join(), /not a valid regular expression/);
    assert.match(validateDetectRule(rule({ match: { string: 'a', flags: 'g' } })).join(), /flags may hold only/);
  });

  it('makes the transform throw on an invalid rule', async() => {
    const result = await run(rule({ match: { property: 'a', nope: 1 } }), `${HOT}const a = { a: 1 };\n`);

    assert.equal(result.entries[0].ruleId, 'transform-error');
  });
});

describe('import matcher', () => {
  const importRule = rule({ requires: 'none', match: { import: ['numbro'] } });

  it('finds an import, a re-export, a require, and a dynamic import, and the files inside the module', async() => {
    const source = `${HOT}import numbro from 'numbro';\nexport * from 'numbro/languages';\n`
      + 'const a = require("numbro");\nconst b = import("numbro/dist/x");\n';

    assert.deepEqual((await run(importRule, source)).lines, [2, 3, 4, 5]);
  });

  it('does not match a module that only shares the prefix', async() => {
    const source = `${HOT}import x from 'numbro-extra';\nimport y from 'my-numbro';\n`;

    assert.deepEqual((await run(importRule, source)).lines, []);
  });
});

describe('namespaceMember matcher', () => {
  const member = rule({ match: { namespaceMember: ['helper.log', 'helper.isIE'] } });

  it('matches a read of the member through the file\'s own Handsontable binding, called or not', async() => {
    const source = `${HOT}Handsontable.helper.log('a');\nconst f = Handsontable.helper.isIE;\n`
      + 'Handsontable?.helper.log("b");\nHandsontable.helper.isNumeric(1);\n';

    assert.deepEqual((await run(member, source)).lines, [2, 3, 4]);
  });

  it('ignores a same-shaped chain on another object and a name that only shares the prefix', async() => {
    const source = `${HOT}const other = { helper: { log() {} } };\nother.helper.log();\n`
      + 'Handsontable.helper.logger();\nHandsontable.helper;\n';

    assert.deepEqual((await run(member, source)).lines, []);
  });

  it('reads through a namespace import and the global build', async() => {
    const namespace = 'import * as HOT from "handsontable";\nHOT.helper.log(1);\n';
    const global = '/* Handsontable global */\nHandsontable.helper.log(1);\n';

    assert.deepEqual((await run(member, namespace)).lines, [2]);
    assert.deepEqual((await run(member, global)).lines, [2]);
  });

  it('wants a member path or a list of them', () => {
    assert.match(validateDetectRule(rule({ match: { namespaceMember: 1 } })).join(), /namespaceMember must be/);
    assert.match(validateDetectRule(rule({ match: { namespaceMember: 'a', files: ['css'] }, files: ['css'] })).join(),
      /reads js only/);
  });
});

describe('property matcher', () => {
  const pattern = rule({ match: { property: 'numericFormat.pattern' } });

  it('matches the dotted path and not a same-named key elsewhere', async() => {
    const source = `${HOT}const a = { numericFormat: { pattern: '0.00' } };\nconst b = { pattern: 'x' };\n`
      + 'const c = { format: { pattern: "y" } };\n';

    assert.deepEqual((await run(pattern, source)).lines, [2]);
  });

  it('sees through a type assertion between the keys', async() => {
    const source = `${HOT}const a = { numericFormat: { pattern: '0.00' } as object };\n`;

    assert.deepEqual((await run(pattern, source)).lines, [2]);
  });

  it('matches a JSX attribute for a one-segment path', async() => {
    const source = 'import { HotColumn } from "@handsontable/react-wrapper";\n'
      + 'const a = <HotColumn dateFormat="DD/MM/YYYY" />;\n';
    const result = await run(rule({ match: { property: 'dateFormat' } }), source, 'a.tsx');

    assert.deepEqual(result.lines, [2]);
  });

  it('matches a nested path under a JSX attribute', async() => {
    const source = 'import { HotTable } from "@handsontable/react-wrapper";\n'
      + 'const a = <HotTable loading={{ title: "<b>x</b>" }} />;\n';
    const result = await run(rule({ match: { property: 'loading.title' } }), source, 'a.tsx');

    assert.deepEqual(result.lines, [2]);
  });

  it('tests valueMatches on string literals and template literals only', async() => {
    const matcher = rule({ match: { property: 'dateFormat', valueMatches: '.' } });
    const source = `${HOT}const a = { dateFormat: 'DD/MM/YYYY' };\nconst b = { dateFormat: \`h:mm\` };\n`
      + 'const c = { dateFormat: { year: "numeric" } };\nconst d = { dateFormat: fmt };\n'
      + 'const e = { dateFormat: `${x}` };\n'; // eslint-disable-line no-template-curly-in-string

    assert.deepEqual((await run(matcher, source)).lines, [2, 3]);
  });

  it('matches without valueMatches whatever the value is', async() => {
    const source = `${HOT}const a = { dateFormat: fmt };\nconst b = { dateFormat() {} };\n`;

    assert.deepEqual((await run(rule({ match: { property: 'dateFormat' } }), source)).lines, [2, 3]);
  });

  it('needs the value to be an object with withKey', async() => {
    const matcher = rule({ match: { property: 'formulas', withKey: 'engine' } });
    const source = `${HOT}const a = { formulas: { engine: HyperFormula } };\nconst b = { formulas: true };\n`
      + 'const c = { formulas: { sheetName: "x" } };\n';

    assert.deepEqual((await run(matcher, source)).lines, [2]);
  });

  it('takes a list of paths', async() => {
    const matcher = rule({ match: { property: ['colHeaders', 'rowHeaders'] } });
    const source = `${HOT}const a = { colHeaders: true, rowHeaders: true };\n`;

    assert.deepEqual((await run(matcher, source)).lines, [2]);
  });

  it('keeps a Handsontable-less file silent by default and a hot file noisy', async() => {
    const matcher = rule({ match: { property: 'pattern' } });

    assert.deepEqual((await run(matcher, '// Handsontable\nconst a = { pattern: "x" };\n')).lines, []);
    assert.deepEqual((await run(matcher, `${HOT}const a = { pattern: 'x' };\n`)).lines, [2]);
    assert.deepEqual((await run(rule({ requires: 'none', match: { property: 'pattern' } }),
      '// Handsontable\nconst a = { pattern: "x" };\n')).lines, [2]);
  });

  it('requires an option object with in: option-object', async() => {
    const matcher = rule({ requires: 'none', match: { property: 'dateFormat', in: 'option-object' } });
    const inGrid = `${HOT}new Handsontable(el, { columns: [{ type: 'date', dateFormat: 'a' }] });\n`;
    const inColumnsOfSettings = `${HOT}const columns = [{ dateFormat: 'a' }];\nnew Handsontable(el, { columns });\n`;
    const elsewhere = `${HOT}const unrelated = { dateFormat: 'a' };\n`;

    assert.deepEqual((await run(matcher, inGrid)).lines, [2]);
    assert.deepEqual((await run(matcher, inColumnsOfSettings)).lines, [2]);
    assert.deepEqual((await run(matcher, elsewhere)).lines, []);
  });

  it('applies the rule-level requires: option-object to property matchers', async() => {
    const matcher = rule({ requires: 'option-object', match: { property: 'dateFormat' } });
    const elsewhere = `${HOT}const unrelated = { dateFormat: 'a' };\n`;

    assert.deepEqual((await run(matcher, elsewhere)).lines, []);
  });
});

describe('property matcher in templates and in dynamic forms', () => {
  const pattern = rule({ files: ['js', 'template'], match: { property: 'numericFormat.pattern' } });
  const format = rule({
    files: ['js', 'template'],
    requires: 'option-object',
    match: { property: 'dateFormat', valueMatches: '.' },
  });

  it('is valid for js and template files, and still not for css', () => {
    assert.deepEqual(validateDetectRule(pattern), []);
    assert.match(validateDetectRule(rule({ match: { property: 'a' }, files: ['js', 'css'] })).join(), /reads js only/);
  });

  it('reports a wrapper tag whose attribute binds the option, in kebab-case and camel-case', async() => {
    const source = [
      '<template>',
      '  <hot-column :numeric-format="{ pattern: \'0.0\' }" />',
      '  <HotColumn numericFormat="{ culture: \'de\' }" />',
      '  <hot-column :numeric-format="fmt" />',
      '  <div :numeric-format="{ pattern: 1 }" />',
      '</template>',
      '<script>import Handsontable from \'handsontable\';</script>',
      '',
    ].join('\n');

    assert.deepEqual((await run(pattern, source, 'a.vue')).lines, [2, 4]);
  });

  it('applies valueMatches to the attribute value of a template', async() => {
    const source = '<hot-column date-format="DD/MM/YYYY"></hot-column>\n<hot-column [dateFormat]="fmt"></hot-column>\n'
      + '<hot-column date-format></hot-column>\n';

    assert.deepEqual((await run(format, source, 'a.html')).lines, [1, 2]);
  });

  it('reports assignments and setCellMeta in a Handsontable file, and nothing in another file', async() => {
    const source = `${HOT}column.numericFormat = { pattern: '0.0' };\ncolumn.numericFormat = { culture: 'de' };\n`
      + 'column.numericFormat.pattern = 1;\nhot.setCellMeta(0, 0, \'numericFormat\', { pattern: 2 });\n'
      + 'hot.setCellMetaObject(0, 0, { numericFormat: { pattern: 3 } });\nother.pattern = 1;\n';

    assert.deepEqual((await run(pattern, source)).lines, [2, 4, 5, 6]);
    assert.deepEqual((await run(pattern, source.replace(HOT, '// x\n'))).lines, []);
  });

  it('applies valueMatches to the assigned value', async() => {
    const source = `${HOT}cell.dateFormat = 'DD.MM.YYYY';\ncell.dateFormat = format;\n`
      + 'hot.setCellMeta(0, 0, \'dateFormat\', \'MM/DD\');\n';

    assert.deepEqual((await run(format, source)).lines, [2, 4]);
  });
});

describe('siblingKey and annotatedObject matchers', () => {
  const sibling = rule({ match: { property: 'pattern', siblingKey: 'culture' } });
  const annotated = rule({ match: { annotatedObject: 'NumericFormatOptions' } });

  it('matches a property whose object also sets the sibling key, and a JSX element with both attributes', async() => {
    const source = `${HOT}const fmt = { pattern: '0,0', culture: 'de-DE' };\nconst only = { pattern: 'x' };\n`
      + 'const sheet = <Sheet pattern="a" culture="b" />;\nconst other = <Sheet pattern="a" />;\n';

    assert.deepEqual((await run(sibling, source, 'a.tsx')).lines, [2, 4]);
  });

  it('does not read a template or take a dotted path', async() => {
    assert.deepEqual((await run(rule({ files: ['js', 'template'], match: sibling.match }),
      '<hot-column pattern="0" culture="x"></hot-column>\n', 'a.html')).lines, []);
    assert.match(validateDetectRule(rule({ match: { property: 'a.b', siblingKey: 'c' } })).join(), /siblingKey/);
  });

  it('matches an object literal that a type annotation, as, or satisfies names', async() => {
    const source = [
      `${HOT}const a: NumericFormatOptions = { pattern: '0' };`,
      'const b = { pattern: \'0\' } as Handsontable.NumericFormatOptions;',
      'const c = { pattern: \'0\' } satisfies NumericFormatOptions;',
      'const d: Other = { pattern: \'0\' };',
      'const e: NumericFormatOptions = makeOne();',
      '',
    ].join('\n');

    assert.deepEqual((await run(annotated, source)).lines, [2, 3, 4]);
  });
});

describe('call matcher', () => {
  it('matches a method by name and tests argMatches inside nested arguments', async() => {
    const matcher = rule({ requires: 'none', match: { call: 'dispatchEvent', argMatches: '^mousedown$', flags: 'i' } });
    const source = `${HOT}a.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));\n`
      + 'a.dispatchEvent(new MouseEvent("MouseDown"));\na.dispatchEvent(new MouseEvent("mouseup"));\n'
      + 'b.dispatchEvent(new CustomEvent("x", { detail: "mousedown" }));\n';

    assert.deepEqual((await run(matcher, source)).lines, [2, 3, 5]);
  });

  it('takes a list of names and an optional-call form', async() => {
    const matcher = rule({ requires: 'none', match: { call: ['trigger', 'simulate'], argMatches: 'click' } });
    const source = `${HOT}$(a).trigger('click');\nsimulate(a, 'click');\na?.trigger('click');\n`;

    assert.deepEqual((await run(matcher, source)).lines, [2, 3, 4]);
  });

  it('checks the receiver by text and by confirmed instance', async() => {
    const byText = rule({ requires: 'none', match: { call: 'mouseDown', receiver: 'fireEvent' } });
    const byInstance = rule({ match: { call: 'refreshDimensions', receiver: 'instance' } });
    const text = `${HOT}fireEvent.mouseDown(a);\nuserEvent.mouseDown(a);\nmouseDown(a);\n`;
    const instance = `${HOT}const hot = new Handsontable(el, {});\nhot.refreshDimensions();\n`
      + 'other.refreshDimensions();\n';

    assert.deepEqual((await run(byText, text)).lines, [2]);
    assert.deepEqual((await run(byInstance, instance)).lines, [3]);
  });
});

describe('hook matcher', () => {
  const hooks = rule({ match: { hook: ['beforeColumnMove', 'afterColumnMove'] } });

  it('finds an option key, addHook, addHookOnce, and Handsontable.hooks.add', async() => {
    const source = `${HOT}const hot = new Handsontable(el, { afterColumnMove() {}, data: [] });\n`
      + 'hot.addHook("beforeColumnMove", f);\nhot.addHookOnce("afterColumnMove", f);\n'
      + 'Handsontable.hooks.add("afterColumnMove", f);\nHandsontable.hooks.once("beforeColumnMove", f);\n'
      + 'hot.addHook("afterColumnSort", f);\n';

    assert.deepEqual((await run(hooks, source)).lines, [2, 3, 4, 5, 6]);
  });

  it('finds a JSX prop and ignores the name in an unrelated object', async() => {
    const source = 'import { HotTable } from "@handsontable/react-wrapper";\n'
      + 'const a = <HotTable afterColumnMove={f} />;\nconst b = { afterColumnMove: 1 };\n'
      + 'const c = <div afterColumnMove={f} />;\n';

    assert.deepEqual((await run(hooks, source, 'a.tsx')).lines, [2]);
  });

  it('finds addHook through an optional chain', async() => {
    const source = `${HOT}ref.current?.hotInstance?.addHook('afterColumnMove', f);\n`;

    assert.deepEqual((await run(hooks, source)).lines, [2]);
  });

  it('ignores addHook on a name that is not listed', async() => {
    assert.deepEqual((await run(hooks, `${HOT}hot.addHook('afterRender', f);\n`)).lines, []);
  });
});

describe('string, selector, and regex matchers', () => {
  it('string tests string literals and template text, not identifiers or comments', async() => {
    const matcher = rule({ match: { string: 'pika-single' } });
    const source = `${HOT}// pika-single\nconst pikaSingle = 1;\nq('.pika-single');\nq(\`.pika-single \${x}\`);\n`;

    assert.deepEqual((await run(matcher, source)).lines, [4, 5]);
  });

  it('selector tests stylesheet rule selectors, not declarations or comments', async() => {
    const matcher = rule({ files: ['css'], requires: 'none', match: { selector: '\\.ht-grid\\s*>' } });
    const source = '/* .ht-grid > .a */\n.ht-grid > .b {\n  content: ".ht-grid > .c";\n}\n'
      + '@media print {\n  .ht-grid > .d {}\n}\n';
    const result = await run(matcher, source, 'a.css');

    assert.deepEqual(result.lines, [2, 6]);
  });

  it('selector reads the raw text of a template and the strings of js', async() => {
    const matcher = rule({ files: ['js', 'template'], requires: 'none', match: { selector: 'pika-single' } });

    assert.deepEqual((await run(matcher, '<div class="pika-single"></div>\n<style>.pika-single {}</style>\n',
      'a.html')).lines, [1, 2]);
    assert.deepEqual((await run(matcher, `${HOT}q('.pika-single');\n`)).lines, [2]);
  });

  it('regex reports a line per hit in raw text, comments included', async() => {
    const matcher = rule({ files: ['css', 'template'], match: { regex: 'ht-grid' } });

    assert.deepEqual((await run(matcher, '/* ht-grid */\na {}\n.ht-grid {}\n', 'a.css')).lines, [1, 3]);
    assert.deepEqual((await run(matcher, '<div class="ht-grid"></div>', 'a.html')).lines, [1]);
  });
});

describe('missingOption matcher', () => {
  const license = rule({ match: { missingOption: 'licenseKey' } });

  it('reports a constructor object and a one-hop variable without the key', async() => {
    const source = `${HOT}new Handsontable(el, { data: [] });\nconst s = { data: [] };\nnew Handsontable(el, s);\n`
      + 'new Handsontable(el, { licenseKey: "k" });\n';

    assert.deepEqual((await run(license, source)).lines, [2, 3]);
  });

  it('skips a spread, a computed key, updateSettings, and an annotated object', async() => {
    const source = `${HOT}new Handsontable(el, { ...base });\nnew Handsontable(el, { [k]: 1 });\n`
      + 'hot.updateSettings({ data: [] });\nconst a: Handsontable.GridSettings = { data: [] };\n';

    assert.deepEqual((await run(license, source)).lines, []);
  });

  it('merges the attributes and the settings object of a HotTable element', async() => {
    const wrapper = 'import { HotTable } from "@handsontable/react-wrapper";\n';
    const lines = async source => (await run(license, `${wrapper}${source}`, 'a.tsx')).lines;

    assert.deepEqual(await lines('const a = <HotTable data={d} />;\n'), [2]);
    assert.deepEqual(await lines('const a = <HotTable licenseKey="k" />;\n'), []);
    assert.deepEqual(await lines('const a = <HotTable settings={{ data: [] }} />;\n'), [2]);
    assert.deepEqual(await lines('const a = <HotTable settings={{ licenseKey: "k" }} />;\n'), []);
    assert.deepEqual(await lines('const s = { data: [] };\nconst a = <HotTable settings={s} />;\n'), [3]);
    assert.deepEqual(await lines('const s = { licenseKey: "k" };\nconst a = <HotTable settings={s} />;\n'), []);
    assert.deepEqual(await lines('const a = <HotTable {...props} />;\n'), []);
    assert.deepEqual(await lines('const a = <HotTable settings={make()} />;\n'), []);
    assert.deepEqual(await lines('const a = <HotTable settings={{ ...base }} />;\n'), []);
  });

  it('skips a file that matches unlessFileMatches', async() => {
    const matcher = rule({ match: { missingOption: 'licenseKey', unlessFileMatches: 'HOT_GLOBAL_CONFIG' } });

    assert.deepEqual((await run(matcher, `${HOT}// HOT_GLOBAL_CONFIG\nnew Handsontable(el, {});\n`)).lines, []);
    assert.deepEqual((await run(matcher, `${HOT}new Handsontable(el, {});\n`)).lines, [2]);
  });

  it('needs one of whenAnyKey, and a matching string with whenValueMatches', async() => {
    const matcher = rule({
      match: { missingOption: 'sanitizer', whenAnyKey: ['colHeaders', 'contextMenu'], whenValueMatches: '<[a-z]' },
    });
    const source = `${HOT}new Handsontable(el, { colHeaders: ['<b>a</b>'] });\n`
      + 'new Handsontable(el, { colHeaders: ["a"] });\nnew Handsontable(el, { colHeaders: true });\n'
      + 'new Handsontable(el, { contextMenu: { items: { x: { name: "<i>x</i>" } } } });\n'
      + 'new Handsontable(el, { colHeaders: ["<b>a</b>"], sanitizer: s });\nnew Handsontable(el, { data: [] });\n'
      + 'new Handsontable(el, { colHeaders: headers() });\n';

    assert.deepEqual((await run(matcher, source)).lines, [2, 5]);
  });
});

describe('compound matchers', () => {
  it('allOf reports the first matcher only when every other matcher matches in the part', async() => {
    const matcher = rule({
      requires: 'none',
      match: { allOf: [{ call: 'trigger', argMatches: 'mousedown' }, { regex: 'thead' }] },
    });

    assert.deepEqual((await run(matcher, `${HOT}a.trigger('mousedown');\nq('thead th');\n`)).lines, [2]);
    assert.deepEqual((await run(matcher, `${HOT}a.trigger('mousedown');\n`)).lines, []);
  });

  it('anyOf reports every child, once per line', async() => {
    const matcher = rule({ match: { anyOf: [{ property: 'a' }, { property: 'b' }] } });

    assert.deepEqual((await run(matcher, `${HOT}const x = { a: 1, b: 2 };\nconst y = { b: 3 };\n`)).lines, [2, 3]);
  });
});

describe('reporting', () => {
  it('reports each match with the rule severity, message, and a line', async() => {
    const result = await run(rule({ severity: 'warning', message: 'Look here.', match: { property: 'a' } }),
      `${HOT}const x = { a: 1 };\n`);

    assert.deepEqual(result.entries.map(({ severity, message, line }) => ({ severity, message, line })), [
      { severity: 'warning', message: 'Look here.', line: 2 },
    ]);
    assert.equal(result.changed, false);
  });

  it(`lists up to ${COLLAPSE_AFTER} matches and collapses more into one entry with a count`, async() => {
    const matcher = rule({ match: { property: 'a' } });
    const declaration = (_, index) => `const x${index} = { a: 1 };\n`;
    const lines = count => `${HOT}${Array.from({ length: count }, declaration).join('')}`;
    const few = await run(matcher, lines(COLLAPSE_AFTER));
    const many = await run(matcher, lines(COLLAPSE_AFTER + 1));

    assert.equal(few.entries.length, COLLAPSE_AFTER);
    assert.equal(many.entries.length, 1);
    assert.equal(many.entries[0].line, 2);
    assert.match(many.entries[0].message, new RegExp(`${COLLAPSE_AFTER + 1} matches`));
    assert.deepEqual(many.entries[0].lines, [2, 3, 4, 5, 6, 7]);
    assert.doesNotMatch(many.entries[0].message, /Only the first/);
  });

  it('adds the rule fact once when the rule matches, and not otherwise', async() => {
    const matcher = rule({ emitsFact: 'uses-thing', match: { property: 'a' } });
    const facts = new Set();

    await run(matcher, `${HOT}const x = { b: 1 };\n`, 'src/a.ts', facts);
    assert.equal(facts.size, 0);

    await run(matcher, `${HOT}const x = { a: 1 };\n`, 'src/a.ts', facts);
    assert.deepEqual([...facts].sort(), ['uses-thing', 'uses-thing@src']);
  });

  it('never edits a file', async() => {
    const source = `${HOT}const x = { a: 1 };\n`;
    const result = await run(rule({ match: { property: 'a' } }), source);

    assert.equal(result.output, source);
  });
});

describe('shipped rules on realistic input', () => {
  /**
   * Run every rule of a version over a file.
   *
   * @param {string} version Version directory.
   * @param {string} filePath File name.
   * @param {string} source File text.
   * @returns {Promise<{skipped: string|null, entries: object[]}>} The outcome.
   */
  async function runVersion(version, filePath, source) {
    const manifest = await loadManifest(join(VERSIONS_DIR, version));

    return transformFile({ filePath, source, plan: buildPlan([manifest]) });
  }

  it('reports nothing for the same names in a file that does not use Handsontable', async() => {
    const source = await readFile(join(VERSIONS_DIR, '18.0.0', '__fixtures__', 'detect-negative-non-hot', 'input.ts'),
      'utf8');
    const result = await runVersion('18.0.0', 'input.ts', source);

    assert.equal(result.skipped, null, 'the precheck must let the file through, or the test proves nothing');
    assert.deepEqual(result.entries, []);
  });

  it('reports nothing for stylesheet selectors that fit the 18.0 structure', async() => {
    const source = await readFile(join(VERSIONS_DIR, '18.0.0', '__fixtures__', 'detect-negative-css', 'input.css'),
      'utf8');
    const result = await runVersion('18.0.0', 'input.css', source);

    assert.equal(result.skipped, null);
    assert.deepEqual(result.entries, []);
  });

  it('reports nothing for grids whose keys a spread or a computed key hides', async() => {
    const source = await readFile(join(VERSIONS_DIR, '18.1.0', '__fixtures__', 'detect-license-key-negative',
      'input.ts'), 'utf8');
    const result = await runVersion('18.1.0', 'input.ts', source);

    assert.equal(result.skipped, null);
    assert.deepEqual(result.entries, []);
  });

  it('reports the 18.0 rules in an Angular template and a plain page', async() => {
    const result = await runVersion('18.0.0', 'a.component.html',
      '<style>\n  .ht-grid > .handsontable { border: 0; }\n  .pika-single { top: 0; }\n</style>\n'
      + '<hot-table></hot-table>\n');

    assert.deepEqual(result.entries.map(entry => [entry.ruleId, entry.line]), [
      ['18.0.0/wrapper-dom-selectors', 2],
      ['18.0.0/pikaday-leftovers', 3],
    ]);
  });
});

describe('sanitizer custom rules', () => {
  const SOURCE = '18.1.0/sanitizer-source';
  const NEW_SOURCES = '18.1.0/sanitizer-new-sources';

  /**
   * Run the two sanitizer rules over a file.
   *
   * @param {string} source File text.
   * @param {string} [filePath] File name.
   * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The outcome.
   */
  async function runSanitizer(source, filePath = 'a.ts') {
    const manifest = await loadManifest(join(VERSIONS_DIR, '18.1.0'));
    const plan = buildPlan([manifest], [SOURCE, NEW_SOURCES]);

    return transformFile({ filePath, source, plan });
  }

  /**
   * Wrap a sanitizer function in a grid configuration.
   *
   * @param {string} sanitizer The function text.
   * @returns {string} A file.
   */
  const grid = sanitizer => `${HOT}new Handsontable(el, { licenseKey: 'k', sanitizer: ${sanitizer} });\n`;

  it('reports an innerHTML test that sits next to a header test as redundant and edits nothing', async() => {
    const sources = [
      '(c, s) => (s === "innerHTML" || s === "header" ? a(c) : b(c))',
      '(c, s) => (s === "password" || s === "innerHTML" || s === "header" ? a(c) : b(c))',
      '(c, s) => { switch (s) { case "header": case "innerHTML": return a(c); default: return c; } }',
      '(c, s) => { switch (s) { case "innerHTML": case "header": return a(c); default: return c; } }',
    ];

    for (const sanitizer of sources) {
      const result = await runSanitizer(grid(sanitizer));
      const entry = result.entries.find(item => item.ruleId === SOURCE && /innerHTML/.test(item.message));

      assert.equal(result.changed, false, sanitizer);
      assert.equal(result.output, grid(sanitizer), sanitizer);
      assert.match(entry.message, /already handles it/, sanitizer);
      assert.equal(result.entries.filter(item => item.severity === 'changed').length, 0, sanitizer);
    }
  });

  it('reports every other innerHTML test without the redundant wording and edits nothing', async() => {
    const sources = [
      '(c, s) => (s === "innerHTML" ? a(c) : b(c))',
      '(c, s) => (s !== "innerHTML" ? a(c) : b(c))',
      '(c, s) => (s === "innerHTML" && x ? a(c) : b(c))',
      '(c, s) => (["header", "innerHTML"].includes(s) ? a(c) : b(c))',
      '(c, s) => { switch (s) { case "innerHTML": return a(c); case "header": return b(c); default: return c; } }',
      '(c, s) => (s === "innerHTML" || s === "password" ? a(c) : b(c))',
    ];

    for (const sanitizer of sources) {
      const result = await runSanitizer(grid(sanitizer));

      assert.equal(result.changed, false, sanitizer);
      assert.ok(result.entries.some(entry => entry.ruleId === SOURCE && entry.severity === 'manual'
        && /innerHTML/.test(entry.message)), sanitizer);
    }
  });

  it('never touches a comparison of another variable or a function it cannot see', async() => {
    const other = await runSanitizer(grid('(c, s) => (mode === "innerHTML" || mode === "header" ? a(c) : s)'));
    const imported = await runSanitizer(`${HOT}import { clean } from './clean';\n`
      + 'new Handsontable(el, { sanitizer: clean });\nconst x = (c, s) => s === "innerHTML" || s === "header";\n');

    assert.equal(other.changed, false);
    assert.equal(other.entries.some(entry => /innerHTML/.test(entry.message)), false);
    assert.deepEqual(imported.entries, []);
  });

  it('reports the dialog source once per function that reads its source argument', async() => {
    const reads = await runSanitizer(grid('(c, s) => (s === "header" ? a(c) : b(c))'));
    const ignores = await runSanitizer(grid('(c) => a(c)'));
    const dialog = result => result.entries.filter(entry => entry.ruleId === SOURCE && /'dialog'/.test(entry.message));

    assert.equal(dialog(reads).length, 1);
    assert.equal(dialog(ignores).length, 0);
  });

  it('reports the new sources for a function that reads its source or escapes HTML, not a stripper', async() => {
    const newSources = result => result.entries.filter(entry => entry.ruleId === NEW_SOURCES);
    const reads = await runSanitizer(grid('(c, s) => (s === "header" ? a(c) : b(c))'));
    const escapes = await runSanitizer(grid('(c) => c.replace(/</g, "&lt;")'));
    const strips = await runSanitizer(grid('(c) => DOMPurify.sanitize(c)'));

    assert.equal(newSources(reads).length, 1);
    assert.equal(newSources(escapes).length, 1);
    assert.equal(newSources(strips).length, 0);
  });

  it('finds a sanitizer in a JSX prop and in a method shorthand', async() => {
    const jsx = await runSanitizer('import { HotTable } from "@handsontable/react-wrapper";\n'
      + 'const a = <HotTable sanitizer={(c, s) => (s === "header" || s === "innerHTML" ? a(c) : b(c))} />;\n', 'a.tsx');
    const method = await runSanitizer(`${HOT}new Handsontable(el, {\n`
      + '  sanitizer(c, s) { return s === "innerHTML" || s === "header"; },\n});\n');
    const named = await runSanitizer(`${HOT}export const clean = (c, s) => s === "header" || s === "innerHTML";\n`
      + 'new Handsontable(el, { sanitizer: clean });\n');
    const innerHtml = result => result.entries
      .filter(entry => entry.ruleId === SOURCE && /innerHTML/.test(entry.message));

    assert.equal(innerHtml(jsx).length, 1);
    assert.equal(innerHtml(method).length, 1);
    assert.equal(innerHtml(named).length, 1);
    assert.equal([jsx, method, named].some(result => result.changed), false);
  });

  it('never marks a file changed, so a second run reports the same and changes nothing', async() => {
    const source = grid('(c, s) => (s === "innerHTML" || s === "header" ? a(c) : b(c))');
    const first = await runSanitizer(source);
    const second = await runSanitizer(source);

    assert.equal(first.changed, false);
    assert.deepEqual(second.entries, first.entries);
  });

  it('does nothing in a file that never says sanitizer', async() => {
    const result = await runSanitizer(`${HOT}new Handsontable(el, { licenseKey: 'k' });\n`);

    assert.deepEqual([result.skipped, result.entries], [null, []]);
  });
});

describe('stringsIn', () => {
  it('collects strings from arrays, objects, template text, calls, and conditionals, but not functions', () => {
    const interpolated = ['c', '$', '{d}e'].join('');
    const text = `x = ["a", { k: "b" }, \`${interpolated}\`, f("g"), h ? "i" : "j", () => "k", "l" + "m"];`;
    const { root, j } = parse(text, 'ts');
    const node = root.find(j.AssignmentExpression).paths()[0].node.right;

    assert.deepEqual(stringsIn(node).sort(), ['a', 'b', 'c', 'e', 'g', 'i', 'j', 'l', 'm']);
  });
});
