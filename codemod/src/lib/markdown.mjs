/**
 * The one rule for what the tool never prints as it is: every character of the Unicode categories Cc (the C0 and C1
 * controls and DEL: an escape sequence in a file name or a source line can rewrite the screen), Cf (format characters:
 * the bidirectional marks, overrides, and isolates make a name read backward, and the zero width space, the joiners, and
 * the byte order mark are invisible), Zl and Zp (the line and paragraph separators U+2028 and U+2029, which end a line
 * in JavaScript source and in several log pipelines). A carriage return that does not end a CRLF pair is one too (it
 * overwrites the line).
 */
const UNSAFE_CHARACTER = '\\p{Cc}\\p{Cf}\\p{Zl}\\p{Zp}';

/**
 * That rule for a text that keeps its layout: the line feed, the tab, and a CRLF pair stay, so a diff and a multi-line
 * message read as they are written.
 */
const UNSAFE = new RegExp(`\\r(?!\\n)|(?![\\r\\n\\t])[${UNSAFE_CHARACTER}]`, 'gu');

/**
 * The same rule for a text that must stay on one line, such as a file name: the line feed and the tab are spelled too.
 */
const UNSAFE_IN_NAME = new RegExp(`[${UNSAFE_CHARACTER}]`, 'gu');

/**
 * Show a character as an escape that cannot do anything: `\x1b` in the one-byte range, `\u202e` in the rest of the
 * basic plane, and `\u{e0041}` above it.
 *
 * @param {string} char One character (one code point).
 * @returns {string} The escape text.
 */
function visible(char) {
  const code = char.codePointAt(0);

  if (code < 256) {
    return `\\x${code.toString(16).padStart(2, '0')}`;
  }

  return code < 0x10000 ? `\\u${code.toString(16).padStart(4, '0')}` : `\\u{${code.toString(16)}}`;
}

/**
 * Make a text safe to print: every Cc, Cf, Zl, and Zp character becomes a visible escape. Line breaks, tabs,
 * and CRLF pairs stay, so a diff and a multi-line message keep their layout.
 *
 * @param {string} text Any text, such as a diff, a message, or a whole report.
 * @returns {string} The text with the unsafe characters spelled out.
 */
export function plainText(text) {
  return String(text).replace(UNSAFE, visible);
}

/**
 * Make a file name safe to print on one line.
 *
 * @param {string} name A file name or path.
 * @returns {string} The name with every control character spelled out, line breaks and tabs included.
 */
export function plainName(name) {
  return String(name).replace(UNSAFE_IN_NAME, visible);
}

/**
 * Write text as a Markdown code span, whatever it holds. The fence is one backtick longer than the longest run of
 * backticks in the text, and a space pads a text that starts or ends with a backtick, as CommonMark asks. Inside a span
 * `*`, `_`, `[`, `<`, and `&` are text.
 *
 * @param {string} text The text, already free of line breaks.
 * @returns {string} The code span.
 */
export function codeSpan(text) {
  const runs = String(text).match(/`+/g) ?? [];
  const fence = '`'.repeat(1 + Math.max(0, ...runs.map(run => run.length)));
  const pad = /^`|`$/.test(text) || (/^ .* $/.test(text) && text.trim() !== '') ? ' ' : '';

  return `${fence}${pad}${text}${pad}${fence}`;
}

/**
 * A code span as CommonMark reads it: a backtick string, a text without a backtick string of that length, and a
 * closing backtick string of the same length.
 */
const CODE_SPAN = /(`+)(?!`)([\s\S]*?[^`])\1(?!`)/g;

/**
 * A literal tag in prose, such as `<style lang="less">`, `<script>`, or `</script>`. The tool names these in its own
 * messages, and a Markdown viewer would take them for markup.
 */
const TAG = /<\/?[A-Za-z][^<>\n]*>/g;

/**
 * Escape what Markdown or HTML would read as markup in a stretch of prose that has no code span in it.
 *
 * @param {string} prose The text outside every code span.
 * @returns {string} The text, safe to put in a paragraph or a list item.
 */
function escapeProse(prose) {
  return prose
    .replace(TAG, tag => codeSpan(tag))
    .split(/(`+[^`]*`+)/)
    .map((piece, index) => (index % 2 === 1 ? piece : piece
      .replace(/\\/g, '\\\\')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/([*_[\]`~|])/g, '\\$1')))
    .join('');
}

