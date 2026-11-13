import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { transformFile } from '../src/runner.mjs';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';
import { guardLiterals, linesInsideLiterals, printedLiterals } from '../src/lib/literals.mjs';
import { listFixtures } from './helpers/fixtures.mjs';
import {
  cookedTemplates,
  multilineLiterals,
  multilineStringValues,
  parserOf,
} from './helpers/literals.mjs';

const CULTURE = ['18.0.0/numeric-format-culture'];
const BORDER = ['18.0.0/css-wrapper-border-radius'];
const NO_ERRORS = entry => !['parse-error', 'transform-error'].includes(entry.ruleId);

/**
 * Run the selected rules of the whole chain over one file text.
 *
 * @param {string} source File text.
 * @param {string} filePath File name.
 * @param {string[]} [only] Rule ids. All rules when empty.
 * @returns {Promise<{output: string, entries: object[], changed: boolean}>} The outcome.
 */
async function transform(source, filePath, only = []) {
  const plan = buildPlan(await loadManifests(VERSIONS_DIR), only);

  return transformFile({ filePath, source, plan, options: {} });
}

/**
 * Transform a text, assert the run did not fail, and assert that runs two and three change nothing.
 *
 * @param {string} source File text.
 * @param {string} filePath File name.
 * @param {string[]} [only] Rule ids.
 * @returns {Promise<string>} The output of the first run.
 */
async function migrate(source, filePath, only = []) {
  const first = await transform(source, filePath, only);

  assert.deepEqual(first.entries.filter(entry => !NO_ERRORS(entry)), [], 'the run failed');
  assert.ok(first.changed, 'the run changed nothing, so the case proves nothing');

  const second = await transform(first.output, filePath, only);
  const third = await transform(second.output, filePath, only);

  assert.equal(second.changed, false, 'run two changed the output');
  assert.equal(third.changed, false, 'run three changed the output');

  return first.output;
}

/**
 * Assert that every template literal builds the same string before and after, and that every literal that spans
 * lines keeps its bytes (line terminators compared as `\n`).
 *
 * @param {string} before Original text.
 * @param {string} after Migrated text.
 * @param {string} filePath File name.
 * @returns {void}
 */
function assertLiteralsKept(before, after, filePath) {
  const parser = parserOf(filePath);

  assert.deepEqual(cookedTemplates(after, parser), cookedTemplates(before, parser), 'a template literal changed');
  assert.deepEqual(multilineStringValues(after, parser), multilineStringValues(before, parser),
    'a string literal changed');
  assert.deepEqual(multilineLiterals(after, parser), multilineLiterals(before, parser),
    'the bytes of a multi-line literal changed');
}

/**
 * A module with a one-line column object that the culture rule rewrites, in the file style under test.
 *
 * @param {object} style File style.
 * @param {string} style.unit One level of indentation.
 * @param {string} style.eol Line terminator.
 * @param {string} column Text of the column object, `\n` inside it stays a line break of the file.
 * @returns {string} The module.
 */
function columnsModule({ unit, eol }, column) {
  return [
    'import Handsontable from \'handsontable\';',
    '',
    'export function mount(el) {',
    `${unit}return new Handsontable(el, {`,
    `${unit}${unit}licenseKey: 'k',`,
    `${unit}${unit}columns: [`,
    `${unit}${unit}${unit}${column},`,
    `${unit}${unit}],`,
    `${unit}});`,
    '}',
    '',
  ].join('\n').replace(/\n/g, eol);
}

const STYLES = {
  spaces: { unit: '  ', eol: '\n' },
  'four spaces': { unit: '    ', eol: '\n' },
  tabs: { unit: '\t', eol: '\n' },
  crlf: { unit: '  ', eol: '\r\n' },
  'tabs and crlf': { unit: '\t', eol: '\r\n' },
};

const CULTURE_KEY = 'numericFormat: { culture: \'de-DE\' }';

/**
 * Column objects that hold a literal which spans lines, each a shape recast can mangle when it reprints the object.
 * `\n` is a line break of the file.
 */
