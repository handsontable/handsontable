import postcss from 'postcss';
import { enclosingAnchor } from './anchor.mjs';

/**
 * Prefix of every comment this tool leaves behind.
 */
export const TODO_PREFIX = 'TODO(handsontable-codemod';

/**
 * Longest TODO text, in characters, before the guide link.
 */
export const TODO_MAX_LENGTH = 100;

/**
 * A sentence shorter than this takes the next sentence along, so "Removed in 18.0." does not stand alone.
 */
const SHORT_SENTENCE = 40;

/**
 * Split text into sentences. A sentence ends with `.`, `!`, or `?` followed by white space, so a version such as
 * `18.0` or a dotted name such as `Handsontable.helper` stays whole.
 *
 * @param {string} text Text on one line.
 * @returns {string[]} The sentences, trimmed.
 */
function sentencesOf(text) {
  return text.split(/(?<=[.!?])\s+/).map(sentence => sentence.trim()).filter(Boolean);
}

/**
 * Cut advice down to what fits in a code comment: the first sentence, plus the next one while the first is very
 * short and both fit. A longer sentence is cut at a word boundary and ends with `...`. The text is flattened to
 * one line. The full advice stays in the report entry.
 *
 * @param {string} text The advice.
 * @param {number} [max] Longest result in characters.
 * @returns {string} One short line that ends with a full stop, a question mark, an exclamation mark, or `...`.
 */
export function shortenAdvice(text, max = TODO_MAX_LENGTH) {
  const sentences = sentencesOf(String(text).replace(/\s*\r?\n\s*/g, ' ').trim());
  let short = sentences[0] ?? '';

  for (let next = 1; short.length < SHORT_SENTENCE && next < sentences.length
    && short.length + 1 + sentences[next].length <= max; next += 1) {
    short = `${short} ${sentences[next]}`;
  }

  if (short.length > max) {
    const cut = short.slice(0, max - 3);
    const space = cut.lastIndexOf(' ');

    short = `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:.]+$/, '')}...`;
  }

  return /[.!?]$/.test(short) || short === '' ? short : `${short}.`;
}

/**
 * Build the text of a TODO comment, without comment delimiters: the marker, the rule id, the first sentence of the
 * advice, and the guide link when there is one.
 *
 * @param {string} ruleId Id of the rule that asks for the follow-up.
 * @param {string} text What the user has to do. Only its first sentence is kept.
 * @param {string|null} [guideUrl] Link to the guide section, or `null` for none.
 * @returns {string} For example `TODO(handsontable-codemod 18.0.0/x): Replace this. See https://...#anchor`.
 */
export function formatTodo(ruleId, text, guideUrl = null) {
  return `${TODO_PREFIX} ${ruleId}): ${shortenAdvice(text)}${guideUrl ? ` See ${guideUrl}` : ''}`;
}

/**
 * A comment of the tool that a call wrote into the tree, kept so a later twin of the rule can restate its text.
 *
 * @typedef {object} WrittenComment
 * @property {{value: string}} comment The comment node.
 * @property {boolean} block `true` for a JSX block comment, `false` for a `//` line.
 */

const COMMENT_KEYS = new Set(['comments', 'leadingComments', 'trailingComments', 'innerComments']);

/**
 * What the TODO writers need to find a comment that an earlier run left in front of a node: the text of the part
 * and a lazy list of the comments the parser found in it.
 *
 * @typedef {object} CommentScan
 * @property {string} source Text of the part that was parsed.
 * @property {() => Array<{value: string, start?: number, end?: number}>} comments Every comment of the part, as
 * the parser attached it.
 */

/**
 * Every comment of a parsed JavaScript file, wherever the parser attached it (leading, trailing, or inside an
 * empty JSX expression). The same comment can be reachable twice, so the list is deduplicated by position.
 *
 * @param {object} file The `File` node of the parsed source.
 * @returns {Array<{value: string, start?: number, end?: number}>} The comments.
 */
