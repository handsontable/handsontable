import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MarkerCarriers } from '../src/lib/carrier.mjs';
import { removeNamedImport } from '../src/lib/imports.mjs';
import { formatTodo } from '../src/lib/todo.mjs';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { createRegistry } from '../src/transforms/index.mjs';
import { parse } from './helpers/parse.mjs';

const manifests = await loadManifests(VERSIONS_DIR);
const TEXT = 'Check this by hand.';
const todoOf = ruleId => `// ${formatTodo(ruleId, TEXT)}`;
const A = todoOf('18.0.0/a');
const B = todoOf('18.0.0/b');
const BOM = String.fromCharCode(0xfeff);

/**
 * Run fake rules over a text. The rules are of one fake kind, and each rule id has a behavior that gets the context.
 *
 * @param {object} args Arguments.
 * @param {string} args.source File text.
 * @param {string} [args.filePath] File name.
 * @param {Record<string, Function>} args.behaviors What each rule does, by id (`18.0.0/a`, `18.0.0/b`).
 * @param {object} [args.hooks] Injection points of `transformFile()`.
 * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The outcome.
 */
async function runFake({ source, filePath = 'a.js', behaviors, hooks }) {
  const transform = {
    kinds: ['detect'],
    fileKinds: ['js'],
    apply(ctx, rules) {
      rules.forEach(rule => behaviors[rule.id]?.(ctx, rule));
    },
    // The texts of these tests never say Handsontable, which the precheck of the adapter looks for.
    rescue: rules => rules,
  };
  const rules = Object.keys(behaviors).map(id => ({
    id,
    kind: 'detect',
    safe: true,
    version: '18.0.0',
    guideUrl: 'https://example.com/g',
  }));
  const plan = buildPlan([{ version: '18.0.0', rules }]);

  return transformFile({
    filePath,
    source,
    plan,
    registry: createRegistry([transform], ['detect'], new Set()),
    options: { markers: false },
    hooks,
  });
}

/**
 * The first statement of a part whose text is exactly `code`, as a NodePath.
 *
 * @param {import('../src/types.mjs').Ctx} ctx Context.
 * @param {string} code The text of the statement.
 * @returns {object} The path.
 */
function statementAt(ctx, code) {
  const [found] = ctx.root.find(ctx.j.Statement).filter(path => path.node.loc?.lines
    ?.sliceString(path.node.loc.start, path.node.loc.end).replace(BOM, '') === code).paths();

  assert.ok(found, `no statement with the text ${JSON.stringify(code)}`);

  return found;
}

/**
 * A rule that leaves the TODO of its id on the statement with the given text.
 *
 * @param {string} code Text of the statement.
 * @returns {Function} The behavior.
 */
const todoOn = code => (ctx, rule) => {
  ctx.todo(statementAt(ctx, code).node, rule.id, TEXT);
};

/**
 * Transform a text with a rule that puts a TODO on one statement, three times, each run on the output of the one
 * before. Runs 2 and 3 must change nothing.
 *
 * @param {string} source File text.
 * @param {string} code Text of the statement.
 * @param {string} [filePath] File name.
 * @returns {Promise<string>} The output of run 1.
 */
async function todoRuns(source, code, filePath = 'a.js') {
  const behaviors = { '18.0.0/a': todoOn(code) };
  const first = await runFake({ source, filePath, behaviors });
  const second = await runFake({ source: first.output, filePath, behaviors });
  const third = await runFake({ source: second.output, filePath, behaviors });

  assert.deepEqual(first.entries.filter(entry => /-error$/.test(entry.ruleId)), [], first.output);
  assert.equal(second.changed, false, `run 2 changed the file:\n${second.output}`);
  assert.equal(third.changed, false, 'run 3 changed the file');

  // The same entries in every run: a run adds none.
  const entriesOf = result => result.entries.map(entry => `${entry.ruleId} ${entry.severity} ${entry.marked}`).sort();

  assert.deepEqual(entriesOf(first), ['18.0.0/a manual true']);
  assert.deepEqual(entriesOf(second), entriesOf(first));
  assert.deepEqual(entriesOf(third), entriesOf(first));

  return first.output;
}

/**
 * Statements of one line, for a module. Each is the anchor of a TODO that no rule changed. A statement that needs a
 * function around it (`return`) is in `INSIDE`.
 */