/**
 * Where a quoted fragment stands in a message: the first occurrence that is a whole word at each end that is a word
 * character, and does not run into a version (`Safari 18` is not the start of `Safari 18.2`, `Chrome 13` is not the
 * start of `Chrome 130`). The tool's own text can hold a prefix of what the user wrote, so the first plain match
 * is not always the quote. When no occurrence stands alone, the first plain one is used.
 *
 * @param {string} text The message.
 * @param {string} fragment The fragment, as `plainText()` spells it.
 * @returns {number} The index, or -1.
 */
function quotedAt(text, fragment) {
  let first = -1;

  for (let at = text.indexOf(fragment); at !== -1; at = text.indexOf(fragment, at + 1)) {
    first = first === -1 ? at : first;

    const before = text[at - 1];
    const after = text[at + fragment.length];
    const runsOn = after !== undefined && /\w$/.test(fragment) && (/\w/.test(after)
      || (after === '.' && /\d/.test(text[at + fragment.length + 1] ?? '') && /\d$/.test(fragment)));
    const startsInside = before !== undefined && /^\w/.test(fragment) && /\w/.test(before);

    if (!startsInside && !runsOn) {
      return at;
    }
  }

  return first;
}

/**
 * Turn the text of a report entry into Markdown that renders as the text it says, whatever it quotes from the user's
 * project:
 *
 * - a fragment in `quoted` (a source line, a name from the code) becomes a code span with a fence that fits it,
 * - a code span the message already holds stays one,
 * - a literal tag (`<style lang="less">`) becomes a code span,
 * - everything else has its Markdown and HTML markup escaped,
 * - a line that would open a heading, a quote, or a list is escaped at its start.
 *
 * Control characters become visible escapes.
 *
 * @param {string} text The message.
 * @param {string[]} [quoted] Fragments of the message that are text from the user's files. The first occurrence of each
 * is quoted.
 * @returns {string} Markdown.
 */
export function markdownText(text, quoted = []) {
  const holders = [];
  let work = plainText(text);

  for (const fragment of [...quoted].filter(Boolean).sort((a, b) => b.length - a.length)) {
    const at = quotedAt(work, plainText(fragment));

    if (at !== -1) {
      const held = plainText(fragment).replace(/\s+/g, ' ');

      work = `${work.slice(0, at)}\u0001${holders.length}\u0001${work.slice(at + plainText(fragment).length)}`;
      holders.push(codeSpan(held));
    }
  }

  const pieces = [];
  const spans = [];
  let cursor = 0;

  // A code span of the message stands as a placeholder while the line starts are escaped, so a `#`, `-`, or `1.` that
  // opens a line inside a span that runs over a break stays as written.
  for (const match of work.matchAll(CODE_SPAN)) {
    pieces.push(escapeProse(work.slice(cursor, match.index)), `\u0002${spans.length}\u0002`);
    spans.push(match[0]);
    cursor = match.index + match[0].length;
  }

  pieces.push(escapeProse(work.slice(cursor)));

  return pieces.join('')
    // A line that opens a heading, a list item, an ordered list, or a rule gets its first character escaped.
    .replace(/(^|\n)([ \t]*)(#{1,6}(?=\s|$)|[-+](?=\s)|-{3,}[ \t]*(?=\n|$)|={3,}[ \t]*(?=\n|$))/g, '$1$2\\$3')
    .replace(/(^|\n)([ \t]*\d+)([.)])(?=\s)/g, '$1$2\\$3')
    // eslint-disable-next-line no-control-regex -- the placeholders of a code span, after `plainText()` removed any
    .replace(/\u0002(\d+)\u0002/g, (_, index) => spans[Number(index)])
    // eslint-disable-next-line no-control-regex -- the placeholder of a quoted fragment, after `plainText()` removed any
    .replace(/\u0001(\d+)\u0001/g, (_, index) => holders[Number(index)]);
}