export function collectComments(file) {
  const found = new Map();
  const seen = new Set();
  const visit = (value) => {
    if (!value || typeof value !== 'object' || seen.has(value)) {
      return;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach(visit);

      return;
    }

    for (const key of Object.keys(value)) {
      if (key === 'loc' || key === 'original' || key === 'tokens') {
        continue;
      }

      if (COMMENT_KEYS.has(key)) {
        (value[key] ?? []).forEach((comment) => {
          found.set(Number.isInteger(comment.start) ? comment.start : comment, comment);
        });
      } else {
        visit(value[key]);
      }
    }
  };

  visit(file);

  return [...found.values()];
}

/**
 * The text between the end of a comment and the start of a node. The offsets of a node are offsets in the text recast
 * handed to the parser, which joins the lines with the platform's line terminator and turns leading tabs into spaces,
 * so on Windows, or in a file indented with tabs, they are not offsets of the original text. The `Lines` object that
 * recast keeps for the parse reads the same text by line and column, which are right in both. The original text is the
 * fallback for a node that has no such object.
 *
 * @param {{loc?: object, end?: number}} comment A comment with source offsets.
 * @param {{loc?: object, start?: number}} node A node with a source offset.
 * @param {string} source Original text of the part.
 * @returns {string} The text in between.
 */
function textBetween(comment, node, source) {
  const lines = node.loc?.lines;

  if (lines && comment.loc?.end && node.loc?.start) {
    return lines.sliceString(comment.loc.end, node.loc.start);
  }

  return source.slice(comment.end, node.start);
}

/**
 * Whether a comment sits directly in front of a node: nothing but white space, commas, other comments, and a closing
 * `}` (the end of a JSX comment container) lies between them in the source. Where the parser attached the comment (to the node,
 * to the property before it, or to the one after) does not matter.
 *
 * @param {{start?: number, end?: number}} comment A comment with source offsets.
 * @param {{start?: number}} node A node with a source offset.
 * @param {string} source Text both offsets refer to.
 * @returns {boolean} `true` when the comment is the one right before the node.
 */
function sitsBefore(comment, node, source) {
  if (!Number.isInteger(comment.end) || !Number.isInteger(node.start) || comment.end > node.start) {
    return false;
  }

  // Several markers stand in a row in front of one node, so the comments in between do not count.
  return /^[\s,}]*$/.test(textBetween(comment, node, source).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ''));
}

/**
 * Whether the same TODO already stands in front of a node, either on the node or anywhere the parser may have
 * attached it. Offsets only exist for nodes from the original parse: a node the run built has none, and only its own
 * comments count.
 *
 * @param {object} node An AST node.
 * @param {string} body Text of the comment, as `formatTodo()` builds it.
 * @param {CommentScan|null} scan The part's comments, or `null` to look at the node only.
 * @returns {boolean} `true` when a comment with this text is already there.
 */
function hasTodo(node, body, scan) {
  if ((node.comments ?? []).some(comment => comment.value.trim() === body)) {
    return true;
  }

  return Boolean(scan) && scan.comments()
    .some(comment => comment.value.trim() === body && sitsBefore(comment, node, scan.source));
}

/**
 * Whether an earlier run, or the user, left the same TODO in front of a node of the original parse. Unlike
 * `hasJsTodo()` it ignores the comments this run inserts, so a marker that this run wrote for one spot never stands in
 * for another spot of the same rule further down.
 *
 * @param {object} node An AST node.
 * @param {string} ruleId Id of the rule that asks for the follow-up.
 * @param {string} text What the user has to do.
 * @param {string|null} guideUrl Link to the guide section, or `null` for none.
 * @param {CommentScan|null} scan The part's comments as the parser attached them.
 * @returns {boolean} `true` when the source already had a comment with this text in front of the node.
 */
export function hasEarlierTodo(node, ruleId, text, guideUrl, scan) {
  const body = formatTodo(ruleId, text, guideUrl);

  return Boolean(scan) && scan.comments()
    .some(comment => comment.value.trim() === body && sitsBefore(comment, node, scan.source));
}