const JS_SHAPES = [
  ['an expression statement', 'hot.undo();'],
  ['an expression statement without a semicolon', 'hot.undo()'],
  ['an await expression', 'await hot.undo();'],
  ['an if without braces', 'if (ready) hot.undo();'],
  ['an if with an else, without braces', 'if (ready) hot.undo(); else other();'],
  ['an else if chain', 'if (a) hot.undo(); else if (b) other();'],
  ['a for', 'for (let i = 0; i < 3; i++) hot.undo();'],
  ['a for of', 'for (const key of keys) hot.undo();'],
  ['a for in', 'for (const key in keys) hot.undo();'],
  ['a while', 'while (ready) hot.undo();'],
  ['a do while', 'do hot.undo(); while (ready);'],
  ['a labeled statement', 'outer: hot.undo();'],
  ['a labeled loop', 'outer: for (;;) hot.undo();'],
  ['a variable declaration', 'const result = hot.undo();'],
  ['a declaration without a value', 'let result;'],
  ['a destructuring declaration', 'const { a, b } = hot.undo();'],
  ['an export of a declaration', 'export const result = hot.undo();'],
  ['an export default expression', 'export default hot.undo();'],
  ['an export of a function', 'export function run() { return 1; }'],
  ['an export from another module', 'export { run } from \'other\';'],
  ['an import', 'import { run } from \'other\';'],
  ['a one-line block', '{ first(); hot.undo(); }'],
  ['a try', 'try { hot.undo(); } catch (error) { other(); }'],
  ['a switch', 'switch (kind) { case 1: hot.undo(); }'],
  ['a throw', 'throw new Error(\'x\');'],
  ['a function declaration', 'function run() { hot.undo(); }'],
  ['a class declaration', 'class Run { go() { hot.undo(); } }'],
  ['a parenthesized expression', '(first, hot.undo());'],
  ['an assignment', 'result = ready ? hot.undo() : other();'],
  ['a call of a function expression', '(function() { hot.undo(); })();'],
];

const TS_SHAPES = [
  ['a typed declaration', 'let result: number = hot.undo();'],
  ['a type alias', 'type Run = { go: number };'],
  ['an interface', 'interface Run { go: number }'],
  ['an enum', 'enum Run { A, B }'],
  ['an ambient declaration', 'declare const result: number;'],
  ['a type import', 'import type { Run } from \'other\';'],
  ['a type export', 'export type { Run } from \'other\';'],
  ['an assertion', 'const run = hot as unknown as Run;'],
];

const TSX_SHAPES = [
  ['a declaration of an element', 'const element = <Grid data={hot.undo()} />;'],
  ['an arrow function that returns an element', 'export const App = () => <Grid />;'],
  ['an if without braces and an element', 'if (ready) render(<Grid />);'],
];

const INSIDE = [
  ['a return', 'return hot.undo();'],
  ['a return of an element', 'return render(<Grid />);'],
  ['a throw', 'throw hot.undo();'],
  ['an if without braces', 'if (ready) return hot.undo();'],
  ['a variable declaration', 'const result = hot.undo();'],
];

