/**
 * Edits that recast would lay out again, made as text after printing.
 *
 * A comment on a node makes recast print that node again, and a list that changes length makes it print the whole list
 * again. recast prints an object, an array, or a statement without braces over several lines when it prints it again,
 * and it joins two statements that shared a line. So three edits go through a sentinel instead of the tree:
 *
 * - A comment on an array element. The element is swapped for an identifier whose name is a sentinel followed by the
 *   exact text of the element. A node of another type is patched on its own range, with no layout of its own.
 * - A comment on a statement. The transforms write it into the tree as any comment, so every rule sees it. After the
 *   last transform, `commit()` takes the comments of the tool off each statement that is still as it was parsed and
 *   stands on a line of its own, and swaps the first expression of the statement, the node nearest to its start, for an
 *   identifier named by a sentinel and the text of that expression. The swap is a patch of that range alone (see
 *   `findObjectReprints()` in recast), so the statement is printed as it was, with the sentinel inside it. After
 *   printing, the sentinel tells where the statement stands, and the comment goes on the line above.
 * - The removal of an expression statement. The statement is swapped for another expression statement that holds a
 *   sentinel, which is a patch of the statement's own range and leaves the list the same length. After printing, the
 *   text of the sentinel is cut out, with its line when it stood alone.
 *
 * `spliceCarriers()` turns the sentinels into text. A swap of a marker happens after every transform ran, and nothing
 * holds a path afterwards, so it is safe. It is also checked, and fails closed: a node becomes a carrier only when recast
 * prints it exactly as the original text, so a carrier can never undo a rewrite. A statement that a rule changed keeps
 * its comment in the tree, where it goes through the printer as it would without a carrier.
 */

import { jsxTextsOf } from './literals.mjs';
import { printTree } from './print.mjs';
import { isDirectiveLine, isToolComment } from './todo.mjs';

const SENTINEL_PREFIX = '__codemodMarker';
const LINE_BREAK = /[\n\r\u2028\u2029]/;
const STATEMENT = /(?:Statement|Declaration)$/;
const BLANK = /^[ \t]*$/;
const BLANK_OR_MARK = /^[ \t\uFEFF]*$/;
const BYTE_ORDER_MARK = new RegExp(String.fromCharCode(0xfeff), 'g');
const NOT_NODES = new Set(['loc', 'tokens', 'comments', 'extra', 'leadingComments', 'trailingComments', 'innerComments',
  'original']);
/**
 * The text before a sentinel on its line when it is only indentation and block comments that start and end there.
 */
const BLOCK_COMMENTS_ONLY = /^(?:[ \t]|\/\*(?:(?!\*\/)[^\n\r])*\*\/)*$/;

/**
 * Whether the comments of a node are the ones the parser found.
 *
 * @param {object} node A node with an `original`.
 * @returns {boolean} `true` when the comment list is the original one.
 */
function sameComments(node) {
  const now = node.comments ?? [];
  const before = node.original.comments ?? [];

  return now.length === before.length && now.every((comment, index) => {
    const old = before[index];

    return comment.type === old.type && comment.value === old.value && comment.leading === old.leading
      && comment.trailing === old.trailing;
  });
}

/**
 * Print a node the way recast would, without its own comments, from a copy that holds no comments on either side.
 * The copy shares every child with the node, so a change anywhere below shows in the text. A node that no transform
 * touched prints as its original text.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} node A node with an `original`.
 * @returns {string} The printed text.
 */
function printWithoutComments(j, node) {
  const detach = (source) => {
    const copy = Object.assign(Object.create(Object.getPrototypeOf(source)), source);

    delete copy.comments;

    return copy;
  };
  const copy = detach(node);

  Object.defineProperty(copy, 'original', { value: detach(node.original), enumerable: false, configurable: true });

  return printTree(j, copy);
}

/**
 * The text of a node that a carrier can stand for: a node that no transform touched, as one line of the original
 * source. Anything else gets `null`, and its comment goes through the AST.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} arrayNode The `ArrayExpression` that holds the element.
 * @param {object} node The element.
 * @returns {string|null} The original text of the element, or `null` when it cannot be carried.
 */