/**
 * Whether a node carries the TODO of one of the twin rules of a rule: a comment in front of it, from this run or from
 * the source, that starts with `TODO(handsontable-codemod <twin id>)`. The twin is named by the rule's data, so the text
 * after the id does not matter.
 *
 * @param {object} node An AST node.
 * @param {string[]} twinIds Ids of the earlier rules that report the same spot.
 * @param {CommentScan|null} scan The part's comments, or `null` to look at the node only.
 * @returns {boolean} `true` when a twin's comment is in front of the node.
 */
export function hasTwinTodo(node, twinIds, scan) {
  const isTwin = comment => twinIds.some(id => comment.value.trim().startsWith(`${TODO_PREFIX} ${id}):`));

  return (node.comments ?? []).some(isTwin)
    || (Boolean(scan) && scan.comments().some(comment => isTwin(comment) && sitsBefore(comment, node, scan.source)));
}

/**
 * Whether the source already holds a TODO of one rule in front of a node, whatever follows the id. A rule can word
 * one spot two ways across runs: a chained run may restate the text of a TODO with the text of a later twin (see
 * `restateTodo()`), and an edit of the first run (a deleted key, a spread object) can make the next run take the same
 * object for another kind of holder, which has its own text. The rule marks a site once, so the next run must still
 * find the comment. Only comments of the source count, never one the current run wrote, so two different spots of one
 * rule that share a statement keep one comment each.
 *
 * @param {object} node An AST node.
 * @param {string} ruleId Id of the rule.
 * @param {CommentScan|null} scan The part's comments, or `null` for none.
 * @returns {boolean} `true` when a comment of the rule from an earlier run is in front of the node.
 */
export function hasEarlierRuleTodo(node, ruleId, scan) {
  return Boolean(scan) && scan.comments().some(comment => comment.value.trim().startsWith(`${TODO_PREFIX} ${ruleId}):`)
    && sitsBefore(comment, node, scan.source));
}

const JSX_TARGETS = new Set(['JSXElement', 'JSXOpeningElement']);
const JSX_PARENTS = new Set(['JSXElement', 'JSXFragment']);
const CLIMB_STOPS = /^(?:Program|File)$|(?:Statement|Declaration)$/;

/**
 * Most lines a statement may start above a JSX element for a line comment on the statement to count as "next to
 * the element".
 */
const NEAR_STATEMENT_LINES = 3;

/**
 * Find the list of JSX children that holds an element, or an expression that holds it (`{cond && <X />}`,
 * `{items.map(() => <X />)}`), so a JSX comment can go in front of it.
 *
 * @param {object} elementPath NodePath of the `JSXElement`.
 * @returns {{parent: object, child: object}|null} The parent element or fragment and its child that holds the
 * element, or `null` when a statement lies in between (a `return`, a declaration) or there is no JSX parent.
 */
function jsxChildSite(elementPath) {
  for (let current = elementPath; current.parent; current = current.parent) {
    const parent = current.parent.node;

    if (JSX_PARENTS.has(parent.type) && parent.children.includes(current.node)) {
      return { parent, child: current.node };
    }

    if (CLIMB_STOPS.test(parent.type)) {
      return null;
    }
  }

  return null;
}

/**
 * Whether a JSX child is a comment-only container that already says what `body` says.
 *
 * @param {object|undefined} child A JSX child node.
 * @param {string} body Text of the comment.
 * @returns {boolean} `true` for `{/* body *\/}`.
 */
function isTodoContainer(child, body) {
  return child?.type === 'JSXExpressionContainer' && child.expression.type === 'JSXEmptyExpression'
    && (child.expression.comments ?? []).some(comment => comment.value.trim() === body);
}

/**
 * The comment-only containers in the run right in front of a JSX child, nearest first. Several markers of one element
 * stand in a row, and blank text between them does not end the run.
 *
 * @param {object} parent The `JSXElement` or `JSXFragment` that holds the child.
 * @param {number} index Index of the child in `parent.children`.
 * @returns {object[]} The containers.
 */
