/**
 * The bytes of a string or template literal that a run did not edit must come out as they went in.
 *
 * recast keeps the text of a node no transform touched, and that holds for a literal that sits on one line. A
 * literal that spans lines does not hold up when its parent is printed again: recast copies the original lines of an
 * untouched template literal into the new layout, slices them (a slice drops the lock that keeps the indentation of
 * a template literal's own lines, and the original lines never had one), and indents them with the line they now
 * stand in. A one-line object that gets a key moved is printed over several lines, so the continuation lines of a
 * template inside it gain indentation, and the string the template builds changes. The same goes for a string with a
 * line continuation, a JSX attribute string, a tagged template, and a template nested in a `${}`.
 *
 * `guardLiterals()` is the check behind that promise. It reads the literals that the final tree holds before the
 * part is printed, reads them again from the printed text with a plain parser, and puts the intended text back by
 * range wherever the two differ. It throws when a literal is missing or added, or when the repair does not hold, so
 * `transformFile()` reports a `transform-error` and leaves the file alone.
 */
import babylonParser from 'jscodeshift/parser/babylon.js';
import tsParser from 'jscodeshift/parser/ts.js';
import tsxParser from 'jscodeshift/parser/tsx.js';

const PARSERS = { babylon: babylonParser, ts: tsParser, tsx: tsxParser };
const TERMINATORS = /\r\n|[\r\n\u2028\u2029]/g;
const HAS_TERMINATOR = /[\r\n\u2028\u2029]/;
/**
 * A terminator that a recast `Lines` slice cannot give back as it was: it turns every kind into `\n`.
 */
const EXOTIC_TERMINATOR = /\r(?!\n)|[\u2028\u2029]/;
const SKIPPED_KEYS = new Set([
  'loc', 'range', 'tokens', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments', 'original',
]);

/**
 * @typedef {object} Literal
 * @property {'template'|'string'} kind What the literal is.
 * @property {string} text Raw text, line terminators written as `\n`. A string literal includes its quotes.
 */

/**
 * @typedef {Literal & {start: number, end: number}} PrintedLiteral
 */

/**
 * The text of a node as the original source had it, tabs and all. recast parses a copy of the source with the
 * leading tabs of every line turned into spaces, so the `raw` of a template literal that has a continuation line
 * indented with a tab does not hold the tab. The `Lines` object the parse keeps still does. A line terminator comes
 * back as `\n`.
 *
 * @param {object} node A node of the tree that recast parsed, with its `loc`.
 * @returns {string|null} The original text, or `null` for a node that has no location.
 */
function sourceText(node) {
  const { loc } = node;

  if (!loc?.lines) {
    return null;
  }

  return loc.lines.slice(loc.start, loc.end).toString({ lineTerminator: '\n', reuseWhitespace: true });
}

/**
 * The raw text of a `TemplateElement` that a print should produce. A transform that edited `value.raw` made its own
 * text, so that text stands. An element nobody edited is read from the original source, because its `raw` has lost
 * the tabs of its continuation lines.
 *
 * @param {object} node A `TemplateElement`.
 * @returns {string} The intended raw text. Line terminators are `\n` in an original one.
 */
export function templateRaw(node) {
  const { raw } = node.value;

  return node.original?.value?.raw === raw ? (sourceText(node) ?? raw) : raw;
}

/**
 * The raw text, quotes included, of a string literal that a print should produce. See `templateRaw()`.
 *
 * @param {object} node A `StringLiteral`, or a `Literal` with a string value.
 * @returns {string|null} The intended raw text, or `null` when the node has none (a node a transform built from a
 * value alone, which recast prints on one line).
 */
export function stringRaw(node) {
  const raw = node.extra?.raw ?? node.raw;

  if (typeof raw !== 'string') {
    return null;
  }

  const old = node.original;

  return old && (old.extra?.raw ?? old.raw) === raw ? (sourceText(node) ?? raw) : raw;
}

/**
 * Call `visit` for every node below a node, in field order.
 *
 * @param {*} value A node, an array, or anything else.
 * @param {(node: object) => void} visit Called with each node.
 * @returns {void}
 */
function walk(value, visit) {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(item => walk(item, visit));

    return;
  }

  if (typeof value.type === 'string') {
    visit(value);
  }

  for (const key of Object.keys(value)) {
    if (!SKIPPED_KEYS.has(key)) {
      walk(value[key], visit);
    }
  }
}

/**
 * Normalize the line terminators of a text to `\n`.
 *
 * @param {string} text Text.
 * @returns {string} The text.
 */
function normalize(text) {
  return text.replace(TERMINATORS, '\n');
}

/**
 * The literals that span lines in the final tree of a part, with the text each should have in the printed file. A
 * literal on one line cannot be re-indented, so it is left out, which also leaves out the elements a carrier holds.
 *
 * @param {import('../types.mjs').Part} part A `js` part, after every transform and marker.
 * @returns {Literal[]} The literals, in the order of the tree.
 */
export function intendedLiterals(part) {
  const found = [];

  walk(part.root.paths()[0].node, (node) => {
    let literal = null;

    if (node.type === 'TemplateElement') {
      literal = { kind: 'template', text: templateRaw(node) };
    } else if (node.type === 'StringLiteral' || (node.type === 'Literal' && typeof node.value === 'string')) {
      const raw = stringRaw(node);

      literal = raw === null ? null : { kind: 'string', text: raw };
    }

    if (literal && HAS_TERMINATOR.test(literal.text)) {
      found.push({ ...literal, text: normalize(literal.text) });
    }
  });

  return found;
}

