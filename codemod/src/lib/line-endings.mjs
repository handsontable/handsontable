import { diffArrays } from 'diff';

const BREAK = /\r\n|\n|\r/g;

/**
 * The most lines of a mixed-ending file that may differ from the source before the alignment gives up. A file past it
 * is left alone, which is the safe side.
 */
const MAX_EDIT_LENGTH = 20000;

/**
 * The line terminator most lines of a text end with: `\r\n`, `\n`, or a lone `\r` (a classic Mac file). A tie goes to
 * `\r\n`, then `\n`. A text with no line break gives `\n`.
 *
 * @param {string} source Text of the part.
 * @returns {'\r\n'|'\n'|'\r'} The terminator.
 */
export function dominantBreak(source) {
  const counts = new Map([['\r\n', 0], ['\n', 0], ['\r', 0]]);
  let best = '\r\n';

  for (const match of source.matchAll(BREAK)) {
    counts.set(match[0], counts.get(match[0]) + 1);
  }

  for (const kind of ['\n', '\r']) {
    if (counts.get(kind) > counts.get(best)) {
      best = kind;
    }
  }

  return counts.get(best) === 0 ? '\n' : best;
}

/**
 * Split a text into lines and the terminator after each. The last line has the terminator `''` when the text does not
 * end with a line break, and a text that does has no empty line after it.
 *
 * @param {string} text The text.
 * @returns {{texts: string[], terms: string[]}} The text of each line, and the terminator that followed it.
 */
export function splitLines(text) {
  const texts = [];
  const terms = [];
  let from = 0;

  for (const match of text.matchAll(BREAK)) {
    texts.push(text.slice(from, match.index));
    terms.push(match[0]);
    from = match.index + match[0].length;
  }

  if (from < text.length) {
    texts.push(text.slice(from));
    terms.push('');
  }

  return { texts, terms };
}

/**
 * Pair the lines of the printed text with the lines of the source they came from, by the longest common subsequence of
 * their text. Every pair is a line that both texts hold, in the same order.
 *
 * @param {string[]} source The lines of the source.
 * @param {string[]} printed The lines of the printed text.
 * @returns {Map<number, number>|null} Index in `printed` to index in `source`, or `null` when the texts differ by more
 * than `MAX_EDIT_LENGTH` lines.
 */
function align(source, printed) {
  const parts = diffArrays(source, printed, { maxEditLength: MAX_EDIT_LENGTH });

  if (!parts) {
    return null;
  }

  const pairs = new Map();
  let at = 0;
  let to = 0;

  for (const part of parts) {
    if (part.added) {
      to += part.count;
    } else if (part.removed) {
      at += part.count;
    } else {
      for (let offset = 0; offset < part.count; offset += 1) {
        pairs.set(to + offset, at + offset);
      }

      at += part.count;
      to += part.count;
    }
  }

  return pairs;
}

/**
 * Give the printed text the line terminators of the source.
 *
 * The printer writes one terminator for the whole text (`working`). A source that uses one kind of terminator gets it
 * back everywhere, a lone `\r` included. A source that mixes them gets each line that the printer did not change its
 * own terminator back, and every new or changed line the dominant one.
 *
 * Which line of the source a printed line came from is not recorded, so it is found by the text: the two alignments of
 * the longest common subsequence that prefer the earliest and the latest match. A line both alignments pair with the
 * same source line is that line. A line that the alignments pair with different lines, or with a line in one and not in
 * the other (a blank line next to an edit that removed or added one), is a line the text cannot place. It is fine when
 * every source line it could be ends the same way. When they end differently the tool cannot tell which ending to
 * write, and it throws, which leaves the file as it was, instead of guessing.
 *
 * @param {string} source The text the part started from.
 * @param {string} printed The printed text, ended by `working`.
 * @param {'\r\n'|'\n'} working The terminator the printer used.
 * @returns {string} The printed text with the terminators of the source.
 * @throws {Error} When a line of the printed text could have come from source lines that end in different ways.
 */
export function restoreLineEndings(source, printed, working) {
  const kinds = new Set(source.match(BREAK) ?? []);
  const dominant = dominantBreak(source);

  if (kinds.size <= 1) {
    return dominant === working ? printed : printed.split(working).join(dominant);
  }

  const before = splitLines(source);
  const after = splitLines(printed);
  const forward = align(before.texts, after.texts);
  const backward = align([...before.texts].reverse(), [...after.texts].reverse());

  if (forward === null || backward === null) {
    throw new Error('The file mixes line endings and the edit changes too many lines to tell which line ending '
      + 'each line had.');
  }

  const last = before.texts.length - 1;
  let text = '';

  after.texts.forEach((line, index) => {
    const early = forward.get(index);
    const late = backward.has(after.texts.length - 1 - index) ? last - backward.get(after.texts.length - 1 - index)
      : undefined;
    const candidates = [early, late].filter(candidate => candidate !== undefined)
      .map(candidate => (before.terms[candidate] === '' ? dominant : before.terms[candidate]));
    const options = new Set(early !== undefined && late !== undefined ? candidates : [...candidates, dominant]);

    if (after.terms[index] === '') {
      text += line;

      return;
    }

    if (options.size > 1) {
      throw new Error('The file mixes line endings, and the edit sits next to a line that the file repeats, so the '
        + `tool cannot tell which line ending line ${index + 1} had.`);
    }

    text += line + [...options][0];
  });

  return text;
}
