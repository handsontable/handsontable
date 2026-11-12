import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import jscodeshift from 'jscodeshift';
import postcss from 'postcss';
import { addCssTodo, addJsTodo, formatTodo, lineOf, shortenAdvice } from '../src/lib/todo.mjs';

describe('shortenAdvice', () => {
  it('keeps the first sentence and leaves version numbers and dotted names whole', () => {
    assert.equal(
      shortenAdvice('The correctFormat option was removed in 18.0. Use Handsontable.helper.x instead.'),
      'The correctFormat option was removed in 18.0.'
    );
  });

  it('takes the next sentence along when the first one is very short and both fit', () => {
    assert.equal(
      shortenAdvice('Removed in 18.0. Delete this token by hand. Then more.'),
      'Removed in 18.0. Delete this token by hand.'
    );
    assert.equal(
      shortenAdvice(`Removed in 18.0. ${'Draw the border with a long selector '.repeat(4)}.`),
      'Removed in 18.0.'
    );
  });

  it('cuts a long sentence at a word boundary and ends it with three dots', () => {
    const short = shortenAdvice(`Replace ${'word '.repeat(40)}now.`);

    assert.ok(short.length <= 100, short.length);
    assert.match(short, /word\.\.\.$/);
  });

  it('flattens line breaks and ends the text with a full stop', () => {
    assert.equal(shortenAdvice('Do this\n   now'), 'Do this now.');
    assert.equal(shortenAdvice(''), '');
  });
});

describe('formatTodo', () => {
  it('adds the guide link after the first sentence, and only when there is one', () => {
    assert.equal(
      formatTodo('18.0.0/x', 'Replace the old import with the new one. Then do B.', 'https://example.com/guide#a'),
      'TODO(handsontable-codemod 18.0.0/x): Replace the old import with the new one. See https://example.com/guide#a'
    );
    assert.equal(formatTodo('18.0.0/x', 'Replace A.'), 'TODO(handsontable-codemod 18.0.0/x): Replace A.');
  });

  it('uses the fixed marker and flattens the text to one line', () => {
    assert.equal(
      formatTodo('18.0.0/x', 'First line.\n   Second line.'),
      'TODO(handsontable-codemod 18.0.0/x): First line. Second line.'
    );
  });
});

describe('addJsTodo', () => {
  const j = jscodeshift.withParser('ts');
  const source = 'import { A } from \'handsontable/common\';\nconst x = 1;\n';

  /**
   * Insert a TODO before the first statement and print the result.
   *
   * @param {string} code Source text.
   * @param {string} text TODO text.
   * @returns {{output: string, inserted: boolean}} The printed code and whether a comment was added.
   */
  function addToFirstStatement(code, text) {
    const root = j(code);
    const inserted = addJsTodo(j, root.find(j.ImportDeclaration).paths()[0], 'r/x', text);

    return { output: root.toSource(), inserted };
  }

  it('inserts a line comment before the node', () => {
    const { output, inserted } = addToFirstStatement(source, 'Replace A.');

    assert.equal(inserted, true);
    assert.equal(output, `// TODO(handsontable-codemod r/x): Replace A.\n${source}`);
  });

  it('adds nothing on a second pass over its own output', () => {
    const first = addToFirstStatement(source, 'Replace A.');
    const second = addToFirstStatement(first.output, 'Replace A.');

    assert.equal(second.inserted, false);
    assert.equal(second.output, first.output);
  });

  it('adds a different text for the same rule on the same node', () => {
    const first = addToFirstStatement(source, 'Replace A.');
    const second = addToFirstStatement(first.output, 'Replace B.');

    assert.equal(second.inserted, true);
    assert.equal(second.output.match(/TODO\(handsontable-codemod/g).length, 2);
  });

  it('keeps an existing leading comment', () => {
    const { output } = addToFirstStatement(`// header\n${source}`, 'Replace A.');

    assert.match(output, /\/\/ header\n/);
    assert.match(output, /TODO\(handsontable-codemod r\/x\)/);
  });
});

describe('addCssTodo', () => {
  /**
   * Insert a TODO before the first declaration and print the result.
   *
   * @param {string} css Source text.
   * @param {string} text TODO text.
   * @returns {{output: string, inserted: boolean}} The printed code and whether a comment was added.
   */
  function addToFirstDeclaration(css, text) {
    const root = postcss.parse(css);
    let inserted = false;

    root.walkDecls('color', (declaration) => {
      inserted = addCssTodo(declaration, 'r/x', text) || inserted;
    });

    return { output: root.toString(), inserted };
  }

  const source = 'a {\n  color: red;\n}\n';

  it('inserts a block comment before the node', () => {
    const { output, inserted } = addToFirstDeclaration(source, 'Check it.');

    assert.equal(inserted, true);
    assert.equal(output, 'a {\n  /* TODO(handsontable-codemod r/x): Check it. */\n  color: red;\n}\n');
  });

  it('adds nothing on a second pass over its own output', () => {
    const first = addToFirstDeclaration(source, 'Check it.');
    const second = addToFirstDeclaration(first.output, 'Check it.');

    assert.equal(second.inserted, false);
    assert.equal(second.output, first.output);
  });
});

describe('lineOf', () => {
  it('reads the line of a js node, a path, and a postcss node', () => {
    const j = jscodeshift.withParser('ts');
    const path = j('\n\nconst x = 1;').find(j.VariableDeclaration).paths()[0];
    const declaration = postcss.parse('a {\n  color: red;\n}').first.first;

    assert.equal(lineOf(path), 3);
    assert.equal(lineOf(path.node), 3);
    assert.equal(lineOf(declaration), 2);
    assert.equal(lineOf({}), null);
  });
});
