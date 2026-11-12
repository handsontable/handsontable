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