function carriedText(j, arrayNode, node) {
  if (!Array.isArray(arrayNode?.elements) || !arrayNode.elements.includes(node)) {
    return null;
  }

  if (!node.original?.loc?.lines || !node.loc || !j.Expression.check(node) || /^JSX/.test(node.type)
    || node.extra?.parenthesized || node.loc.start.line !== node.loc.end.line || !sameComments(node)) {
    return null;
  }

  const text = node.loc.lines.sliceString(node.loc.start, node.loc.end);

  if (text === '' || LINE_BREAK.test(text) || printWithoutComments(j, node) !== text) {
    return null;
  }

  return text;
}

/**
 * The text of a statement that a carrier can stand for: a statement that no transform touched, on one line of the
 * original source, that starts its line (nothing but white space before it), so a comment can go on the line above.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} node The statement or declaration.
 * @returns {string|null} The original text of the statement, or `null` when it cannot be carried.
 */
function statementText(j, node) {
  if (!STATEMENT.test(node.type) || !node.original?.loc?.lines || !node.loc?.lines || !sameComments(node)) {
    return null;
  }

  const { start, end, lines } = node.loc;

  // A byte order mark is parsed with the text, and the printed text that `spliceCarriers()` reads has none.
  if (start.line !== end.line
    || !BLANK.test(lines.sliceString({ line: start.line, column: 0 }, start).replace(BYTE_ORDER_MARK, ''))) {
    return null;
  }

  const text = lines.sliceString(start, end).replace(BYTE_ORDER_MARK, '');

  return text === '' || LINE_BREAK.test(text) || printWithoutComments(j, node).replace(BYTE_ORDER_MARK, '') !== text
    ? null : text;
}

/**
 * The expression of a statement nearest to its start that can be swapped for an identifier: an expression of the
 * original parse that sits on one line, without parentheses of its own, and is not part of a JSX element. Where
 * several start at the same place the outermost one is taken.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} statement The statement.
 * @returns {{node: object, parent: object, key: string, index: number|undefined}|null} The place of the expression in
 * its parent, or `null` when the statement holds none (`debugger;`, `break;`).
 */
function swapSite(j, statement) {
  let best = null;
  const visit = (node, parent, key, index) => {
    if (/^JSX/.test(node.type)) {
      return;
    }

    if (parent && j.Expression.check(node) && node.original && node.loc?.lines && !node.extra?.parenthesized
      && node.loc.start.line === node.loc.end.line
      && (best === null || node.loc.start.column < best.node.loc.start.column)) {
      best = { node, parent, key, index };
    }

    for (const field of Object.keys(node)) {
      const value = node[field];

      if (NOT_NODES.has(field) || !value || typeof value !== 'object') {
        continue;
      }

      if (Array.isArray(value)) {
        value.forEach((item, position) => item && typeof item.type === 'string' && visit(item, node, field, position));
      } else if (typeof value.type === 'string') {
        visit(value, node, field, undefined);
      }
    }
  };

  visit(statement, null, null, undefined);

  return best;
}

/**
 * Put a node in a place that `swapSite()` found.
 *
 * @param {{parent: object, key: string, index: number|undefined}} site The place.
 * @param {object} node The node to put there.
 * @returns {void}
 */
function putAt(site, node) {
  if (site.index === undefined) {
    site.parent[site.key] = node;
  } else {
    site.parent[site.key][site.index] = node;
  }
}

/**
 * The characters of the original text that a line of code can start with and still continue the line before it when that
 * line has no semicolon: a call, an index, a template, a sign, a regular expression.
 */
