import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createCssPart } from '../src/adapters/css.mjs';
import { VERSIONS_DIR, buildPlan, loadManifest } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { guidePath, skipWithoutGuides } from './helpers/guide-source.mjs';

const manifest = await loadManifest(join(VERSIONS_DIR, '18.0.0'));
const plan = buildPlan([manifest]);
const RADIUS = '18.0.0/css-wrapper-border-radius';
const WIDTH = '18.0.0/css-wrapper-border-width';
const TOKEN_RADIUS = '18.0.0/theme-token-wrapper-border-radius';
const TOKEN_WIDTH = '18.0.0/theme-token-wrapper-border-width';
const TOKEN_COLOR = '18.0.0/theme-token-wrapper-border-color';

/**
 * Run a file through the real 18.0.0 rules.
 *
 * @param {string} filePath File name, which picks the adapter.
 * @param {string} source File text.
 * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The `transformFile` result.
 */
function run(filePath, source) {
  return transformFile({ filePath, source, plan, options: { markers: false } });
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

  it('points every rule at a heading of the migration guide and states the guide recommendation', async(context) => {
    if (skipWithoutGuides(context, [manifest])) {
      return;
    }

    const guide = await readFile(guidePath(manifest), 'utf8');
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

  for (const [label, name, source] of [
    ['sets the new name from the old one', 'a.css',
      '.ht-theme-alt {\n  --ht-border-radius: var(--ht-wrapper-border-radius, 4px);\n}\n'],
    ['sets the new name from the old one in SCSS', 'a.scss',
      '.ht-theme-alt {\n  --ht-border-radius: var(--ht-wrapper-border-radius, 4px);\n  .x {\n'
      + '    --ht-border-radius: var(--ht-wrapper-border-radius);\n  }\n}\n'],
    ['defines the new name next to a use of the old one', 'a.css',
      '.t {\n  --ht-border-radius: 1px;\n  margin: var(--ht-wrapper-border-radius);\n}\n'],
    ['uses the old name before it defines the new one', 'a.css',
      '.t {\n  margin: var(--ht-wrapper-border-radius);\n  --ht-border-radius: 1px;\n}\n'],
  ]) {
    it(`leaves a rule that ${label}, reports it, and changes nothing on a second run`, async() => {
      const first = await run(name, source);
      const second = await run(name, first.output);

      assert.equal(first.changed, false);
      assert.equal(first.output, source);
      assert.equal(first.entries.length >= 1 && first.entries.every(entry => entry.severity === 'manual'), true,
        JSON.stringify(first.entries));
      assert.equal(first.entries.every(entry => entry.ruleId === RADIUS), true);
      assert.match(first.entries[0].message, /already defines --ht-border-radius/);
      assert.equal(second.changed, false);
      assert.equal(second.entries.length, first.entries.length);
    });
  }

  it('still renames the old name in a rule next to the one that defines the new name', async() => {
    const source = '.a {\n  --ht-border-radius: 2px;\n}\n.b {\n  --ht-wrapper-border-radius: 1px;\n'
      + '  margin: var(--ht-wrapper-border-radius);\n}\n.c {\n  --ht-border-radius: var(--ht-radius-other, 4px);\n}\n';
    const { output, entries } = await run('a.css', source);

    assert.equal(output, source
      .replace('  --ht-wrapper-border-radius: 1px;', '  --ht-border-radius: 1px;')
      .replace('margin: var(--ht-wrapper-border-radius)', 'margin: var(--ht-border-radius)'));
    assert.deepEqual(entries.map(entry => [entry.severity, entry.line]), [['changed', 5], ['changed', 6]]);
  });

  it('renames inside at-rule parameters', async() => {
    const source = '@include theme((--ht-wrapper-border-radius: 1px));\n';
    const { output } = await run('a.scss', source);

    assert.equal(output, '@include theme((--ht-border-radius: 1px));\n');
  });

  for (const text of [
    '@import url("fonts.css?v=--ht-wrapper-border-radius");',
    '@import url(fonts.css?v=--ht-wrapper-border-radius);',
    '@warn "unknown --ht-wrapper-border-radius";',
    '@debug \'--ht-wrapper-border-radius\';',
  ]) {
    it(`reports the name in a string or url() of an at-rule and does not rename it: ${text}`, async() => {
      const source = `${text}\n`;
      const first = await run('a.scss', source);
      const second = await run('a.scss', first.output);

      assert.equal(first.changed, false);
      assert.equal(first.output, source);
      assert.deepEqual(first.entries.map(entry => [entry.ruleId, entry.severity, entry.line]), [[RADIUS, 'manual', 1]]);
      assert.match(first.entries[0].message,
        /^Check this text by hand: it names --ht-wrapper-border-radius in a string/);
      assert.equal(second.changed, false);
    });
  }

  it('renames the name in an at-rule outside its strings and url()', async() => {
    const source = '@include theme((--ht-wrapper-border-radius: 1px, label: "--ht-wrapper-border-radius"));\n'
      + '@include box(var(--ht-wrapper-border-radius), url(--ht-wrapper-border-radius.png));\n';
    const { output, entries } = await run('a.scss', source);

    assert.equal(output, '@include theme((--ht-border-radius: 1px, label: "--ht-wrapper-border-radius"));\n'
      + '@include box(var(--ht-border-radius), url(--ht-wrapper-border-radius.png));\n');
    // Each at-rule also keeps the name in a string or a url(), so the note is made now and the second run adds nothing.
    assert.deepEqual(entries.map(entry => [entry.severity, entry.line]),
      [['changed', 1], ['manual', 1], ['changed', 2], ['manual', 2]]);
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

describe('cssVariable in css: only a reference to the custom property is rewritten', () => {
  const NAME = '--ht-wrapper-border-radius';

  it('keeps a name in a url(), a quoted string, and outside var(), and reports it', async() => {
    const source = `.a {\n  background: url(${NAME}.png);\n  background: url("${NAME}.png");\n  content: "${NAME}";\n`
      + `  content: '${NAME} and \\' more';\n  transition-property: ${NAME};\n}\n`;
    const { output, entries, changed } = await run('a.css', source);

    assert.equal(changed, false);
    assert.equal(output, source);
    assert.deepEqual(entries.map(entry => [entry.severity, entry.line]),
      [['manual', 2], ['manual', 3], ['manual', 4], ['manual', 5], ['manual', 6]]);
    assert.match(entries[0].message, /^Check this text by hand: it names --ht-wrapper-border-radius in a string/);
  });

  it('keeps a string that holds var(), even a var() inside url(), and reports each', async() => {
    const source = `.a {\n  content: "var(${NAME})";\n  background: url("x?var(${NAME})");\n`
      + `  content: 'a var(${NAME}, 1px) b';\n}\n`;
    const first = await run('a.css', source);
    const second = await run('a.css', first.output);

    assert.equal(first.changed, false);
    assert.equal(first.output, source);
    assert.deepEqual(first.entries.map(entry => [entry.severity, entry.line]),
      [['manual', 2], ['manual', 3], ['manual', 4]]);
    assert.equal(second.changed, false);
  });

  it('reads url( as the function only at a word start: image-url() and a name that ends in url are not it', async() => {
    const source = (name) => {
      return `.a {\n  margin: image-url(var(${name}));\n  margin: my_url(var(${name}));\n`
        + `  margin: url(x.png) var(${name});\n}\n`;
    };
    const { output, entries } = await run('a.scss', source(NAME));

    assert.equal(output, source('--ht-border-radius'));
    assert.deepEqual(entries.map(entry => [entry.severity, entry.line]),
      [['changed', 2], ['changed', 3], ['changed', 4]]);
  });

  it('still renames the property, var(), a fallback var(), and the references next to a string', async() => {
    const source = `.a {\n  ${NAME}: 1px;\n  border-radius: var(${NAME}, 2px);\n`
      + `  margin: var(--x, var(${NAME}));\n  content: "${NAME}" var(${NAME});\n`
      + `  width: calc(var( ${NAME} ) * 2);\n}\n`;
    const { output } = await run('a.scss', source);

    assert.equal(output, source.replace(`  ${NAME}: 1px`, '  --ht-border-radius: 1px')
      .replace('var(--ht-wrapper-border-radius, 2px)', 'var(--ht-border-radius, 2px)')
      .replace('var(--x, var(--ht-wrapper-border-radius))', 'var(--x, var(--ht-border-radius))')
      .replace(`"${NAME}" var(${NAME})`, `"${NAME}" var(--ht-border-radius)`)
      .replace('var( --ht-wrapper-border-radius )', 'var( --ht-border-radius )'));
  });

  it('leaves a removed variable in a string without a TODO, and still marks its reference', async() => {
    const source = '.a {\n  content: "--ht-wrapper-border-width";\n'
      + '  box-shadow: 0 0 0 var(--ht-wrapper-border-width) red;\n}\n';
    const { output, entries } = await run('a.css', source);

    assert.equal(output.match(/TODO\(handsontable-codemod/g).length, 1);
    assert.deepEqual(entries.map(entry => [entry.ruleId, entry.line]), [[WIDTH, 2], [WIDTH, 3]]);
  });

  it('is stable over a second run', async() => {
    const source = `.a {\n  background: url(${NAME}.png);\n  border-radius: var(${NAME});\n}\n`;
    const first = await run('a.css', source);
    const second = await run('a.css', first.output);

    assert.equal(second.output, first.output);
    assert.equal(second.changed, false);
  });
});

describe('cssVariable edits a stylesheet by offset and keeps every other byte', () => {
  const OLD = '--ht-wrapper-border-radius';
  const NEW = '--ht-border-radius';

  /**
   * The expected result of renaming the variable: the input with only the variable name changed.
   *
   * @param {string} source Stylesheet text.
   * @returns {string} The text with every whole-token mention renamed.
   */
  function renamed(source) {
    return source.replace(new RegExp(`${OLD}(?![\\w-])`, 'g'), NEW);
  }

  it('leaves <style and </style in comments and strings alone', async() => {
    const source = '/* Loaded through <style src> in App.vue; see </style> handling */\n'
      + '.grid::before { content: "<style>"; }\n'
      + '.grid { --ht-wrapper-border-radius: 4px; }\n';
    const { output, changed } = await run('links.style.css', source);

    assert.equal(changed, true);
    assert.equal(output, renamed(source));
    assert.equal(output.includes('\\3c'), false);
  });

  it('keeps a byte order mark and CRLF line endings, and inserts a TODO with the same ending', async() => {
    const source = '﻿/* <style> */\r\n.a {\r\n  --ht-wrapper-border-radius: 1px;\r\n'
      + '  box-shadow: 0 0 0 var(--ht-wrapper-border-width);\r\n}\r\n';
    const { output } = await run('a.css', source);

    assert.equal(output.startsWith('﻿/* <style> */\r\n.a {\r\n  --ht-border-radius: 1px;\r\n  /* TODO('), true);
    assert.equal(output.includes('\n') && output.replace(/\r\n/g, '').includes('\n'), false, 'no bare LF appears');
    assert.equal(output.endsWith('  box-shadow: 0 0 0 var(--ht-wrapper-border-width);\r\n}\r\n'), true);
  });

  it('edits a minified one-line file without adding a byte elsewhere', async() => {
    const source = '.a{--ht-wrapper-border-radius:4px;margin:0}.b{border-radius:var(--ht-wrapper-border-radius,2px)}';
    const { output } = await run('a.css', source);

    assert.equal(output, renamed(source));
  });

  it('puts a TODO before a declaration in a minified file without breaking it', async() => {
    const source = '.a{margin:0;box-shadow:0 0 0 var(--ht-wrapper-border-width)}.b{color:red}';
    const { output } = await run('a.css', source);

    assert.match(output, new RegExp('^\\.a\\{margin:0;/\\* TODO\\(handsontable-codemod [^*]*\\*/'
      + 'box-shadow:0 0 0 var\\(--ht-wrapper-border-width\\)\\}\\.b\\{color:red\\}$'));
  });

  it('edits SCSS with // comments, interpolation, nested rules, and a declaration over several lines', async() => {
    const source = [
      '// <style> in a line comment',
      '$gap: 4px;',
      '.card {',
      '  --ht-wrapper-border-radius: 1px; // keep "<style>" here',
      '  .inner-#{$gap} {',
      '    border-radius: var(--ht-wrapper-border-radius,',
      '      2px);',
      '    &:hover { --ht-wrapper-border-radius: #{$gap}; }',
      '  }',
      '}',
      '@include theme((--ht-wrapper-border-radius: 1px));',
      '',
    ].join('\n');
    const { output } = await run('a.scss', source);

    assert.equal(output, renamed(source));
  });

  it('does not edit a value that holds a comment, and reports it instead', async() => {
    const source = '.a { border-radius: var(--ht-wrapper-border-radius, /* fallback */ 2px); }\n';
    const { output, changed, entries } = await run('a.css', source);

    assert.equal(changed, false);
    assert.equal(output, source);
    assert.deepEqual(entries.map(entry => [entry.ruleId, entry.severity, entry.line]), [[RADIUS, 'manual', 1]]);
  });

  it('keeps the order of two TODOs before one declaration and indents them like the declaration', async() => {
    const source = '.a {\n\tbox-shadow: 0 0 0 var(--ht-wrapper-border-width) var(--ht-wrapper-border-color);\n}\n';
    const { output } = await run('a.css', source);
    const lines = output.split('\n');

    assert.equal(lines.length, 6);
    assert.match(lines[1], /^\t\/\* TODO\(handsontable-codemod 18\.0\.0\/css-wrapper-border-width\)/);
    assert.match(lines[2], /^\t\/\* TODO\(handsontable-codemod 18\.0\.0\/css-wrapper-border-color\)/);
    assert.equal(lines[3], '\tbox-shadow: 0 0 0 var(--ht-wrapper-border-width) var(--ht-wrapper-border-color);');
  });

  it('edits a style block of a Vue file and leaves the rest of the file, including a <style> comment, alone', async() => {
    const source = '<template>\n  <div class="a"></div>\n</template>\n'
      + '<style>\n/* <style src> */\n.a { --ht-wrapper-border-radius: 1px; }\n</style>\n';
    const { output } = await run('A.vue', source);

    assert.equal(output, renamed(source));
  });
});

describe('CssDocument', () => {
  const SOURCE = '.a { --x: 1px; }\n';

  /**
   * A document over a stylesheet, with the postcss root it reads.
   *
   * @param {string} source Stylesheet text.
   * @returns {import('../src/lib/css-edit.mjs').CssDocument} The document.
   */
  function documentOf(source) {
    const part = createCssPart(source, 'a.css', false);

    return part.document;
  }

  it('refuses an edit when the text at the offsets is not what the model says, and records nothing', () => {
    const document = documentOf(SOURCE);
    const declaration = document.root.first.first;

    document.source = '.a { --y: 1px; }\n';

    assert.equal(document.replaceInDeclaration(declaration, /--x/g, '--z'), false);
    assert.equal(declaration.prop, '--x');
    assert.equal(document.edited, false);
  });

  it('refuses to edit a value that holds a comment', () => {
    const document = documentOf('.a { --x: 1px /* note --x */; }\n');

    assert.equal(document.replaceInDeclaration(document.root.first.first, /1px/g, '2px'), false);
    assert.equal(document.edited, false);
  });

  it('throws when the edited text does not parse to the model', () => {
    const document = documentOf(SOURCE);

    assert.equal(document.replaceInDeclaration(document.root.first.first, /--x/g, '--z'), true);
    document.root.first.first.prop = '--other';

    assert.throws(() => document.print(), /does not match the intended edits/);
  });

  it('prints the original text when nothing was edited', () => {
    assert.equal(documentOf(SOURCE).print(), SOURCE);
  });
});

describe('cssVariable in js', () => {
  it('keeps the quote style of each string and never touches identifiers', async() => {
    const source = 'import H from \'handsontable\';\n'
      + 'a.setProperty("--ht-wrapper-border-radius", \'1px\');\n'
      + 'const wrapperStyle = { \'--ht-wrapper-border-radius\': "2px" };\n';
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

  it('renames a --ht- variable in a file with no other Handsontable usage, and touches nothing else there', async() => {
    const source = 'document.body.style.setProperty(\'--ht-wrapper-border-radius\', \'4px\');\n'
      + 'const theme = { wrapperBorderRadius: \'4px\', correctFormat: true, numericFormat: { culture: \'de-DE\' } };\n'
      + 'grid.saveManualColumnWidths();\n';
    const { output, entries } = await run('not-handsontable.js', source);

    assert.equal(output, source.replace('--ht-wrapper-border-radius', '--ht-border-radius'));
    assert.deepEqual(entries.map(entry => [entry.ruleId, entry.severity, entry.line]), [[RADIUS, 'changed', 1]]);
  });

  it('reads a .cts and a .mts file as TypeScript, so a file with a type assertion is migrated and not skipped', async() => {
    const source = [
      'export const radius = 1 as number;',
      'el.style.setProperty(\'--ht-wrapper-border-radius\', String(radius));',
      '',
    ].join('\n');

    for (const name of ['a.cts', 'a.mts']) {
      const { output, entries } = await run(name, source);

      assert.equal(output, source.replace('--ht-wrapper-border-radius', '--ht-border-radius'), name);
      assert.deepEqual(entries.map(entry => [entry.severity, entry.line]), [['changed', 2]], name);
    }
  });

  it('keeps the comments of a string it renames', async() => {
    const source = [
      'import H from \'handsontable\';',
      'el.style.setProperty(/* the radius */ "--ht-wrapper-border-radius", \'8px\');',
      '// the radius, read back',
      'const read = \'var(--ht-wrapper-border-radius)\'; // trailing',
      '',
    ].join('\n');
    const { output, entries } = await run('a.js', source);

    assert.equal(output, source.split('--ht-wrapper-border-radius').join('--ht-border-radius'));
    assert.equal(output.includes('/* the radius */'), true);
    assert.equal(output.includes('// the radius, read back'), true);
    assert.equal(output.includes('// trailing'), true);
    assert.deepEqual(entries.map(entry => [entry.severity, entry.line]), [['changed', 2], ['changed', 4]]);
  });

  it('does not rename a --ht- look-alike inside a longer name', async() => {
    const source = 'a.setProperty(\'--ht-wrapper-border-radius-extra\', \'4px\');\n';
    const { output, entries } = await run('not-handsontable.js', source);

    assert.equal(output, source);
    assert.deepEqual(entries, []);
  });

  it('reports a removed variable in a string and does not edit the file', async() => {
    const source = 'import H from \'handsontable\';\na.setProperty(\'--ht-wrapper-border-width\', \'1px\');\n';
    const { output, entries } = await run('a.js', source);

    assert.equal(output, source);
    assert.deepEqual(entries.map(entry => [entry.ruleId, entry.severity, entry.line]), [[WIDTH, 'manual', 2]]);
  });
});

describe('cssVariable on a key of an object that is not a style', () => {
  const NAME = '--ht-wrapper-border-radius';
  const renamedInOutput = async(source, file = 'a.jsx') => (await run(file, source)).output
    .includes('--ht-border-radius');

  it('reports the key of a map and a computed member key, and edits neither', async() => {
    const source = `import H from 'handsontable';\nconst cssVars = { '${NAME}': '4px' };\n`
      + `const x = cssVars['${NAME}'];\nconst y = this.tokens?.['${NAME}'];\nconst z = { ...base, "${NAME}": 1 };\n`;
    const { output, entries } = await run('a.js', source);

    assert.equal(output.replace(/^\/\/ TODO.*\n/gm, ''), source);
    assert.deepEqual(entries.map(entry => [entry.severity, entry.line]),
      [['manual', 2], ['manual', 3], ['manual', 4], ['manual', 5]]);
    assert.match(entries[0].message, /^Rename --ht-wrapper-border-radius to --ht-border-radius here by hand/);
  });

  it('renames the key of a style: a style prop, an object a style name holds, and a style type', async() => {
    for (const source of [
      `const e = <div style={{ '${NAME}': '1px' }} />;`,
      `const e = <div style={{ ...rest, '${NAME}': '1px' } as React.CSSProperties} />;`,
      `const wrapperStyle = { '${NAME}': '1px' };`,
      `const styles = { '${NAME}': '1px' };`,
      `const s: React.CSSProperties = { '${NAME}': '1px' };`,
      `const o = { style: { '${NAME}': '1px' } };`,
      `const o = { cardStyle: { '${NAME}': '1px' } };`,
      `el.style = { '${NAME}': '1px' };`,
      `Object.assign(el.style, { '${NAME}': '1px' });`,
      `$(el).css({ '${NAME}': '1px' });`,
      `el.style['${NAME}'] = '1px';`,
      `getComputedStyle(el)['${NAME}'];`,
      `this.style['${NAME}'];`,
    ]) {
      assert.ok(await renamedInOutput(`import H from 'handsontable';\n${source}\n`, 'a.tsx'), source);
    }
  });

  it('keeps renaming a string that is not a key', async() => {
    const source = `import H from 'handsontable';\nel.style.setProperty('${NAME}', '1px');\n`
      + `getComputedStyle(el).getPropertyValue('${NAME}');\nconst css = \`a { r: var(${NAME}); }\`;\n`
      + `const name = '${NAME}';\nfoo('${NAME}');\nstyled.div\`${NAME}: 2px;\`;\n`;
    const { output, entries } = await run('a.js', source);

    assert.equal(output, source.replaceAll(NAME, '--ht-border-radius'));
    assert.ok(entries.every(entry => entry.severity === 'changed'));
  });

  it('is stable over three runs', async() => {
    const source = `import H from 'handsontable';\nconst cssVars = { '${NAME}': '4px' };\n`
      + `el.style.setProperty('${NAME}', 1);\n`;
    const first = await run('a.js', source);
    const second = await run('a.js', first.output);
    const third = await run('a.js', second.output);

    assert.equal(second.output, first.output);
    assert.equal(third.output, first.output);
    assert.equal(first.entries.filter(entry => entry.severity === 'manual').length, 1);
    assert.equal(second.entries.filter(entry => entry.severity === 'manual').length, 1);
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

  it('rewrites params() only on a theme receiver', async() => {
    const source = 'import Handsontable from \'handsontable\';\n'
      + 'import { registerTheme, getTheme, mainTheme } from \'handsontable/themes\';\n'
      + 'import * as themes from \'handsontable/themes\';\n'
      + 'const bound = registerTheme(\'b\', {});\n'
      + 'registerTheme(\'t\', {}).params({ tokens: { wrapperBorderRadius: 1 } });\n'
      + 'getTheme(\'main\')?.params({ tokens: { wrapperBorderRadius: 2 } });\n'
      + 'mainTheme.params({ tokens: { wrapperBorderRadius: 3 } });\n'
      + 'themes.getTheme(\'x\').params({ tokens: { wrapperBorderRadius: 4 } });\n'
      + 'bound.params({ tokens: { wrapperBorderRadius: 5 } });\n'
      + 'axios.get(url).params({ tokens: { wrapperBorderRadius: 6 } });\n'
      + 'router.params({ tokens: { wrapperBorderRadius: 7 } });\n';
    const { output } = await run('a.js', source);
    const renamed = [...output.matchAll(/borderRadius: (\d)/g)].map(match => match[0]);

    assert.equal(output.includes('axios.get(url).params({ tokens: { wrapperBorderRadius: 6 } })'), true);
    assert.equal(output.includes('router.params({ tokens: { wrapperBorderRadius: 7 } })'), true);
    assert.equal(renamed.filter(text => !text.startsWith('wrapper')).length, 5);
  });

  it('rewrites a token only in the tokens object, the one part of a theme config that holds tokens', async() => {
    const unrelated = [
      'mainTheme.params({ colors: { wrapperBorderColor: \'#000\' } });',
      'mainTheme.params({ icons: { wrapperBorderRadius: \'x\' }, sizing: { wrapperBorderWidth: \'1px\' } });',
      'registerTheme(\'t\', { colors: { palette: { wrapperBorderRadius: \'#fff\' } } });',
    ];
    const source = ['import { mainTheme, registerTheme } from \'handsontable/themes\';', ...unrelated,
      'mainTheme.params({ wrapperBorderRadius: 1, tokens: { wrapperBorderRadius: 2, wrapperBorderColor: \'#000\' } });',
      ''].join('\n');
    const { output, entries } = await run('a.ts', source);

    unrelated.forEach(line => assert.ok(output.includes(`${line}\n`), line));
    assert.ok(output.includes('{ wrapperBorderRadius: 1, tokens: { borderRadius: 2, wrapperBorderColor'), output);
    assert.equal(output.match(/TODO\(handsontable-codemod/g).length, 1);
    // The top-level key is no token, so only the generic note about an unplaced key reaches it.
    assert.deepEqual(entries.map(entry => [entry.ruleId, entry.severity, entry.line]), [
      [TOKEN_RADIUS, 'changed', 5],
      [TOKEN_COLOR, 'manual', 5],
      [TOKEN_RADIUS, 'manual', 5],
    ]);
  });

  it('reads the tokens of both branches of a conditional config', async() => {
    const source = 'import { registerTheme } from \'handsontable/themes\';\n'
      + 'registerTheme(\'t\', dark ? { tokens: { wrapperBorderRadius: 1 } } : '
      + '{ tokens: { wrapperBorderRadius: 2 } });\n';
    const { output } = await run('a.ts', source);

    assert.equal(output, source.replaceAll('wrapperBorderRadius', 'borderRadius'));
  });

  it('does not descend into function bodies inside a theme argument', async() => {
    const source = 'import { registerTheme } from \'handsontable/themes\';\n'
      + 'registerTheme(\'t\', {\n'
      + '  onChange() { return { wrapperBorderRadius: 1 }; },\n'
      + '  other: () => ({ wrapperBorderRadius: 2 }),\n'
      + '  tokens: { wrapperBorderRadius: 3 },\n'
      + '});\n';
    const { output } = await run('a.js', source);

    assert.match(output, /return \{ wrapperBorderRadius: 1 \}/);
    assert.match(output, /\(\{ wrapperBorderRadius: 2 \}\)/);
    assert.match(output, /tokens: \{ borderRadius: 3 \}/);
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

describe('a Sass map key next to an interpolated variable name', () => {
  it('finds a key that follows a url() with a scheme on the same line, because // there starts no comment', async() => {
    const source = [
      '$tokens: (\'logo\': url(http://example.com/logo.png), \'wrapper-border-radius\': 6px);',
      '@each $name, $value in $tokens { .x { --ht-#{$name}: #{$value}; } }',
      '',
    ].join('\n');
    const { entries } = await run('tokens.scss', source);

    assert.deepEqual(entries.filter(entry => entry.ruleId === RADIUS).map(entry => [entry.severity, entry.line]),
      [['manual', 1]]);
  });

  it('does not report a key behind a real // comment on the same line', async() => {
    const source = [
      '$tokens: (',
      '  \'logo\': 1px, // \'wrapper-border-radius\': 6px,',
      '  \'wrapper-border-width\': 1px,',
      ');',
      '@each $name, $value in $tokens { .x { --ht-#{$name}: #{$value}; } }',
      '',
    ].join('\n');
    const { entries } = await run('tokens.scss', source);

    assert.deepEqual(entries.filter(entry => entry.ruleId === RADIUS), []);
    assert.equal(entries.filter(entry => entry.ruleId === WIDTH).length, 1);
  });

  it('does not report a key in a comment that follows a string ending in an escaped backslash', async() => {
    const source = [
      '$tokens: (',
      '  \'separator\': "a\\\\", // \'wrapper-border-width\': 1px,',
      '  \'wrapper-border-radius\': 6px,',
      ');',
      '@each $name, $value in $tokens { .x { --ht-#{$name}: #{$value}; } }',
      '',
    ].join('\n');
    const { entries } = await run('tokens.scss', source);

    assert.deepEqual(entries.filter(entry => entry.ruleId === WIDTH), []);
    assert.equal(entries.filter(entry => entry.ruleId === RADIUS).length, 1);
  });
});

describe('a TODO comment in a stylesheet that mixes line endings', () => {
  const DECLARATION = '  border-width: var(--ht-wrapper-border-width);';
  const todoOf = output => output.split(/(?<=\n)/).find(line => line.includes('TODO(handsontable-codemod'));
  const runMarked = source => transformFile({ filePath: 'a.css', source, plan, options: { markers: true } });

  for (const [label, source, ending] of [
    ['a CRLF region after an LF first line', `.a {\n  color: red;\r\n${DECLARATION}\r\n}\r\n`, '\r\n'],
    ['an LF region after a CRLF first line', `.a {\r\n  color: red;\n${DECLARATION}\n}\n`, '\n'],
    ['a CRLF rule after an LF line', `a { color: red }\n.a {\r\n${DECLARATION}\r\n}\r\n`, '\r\n'],
    ['a first line that is the declaration, in CRLF', `${DECLARATION.trim()}\r\n`, '\r\n'],
  ]) {
    it(`ends the comment with the ending of its own line in ${label}`, async() => {
      const first = await runMarked(source);
      const line = todoOf(first.output);

      assert.ok(line, first.output);
      assert.equal(line.endsWith(ending), true, JSON.stringify(first.output));
      // The comment adds one line break, and every break of the file keeps the ending it had.
      const crlf = text => text.split('\r\n').length - 1;

      assert.equal(crlf(first.output), crlf(source) + (ending === '\r\n' ? 1 : 0));
      assert.equal(first.output.split('\n').length - 1, source.split('\n').length);

      const second = await runMarked(first.output);

      assert.equal(second.output, first.output, 'run 2 changed the file');
    });
  }
});

describe('a TODO comment in a stylesheet whose advice holds a comment end', () => {
  const rules = [{
    id: '18.0.0/css-x',
    kind: 'cssVariable',
    from: '--ht-x',
    removed: true,
    safe: false,
    version: '18.0.0',
    guide: 'x',
    guideUrl: 'https://example.com/g',
    advice: 'Use styles/*/file.css */ body { color: red } instead.',
  }];
  const synthetic = buildPlan([{ version: '18.0.0', rules }]);
  const runSynthetic = source => transformFile({
    filePath: 'a.css',
    source,
    plan: synthetic,
    options: { markers: true },
  });

  it('writes a comment that ends where the tool ends it, and a second run adds nothing', async() => {
    const source = 'a { color: var(--ht-x); }\n';
    const first = await runSynthetic(source);

    assert.equal(first.changed, true, JSON.stringify(first.entries));
    assert.equal(first.entries.some(entry => entry.severity === 'warning'), false, JSON.stringify(first.entries));
    assert.equal(first.output.split('*/').length - 1, 1, 'one comment end, the one the tool writes');
    assert.match(first.output, /Use styles\/\* \/file\.css \* \/ body \{ color: red \} instead\./);

    const second = await runSynthetic(first.output);

    assert.equal(second.changed, false);
    assert.equal(second.output, first.output);
  });
});