function commentRunBefore(parent, index) {
  const isBlank = child => child?.type === 'JSXText' && child.value.trim() === '';
  const isComment = child => child?.type === 'JSXExpressionContainer' && child.expression.type === 'JSXEmptyExpression';
  const run = [];

  for (const child of parent.children.slice(0, index).reverse()) {
    if (isBlank(child)) {
      continue;
    }

    if (!isComment(child)) {
      break;
    }

    run.push(child);
  }

  return run;
}

/**
 * Leave a TODO in front of a JSX element: a JSX comment `{/* ... *\/}` when the element is (or sits inside an
 * expression that is) a child of another element, so it lands right before the element. For an element that is a
 * statement's value, a `//` comment on the enclosing statement when that statement starts at most three lines above
 * the element, else a `//` comment on the element's first attribute, which is legal inside a tag. When the element has
 * no attribute, the comment goes on the statement whatever its distance.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} path NodePath of a `JSXElement` or its `JSXOpeningElement`.
 * @param {string} body Text of the comment, as `formatTodo()` builds it.
 * @param {CommentScan|null} scan The part's comments.
 * @param {WrittenComment[]|null} sink Receives the comment this call writes.
 * @returns {boolean} `true` when a comment was inserted.
 */
function addJsxTodo(j, path, body, scan, sink) {
  const elementPath = path.node.type === 'JSXOpeningElement' ? path.parent : path;
  const site = jsxChildSite(elementPath);

  if (site) {
    const { parent, child } = site;
    const index = parent.children.indexOf(child);

    if (hasTodo(child, body, scan) || commentRunBefore(parent, index).some(item => isTodoContainer(item, body))) {
      return false;
    }

    const empty = j.jsxEmptyExpression();
    const spacer = parent.children[index - 1];
    const indent = spacer?.type === 'JSXText' ? spacer.value.slice(spacer.value.lastIndexOf('\n')) : '';

    empty.comments = [j.commentBlock(` ${body.replace(/\*\//g, '* /')} `, false, true)];
    sink?.push({ comment: empty.comments[0], block: true });
    parent.children.splice(index, 0, j.jsxExpressionContainer(empty), ...(/^\n[ \t]*$/.test(indent)
      ? [j.jsxText(indent)] : []));

    return true;
  }

  const statement = enclosingAnchor(elementPath);
  const line = elementPath.node.loc?.start.line;
  const near = !line || !statement.loc || line - statement.loc.start.line <= NEAR_STATEMENT_LINES;
  const attribute = elementPath.node.openingElement.attributes[0];

  return insertLineComment(j, near || !attribute ? statement : attribute, body, scan, sink);
}

/**
 * A comment that talks about the next line of code: an eslint, stylelint, or tslint next-line directive, a TypeScript
 * `@ts-expect-error` or `@ts-ignore`, `prettier-ignore`, `biome-ignore`, `deno-lint-ignore`, and a coverage ignore. A
 * comment of the tool between such a directive and its line would take the directive's place, so the tool's comment goes
 * above the run of them.
 */
const NEXT_LINE_DIRECTIVE = new RegExp('^\\s*(?:(?:eslint|oxlint|stylelint)-disable-next-line|tslint:disable-next-line'
  + '|@ts-expect-error|@ts-ignore|prettier-ignore|biome-ignore|deno-lint-ignore|(?:istanbul|c8|v8) ignore)(?![\\w-])');

/**
 * Whether a line of source is one comment, a `//` line or a one-line block, that is a next-line directive (see
 * `NEXT_LINE_DIRECTIVE`).
 *
 * @param {string} line A line of text, without its terminator.
 * @returns {boolean} `true` for a line that holds only such a comment.
 */
export function isDirectiveLine(line) {
  const text = /^\s*(?:\/\/(.*)|\/\*(.*)\*\/)\s*$/.exec(line);

  return text !== null && NEXT_LINE_DIRECTIVE.test(text[1] ?? text[2]);
}

/**
 * Where a new comment goes in the comments of a node: after the leading ones and before a trailing one, and above the
 * run of next-line directives that ends the leading ones (see `NEXT_LINE_DIRECTIVE`).
 *
 * @param {object[]} comments The comments of the node, leading ones first.
 * @returns {number} The index to insert at.
 */