const CONTINUATION = /^[([`+\-*/]/;

/**
 * Whether a statement of the original text starts with a character that continues the previous line.
 *
 * @param {object|undefined} node A statement.
 * @returns {boolean} `true` for a statement that starts with `(`, `[`, a template, or an operator.
 */
function startsWithContinuation(node) {
  const start = node?.loc?.start;

  return Boolean(start)
    && CONTINUATION.test(node.loc.lines.sliceString(start, { line: start.line, column: start.column + 1 }));
}

/**
 * Whether a statement of the original text ends in a way that lets the next line run on: not with `;` and not with
 * `}`. A statement made by the run has no text to read and counts as ended.
 *
 * @param {object|undefined} node A statement.
 * @returns {boolean} `true` for a statement that ends with any other character.
 */
function endsUnterminated(node) {
  const end = node?.loc?.end;

  return Boolean(end) && end.column > 0
    && !/[;}]/.test(node.loc.lines.sliceString({ line: end.line, column: end.column - 1 }, end));
}

/**
 * Read the tree once, after the last transform: the statements that carry a comment of the tool wherever it ended up
 * (a rule that removes a declaration hands its comments to another one), and which of some nodes are still in it.
 *
 * @param {object} root The `File` node.
 * @param {Set<object>} watched Nodes whose presence in the tree is asked for.
 * @returns {{statements: object[], removed: Set<object>}} The statements with a comment of the tool, and the watched
 * nodes that are reachable from the root.
 */
function scanTree(root, watched) {
  const statements = [];
  const removed = new Set();
  const seen = new Set();
  const stack = [root];

  while (stack.length > 0) {
    const value = stack.pop();

    if (!value || typeof value !== 'object' || seen.has(value)) {
      continue;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        stack.push(item);
      }

      continue;
    }

    if (watched.has(value)) {
      removed.add(value);
    }

    if (STATEMENT.test(value.type) && value.comments?.some(isToolComment)) {
      statements.push(value);
    }

    for (const key of Object.keys(value)) {
      if (!NOT_NODES.has(key)) {
        stack.push(value[key]);
      }
    }
  }

  return { statements, removed };
}

/**
 * What a part keeps for the edits it makes as text: the sentinel of each, once `commit()` ran.
 *
 * @typedef {object} Carried
 * @property {'element'|'statement'|'removal'} [kind] What the sentinel stands for. A record without it is an element.
 * @property {string} sentinel The sentinel in the tree.
 * @property {string[]} bodies Texts of the comments, as `formatTodo()` builds them.
 * @property {object[]} texts The JSX texts that left the tree with the node (see `intendedLiterals()`).
 * @property {string} [prefix] A statement: its text up to the swapped expression.
 * @property {string} [text] A statement: its text on the line.
 */

/**
 * The array elements, statements, and removed statements of a part that take their edits as text.
 */
export class MarkerCarriers {
  /**
   * @param {object} j The jscodeshift API.
   * @param {string} source Text of the part, to keep every sentinel unique.
   * @param {object} [root] The parsed Collection of the part, for the statements that `commit()` looks for.
   */
  constructor(j, source, root = null) {
    this.j = j;
    this.root = root;
    this.prefix = SENTINEL_PREFIX;
    this.count = 0;

    while (source.includes(this.prefix)) {
      this.prefix += 'X';
    }

    /**
     * @type {Map<object, {array: object, text: string, bodies: string[]}>}
     */
    this.pending = new Map();
    /**
     * @type {Array<{node: object, sentinel: string}>}
     */
    this.removals = [];
    /**
     * @type {Set<object>}
     */
    this.standIns = new Set();
    /**
     * @type {Carried[]}
     */
    this.committed = [];
    /**
     * @type {Map<string, Carried>}
     */
    this.bySentinel = new Map();
  }

  /**
   * Remember a record that `spliceCarriers()` reads.
   *
   * @param {Carried} record The record.
   * @returns {void}
   */
  keep(record) {
    this.committed.push(record);
    this.bySentinel.set(record.sentinel, record);
  }

  /**
   * The record of the identifier that stands in the tree for a carried node: its name is the sentinel, and for an element
   * or a statement the text of the node follows.
   *
   * @param {string} name The name of an identifier.
   * @returns {Carried|undefined} The record, or `undefined` for an identifier that is no carrier.
   */
  recordOf(name) {
    if (!name.startsWith(this.prefix)) {
      return undefined;
    }

    const digits = /^\d+__/.exec(name.slice(this.prefix.length));

    return digits === null ? undefined : this.bySentinel.get(`${this.prefix}${digits[0]}`);
  }

  /**
   * Whether a node already waits for this comment, from a mark earlier in the run.
   *
   * @param {object} node The anchor node.
   * @param {string} body Text of the comment, as `formatTodo()` builds it.
   * @returns {boolean} `true` when the comment is queued for the node.
   */
  has(node, body) {
    return Boolean(this.pending.get(node)?.bodies.includes(body));
  }

  /**
   * Queue a comment for an array element when the element can take it as text.
   *
   * @param {object|null} arrayNode The array the node is an element of, or `null` for another anchor.
   * @param {object} node The anchor node.
   * @param {string} body Text of the comment, as `formatTodo()` builds it.
   * @returns {boolean} `true` when the comment is queued. `false` leaves the comment to the AST.
   */
  add(arrayNode, node, body) {
    if (!this.pending.has(node)) {
      const text = arrayNode ? carriedText(this.j, arrayNode, node) : null;

      if (text === null) {
        return false;
      }

      this.pending.set(node, { array: arrayNode, text, bodies: [] });
    }

    this.pending.get(node).bodies.push(body);

    return true;
  }

  /**
   * Remove an expression statement of a statement list without laying the list out again. The statement is swapped
   * for another one that holds a sentinel, which recast patches into the range of the old one, so the statements around
   * it, on their lines or sharing one, keep their text. `spliceCarriers()` cuts the sentinel out. The comments of the
   * statement stay where they stand.
   *
   * @param {object} path NodePath of the statement: an expression statement, or an import declaration.
   * @param {object} [options] Options.
   * @param {boolean} [options.keepComments] `false` when the caller gave the comments of an import declaration to
   * another node, so the stand-in must not hold them. Defaults to `true`.
   * @returns {boolean} `true` when the statement was swapped. `false` leaves the removal to the caller: the statement
   * is not an expression statement or an import of the original text, a rule changed its comments, or it is not an
   * item of a list.
   */
  removeStatement(path, { keepComments = true } = {}) {
    const { node } = path;
    const isImport = node.type === 'ImportDeclaration';

    // A removed import hands its comments to another declaration before it goes (`removeNamedImport()`), so the list
    // of its comments is no longer the original one.
    if ((node.type !== 'ExpressionStatement' && !isImport) || !node.original?.loc
      || !Array.isArray(path.parentPath?.value) || typeof path.name !== 'number'
      || (!isImport && !sameComments(node))) {
      return false;
    }

    const list = path.parentPath.value;
    const sentinel = this.nextSentinel();
    // An import is swapped for an import, which recast patches into the range of the old one, as an expression
    // statement is for another one. A statement of another type would make it print the whole list again.
    const standIn = isImport ? this.j.importDeclaration([], this.j.literal(sentinel))
      : this.j.expressionStatement(this.j.identifier(sentinel));

    if (node.comments && keepComments) {
      // The same comment objects: recast then leaves the comments around the statement in the text.
      standIn.comments = node.comments;
    }

    // The statements that stay, on both sides: a stand-in is not one, so a run of removals is read as one gap.
    const staying = (step) => {
      let at = path.name + step;

      while (this.standIns.has(list[at])) {
        at += step;
      }

      return list[at];
    };

    path.replace(standIn);
    this.standIns.add(standIn);
    this.removals.push({
      node: standIn,
      sentinel,
      // A file without semicolons: the line before would run on into the line after.
      keepSemicolon: startsWithContinuation(staying(1)) && endsUnterminated(staying(-1)),
      ...(isImport ? { isImport } : {}),
    });

    return true;
  }

  /**
   * @returns {string} A sentinel no other carrier of the part has.
   */
  nextSentinel() {
    const sentinel = `${this.prefix}${this.count}__`;

    this.count += 1;

    return sentinel;
  }

  /**
   * Swap every queued array element for its carrier, take the comments of the tool off the statements that print as
   * their text, and see which removed statements are still in the tree. Call once, after the last mark.
   *
   * @returns {void}
   */
  commit() {
    for (const [node, { array, text, bodies }] of this.pending) {
      const index = array.elements.indexOf(node);

      // The element left its array after the comment was queued, so there is nothing to carry the comment, and a
      // record without a sentinel in the tree would fail the splice.
      if (index === -1) {
        continue;
      }

      const sentinel = this.nextSentinel();
      const carrier = this.j.identifier(`${sentinel}${text}`);

      if (node.comments) {
        // The same comment objects: recast then leaves the comments around the element in the text.
        carrier.comments = node.comments;
      }

      array.elements[index] = carrier;
      // The element leaves the tree, and its JSX texts are printed back with it (see `intendedLiterals()`).
      this.keep({ kind: 'element', sentinel, bodies, texts: jsxTextsOf(node) });
    }

    this.pending.clear();

    const watched = new Set(this.removals.map(item => item.node));
    const { statements, removed } = this.root ? scanTree(this.root.get().node, watched)
      : { statements: [], removed: new Set() };

    statements.forEach(node => this.commitStatement(node));

    // A removed statement that left the tree with its container has no sentinel to cut.
    for (const { node, sentinel, keepSemicolon, isImport } of this.removals) {
      if (removed.has(node)) {
        this.keep({ kind: 'removal', sentinel, keepSemicolon, isImport, bodies: [], texts: [] });
      }
    }

    this.removals = [];
  }

  /**
   * Take the comments of the tool off a statement and carry them as text, when the statement is on a line of its own, was
   * not changed, and holds no other new comment. The statement keeps its comments otherwise, and so its place in the tree.
   *
   * @param {object} node A statement with a comment of the tool.
   * @returns {void}
   */
  commitStatement(node) {
    const mine = node.comments.filter(isToolComment);

    // A comment that a rule turned into a trailing one goes where that rule put it.
    if (mine.some(comment => comment.trailing === true || comment.leading === false)) {
      return;
    }

    const saved = node.comments;
    const kept = saved.filter(comment => !isToolComment(comment));

    if (kept.length > 0) {
      node.comments = kept;
    } else {
      delete node.comments;
    }

    const carried = this.carryStatement(node);

    if (carried === null) {
      node.comments = saved;

      return;
    }

    this.keep({ kind: 'statement', ...carried, bodies: mine.map(comment => comment.value.trim()) });
  }

  /**
   * Swap the first expression of a statement for its sentinel, and check that the statement prints as its text with
   * the sentinel in it.
   *
   * @param {object} node The statement.
   * @returns {{sentinel: string, prefix: string, text: string, texts: object[]}|null} What `spliceCarriers()` needs, or
   * `null` (the tree is left as it was) when the statement was changed or cannot carry a sentinel.
   */
  carryStatement(node) {
    const text = statementText(this.j, node);
    const site = text === null ? null : swapSite(this.j, node);

    if (site === null) {
      return null;
    }

    const { lines } = node.loc;
    const inner = lines.sliceString(site.node.loc.start, site.node.loc.end);
    const prefix = lines.sliceString(node.loc.start, site.node.loc.start).replace(BYTE_ORDER_MARK, '');

    if (inner === '' || !text.startsWith(`${prefix}${inner}`)) {
      return null;
    }

    const sentinel = `${this.prefix}${this.count}__`;

    putAt(site, this.j.identifier(`${sentinel}${inner}`));

    const printed = printWithoutComments(this.j, node).replace(BYTE_ORDER_MARK, '');

    if (printed !== `${prefix}${sentinel}${text.slice(prefix.length)}`) {
      putAt(site, site.node);

      return null;
    }

    this.count += 1;

    // The expression leaves the tree, and its JSX texts are printed back with it (see `intendedLiterals()`).
    return { sentinel, prefix, text, texts: jsxTextsOf(site.node) };
  }
}

/**
 * The printed text as lines, which the edits of `spliceCarriers()` change one at a time. A text with thousands of
 * sentinels is not copied for each of them.
 *
 * @typedef {object} LineList
 * @property {string[]} body The text of each line without its terminator. An edit may put a line break inside it.
 * @property {string[]} terminator The terminator of each line, `''` for a last line that has none.
 * @property {string[][]} above The comment lines, indentation included, that stand above each line.
 * @property {boolean[]} cut Whether the line was cut out of the text.
 */

/**
 * Where each sentinel stands in a printed text, found in one pass.
 *
 * @param {string[]} body The lines of the text.
 * @param {Carried[]} records The records, which share one sentinel prefix.
 * @returns {Map<string, number[]>} For each sentinel that the text holds, the index of its line, once for each time.
 */
function sentinelLines(body, records) {
  const [{ sentinel }] = records;
  const start = sentinel.search(/\d+__/);
  const prefix = start === -1 ? sentinel : sentinel.slice(0, start);
  const pattern = new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\d+__`, 'g');
  const found = new Map();

  body.forEach((line, index) => {
    if (line.includes(prefix)) {
      for (const [name] of line.matchAll(pattern)) {
        found.set(name, [...found.get(name) ?? [], index]);
      }
    }
  });

  return found;
}

/**
 * The line that a comment goes above: the line itself, or the first of the run of next-line directives that ends right
 * before it. A line that was cut, or a comment that an earlier record put there, is not a directive, and ends the run.
 *
 * @param {LineList} lines The lines.
 * @param {number} index Index of the line.
 * @returns {number} The index of the line the comment goes above.
 */
function aboveDirectives(lines, index) {
  let top = index;

  while (top > 0 && lines.above[top].length === 0) {
    let previous = top - 1;

    while (previous >= 0 && lines.cut[previous] && lines.above[previous].length === 0) {
      previous -= 1;
    }

    // A cut line with comments above it hides nothing: the last of them is the line right above.
    if (previous < 0 || lines.cut[previous] || !isDirectiveLine(lines.body[previous])) {
      break;
    }

    top = previous;
  }

  return top;
}

/**
 * Put comment lines in front of the code that starts at a column of a line, whose sentinel is already out of the line.
 *
 * @param {LineList} lines The lines.
 * @param {number} index Index of the line.
 * @param {number} anchor Column of the first character of the element or statement.
 * @param {string[]} bodies Texts of the comments.
 * @param {string} eol Line terminator of the part.
 * @returns {void}
 */
function insertComments(lines, index, anchor, bodies, eol) {
  const line = lines.body[index];
  const before = line.slice(0, anchor);
  const indent = /^[ \t]*/.exec(before)[0];
  const comments = bodies.map(body => `// ${body}`);

  if (BLOCK_COMMENTS_ONLY.test(before)) {
    // Nothing but white space and block comments stands in front of the code: the marker goes on lines above the whole
    // line, so the code keeps the comments it had on its line. A directive for the next line
    // (`// eslint-disable-next-line`) keeps that line, so the marker goes above the lines of such directives.
    lines.above[aboveDirectives(lines, index)].push(...comments.map(comment => `${indent}${comment}`));

    return;
  }

  lines.body[index] = line.slice(0, anchor) + comments.map(comment => `${comment}${eol}${indent}`).join('')
    + line.slice(anchor);
}

/**
 * Cut a removed statement out of a line. The line goes with it when nothing else stands on it, and so does the line
 * break before it when it is the last line and has none of its own (see `spliceCarriers()`). When code or a comment
 * shares the line, only the statement goes, with the run of spaces that separated it from what follows, or from what
 * precedes it when nothing follows.
 *
 * @param {LineList} lines The lines.
 * @param {number} index Index of the line.
 * @param {number} at Column of the sentinel.
 * @param {string} sentinel The sentinel.
 * @param {boolean} keepSemicolon A file without semicolons would run the line before into the line after, so a `;`
 * stays where the statement was.
 * @param {boolean} [isImport] The stand-in is an import declaration: `import "sentinel";`, so the cut starts at its
 * keyword and ends after its closing quote.
 * @returns {void}
 */
function cutRemoved(lines, index, at, sentinel, keepSemicolon, isImport = false) {
  const line = lines.body[index];
  let start = at;
  let end = at + sentinel.length;

  if (isImport) {
    // The stand-in prints as `import "sentinel";`, in whatever quotes the printer uses.
    const open = /import\s*["']$/.exec(line.slice(0, at));

    start = at - (open ? open[0].length : 0);
    end += 1;
  }

  // The printer ends the statement with a `;` after the sentinel.
  end += line[end] === ';' ? 1 : 0;

  const before = line.slice(0, start);
  const after = line.slice(end);

  if (keepSemicolon) {
    lines.body[index] = `${before};${after}`;
  } else if (BLANK_OR_MARK.test(before) && BLANK.test(after)) {
    // A byte order mark inside the text is white space to the parser, and goes with its line.
    lines.cut[index] = true;
  } else if (BLANK.test(after)) {
    lines.body[index] = line.slice(0, start - /[ \t]*$/.exec(before)[0].length);
  } else {
    lines.body[index] = before + after.slice(/^[ \t]*/.exec(after)[0].length);
  }
}

/**
 * Turn the sentinels of a printed part into text: comment lines in front of a carried element or statement, and the cut
 * of a removed statement. The text is read once, and an edit touches the line it is on.
 *
 * @param {MarkerCarriers|undefined} carriers The carriers of the part.
 * @param {string} printed The text recast printed.
 * @param {string} eol Line terminator of the part.
 * @returns {string} The text with a `// ...` line, in the indentation of its line, in front of each carried element or
 * statement. When only white space and single-line block comments precede it on its line, the lines go above that line.
 * @throws {Error} When a sentinel is missing or stands more than once, or a statement is not printed as its text, so a
 * lost marker or a wrong cut never ships as code.
 */
export function spliceCarriers(carriers, printed, eol) {
  const records = carriers?.committed ?? [];

  if (records.length === 0) {
    return printed;
  }

  const parts = printed.split(/(?<=\n)/);
  const lines = {
    body: parts.map(part => part.replace(/\r?\n$/, '')),
    terminator: parts.map(part => /\r?\n$/.exec(part)?.[0] ?? ''),
    above: parts.map(() => []),
    cut: parts.map(() => false),
  };
  const where = sentinelLines(lines.body, records);

  for (const record of records) {
    const { sentinel, bodies } = record;
    const kind = record.kind ?? 'element';
    const what = kind === 'removal' ? 'a removed statement' : 'a marker';
    const stands = where.get(sentinel);

    if (stands?.length !== 1) {
      throw new Error(`${what} could not be placed`);
    }

    const [index] = stands;
    const line = lines.body[index];
    const at = line.indexOf(sentinel);

    if (kind === 'removal') {
      cutRemoved(lines, index, at, sentinel, record.keepSemicolon === true, record.isImport === true);

      continue;
    }

    let anchor = at;

    if (kind === 'statement') {
      anchor = at - record.prefix.length;

      const expected = `${record.prefix}${sentinel}${record.text.slice(record.prefix.length)}`;

      if (anchor < 0 || !line.startsWith(expected, anchor)) {
        throw new Error('a marker could not be placed');
      }
    }

    lines.body[index] = line.slice(0, at) + line.slice(at + sentinel.length);
    insertComments(lines, index, anchor, bodies, eol);
  }

  const out = [];

  parts.forEach((part, index) => {
    lines.above[index].forEach(comment => out.push(`${comment}${eol}`));

    if (!lines.cut[index]) {
      out.push(lines.body[index] + lines.terminator[index]);
    }
  });

  const last = parts.length - 1;
  const text = out.join('');

  // A last line that has no break of its own and was cut takes the break before it along.
  return lines.cut[last] && lines.terminator[last] === '' ? text.replace(/\r?\n$/, '') : text;
}
