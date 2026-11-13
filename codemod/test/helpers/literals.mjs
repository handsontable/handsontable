import babylonParser from 'jscodeshift/parser/babylon.js';
import tsParser from 'jscodeshift/parser/ts.js';
import tsxParser from 'jscodeshift/parser/tsx.js';
import { extname } from 'node:path';

const PARSERS = { babylon: babylonParser, ts: tsParser, tsx: tsxParser };
const LINE_BREAKS = /\r\n|[\r\n\u2028\u2029]/g;

/**
 * The jscodeshift parser name for a file name, the same choice the js adapter makes.
 *
 * @param {string} filePath File name.
 * @returns {'babylon'|'ts'|'tsx'} Parser name.
 */
export function parserOf(filePath) {
  const extension = extname(filePath).toLowerCase();

  if (extension === '.tsx') {
    return 'tsx';
  }

  return ['.ts', '.mts', '.cts'].includes(extension) ? 'ts' : 'babylon';
}

/**
 * Walk a Babel AST and call `visit` on every node, in field order. It is a plain walk with no recast in the way, so
 * offsets are offsets of the real text.
 *
 * @param {object} node A Babel node.
 * @param {(node: object) => void} visit Callback.
 * @returns {void}
 */
function walk(node, visit) {
  if (!node || typeof node !== 'object') {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach(item => walk(item, visit));

    return;
  }

  if (typeof node.type === 'string') {
    visit(node);
  }

  for (const key of Object.keys(node)) {
    if (!['loc', 'tokens', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments']
      .includes(key)) {
      walk(node[key], visit);
    }
  }
}

/**
 * The source text of every template literal element and every string literal that spans lines, in the order the
 * parser finds them, with line terminators written as `\n`. A `TemplateElement` is its raw text, a string literal
 * is its raw text with quotes. These are the values a reprint must never change.
 *
 * @param {string} text File text.
 * @param {'babylon'|'ts'|'tsx'} parser Parser name.
 * @returns {string[]} The texts.
 */
export function multilineLiterals(text, parser) {
  const found = [];

  walk(PARSERS[parser]().parse(text), (node) => {
    if (node.type === 'TemplateElement' || node.type === 'StringLiteral') {
      const raw = text.slice(node.start, node.end).replace(LINE_BREAKS, '\n');

      if (raw.includes('\n')) {
        found.push(raw);
      }
    }
  });

  return found;
}

/**
 * The cooked value of every template literal, with `${}` where an expression stands, in the order the parser finds
 * them. Two files whose lists are equal build the same strings at run time.
 *
 * @param {string} text File text.
 * @param {'babylon'|'ts'|'tsx'} parser Parser name.
 * @returns {string[]} One entry per template literal.
 */
export function cookedTemplates(text, parser) {
  const found = [];

  walk(PARSERS[parser]().parse(text), (node) => {
    if (node.type === 'TemplateLiteral') {
      found.push(node.quasis.map(quasi => quasi.value.cooked).join('${}'));
    }
  });

  return found;
}

/**
 * The values of the string literals that span lines (a line continuation, or a JSX attribute), in parse order.
 *
 * @param {string} text File text.
 * @param {'babylon'|'ts'|'tsx'} parser Parser name.
 * @returns {string[]} The cooked values.
 */
export function multilineStringValues(text, parser) {
  const found = [];

  walk(PARSERS[parser]().parse(text), (node) => {
    if (node.type === 'StringLiteral' && /[\r\n\u2028\u2029]/.test(text.slice(node.start, node.end))) {
      found.push(node.value);
    }
  });

  return found;
}
