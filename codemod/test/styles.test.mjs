import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { PACKAGE_ROOT, VERSIONS_DIR, buildPlan, loadManifest } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const manifest = await loadManifest(join(VERSIONS_DIR, '18.0.0'));
const plan = buildPlan([manifest]);
const RADIUS = '18.0.0/css-wrapper-border-radius';
const WIDTH = '18.0.0/css-wrapper-border-width';
const TOKEN_RADIUS = '18.0.0/theme-token-wrapper-border-radius';
const TOKEN_WIDTH = '18.0.0/theme-token-wrapper-border-width';

/**
 * Run a file through the real 18.0.0 rules.
 *
 * @param {string} filePath File name, which picks the adapter.
 * @param {string} source File text.
 * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The `transformFile` result.
 */
function run(filePath, source) {
  return transformFile({ filePath, source, plan });
}

/**
 * Slug the docs site gives a heading: the leading list number is dropped, the rest is lowercased and joined
 * with hyphens.
 *
 * @param {string} heading Heading text without the leading hashes.
 * @returns {string} Anchor without the `#`.
 */
function slug(heading) {
  return heading.replace(/^\d+\.\s+/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

describe('style rules', () => {
  const rules = manifest.rules.filter(rule => rule.kind === 'cssVariable' || rule.kind === 'themeToken');

  it('declares a rename or a removal with advice on every rule', () => {
    assert.equal(rules.length, 6);

    for (const rule of rules) {
      assert.ok(typeof rule.to === 'string' || rule.removed === true, rule.id);
      assert.equal(typeof rule.to === 'string' && rule.removed === true, false, rule.id);

      if (rule.removed) {
        assert.match(rule.advice, /box-shadow/, rule.id);
        assert.equal(rule.safe, false, rule.id);
      }
    }
  });

  it('points every rule at a heading of the migration guide and states the guide recommendation', async() => {
    const guide = await readFile(join(PACKAGE_ROOT, '..', manifest.guide.source), 'utf8');
    const anchors = [...guide.matchAll(/^##+ (.+)$/gm)].map(match => slug(match[1]));

    for (const rule of rules) {
      assert.ok(anchors.includes(rule.guide), `${rule.id} anchor ${rule.guide}`);
    }

    assert.match(guide, /\.ht-theme-main\.ht-root-wrapper \{\s+box-shadow: 0 0 0 1px/);
    assert.match(manifest.rules.find(rule => rule.id === WIDTH).advice, /\.ht-theme-<name>\.ht-root-wrapper \{/);
  });
});

describe('cssVariable in css', () => {
  it('renames by whole token and leaves longer names alone', async() => {
    const source = '.a {\n  --ht-wrapper-border-radius: 1px;\n  --ht-wrapper-border-radius-x: 2px;\n'
      + '  margin: var(--ht-wrapper-border-radius) var(--ht-wrapper-border-radius-x);\n}\n';
    const { output } = await run('a.css', source);

    assert.equal(output, source
      .replace('  --ht-wrapper-border-radius: 1px', '  --ht-border-radius: 1px')
      .replace('margin: var(--ht-wrapper-border-radius)', 'margin: var(--ht-border-radius)'));
  });

  it('skips a rule that already defines both names and reports it as manual', async() => {
    const source = '.a {\n  --ht-wrapper-border-radius: 1px;\n  --ht-border-radius: 2px;\n}\n';
    const { output, changed, entries } = await run('a.css', source);

    assert.equal(changed, false);
    assert.equal(output, source);
    assert.deepEqual(entries.map(entry => [entry.ruleId, entry.severity, entry.line]), [[RADIUS, 'manual', 2]]);
  });

  it('renames inside at-rule parameters', async() => {
    const source = '@include theme((--ht-wrapper-border-radius: 1px));\n';
    const { output } = await run('a.scss', source);

    assert.equal(output, '@include theme((--ht-border-radius: 1px));\n');
  });

  it('inserts one TODO per rule and declaration, also when two removed variables share a declaration', async() => {
    const source = '.a {\n  box-shadow: 0 0 0 var(--ht-wrapper-border-width) var(--ht-wrapper-border-color);\n}\n';
    const first = await run('a.css', source);
    const second = await run('a.css', first.output);

    assert.equal(first.output.match(/TODO\(handsontable-codemod/g).length, 2);
    assert.equal(second.changed, false);
    assert.equal(second.entries.length, 2);
    assert.ok(second.entries.every(entry => entry.severity === 'manual'));
  });
});

describe('cssVariable in js', () => {
  it('keeps the quote style of each string and never touches identifiers', async() => {
    const source = 'import H from \'handsontable\';\n'
      + 'a.setProperty("--ht-wrapper-border-radius", \'1px\');\n'
      + 'const wrapperBorderRadius = { \'--ht-wrapper-border-radius\': "2px" };\n';
    const { output } = await run('a.ts', source);

    assert.equal(output, source.replace(/--ht-wrapper-border-radius/g, '--ht-border-radius'));
  });

  it('renames text of a template literal and keeps its interpolations', async() => {
    const source = 'import H from \'handsontable\';\n'
      + 'const c = `a { r: var(--ht-wrapper-border-radius); } ${H.version}`;\n'; // eslint-disable-line
    const { output } = await run('a.js', source);

    assert.equal(output, source.replace('--ht-wrapper-border-radius', '--ht-border-radius'));
  });

  it('renames in a JSX attribute string', async() => {
    const source = 'import H from \'handsontable\';\nconst e = <div style="--ht-wrapper-border-radius: 1px" />;\n';
    const { output } = await run('a.jsx', source);

    assert.equal(output, source.replace('--ht-wrapper-border-radius', '--ht-border-radius'));
  });

  it('reports a removed variable in a string and does not edit the file', async() => {
    const source = 'import H from \'handsontable\';\na.setProperty(\'--ht-wrapper-border-width\', \'1px\');\n';
    const { output, entries } = await run('a.js', source);

    assert.equal(output, source);
    assert.deepEqual(entries.map(entry => [entry.ruleId, entry.severity, entry.line]), [[WIDTH, 'manual', 2]]);
  });
});

describe('cssVariable in a vue template', () => {
  it('reports each mention with its file line and leaves the template bytes alone', async() => {
    const source = '<template>\n  <div style="--ht-wrapper-border-radius: 1px">\n'
      + '    <p :style="{ \'--ht-wrapper-border-width\': w }" />\n  </div>\n</template>\n';
    const { output, changed, entries } = await run('A.vue', source);

    assert.equal(changed, false);
    assert.equal(output, source);
    assert.deepEqual(entries.map(entry => [entry.ruleId, entry.severity, entry.line]), [
      [RADIUS, 'manual', 2],
      [WIDTH, 'manual', 3],
    ]);
  });
});

describe('themeToken', () => {
  it('rewrites only inside the arguments of the theme API', async() => {
    const source = 'import { registerTheme } from \'handsontable/themes\';\n'
      + 'registerTheme(\'t\', { tokens: { wrapperBorderRadius: \'1px\' } });\n'
      + 'const card = { wrapperBorderRadius: 3 };\n';
    const { output, entries } = await run('a.ts', source);

    assert.equal(output, source.replace('{ tokens: { wrapperBorderRadius', '{ tokens: { borderRadius'));
    assert.deepEqual(entries.map(entry => [entry.ruleId, entry.severity, entry.line]), [
      [TOKEN_RADIUS, 'changed', 2],
      [TOKEN_RADIUS, 'manual', 3],
    ]);
  });

  it('handles the optional call form of params()', async() => {
    const source = 'import { getTheme } from \'handsontable/themes\';\n'
      + 'getTheme(\'main\')?.params({ tokens: { wrapperBorderRadius: 1 } });\n';
    const { output } = await run('a.js', source);

    assert.equal(output, source.replace('wrapperBorderRadius', 'borderRadius'));
  });

  it('does nothing in a file that has no connection to Handsontable', async() => {
    const source = '// handsontable is only named in this comment\n'
      + 'other.params({ tokens: { wrapperBorderRadius: 1 } });\n';
    const { output, changed, entries } = await run('a.js', source);

    assert.equal(changed, false);
    assert.equal(output, source);
    assert.deepEqual(entries, []);
  });

  it('turns a shorthand property into key and value', async() => {
    const source = 'import { registerTheme } from \'handsontable/themes\';\nconst wrapperBorderRadius = 1;\n'
      + 'registerTheme(\'t\', { tokens: { wrapperBorderRadius } });\n';
    const { output } = await run('a.js', source);

    assert.equal(output, source.replace('{ wrapperBorderRadius }', '{ borderRadius: wrapperBorderRadius }'));
  });

  it('leaves a TODO on a removed token once', async() => {
    const source = 'import { registerTheme } from \'handsontable/themes\';\n'
      + 'registerTheme(\'t\', { tokens: { wrapperBorderWidth: \'1px\' } });\n';
    const first = await run('a.js', source);
    const second = await run('a.js', first.output);

    assert.equal(first.output.match(/TODO\(handsontable-codemod/g).length, 1);
    assert.equal(first.entries[0].ruleId, TOKEN_WIDTH);
    assert.equal(second.changed, false);
  });
});