describe('a TODO on an untouched one-line statement leaves the statement on its line', () => {
  for (const [group, shapes, filePath] of [['js', JS_SHAPES, 'a.js'], ['ts', TS_SHAPES, 'a.ts'],
    ['tsx', TSX_SHAPES, 'a.tsx'], ['ts file with the shapes of js', JS_SHAPES, 'a.ts'],
    ['tsx file with the shapes of js', JS_SHAPES, 'a.tsx']]) {
    describe(`in a ${group} file`, () => {
      for (const [name, code] of shapes) {
        it(`${name}: exactly one comment line is added`, async() => {
          const source = `const first = 1;\n${code}\nconst last = 2;\n`;
          const output = await todoRuns(source, code, filePath);

          assert.equal(output, `const first = 1;\n${A}\n${code}\nconst last = 2;\n`);
        });
      }
    });
  }

  describe('inside a function, indented with spaces and with tabs', () => {
    for (const [name, code] of INSIDE) {
      it(`${name}`, async() => {
        const spaced = `function run() {\n  const first = 1;\n  ${code}\n}\n`;
        const tabbed = spaced.replaceAll('  ', '\t');

        assert.equal(await todoRuns(spaced, code, 'a.tsx'), spaced.replace(`  ${code}`, `  ${A}\n  ${code}`));
        assert.equal(await todoRuns(tabbed, code, 'a.tsx'), tabbed.replace(`\t${code}`, `\t${A}\n\t${code}`));
      });
    }
  });

  it('leaves a line ending, an indent, and a trailing comment as they were', async() => {
    const code = 'if (ready) hot.undo();';
    const cases = [
      // The statement, with the lines around it, and what the output holds.
      [`const a = 1;\r\n${code}\r\nconst b = 2;\r\n`, `const a = 1;\r\n${A}\r\n${code}\r\nconst b = 2;\r\n`],
      [`const a = 1;\n${code} // keep this note\nconst b = 2;\n`,
        `const a = 1;\n${A}\n${code} // keep this note\nconst b = 2;\n`],
      [`const a = 1;\n${code}`, `const a = 1;\n${A}\n${code}`],
      [`${code}\n`, `${A}\n${code}\n`],
      [`const a = 1;\n\n\n${code}\n\n\nconst b = 2;\n`, `const a = 1;\n\n\n${A}\n${code}\n\n\nconst b = 2;\n`],
    ];

    for (const [source, expected] of cases) {
      assert.equal(await todoRuns(source, code), expected);
    }
  });

  it('adds the line with the ending most lines have in a file that mixes endings, and keeps every other ending', async() => {
    const code = 'if (ready) hot.undo();';
    const source = ['const a = 1;\n', 'const b = 2;\r\n', `${code}\r\n`, 'const c = 3;\n', 'const d = 4;\r\n'].join('');
    const expected = [
      'const a = 1;\n', 'const b = 2;\r\n', `${A}\r\n`, `${code}\r\n`, 'const c = 3;\n', 'const d = 4;\r\n',
    ].join('');

    assert.equal(await todoRuns(source, code), expected);
  });

  it('puts the line below a shebang, a directive prologue, a license comment, and a byte order mark', async() => {
    const code = 'if (ready) hot.undo();';
    const cases = [
      [`#!/usr/bin/env node\n${code}\n`, `#!/usr/bin/env node\n${A}\n${code}\n`],
      [`'use strict';\n${code}\n`, `'use strict';\n${A}\n${code}\n`],
      [`'use strict';\n'use client';\n\n${code}\n`, `'use strict';\n'use client';\n\n${A}\n${code}\n`],
      [`/*! license */\n${code}\n`, `/*! license */\n${A}\n${code}\n`],
      [`${BOM}${code}\n`, `${BOM}${A}\n${code}\n`],
      [`${BOM}#!/usr/bin/env node\r\n${code}\r\n`, `${BOM}#!/usr/bin/env node\r\n${A}\r\n${code}\r\n`],
    ];

    for (const [source, expected] of cases) {
      assert.equal(await todoRuns(source, code), expected);
    }
  });

  it('goes above a directive for the next line, and below the other comments of the statement', async() => {
    const code = 'if (ready) hot.undo();';
    const source = `const a = 1;\n// a note about the line\n// eslint-disable-next-line no-undef\n${code}\n`;

    assert.equal(await todoRuns(source, code),
      `const a = 1;\n// a note about the line\n${A}\n// eslint-disable-next-line no-undef\n${code}\n`);
    assert.equal(await todoRuns(`const a = 1;\n// @ts-expect-error\n// prettier-ignore\n${code}\n`, code),
      `const a = 1;\n${A}\n// @ts-expect-error\n// prettier-ignore\n${code}\n`);
  });

  describe('in a Vue <script setup>', () => {
    // The import is for the adapter, which reads a script only when it names Handsontable.
    const vue = (lang, body) => `<template>\n  <div />\n</template>\n\n<script setup${lang}>\n`
      + `import Handsontable from 'handsontable';\n${body}\n</script>\n`;

    for (const [shapes, lang] of [[JS_SHAPES, ''], [TS_SHAPES, ' lang="ts"'], [JS_SHAPES, ' lang="ts"']]) {
      for (const [name, code] of shapes) {
        it(`${name}${lang}`, async() => {
          assert.equal(await todoRuns(vue(lang, code), code, 'a.vue'), vue(lang, `${A}\n${code}`));
        });
      }
    }

    // A TypeScript block has no JSX.
    for (const [name, code] of INSIDE.filter(([, text]) => !text.includes('<'))) {
      it(`${name}, inside a function`, async() => {
        const body = `function run() {\n  ${code}\n}`;

        assert.equal(await todoRuns(vue(' lang="ts"', body), code, 'a.vue'),
          vue(' lang="ts"', `function run() {\n  ${A}\n  ${code}\n}`));
      });
    }
  });

  it('works in the script of a Vue file, both kinds of script block', async() => {
    const code = 'if (ready) hot.undo();';
    const shell = script => `<template>\n  <div />\n</template>\n\n${script}\n`;
    const setup = `<script setup lang="ts">\nimport Handsontable from 'handsontable';\n${code}\n</script>`;
    const plain = `<script>\nimport Handsontable from 'handsontable';\n\nexport default {\n  mounted() {\n    ${code}\n`
      + '  },\n};\n</script>';
    const crlf = shell(setup).replaceAll('\n', '\r\n');

    assert.equal(await todoRuns(shell(setup), code, 'a.vue'),
      shell(setup.replace(code, `${A}\n${code}`)));
    assert.equal(await todoRuns(shell(plain), code, 'a.vue'),
      shell(plain.replace(`    ${code}`, `    ${A}\n    ${code}`)));
    assert.equal(await todoRuns(crlf, code, 'a.vue'), crlf.replace(code, `${A}\r\n${code}`));
  });

  it('puts two TODOs of two rules on one statement in the order of the rules', async() => {
    const code = 'if (ready) hot.undo();';
    const behaviors = { '18.0.0/a': todoOn(code), '18.0.0/b': todoOn(code) };
    const source = `const a = 1;\n${code}\nconst b = 2;\n`;
    const first = await runFake({ source, behaviors });
    const second = await runFake({ source: first.output, behaviors });

    assert.equal(first.output, `const a = 1;\n${A}\n${B}\n${code}\nconst b = 2;\n`);
    assert.equal(second.changed, false);
  });

  it('adds one comment when a rule asks twice, whether with todo() or comment()', async() => {
    const code = 'if (ready) hot.undo();';
    const twice = (ctx, rule) => {
      const { node } = statementAt(ctx, code);

      ctx.todo(node, rule.id, TEXT);
      ctx.todo(node, rule.id, TEXT);
      ctx.comment(node, rule.id, TEXT);
    };
    const result = await runFake({ source: `${code}\n`, behaviors: { '18.0.0/a': twice } });

    assert.equal(result.output, `${A}\n${code}\n`);
  });

  it('keeps one comment when a later rule changes the statement, and prints the change', async() => {
    const rename = code => (ctx) => {
      const found = statementAt(ctx, code);

      ctx.j(found).find(ctx.j.Identifier, { name: 'hot' }).forEach((path) => {
        path.node.name = 'grid';
      });
      ctx.markChanged();
    };

    // The statement, and what the tree prints for it once the rename changed it: a statement that the printer lays out
    // again may take other lines, and none of that is the business of the carriers.
    for (const [code, renamed] of [
      ['hot.undo();', 'grid.undo();'],
      ['const result = hot.undo();', 'const result = grid.undo();'],
      ['if (ready) hot.undo();', 'if (ready)\n  grid.undo();'],
    ]) {
      // The TODO first, the change after it, and the other way round.
      for (const [todoId, behaviors] of [
        ['18.0.0/a', { '18.0.0/a': todoOn(code), '18.0.0/b': rename(code) }],
        ['18.0.0/b', { '18.0.0/a': rename(code), '18.0.0/b': todoOn(code) }],
      ]) {
        const source = `const a = 1;\n${code}\nconst b = 2;\n`;
        const first = await runFake({ source, behaviors });
        // The second run asks for the same TODO on the statement as it stands now.
        const second = await runFake({ source: first.output, behaviors: { [todoId]: todoOn(renamed) } });

        assert.deepEqual(first.entries.filter(entry => /-error$/.test(entry.ruleId)), [], first.output);
        assert.equal(first.output, `const a = 1;\n${todoOf(todoId)}\n${renamed}\nconst b = 2;\n`);
        assert.equal(second.changed, false, second.output);
      }
    }
  });

  it('keeps one comment for a TODO that a rule moves with the declaration it stood on', async() => {
    const source = 'import { a } from \'x\';\nimport { b } from \'y\';\n\nuse(a, b);\n';
    const behaviors = {
      '18.0.0/a': (ctx, rule) => ctx.todo(statementAt(ctx, 'import { a } from \'x\';').node, rule.id, TEXT),
      '18.0.0/b': (ctx) => {
        const [declaration] = ctx.root.find(ctx.j.ImportDeclaration).paths();
        const [, other] = ctx.root.find(ctx.j.ImportDeclaration).paths();

        removeNamedImport(ctx.j, ctx.root, declaration, declaration.node.specifiers[0], { commentsTo: other });
        ctx.markChanged();
      },
    };
    const first = await runFake({ source, behaviors });

    assert.deepEqual(first.entries.filter(entry => /-error$/.test(entry.ruleId)), []);
    assert.equal(first.output, `${A}\nimport { b } from 'y';\n\nuse(a, b);\n`);
  });

  it('keeps a TODO that the rules of the shipped manifests leave on a call, in a chain of twin rules, once', async() => {
    const plan = buildPlan(manifests, ['18.0.0/resize-state-methods', '19.0.0/resize-state-methods']);
    const source = 'import Handsontable from \'handsontable\';\nconst hot = new Handsontable(el, {});\n'
      + 'const plugin = hot.getPlugin(\'manualColumnResize\');\n\nif (ready) plugin.saveManualColumnWidths();\n';
    const results = [];
    let text = source;

    for (let run = 0; run < 3; run += 1) {
      results.push(await transformFile({ filePath: 'a.js', source: text, plan }));
      text = results[run].output;
    }

    const rows = results[0].output.split('\n');
    const at = rows.findIndex(row => row.includes('TODO(handsontable-codemod'));

    assert.equal(rows.filter(row => row.includes('TODO(handsontable-codemod')).length, 1, results[0].output);
    assert.match(rows[at], /TODO\(handsontable-codemod 18\.0\.0\/resize-state-methods\)/);
    assert.equal(rows[at + 1], 'if (ready) plugin.saveManualColumnWidths();');
    assert.equal(results[1].changed, false);
    assert.equal(results[2].changed, false);
  });
});