function insertionIndex(comments) {
  const trailing = comments.findIndex(comment => comment.trailing === true);
  let at = trailing === -1 ? comments.length : trailing;

  while (at > 0 && NEXT_LINE_DIRECTIVE.test(comments[at - 1].value)) {
    at -= 1;
  }

  return at;
}

/**
 * The comments this run wrote into a tree as `//` lines, so `MarkerCarriers` can tell them from the comments of the
 * file when it moves them out of the tree.
 */
const TOOL_COMMENTS = new WeakSet();

/**
 * Whether a comment node is one this run wrote with `addJsTodo()` (a `//` line before a node), as against a comment of
 * the file or a JSX comment.
 *
 * @param {object} comment A comment node.
 * @returns {boolean} `true` for a comment of the tool.
 */
export function isToolComment(comment) {
  return TOOL_COMMENTS.has(comment);
}

/**
 * Add a `//` comment before a node, after its leading comments and before a trailing one, unless the same
 * comment is already in front of it.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} node An AST node.
 * @param {string} body Text of the comment, as `formatTodo()` builds it.
 * @param {CommentScan|null} scan The part's comments.
 * @param {WrittenComment[]|null} [sink] Receives the comment this call writes.
 * @returns {boolean} `true` when a comment was inserted.
 */
function insertLineComment(j, node, body, scan, sink = null) {
  if (hasTodo(node, body, scan)) {
    return false;
  }

  node.comments = node.comments ?? [];

  const comment = j.commentLine(` ${body}`, true, false);

  TOOL_COMMENTS.add(comment);
  sink?.push({ comment, block: false });

  // The TODO goes after the leading comments and before a trailing one, so a note at the end of the line stays there.
  // A directive for the next line keeps that line: the TODO goes above it.
  node.comments.splice(insertionIndex(node.comments), 0, comment);

  return true;
}

/**
 * Whether the TODO that `addJsTodo()` would leave is already in front of a node, or, for a JSX element, where it would
 * put it (a JSX comment before the element, or a line comment on its statement or first attribute).
 *
 * @param {object} target An AST node or a NodePath.
 * @param {string} ruleId Id of the rule that asks for the follow-up.
 * @param {string} text What the user has to do.
 * @param {string|null} [guideUrl] Link to the guide section, or `null` for none.
 * @param {CommentScan|null} [scan] The part's comments.
 * @returns {boolean} `true` when the comment is already there.
 */
export function hasJsTodo(target, ruleId, text, guideUrl = null, scan = null) {
  const node = target.node ?? target;
  const body = formatTodo(ruleId, text, guideUrl);

  if (!(target.node && JSX_TARGETS.has(node.type))) {
    return hasTodo(node, body, scan);
  }

  const elementPath = node.type === 'JSXOpeningElement' ? target.parent : target;
  const site = jsxChildSite(elementPath);

  if (site) {
    const index = site.parent.children.indexOf(site.child);

    // Several markers of one element stand in a row, so the run of comment containers in front of it is searched, not
    // just the nearest one. `addJsxTodo()` searches the same run.
    return hasTodo(site.child, body, scan)
      || commentRunBefore(site.parent, index).some(item => isTodoContainer(item, body));
  }

  const statement = enclosingAnchor(elementPath);
  const attribute = elementPath.node.openingElement.attributes[0];

  return hasTodo(statement, body, scan) || (Boolean(attribute) && hasTodo(attribute, body, scan));
}

