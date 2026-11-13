/**
 * Finds the `<script>` elements of an HTML text without a regular expression that backtracks. A page with many
 * unclosed `<script` tags made `/<script\b(...)>([\s\S]*?)<\/script\b[^>]*>/gi` read to the end of the file for each
 * one, which is quadratic. This scanner indexes the text once, and every search after that is a binary search or a
 * memoized step, so the whole scan is linear (times a logarithm) in the length of the text.
 *
 * It returns what the expression returned: the offset of the tag, the text of its attributes, the text of the
 * element, and where they start. The tag name is case-insensitive, the end tag may carry white space or attributes
 * (`</script  >`, `</script foo>`), and a quote in the attributes must close, or the tag is not a script.
 *
 * @module lib/inline-script
 */

const OPEN = '<script';
const CLOSE = '</script';

/**
 * Lowercase the ASCII letters only. `String#toLowerCase` can change the length of a text (`İ` becomes two characters),
 * and every offset here must stay an offset of the original.
 *
 * @param {string} text The text.
 * @returns {string} The text with `A-Z` lowercased and every other character kept.
 */
function asciiLower(text) {
  return text.replace(/[A-Z]+/g, upper => upper.toLowerCase());
}

/**
 * Whether the character at an offset is a word character, as `\b` sees it.
 *
 * @param {string} text The text.
 * @param {number} index The offset. An offset past the end is no character.
 * @returns {boolean} `true` for a letter, a digit, or an underscore.
 */
function isWordAt(text, index) {
  return index < text.length && /\w/.test(text[index]);
}

/**
 * The first element of a sorted list that is not below a value.
 *
 * @param {number[]} list Ascending offsets.
 * @param {number} value The lower bound.
 * @returns {number} The element, or `-1` when every element is below the value.
 */
function firstFrom(list, value) {
  let low = 0;
  let high = list.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);

    if (list[middle] < value) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low < list.length ? list[low] : -1;
}

/**
 * The nearest `>`, `"`, or `'` at or after an offset.
 *
 * @param {Record<string, number[]>} marks The offsets of each of the three characters.
 * @param {number} position The offset to search from.
 * @returns {[number, string]|null} The offset and the character, or `null` when none follows.
 */
function nextMark(marks, position) {
  let best = null;

  for (const char of ['>', '"', '\'']) {
    const at = firstFrom(marks[char], position);

    if (at !== -1 && (best === null || at < best[0])) {
      best = [at, char];
    }
  }

  return best;
}

/**
 * One `<script>` element of a text.
 *
 * @typedef {object} ScriptElement
 * @property {number} index Offset of the `<` of the start tag.
 * @property {string} attributes The text between the tag name and the `>` of the start tag.
 * @property {string} body The text between the start tag and the end tag.
 * @property {number} bodyStart Offset of the first character of `body`.
 * @property {number} end Offset after the `>` of the end tag.
 */

/**
 * List the `<script>` elements of a text, in order.
 *
 * @param {string} source HTML text.
 * @returns {ScriptElement[]} The elements. A start tag with no `>`, an attribute quote that never closes, or no end
 * tag after it gives no element.
 */
export function scanScripts(source) {
  const lower = asciiLower(source);

  if (!lower.includes(OPEN)) {
    return [];
  }

  const marks = { '>': [], '"': [], '\'': [] };

  for (let index = 0; index < source.length; index += 1) {
    marks[source[index]]?.push(index);
  }

  // Every end tag that is complete: `</script`, a word boundary, and a `>` somewhere after it. The offset after that
  // `>` is kept, so the element can end there.
  const closers = [];
  const closerEnds = new Map();

  for (let at = lower.indexOf(CLOSE); at !== -1; at = lower.indexOf(CLOSE, at + 1)) {
    const tagEnd = firstFrom(marks['>'], at + CLOSE.length);

    if (tagEnd === -1) {
      break;
    }

    if (!isWordAt(lower, at + CLOSE.length)) {
      closers.push(at);
      closerEnds.set(at, tagEnd + 1);
    }
  }

  // The end of a start tag from an offset outside every quote, or -1. Two scans that reach the same offset finish the
  // same way, so each offset is walked once.
  const memo = new Map();
  const tagEndFrom = (start) => {
    const trail = [];
    let position = start;
    let result = -1;

    for (;;) {
      if (memo.has(position)) {
        result = memo.get(position);
        break;
      }

      trail.push(position);

      const next = nextMark(marks, position);

      if (!next) {
        break;
      }

      const [at, char] = next;

      if (char === '>') {
        result = at;
        break;
      }

      const close = firstFrom(marks[char], at + 1);

      if (close === -1) {
        break;
      }

      position = close + 1;
    }

    trail.forEach(item => memo.set(item, result));

    return result;
  };

  const found = [];
  let from = 0;

  for (let open = lower.indexOf(OPEN, from); open !== -1; open = lower.indexOf(OPEN, from)) {
    const afterName = open + OPEN.length;
    const gt = isWordAt(lower, afterName) ? -1 : tagEndFrom(afterName);

    if (gt === -1) {
      from = open + 1;
      continue;
    }

    const closer = firstFrom(closers, gt + 1);

    if (closer === -1) {
      // No end tag follows this start tag. A later `<script` can still have one: it may sit inside a quoted attribute
      // of this tag, and then its own start tag ends earlier. Each offset is looked at once, so this stays linear.
      from = open + 1;
      continue;
    }

    found.push({
      index: open,
      attributes: source.slice(afterName, gt),
      body: source.slice(gt + 1, closer),
      bodyStart: gt + 1,
      end: closerEnds.get(closer),
    });
    from = closerEnds.get(closer);
  }

  return found;
}

/**
 * A line counter for offsets that only grow, so asking for the line of each of many matches reads the text once
 * and not once per match.
 *
 * @param {string} source The text.
 * @returns {(offset: number) => number} A function from an offset to a one-based line number.
 */
export function createLineCounter(source) {
  let counted = 0;
  let line = 1;

  return (offset) => {
    if (offset < counted) {
      counted = 0;
      line = 1;
    }

    for (let at = source.indexOf('\n', counted); at !== -1 && at < offset; at = source.indexOf('\n', counted)) {
      line += 1;
      counted = at + 1;
    }

    return line;
  };
}
