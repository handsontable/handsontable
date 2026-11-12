/**
 * Marker comments on the elements of an array literal, placed as text.
 *
 * A comment on a node makes recast print that node again, and recast prints an object or an array it prints again
 * over several lines. So a `// TODO` comment attached to the `{ ... }` of a one-line array element would spread the
 * element over lines although no key changed. A node of a different type is patched on its own range instead, with no
 * layout of its own. So the element is swapped for a carrier: an identifier whose name is a sentinel followed by the
 * exact text of the element. Once the part is printed, `spliceCarriers()` turns each sentinel into the comment lines,
 * with the indentation of the line the sentinel stands on, and the element text stays where it was.
 *
 * Markers are placed after every transform ran and nothing holds a path afterwards, so the swap is safe. It is also
 * checked: a node becomes a carrier only when recast would print it exactly as the original text, so the carrier
 * can never undo a rewrite.
 */

const SENTINEL_PREFIX = '__codemodMarker';
const LINE_BREAK = /[\n\r\u2028\u2029]/;

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

  return j(copy).toSource();
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
 * The array elements of a part that take their markers as text.
 */
export class MarkerCarriers {
  /**
   * @param {object} j The jscodeshift API.
   * @param {string} source Text of the part, to keep every sentinel unique.
   */
  constructor(j, source) {
    this.j = j;
    this.prefix = SENTINEL_PREFIX;

    while (source.includes(this.prefix)) {
      this.prefix += 'X';
    }

    /** @type {Map<object, {array: object, text: string, bodies: string[]}>} */
    this.pending = new Map();
    /** @type {Array<{sentinel: string, bodies: string[]}>} */
    this.committed = [];
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
   * Queue a comment for a node when the node can take it as text.
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
   * Swap every queued element for its carrier. Call once, after the last mark.
   *
   * @returns {void}
   */
  commit() {
    for (const [node, { array, text, bodies }] of this.pending) {
      const sentinel = `${this.prefix}${this.committed.length}__`;
      const carrier = this.j.identifier(`${sentinel}${text}`);

      if (node.comments) {
        // The same comment objects: recast then leaves the comments around the element in the text.
        carrier.comments = node.comments;
      }

      array.elements[array.elements.indexOf(node)] = carrier;
      this.committed.push({ sentinel, bodies });
    }

    this.pending.clear();
  }
}

/**
 * Turn the sentinels of a printed part into comment lines.
 *
 * @param {MarkerCarriers|undefined} carriers The carriers of the part.
 * @param {string} printed The text recast printed.
 * @param {string} eol Line terminator of the part.
 * @returns {string} The text with a `// ...` line, in the indentation of its line, in front of each carried element.
 * @throws {Error} When a sentinel is missing or stands more than once, so a lost marker never ships as code.
 */
export function spliceCarriers(carriers, printed, eol) {
  let text = printed;

  for (const { sentinel, bodies } of carriers?.committed ?? []) {
    const at = text.indexOf(sentinel);

    if (at === -1 || text.indexOf(sentinel, at + 1) !== -1) {
      throw new Error('a marker could not be placed');
    }

    const lineStart = text.lastIndexOf('\n', at) + 1;
    const indent = /^[ \t]*/.exec(text.slice(lineStart))[0];

    text = text.slice(0, at) + bodies.map(body => `// ${body}${eol}${indent}`).join('')
      + text.slice(at + sentinel.length);
  }

  return text;
}
