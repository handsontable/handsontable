import { DROPPED_FEATURES, type DroppedFeatures } from './capabilities';

/**
 * The first line of the legacy note Excel 365 writes for a threaded comment. The thread itself
 * lives in `xl/threadedComments/threadedComment{N}.xml` (authors in `xl/persons/person.xml`); the
 * note in `comments{N}.xml` is a fallback for readers that cannot read threads, and its text is
 * this line, a fixed English notice, then `Comment:` and the thread, every reply after a
 * `Reply:` line and every entry indented by four spaces. Google Sheets writes the same note with a
 * tab in place of the four spaces and a line feed after each entry.
 */
const THREADED_COMMENT_HEADER = '[Threaded comment]';

/**
 * The line that ends the notice and opens the first entry of the thread.
 */
const THREAD_START = '\nComment:\n';

/**
 * The line that opens each reply.
 */
const REPLY_START = '\nReply:\n';

/**
 * The indent in front of every line of an entry: four spaces from Excel, a tab from Google Sheets.
 */
const ENTRY_INDENT = /^(?: {4}|\t)/gm;

/**
 * The line feed Google Sheets writes after each entry. One per entry is removed, so a blank line
 * the author typed at the end still survives.
 */
const ENTRY_END = /\n$/;

/**
 * Returns the thread an Excel 365 threaded-comment note carries, without the notice in front of
 * it: the comment and its replies, one entry per line group, joined with a line feed. Who wrote
 * each entry, and when, is in the thread part, which neither adapter reads. Returns `null` for
 * any other note, including one that merely starts with the header line.
 *
 * Only the English notice is recognized. If a localized Excel writes a translated one, that note
 * imports as written, notice included, and nothing is recorded.
 *
 * @param {string} text The note text, as read.
 * @returns {string|null}
 */
export function unwrapThreadedComment(text: string): string | null {
  if (!text.startsWith(THREADED_COMMENT_HEADER)) {
    return null;
  }

  const normalized = text.replace(/\r\n?/g, '\n');
  const start = normalized.indexOf(THREAD_START);

  if (start === -1) {
    return null;
  }

  return normalized
    .slice(start + THREAD_START.length)
    .split(REPLY_START)
    .map(entry => entry.replace(ENTRY_END, '').replace(ENTRY_INDENT, ''))
    .join('\n');
}

/**
 * The comment a cell imports for the note text it carries. A threaded-comment note is unwrapped
 * (`unwrapThreadedComment`) and `DROPPED_FEATURES.threadedComments` recorded ONCE per read, so the
 * import result says the thread's metadata was flattened without counting every cell. Shared by
 * both adapters, which must agree on it.
 *
 * @param {string} text The note text, as read.
 * @param {DroppedFeatures} dropped The read's dropped features.
 * @returns {string}
 */
export function noteToComment(text: string, dropped: DroppedFeatures): string {
  const thread = unwrapThreadedComment(text);

  if (thread === null) {
    return text;
  }

  if (dropped.count(DROPPED_FEATURES.threadedComments) === 0) {
    dropped.record(DROPPED_FEATURES.threadedComments);
  }

  return thread;
}