const SHAPES = {
  template: `{ data: 'net', ${CULTURE_KEY}, title: \`Net\namount (EUR)\` }`,
  'template with an indented line': `{ data: 'net', ${CULTURE_KEY}, title: \`Net\n    deep\n\tTab\n  amount\` }`,
  'template with a nested template': `{ data: 'a', ${CULTURE_KEY}, title: \`a\${ \`n\nm\` }b\nc\` }`,
  'template with an expression': `{ data: 'a', ${CULTURE_KEY}, title: \`x\${ 1 + 1 }y\nz\${ 2 }\n  w\` }`,
  'tagged template': `{ data: 'a', ${CULTURE_KEY}, title: tag\`z\n  w\` }`,
  'String.raw': `{ data: 'a', ${CULTURE_KEY}, title: String.raw\`C:\\x\n   y\` }`,
  'template in a function': `{ data: 'a', ${CULTURE_KEY}, validator: () => \`\n  <b>  keep  </b>\` }`,
  'string with a line continuation': `{ data: 'a', ${CULTURE_KEY}, title: 'Net\\\n  amount    two' }`,
  'two templates': `{ data: 'a', ${CULTURE_KEY}, title: \`one\n  two\`, hint: \`three\n    four\` }`,
};

describe('multi-line literals survive a reprint of the object around them', () => {
  for (const [styleName, style] of Object.entries(STYLES)) {
    for (const [shapeName, column] of Object.entries(SHAPES)) {
      for (const filePath of ['grid.js', 'grid.ts']) {
        it(`${shapeName}, ${styleName}, ${filePath}`, async() => {
          const input = columnsModule(style, column);
          const output = await migrate(input, filePath, CULTURE);

          assert.match(output, /locale: 'de-DE'/);
          assert.doesNotMatch(output, /culture/);
          assertLiteralsKept(input, output, filePath);
        });
      }
    }
  }
});

describe('the reported cases', () => {
  it('keeps a template literal in a one-line object that gets its key moved', async() => {
    const input = [
      'import Handsontable from \'handsontable\';',
      '',
      'export function mount(el) {',
      '  return new Handsontable(el, {',
      '    licenseKey: \'k\',',
      '    columns: [',
      '      { data: \'a\', numericFormat: { culture: \'de-DE\' }, title: `Net',
      'amount` },',
      '    ],',
      '  });',
      '}',
      '',
    ].join('\n');
    const output = await migrate(input, 'probe.js', CULTURE);

    assert.equal(output, [
      'import Handsontable from \'handsontable\';',
      '',
      'export function mount(el) {',
      '  return new Handsontable(el, {',
      '    licenseKey: \'k\',',
      '    columns: [',
      '      {',
      '        data: \'a\',',
      '        locale: \'de-DE\',',
      '        numericFormat: {},',
      '',
      '        title: `Net',
      'amount`',
      '      },',
      '    ],',
      '  });',
      '}',
      '',
    ].join('\n'));
  });

  it('keeps the spaces of a rewritten line inside a template literal of a tab-indented file', async() => {
    const input = [
      'import Handsontable from \'handsontable\';',
      '',
      'const css = `',
      '  .grid {',
      '    --ht-wrapper-border-radius: 4px;',
      '    color: red;',
      '  }',
      '`;',
      '',
      'export function mount(el) {',
      '\tconst pre = `line one',
      '    indented with four spaces',
      '\tindented with a tab`;',
      '\tconst hot = new Handsontable(el, {',
      '\t\tlicenseKey: \'k\',',
      '\t\tcolumns: [',
      '\t\t\t{ data: \'a\', type: \'numeric\', numericFormat: { culture: \'de-DE\' }, renderer: () => `',
      '  <b>  keep  </b>` },',
      '\t\t],',
      '\t});',
      '\thot.getPlugin(\'manualColumnResize\').saveManualColumnWidths();',
      '\tdocument.body.dataset.css = css;',
      '\treturn [hot, pre];',
      '}',
      '',
    ].join('\n');
    const output = await migrate(input, 'probe.js');

    assert.ok(output.includes('\n    --ht-border-radius: 4px;\n'), 'the rename is applied with its four spaces');
    assert.ok(output.includes('`line one\n    indented with four spaces\n\tindented with a tab`'));
    assert.ok(output.includes('renderer: () => `\n  <b>  keep  </b>`'));
    assert.deepEqual(cookedTemplates(output, 'babylon'), [
      cookedTemplates(input, 'babylon')[0].replace('--ht-wrapper-border-radius', '--ht-border-radius'),
      ...cookedTemplates(input, 'babylon').slice(1),
    ]);
  });
});