/**
 * Leave a TODO comment before a JavaScript or TypeScript AST node, unless the same comment is already in front
 * of it. This module and `addCssTodo` write TODO comments into a tree. `MarkerCarriers` places the same text after
 * printing, for an untouched array element or statement.
 *
 * The comment is a `//` line comment before the node. A NodePath of a `JSXElement` or `JSXOpeningElement` gets a JSX
 * comment next to the element instead (see `addJsxTodo`).
 *
 * @param {object} j The jscodeshift API.
 * @param {object} target An AST node or a NodePath.
 * @param {string} ruleId Id of the rule that asks for the follow-up.
 * @param {string} text What the user has to do. Only its first sentence is kept.
 * @param {string|null} [guideUrl] Link to the guide section, or `null` for none.
 * @param {CommentScan|null} [scan] The part's comments, so a comment that the parser attached to a neighboring node
 * on the previous run is still found.
 * @param {WrittenComment[]|null} [sink] Receives the comment this call writes, for `restateTodo()`.
 * @returns {boolean} `true` when a comment was inserted, `false` when an identical one was already there.
 */
export function addJsTodo(j, target, ruleId, text, guideUrl = null, scan = null, sink = null) {
  const node = target.node ?? target;
  const body = formatTodo(ruleId, text, guideUrl);

  if (target.node && JSX_TARGETS.has(node.type)) {
    return addJsxTodo(j, target, body, scan, sink);
  }

  return insertLineComment(j, node, body, scan, sink);
}

/**
 * Give a comment that `addJsTodo()` wrote in this run another text. A chained run does it when a later twin of the
 * rule reports the same spot: the comment keeps the id and the link of the earlier rule and says what the later one
 * says.
 *
 * @param {WrittenComment} written The comment, from the `sink` of `addJsTodo()`.
 * @param {string} body Text of the comment, as `formatTodo()` builds it.
 * @returns {void}
 */
export function restateTodo(written, body) {
  written.comment.value = written.block ? ` ${body.replace(/\*\//g, '* /')} ` : ` ${body}`;
}

/**
 * Leave a block comment before a postcss node, unless the node is already preceded by the same comment. A
 * block comment is valid in CSS and in SCSS.
 *
 * @param {object} target A postcss node (a declaration, rule, or at-rule) that has a parent.
 * @param {string} ruleId Id of the rule that asks for the follow-up.
 * @param {string} text What the user has to do. Only its first sentence is kept.
 * @param {string|null} [guideUrl] Link to the guide section, or `null` for none.
 * @param {import('./css-edit.mjs').CssDocument|null} [document] The part's document, which splices the comment into
 * the original text. Without one, only the postcss model gets the comment.
 * @param {string[]} [twinIds] Ids of the earlier rules that report the same spot. A comment of one of them in front of
 * the node counts as this comment (see `hasTwinTodo()`).
 * @returns {boolean} `true` when a comment was inserted, `false` when an identical one was already there.
 */
export function addCssTodo(target, ruleId, text, guideUrl = null, document = null, twinIds = []) {
  // A `*/` in the advice would end the block comment early, and what follows would be CSS. A second run reads the
  // comment as written, so the same text is compared and inserted.
  const body = formatTodo(ruleId, text, guideUrl).replace(/\*\//g, '* /');
  const isTwin = comment => twinIds.some(id => comment.startsWith(`${TODO_PREFIX} ${id}):`));

  // Two rules can leave a comment before one node, so look through the whole run of comments right before it.
  for (let previous = target.prev(); previous?.type === 'comment'; previous = previous.prev()) {
    if (previous.text.trim() === body || isTwin(previous.text.trim())) {
      return false;
    }
  }

  // A directive for the next line (`stylelint-disable-next-line`, `prettier-ignore`) keeps that line: the TODO goes
  // above the run of them.
  let anchor = target;

  for (let previous = target.prev(); previous?.type === 'comment' && NEXT_LINE_DIRECTIVE.test(previous.text);
    previous = previous.prev()) {
    anchor = previous;
  }

  if (document) {
    document.insertCommentBefore(anchor, body);
  } else {
    anchor.before(postcss.comment({ text: body }));
  }

  return true;
}

/**
 * Line number of a js node or a postcss node, or `null` when it has none.
 *
 * @param {object} target An AST node, a NodePath, or a postcss node.
 * @returns {number|null} One-based line.
 */
export function lineOf(target) {
  const node = target?.node ?? target;

  return node?.loc?.start?.line ?? node?.source?.start?.line ?? null;
}