describe('the shapes that stay with the printer', () => {
  const HEAD = 'import Handsontable from \'handsontable\';\nconst hot = new Handsontable(el, {});\n'
    + 'const formulas = hot.getPlugin(\'formulas\');\n\n';
  const CALL = 'formulas.registerShortcuts()';

  /**
   * Run the rule that keeps a call with a TODO three times over a statement.
   *
   * @param {string} code The statement.
   * @returns {Promise<string>} The output of run 1 after the head, with the text of the TODO shortened to `// TODO`.
   */
  async function kept(code) {
    const plan = buildPlan(manifests, ['19.0.0/formulas-shortcut-methods']);
    let text = `${HEAD}${code}\n`;
    let first = null;

    for (let run = 0; run < 3; run += 1) {
      const result = await transformFile({ filePath: 'a.js', source: text, plan });

      if (run === 0) {
        first = result.output;
        assert.equal(first.split('TODO(handsontable-codemod').length - 1, 1, first);
      } else {
        assert.equal(result.changed, false, `run ${run + 1} changed the file:\n${result.output}`);
      }

      text = result.output;
    }

    return first.slice(HEAD.length).replace(/\/\/ TODO\(handsontable-codemod [^\n]*\n/g, '// TODO\n');
  }

  it('lays out a statement that shares its line with other code, as the printer does, with one comment', async() => {
    assert.equal(await kept(`first(); if (ready) ${CALL};`), `first(); // TODO\nif (ready)\n  ${CALL};\n`);
    assert.equal(await kept(`{ foo(${CALL}); }`), `{ // TODO\nfoo(${CALL}); }\n`);
    assert.equal(await kept(`function f() { foo(${CALL}); }`), `function f() { // TODO\nfoo(${CALL}); }\n`);
  });

  it('lays out a brace-less if with an else, or a label, that spans lines, as the printer does, with one comment',
    async() => {
      assert.equal(await kept(`if (a) b();\nelse ${CALL};`),
        `// TODO\nif (a)\n  b();\nelse\n  ${CALL};\n`);
      assert.equal(await kept(`label:\n  for (;;) foo(${CALL});`),
        `// TODO\nlabel:\nfor (;;) foo(${CALL});\n`);
    });

  it('keeps every other statement that spans lines as it was, and takes a one-line statement inside a block', async() => {
    assert.equal(await kept(`if (a) {\n  foo(${CALL});\n}`), `if (a) {\n  // TODO\n  foo(${CALL});\n}\n`);
    assert.equal(await kept(`foo(\n  ${CALL},\n  1,\n);`), `// TODO\nfoo(\n  ${CALL},\n  1,\n);\n`);
    assert.equal(await kept(`const t = \`\n  x\n\${${CALL}}\n\`;`), `// TODO\nconst t = \`\n  x\n\${${CALL}}\n\`;\n`);
    assert.equal(await kept(`const o = {\n  a: ${CALL},\n  b: 2,\n};`),
      `// TODO\nconst o = {\n  a: ${CALL},\n  b: 2,\n};\n`);
  });
});

describe('a failure of the carriers leaves the file as it was', () => {
  const code = 'if (ready) hot.undo();';
  const source = `const message = 'a string';\n${code}\nconst last = 2;\n`;

  /**
   * The outcome of a run whose carriers are tampered with after they committed.
   *
   * @param {Function} tamper Gets the part.
   * @param {Record<string, Function>} behaviors The rules.
   * @param {string} text File text.
   * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The outcome.
   */
  const withHook = (tamper, behaviors, text) => runFake({ source: text, behaviors, hooks: { afterCommit: tamper } });
  const missing = (part) => {
    part.carriers.committed.forEach((record) => {
      record.sentinel = `${record.sentinel}Missing`;
    });
  };
  const doubled = (part) => {
    // A string of the tree that holds the sentinel, so the printed text holds it twice.
    const [record] = part.carriers.committed;
    const [literal] = part.root.find(part.j.StringLiteral).paths();

    literal.node.value = record.sentinel;
    delete literal.node.extra;
  };

  for (const [kind, text, behaviors] of [
    ['a statement that takes a comment', source, { '18.0.0/a': todoOn(code) }],
    ['a removed statement', source.replace(code, 'removeMe();'),
      { '18.0.0/a': (ctx) => {
        ctx.removeStatement(statementAt(ctx, 'removeMe();'));
        ctx.markChanged();
      } }],
  ]) {
    it(`a sentinel that goes missing is a transform-error for ${kind}`, async() => {
      const result = await withHook(missing, behaviors, text);

      assert.equal(result.changed, false);
      assert.equal(result.output, text);
      assert.equal(result.entries.some(entry => entry.ruleId === 'transform-error'
        && /could not be placed/.test(entry.message)), true, JSON.stringify(result.entries));
    });

    it(`a sentinel that stands twice is a transform-error for ${kind}`, async() => {
      const result = await withHook(doubled, behaviors, text);

      assert.equal(result.changed, false);
      assert.equal(result.output, text);
      assert.equal(result.entries.some(entry => entry.ruleId === 'transform-error'
        && /could not be placed/.test(entry.message)), true, JSON.stringify(result.entries));
    });
  }
});

describe('MarkerCarriers.commit() with an element that left its array after its comment was queued', () => {
  const SOURCE = 'const xs = [1, 2, 3];\n';

  /**
   * Parse the array and queue a comment for the element `2` and, when asked, for `3`.
   *
   * @param {boolean} both Whether `3` gets a comment too.
   * @returns {{array: object, two: object, carriers: MarkerCarriers}} The pieces.
   */
  function queued(both) {
    const { j, root } = parse(SOURCE, 'ts');
    const carriers = new MarkerCarriers(j, SOURCE, root);
    const array = root.find(j.ArrayExpression).get().node;
    const [, two, three] = array.elements;

    assert.equal(carriers.add(array, two, 'TODO a'), true);

    if (both) {
      assert.equal(carriers.add(array, three, 'TODO b'), true);
    }

    return { array, two, carriers };
  }

  it('writes nothing at index -1 and keeps no record for the element that left', () => {
    const { array, two, carriers } = queued(false);

    array.elements.splice(array.elements.indexOf(two), 1);
    carriers.commit();

    assert.equal(array.elements.length, 2);
    assert.deepEqual(Object.keys(array.elements), ['0', '1']);
    assert.deepEqual(carriers.committed, []);
    assert.equal(carriers.pending.size, 0);
  });

  it('still carries the comment of an element that stays', () => {
    const { array, two, carriers } = queued(true);

    array.elements.splice(array.elements.indexOf(two), 1);
    carriers.commit();

    assert.equal(carriers.committed.length, 1);
    assert.deepEqual(Object.keys(array.elements), ['0', '1']);
    assert.equal(array.elements[1].type, 'Identifier');
    assert.equal(array.elements[1].name.startsWith(carriers.prefix), true);
    assert.deepEqual(carriers.committed[0].bodies, ['TODO b']);
  });
});