describe('a deliberate edit inside a multi-line template literal', () => {
  const TEMPLATE = [
    '`',
    '  .grid {',
    '    --ht-wrapper-border-radius: 4px;',
    '\t--ht-wrapper-border-radius: 6px;',
    '      color: red;',
    '  }',
    '`',
  ].join('\n');

  for (const [styleName, unit, eol] of [
    ['space-indented', '  ', '\n'],
    ['tab-indented', '\t', '\n'],
    ['tab-indented CRLF', '\t', '\r\n'],
    ['space-indented CRLF', '  ', '\r\n'],
  ]) {
    it(`renames the variable and keeps every neighbor byte in a ${styleName} file`, async() => {
      const input = [
        'import Handsontable from \'handsontable\';',
        '',
        `const css = ${TEMPLATE};`,
        '',
        'export function mount(el) {',
        `${unit}return new Handsontable(el, { licenseKey: 'k', css });`,
        '}',
        '',
      ].join('\n').replace(/\n/g, eol);
      const output = await migrate(input, 'theme.js', BORDER);

      assert.equal(output, input.replaceAll('--ht-wrapper-border-radius', '--ht-border-radius'));
    });
  }

  it('applies the edit and keeps a one-line object around the template untouched', async() => {
    const input = [
      'import Handsontable from \'handsontable\';',
      '',
      'export function mount(el) {',
      '  return new Handsontable(el, { licenseKey: \'k\', css: `',
      '  a {',
      '    --ht-wrapper-border-radius: 4px;',
      '  }` });',
      '}',
      '',
    ].join('\n');
    const output = await migrate(input, 'theme.js', BORDER);

    assert.equal(output, input.replace('--ht-wrapper-border-radius', '--ht-border-radius'));
  });

  it('edits a multi-line string literal and keeps its continuation line', async() => {
    const input = [
      'import Handsontable from \'handsontable\';',
      '',
      'export const css = \'--ht-wrapper-border-radius: 4px;\\',
      '\tcolor: red\';',
      'new Handsontable(document.body, { licenseKey: \'k\' });',
      '',
    ].join('\n');
    const output = await migrate(input, 'theme.js', BORDER);

    assert.equal(output, input.replace('--ht-wrapper-border-radius', '--ht-border-radius'));
  });
});

