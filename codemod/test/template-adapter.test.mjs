import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { VERSIONS_DIR, buildPlan, loadManifest } from '../src/manifest.mjs';
import { adapterFor } from '../src/adapters/index.mjs';
import templateAdapter, { TEMPLATE_PRECHECK } from '../src/adapters/template.mjs';
import { transformFile } from '../src/runner.mjs';

const RADIUS = {
  id: '18.0.0/css-wrapper-border-radius',
  kind: 'cssVariable',
  from: '--ht-wrapper-border-radius',
  to: '--ht-border-radius',
  version: '18.0.0',
  guideUrl: null,
  safe: true,
};
const plan = { versions: [{ version: '18.0.0', rules: [RADIUS] }], rulesById: new Map([[RADIUS.id, RADIUS]]) };

describe('template adapter', () => {
  it('handles .html and .htm files', () => {
    assert.equal(adapterFor('src/app.component.html'), templateAdapter);
    assert.equal(adapterFor('page.HTM'), templateAdapter);
    assert.equal(templateAdapter.implemented, true);
  });

  it('parses a file into one read-only template part with the Vue part shape', () => {
    const source = '<hot-table [settings]="s"></hot-table>\n';
    const { parts } = templateAdapter.parse(source, 'a.html');

    assert.equal(parts.length, 1);
    assert.deepEqual(parts[0], {
      fileKind: 'template',
      source,
      root: { content: source },
      j: null,
      lineOffset: 0,
      changed: false,
    });
  });

  it('prints the original bytes for an untouched part and the new content for a changed one', () => {
    const source = '<hot-table></hot-table>\r\n';
    const handle = templateAdapter.parse(source, 'a.html');

    assert.equal(templateAdapter.print(handle, source), source);

    handle.parts[0].root.content = '<hot-table class="x"></hot-table>\r\n';
    handle.parts[0].changed = true;

    assert.equal(templateAdapter.print(handle, source), '<hot-table class="x"></hot-table>\r\n');
  });

  describe('precheck', () => {
    it('accepts pages that name Handsontable, a wrapper, a theme variable, or a rule target', () => {
      [
        '<script src="handsontable.full.min.js"></script>',
        '<hot-table [data]="rows"></hot-table>',
        '<HotTable data={rows} />',
        '<div style="--ht-border-radius: 4px"></div>',
        '<div class="ht-theme-main"></div>',
        '<style>.htCore td {}</style>',
        '<style>.pika-single {}</style>',
      ].forEach((text) => {
        assert.equal(TEMPLATE_PRECHECK.test(text), true, text);
      });
    });

    it('rejects ordinary pages and words that only end in ht-', () => {
      [
        '<p>hello</p>',
        '<div class="right-aligned light-theme height-full"></div>',
        '<a href="/weight-loss">weight-loss</a>',
      ].forEach((text) => {
        assert.equal(TEMPLATE_PRECHECK.test(text), false, text);
      });
    });
  });

  describe('with the registered transforms', () => {
    it('reports a theme variable in an .html file on the right line and leaves the bytes alone', async() => {
      const source = '<div>\n  <div style="--ht-wrapper-border-radius: 2px"></div>\n</div>\n';
      const result = await transformFile({ filePath: 'page.html', source, plan });

      assert.equal(result.skipped, null);
      assert.equal(result.changed, false);
      assert.equal(result.output, source);
      assert.deepEqual(result.entries.map(({ ruleId, severity, line }) => ({ ruleId, severity, line })), [
        { ruleId: RADIUS.id, severity: 'manual', line: 2 },
      ]);
    });

    it('reads an Angular template that only uses a wrapper tag, with the real 18.0.0 rules', async() => {
      const manifest = await loadManifest(join(VERSIONS_DIR, '18.0.0'));
      const source = '<div>\n  <hot-table dateFormat="MM/DD/YYYY" [correctFormat]="true"></hot-table>\n</div>\n';
      const result = await transformFile({ filePath: 'grid.component.html', source, plan: buildPlan([manifest]) });

      assert.equal(result.skipped, null);
      assert.equal(result.output, source);
      assert.deepEqual(result.entries.map(({ ruleId, line }) => [ruleId, line])
        .sort((a, b) => a[0].localeCompare(b[0])), [
        ['18.0.0/correct-format-removed', 2],
        ['18.0.0/moment-date-format', 2],
      ]);
    });

    it('skips a page the precheck rejects without producing entries', async() => {
      const result = await transformFile({ filePath: 'page.html', source: '<p>hello</p>', plan });

      assert.deepEqual([result.skipped, result.changed, result.entries], ['precheck', false, []]);
    });
  });
});

const MANIFEST = await loadManifest(join(VERSIONS_DIR, '18.0.0'));

