import { throwWithCause } from '../../../../../helpers/errors';
import { MAX_WORKBOOK_CELLS, throwLimitExceeded } from '../../../limits';
import { needsSpacePreserve } from '../xml/escapes';
import { collectRichTextRuns } from '../xml/richText';
import { tokenizeXml } from '../xml/tokenizer';
import { XmlWriter } from '../xml/writer';
import { MAIN_NS } from './package';

/**
 * The shared-string table of a workbook being written. Every string cell adds its text here and
 * writes the returned index; identical texts share one entry.
 */
export class SharedStringTable {
  /**
   * Distinct strings in first-seen order.
   */
  #strings: string[] = [];
  /**
   * Index by string.
   */
  #index = new Map<string, number>();
  /**
   * Total references, the `count` attribute.
   */
  #count = 0;

  /**
   * Adds a string and returns its index.
   */
  add(text: string): number {
    this.#count += 1;

    const existing = this.#index.get(text);

    if (existing !== undefined) {
      return existing;
    }

    const index = this.#strings.length;

    this.#strings.push(text);
    this.#index.set(text, index);

    return index;
  }

  /**
   * Total references.
   */
  get count(): number {
    return this.#count;
  }

  /**
   * Distinct strings.
   */
  get uniqueCount(): number {
    return this.#strings.length;
  }

  /**
   * Serializes `xl/sharedStrings.xml`.
   */
  toXml(): string {
    const w = new XmlWriter().open('sst', { xmlns: MAIN_NS, count: this.#count, uniqueCount: this.#strings.length });

    this.#strings.forEach((text) => {
      w.open('si').leaf('t', needsSpacePreserve(text) ? { 'xml:space': 'preserve' } : undefined, text).close();
    });

    return w.close().toString();
  }
}

/**
 * The parsed shared-string table. `rich[i]` says entry `i` carried formatting runs, which the
 * reader reports as a dropped feature when the entry is referenced.
 */
export interface ParsedSharedStrings {
  strings: string[];
  rich: boolean[];
}

/**
 * Parses `xl/sharedStrings.xml`. Runs are joined into one string; phonetic runs are skipped.
 */
export function parseSharedStrings(xml: string): ParsedSharedStrings {
  const strings: string[] = [];
  const rich: boolean[] = [];

  tokenizeXml(xml, collectRichTextRuns('si', () => {}, (text, isRich) => {
    // A workbook can never address more distinct strings than it can address cells, since every
    // reference is a cell's `<v>`. Bounding the table by `MAX_WORKBOOK_CELLS` keeps two parallel
    // arrays from growing past what `MAX_INFLATED_ENTRY_BYTES` (512 MB, four times the whole-file
    // cap) alone would let through before any per-sheet cap has run.
    if (strings.length >= MAX_WORKBOOK_CELLS) {
      throwLimitExceeded(`The shared-string table declares more than ${MAX_WORKBOOK_CELLS} entries, `
        + 'above the limit this reader accepts.');
    }

    strings.push(text);
    rich.push(isRich);
  }));

  return { strings, rich };
}