describe('literals in other kinds of files', () => {
  it('keeps a template literal of a JSX columns prop', async() => {
    const input = [
      'import { HotTable } from \'@handsontable/react-wrapper\';',
      '',
      'export const Ledger = () => (',
      '  <HotTable',
      '    licenseKey="k"',
      `    columns={[{ data: 'net', type: 'numeric', ${CULTURE_KEY}, title: \`Net`,
      'amount (EUR)` }]}',
      '  />',
      ');',
      '',
    ].join('\n');
    const output = await migrate(input, 'Ledger.tsx', CULTURE);

    assert.match(output, /locale: 'de-DE'/);
    assertLiteralsKept(input, output, 'Ledger.tsx');
  });

  it('keeps a multi-line JSX attribute string and a template in a reprinted object', async() => {
    const input = [
      'import { HotTable } from \'@handsontable/react-wrapper\';',
      '',
      'export const Ledger = () => (',
      '  <HotTable',
      '    licenseKey="k"',
      `    columns={[{ data: 'net', ${CULTURE_KEY}, validator: () => <b title="p`,
      '   q">text</b>, title: `a',
      '  b` }]}',
      '  />',
      ');',
      '',
    ].join('\n');
    const output = await migrate(input, 'Ledger.tsx', CULTURE);

    assert.match(output, /locale: 'de-DE'/);
    assertLiteralsKept(input, output, 'Ledger.tsx');
  });

  for (const [label, attributes] of [['script setup', ' setup'], ['script', '']]) {
    it(`keeps a template literal in a Vue ${label} block`, async() => {
      const input = [
        '<template>',
        '  <div ref="el" />',
        '</template>',
        '',
        `<script${attributes}>`,
        'import Handsontable from \'handsontable\';',
        '',
        'export function mount(el) {',
        '  return new Handsontable(el, {',
        '    licenseKey: \'k\',',
        '    columns: [',
        `      { data: 'a', ${CULTURE_KEY}, title: \`Net`,
        'amount\n   two` },',
        '    ],',
        '  });',
        '}',
        '</script>',
        '',
      ].join('\n');
      const output = await migrate(input, 'Grid.vue', CULTURE);
      const script = text => text.slice(text.indexOf('>', text.indexOf('<script')) + 1, text.lastIndexOf('</script>'));

      assert.match(output, /locale: 'de-DE'/);
      assertLiteralsKept(script(input), script(output), 'grid.js');
    });
  }

  it('keeps a template literal in a TypeScript file with a template literal type', async() => {
    const input = [
      'import Handsontable from \'handsontable\';',
      '',
      // eslint-disable-next-line no-template-curly-in-string
      'type Key = `col-${number}`;',
      '',
      'export function mount(el: HTMLElement, key: Key) {',
      '  return new Handsontable(el, { licenseKey: \'k\', columns: [',
      `    { data: key, ${CULTURE_KEY}, title: \`Net`,
      // eslint-disable-next-line no-template-curly-in-string
      'amount ${key}` },',
      '  ] });',
      '}',
      '',
    ].join('\n');
    const output = await migrate(input, 'grid.ts', CULTURE);

    assert.match(output, /locale: 'de-DE'/);
    assertLiteralsKept(input, output, 'grid.ts');
  });

  it('keeps the literals of a file that a marker comment is added to', async() => {
    const input = [
      'import Handsontable from \'handsontable\';',
      '',
      'export function mount(el) {',
      '  return new Handsontable(el, {',
      '    licenseKey: \'k\',',
      '    columns: [',
      '      { data: \'a\', title: `one',
      '  two`, numbroPattern: 1 },',
      '      { data: \'b\', numericFormat: { pattern: \'0,0.[00]\' }, title: `x',
      '    y` },',
      // eslint-disable-next-line no-template-curly-in-string
      '      { data: \'c\', type: \'numeric\', numericFormat: { pattern: \'0,0.[00]\' }, title: `q ${1}`, hint: `x` },',
      '    ],',
      '  });',
      '}',
      '',
    ].join('\n');
    const output = await migrate(input, 'markers.js');

    // One marker goes in through the tree (the multi-line object), one is spliced in as text (a one-line element).
    assert.equal(output.match(/TODO\(handsontable-codemod/g).length, 2);
    assertLiteralsKept(input, output, 'markers.js');
  });
});

describe('guardLiterals', () => {
  const parser = 'babylon';
  const lineTerminator = '\n';
  const source = 'const a = `x\n  y`;\n';
  const literal = text => ({ kind: 'template', text });

  it('returns the text and the literals of a text that is already right', () => {
    const { text, literals } = guardLiterals({
      parser,
      intended: [literal('x\n  y')],
      text: source,
      source,
      lineTerminator,
    });

    assert.equal(text, source);
    assert.deepEqual(literals.map(item => [item.start, item.end]), [[11, 16]]);
  });

  it('puts the intended text back by range, last literal first', () => {
    const printed = 'const a = `x\n    y`, b = `p\n   q`;\n';
    const { text } = guardLiterals({
      parser,
      intended: [literal('x\n  y'), literal('p\nq')],
      text: printed,
      source,
      lineTerminator,
    });

    assert.equal(text, 'const a = `x\n  y`, b = `p\nq`;\n');
  });

  it('writes the repair with the line terminator of the part', () => {
    const { text } = guardLiterals({
      parser,
      intended: [literal('x\n  y')],
      text: 'const a = `x\r\n    y`;\r\n',
      source: 'const a = `x\r\n  y`;\r\n',
      lineTerminator: '\r\n',
    });

    assert.equal(text, 'const a = `x\r\n  y`;\r\n');
  });

  it('throws when a literal is missing from the text or added to it', () => {
    assert.throws(() => guardLiterals({
      parser,
      intended: [literal('x\n  y'), literal('a\nb')],
      text: source,
      source,
      lineTerminator,
    }), /lost or added/);
    assert.throws(() => guardLiterals({ parser, intended: [], text: source, source, lineTerminator }),
      /lost or added/);
  });

  it('throws when the characters of a literal changed, not only its white space', () => {
    assert.throws(() => guardLiterals({ parser, intended: [literal('x\n  z')], text: source, source, lineTerminator }),
      /lost or added/);
  });

  it('throws instead of repairing when repair is off', () => {
    assert.throws(() => guardLiterals({
      parser,
      intended: [literal('x\ny')],
      text: source,
      source,
      lineTerminator,
      repair: false,
    }), /changed while printing/);
  });

  it('throws instead of repairing a part whose source has a line terminator a slice cannot return', () => {
    const exotic = 'const a = `x\u2028  y`;\n';

    assert.throws(() => guardLiterals({
      parser,
      intended: [literal('x\ny')],
      text: 'const a = `x\u2028    y`;\n',
      source: exotic,
      lineTerminator,
    }), /changed while printing/);
  });

  it('throws when two literals say the same with different spacing and the printed ones are not in order', () => {
    assert.throws(() => guardLiterals({
      parser,
      intended: [literal('x\n  y'), literal('x\n    y')],
      text: 'const a = `x\n    y`, b = `x\n  y`;\n',
      source,
      lineTerminator,
    }), /cannot be matched/);
  });

  it('throws when the printed text does not parse', () => {
    assert.throws(() => guardLiterals({ parser, intended: [], text: 'const = `x', source, lineTerminator }));
  });
});

describe('linesInsideLiterals', () => {
  it('lists the lines that begin inside a literal and no others', () => {
    const text = 'const a = `x\n  y\n  z`;\nconst b = 1;\n';
    const literals = printedLiterals('babylon', text);

    assert.deepEqual([...linesInsideLiterals(text, literals, '\n')], [1, 2]);
  });

  it('counts lines by the given line terminator', () => {
    const text = 'const a = `x\r\n  y`;\r\nlet b;\r\n';

    assert.deepEqual([...linesInsideLiterals(text, printedLiterals('babylon', text), '\r\n')], [1]);
  });
});

describe('every fixture keeps the literals no rule edited', () => {
  it('compares the template literals and the multi-line strings of each fixture input and output', async() => {
    let compared = 0;

    for (const fixture of await listFixtures()) {
      if (!/^input\.(?:[cm]?js|jsx|tsx?)$/.test(fixture.inputName)) {
        continue;
      }

      const input = await readFile(join(fixture.dir, fixture.inputName), 'utf8');
      const output = await readFile(join(fixture.dir, fixture.outputName), 'utf8');
      const parser = parserOf(fixture.inputName);
      const kinds = [
        [cookedTemplates, 'a template literal'],
        [multilineStringValues, 'a multi-line string'],
        [multilineLiterals, 'the bytes of a multi-line literal'],
      ];

      for (const [read, what] of kinds) {
        const before = read(input, parser);
        const after = read(output, parser);
        // The only rule that edits a literal renames a `--ht-` variable, and a rule may remove a literal with the
        // node that holds it, so a literal that is gone must be one a rule could have edited or removed.
        const remaining = [...after];

        for (const text of before) {
          const renamed = text.replaceAll('--ht-wrapper-border-radius', '--ht-border-radius');
          const at = [text, renamed].map(candidate => remaining.indexOf(candidate)).find(index => index !== -1);

          if (at !== undefined) {
            remaining.splice(at, 1);
          }
        }

        assert.deepEqual(remaining, [], `${fixture.version}/${fixture.name}: ${what} appeared or changed`);
        compared += before.length;
      }
    }

    assert.ok(compared > 0, 'no fixture holds a literal, so the sweep proves nothing');
  });
});