/**
 * Read the literals that span lines from printed text, with their offsets, using a plain parser. recast is not
 * involved, so offsets are offsets of the text it gets.
 *
 * @param {'babylon'|'ts'|'tsx'} parser Parser name.
 * @param {string} text Printed text.
 * @returns {PrintedLiteral[]} The literals, in the order of the text.
 * @throws {Error} When the text does not parse.
 */
export function printedLiterals(parser, text) {
  const found = [];

  walk(PARSERS[parser]().parse(text), (node) => {
    if (node.type === 'TemplateElement' || node.type === 'StringLiteral') {
      const raw = text.slice(node.start, node.end);

      if (HAS_TERMINATOR.test(raw)) {
        found.push({
          kind: node.type === 'TemplateElement' ? 'template' : 'string',
          start: node.start,
          end: node.end,
          text: raw,
        });
      }
    }
  });

  return found.sort((a, b) => a.start - b.start);
}

/**
 * Group literals by what they say apart from white space, so a literal is found again wherever its indentation went.
 *
 * @param {Literal[]} literals The literals.
 * @returns {Map<string, Literal[]>} The literals of each key, in order.
 */
function groupByContent(literals) {
  const groups = new Map();

  for (const literal of literals) {
    const key = `${literal.kind}:${normalize(literal.text).replace(/\s+/g, '')}`;

    groups.set(key, [...groups.get(key) ?? [], literal]);
  }

  return groups;
}

/**
 * Compare the intended literals with the printed ones and say what to write back.
 *
 * @param {Literal[]} intended What the tree holds.
 * @param {PrintedLiteral[]} printed What the text holds.
 * @returns {Array<{start: number, end: number, text: string}>} The repairs, with the intended text.
 * @throws {Error} When a literal is missing or added, or when two literals say the same but spell it differently and
 * the printed ones do not match in order, because then the pairing would be a guess.
 */
function plan(intended, printed) {
  const wanted = groupByContent(intended);
  const actual = groupByContent(printed);
  const repairs = [];

  for (const key of new Set([...wanted.keys(), ...actual.keys()])) {
    const should = wanted.get(key) ?? [];
    const are = actual.get(key) ?? [];

    if (should.length !== are.length) {
      throw new Error('a string or template literal was lost or added while printing');
    }

    const ambiguous = should.some(literal => literal.text !== should[0].text);

    are.forEach((literal, index) => {
      const target = should[index].text;

      if (normalize(literal.text) === target) {
        return;
      }

      if (ambiguous) {
        throw new Error('a string or template literal changed while printing and cannot be matched to its source');
      }

      repairs.push({ start: literal.start, end: literal.end, text: target });
    });
  }

  return repairs;
}

/**
 * Check the printed text of a part against the literals of its tree, and repair a literal that printing changed.
 *
 * @param {object} options Options.
 * @param {'babylon'|'ts'|'tsx'} options.parser Parser name of the part.
 * @param {Literal[]} options.intended The result of `intendedLiterals()`, taken before printing.
 * @param {string} options.text The printed text, carriers spliced in.
 * @param {string} options.source Original text of the part.
 * @param {string} options.lineTerminator Line terminator of the part.
 * @param {boolean} [options.repair] `false` makes a difference an error, for a text that must already be right.
 * @returns {{text: string, literals: PrintedLiteral[]}} The text with every literal as intended, and the literals of
 * that text with their offsets.
 * @throws {Error} When the text does not parse, a literal is missing or added, or a repair does not hold.
 */
export function guardLiterals({ parser, intended, text, source, lineTerminator, repair = true }) {
  const literals = printedLiterals(parser, text);
  const repairs = plan(intended, literals);

  if (repairs.length === 0) {
    return { text, literals };
  }

  // A `Lines` slice gives every line terminator back as `\n`, so a source with another kind cannot be repaired.
  if (!repair || EXOTIC_TERMINATOR.test(source)) {
    throw new Error('a string or template literal changed while printing');
  }

  let repaired = text;

  for (const { start, end, text: wanted } of repairs.sort((a, b) => b.start - a.start)) {
    repaired = repaired.slice(0, start) + wanted.replace(/\n/g, lineTerminator) + repaired.slice(end);
  }

  const again = printedLiterals(parser, repaired);

  if (plan(intended, again).length > 0) {
    throw new Error('a string or template literal could not be restored after printing');
  }

  return { text: repaired, literals: again };
}

/**
 * The lines of a text that begin inside a literal, as indexes of `text.split(lineTerminator)`. White space at the
 * start of such a line is part of the string, so no indentation fix may touch it.
 *
 * @param {string} text The text.
 * @param {PrintedLiteral[]} literals The literals of the text.
 * @param {string} lineTerminator Line terminator of the text.
 * @returns {Set<number>} The line indexes.
 */
export function linesInsideLiterals(text, literals, lineTerminator) {
  const starts = [0];
  let at = text.indexOf(lineTerminator);

  while (at !== -1) {
    starts.push(at + lineTerminator.length);
    at = text.indexOf(lineTerminator, at + lineTerminator.length);
  }

  const inside = new Set();

  starts.forEach((start, index) => {
    if (literals.some(literal => literal.start < start && start < literal.end)) {
      inside.add(index);
    }
  });

  return inside;
}