describe('an inline Angular template', () => {
  const ANGULAR = 'import { Component } from \'@angular/core\';\n';
  const RULES = ['18.0.0/correct-format-removed', '18.0.0/css-wrapper-border-radius', '18.0.0/numeric-format-culture'];
  /**
   * Run the 18.0 option and style rules over a component file.
   *
   * @param {string} source File text.
   * @param {string[]} [rules] Rule ids.
   * @param {string} [filePath] File name.
   * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The result.
   */
  const run = (source, rules = RULES, filePath = 'grid.component.ts') => transformFile({
    filePath, source, plan: buildPlan([MANIFEST], rules), options: {},
  });

  it('reports the option of a template literal and keeps its line, next to the rewritten styles', async() => {
    const source = `${ANGULAR}@Component({\n  selector: 'app-g',\n  template: \`<hot-table [settings]="s"\n`
      + '    [correctFormat]="true"></hot-table>`,\n  styles: [`:host { --ht-wrapper-border-radius: 4px; }`],\n})\n'
      + 'export class G {}\n';
    const { output, entries } = await run(source);
    const manual = entries.filter(entry => entry.severity === 'manual');

    assert.equal(output, source.replace('--ht-wrapper-border-radius', '--ht-border-radius'));
    assert.deepEqual(manual.map(entry => [entry.ruleId, entry.line]), [['18.0.0/correct-format-removed', 5]]);
    assert.equal(entries.filter(entry => entry.severity === 'changed').length, 1);
  });

  it('reads a string literal, the call form, and a template with an expression', async() => {
    for (const source of [
      `${ANGULAR}@Component({ template: '<hot-table [correctFormat]="true"></hot-table>' })\nclass A {}\n`,
      `${ANGULAR}@Component({ template: "<hot-column [correctFormat]=\\"true\\"></hot-column>" })\nclass A {}\n`,
      `${ANGULAR}const A = Component({ template: \`<hot-table [correctFormat]="true"></hot-table>\` })(class {});\n`,
      `${ANGULAR}@Component({ template: \`<hot-table [correctFormat]="\${on}"></hot-table>\` })\nclass A {}\n`,
    ]) {
      const { output, entries } = await run(source);

      assert.equal(output, source);
      assert.deepEqual(entries.map(entry => [entry.ruleId, entry.severity, entry.line]),
        [['18.0.0/correct-format-removed', 'manual', 2]], source);
    }
  });

  it('reads an expression as a separator, so the attribute after it is not glued to the tag or to the one before it',
    async() => {
      for (const template of [
        '<hot-table#[correctFormat]="true"></hot-table>',
        '<hot-table [settings]="s"#[correctFormat]="true"></hot-table>',
        '<hot-table [settings]="s" #[correctFormat]="true"></hot-table>',
      ]) {
        // The `#` stands for an expression of the template literal.
        const literal = template.replace('#', ['$', '{extra}'].join(''));
        const source = `${ANGULAR}@Component({ template: \`${literal}\` })\nclass A {}\n`;
        const { output, entries } = await run(source);

        assert.equal(output, source);
        assert.deepEqual(entries.map(entry => [entry.ruleId, entry.severity, entry.line]),
          [['18.0.0/correct-format-removed', 'manual', 2]], template);
      }
    });

  it('keeps the lines of a template literal whose expressions span lines, and reads text after each of them', async() => {
    const lines = [
      'import { Component } from \'@angular/core\';',
      '@Component({',
      '  template: `<p>${',
      '    first +',
      '    second',
      '  }</p>',
      '  <hot-table [correctFormat]="true"></hot-table>',
      ['  <b>${', ' one }${'].join(''),
      '    two }</b>',
      '  <hot-column [correctFormat]="true"></hot-column>`,',
      '})',
      'class A {}',
      '',
    ];

    for (const eol of ['\n', '\r\n']) {
      const source = lines.join(eol);
      const { output, entries } = await run(source);

      assert.equal(output, source);
      assert.deepEqual(entries.map(entry => [entry.ruleId, entry.line]),
        [['18.0.0/correct-format-removed', 7], ['18.0.0/correct-format-removed', 10]], JSON.stringify(eol));
    }
  });

  it('never prints a template part: an edit of its content changes nothing in the file', async() => {
    const { default: adapter } = await import('../src/adapters/js.mjs');
    const source = `${ANGULAR}@Component({ template: \`<p>\${a}</p>\` })\nclass A {}\n`;
    const handle = adapter.parse(source, 'a.component.ts');
    const template = handle.parts.find(part => part.fileKind === 'template');

    template.root.content = '<edited></edited>';
    template.changed = true;

    assert.equal(adapter.print(handle, source), source);
  });

  it('never edits the template, and adds no marker to it', async() => {
    const source = `${ANGULAR}@Component({ template: \`<hot-table [correctFormat]="true" `
      + '[numericFormat]="{ culture: \'de\' }">'
      + '</hot-table>` })\nclass A {}\n';
    const { output, entries } = await run(source, ['18.0.0/correct-format-removed', '18.0.0/numeric-format-culture']);

    assert.equal(output, source);
    assert.equal(entries.length, 2);
  });

  it('leaves alone a file that is no Angular component, a template property of another call, and a templateUrl', async() => {
    for (const source of [
      'import { Component } from \'./mine\';\n'
        + 'Component({ template: `<hot-table [correctFormat]="true"></hot-table>` });\n',
      `${ANGULAR}other({ template: \`<hot-table [correctFormat]="true"></hot-table>\` });\n`,
      `${ANGULAR}@Component({ templateUrl: './g.html', t2: \`<hot-table [correctFormat]="1">\` })\nclass A {}\n`,
      `${ANGULAR}@Component({ template: \`<div [correctFormat]="true"></div>\` })\nclass A {}\n`,
    ]) {
      const { entries } = await run(source);

      assert.deepEqual(entries, [], source);
    }
  });

  it('is stable over a second run', async() => {
    const source = `${ANGULAR}@Component({ template: \`<hot-table [correctFormat]="true"></hot-table>\` })\n`
      + 'class A {}\n';
    const first = await run(source);
    const second = await run(first.output);

    assert.equal(second.changed, false);
    assert.deepEqual(second.entries.map(entry => entry.line), first.entries.map(entry => entry.line));
  });
});
