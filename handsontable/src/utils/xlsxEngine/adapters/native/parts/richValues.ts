import { MAX_WORKBOOK_CELLS, throwLimitExceeded } from '../../../limits';
import { parseUnsignedIntAttr } from '../xml/numbers';
import { tokenizeXml } from '../xml/tokenizer';

/**
 * What a cell's value metadata (`vm`) resolves to: an error Excel stores as a rich value (`#SPILL!`,
 * `#CALC!`, ...) with its error code, a picture placed in the cell, or another rich value (a linked
 * data type, an error type this reader does not know).
 */
export type RichValueKind = { kind: 'error'; code: string } | { kind: 'picture' } | { kind: 'other' };

/**
 * Resolves a cell's `vm` index (1-based, as the sheet writes it) through `xl/metadata.xml` and the
 * rich-value parts.
 */
export interface RichValueLookup {
  /**
   * What the value metadata at `vm` holds, or `null` when the parts do not resolve it.
   */
  resolve(vm: number): RichValueKind | null;
}

/**
 * The error codes of the `_error` rich value structure, by its `errorType` (MS-XLSX 2.3.6.1.3), which
 * is Excel's own `ERROR.TYPE` number minus one: 0 to 6 are the classic codes, 8 to 13 the ones Excel
 * stores only as a rich value. 7 (`#GETTING_DATA`) is a passing state no file keeps, and `#BUSY!` is
 * left out: `ERROR.TYPE` gives it no number, so none can be matched to it. An `errorType` not listed
 * here keeps the cached value the file carries, and records `cellValue:richValue`.
 */
const RICH_VALUE_ERROR_CODES = new Map<number, string>([
  [0, '#NULL!'],
  [1, '#DIV/0!'],
  [2, '#VALUE!'],
  [3, '#REF!'],
  [4, '#NAME?'],
  [5, '#NUM!'],
  [6, '#N/A'],
  [8, '#SPILL!'],
  [9, '#CONNECT!'],
  [10, '#BLOCKED!'],
  [11, '#UNKNOWN!'],
  [12, '#FIELD!'],
  [13, '#CALC!'],
]);

/**
 * The rich value structure types of a picture: `_localImage` is a picture placed in the cell
 * ("Place in Cell"), `_webimage` the result of `IMAGE()`.
 */
const PICTURE_STRUCTURE_TYPES: ReadonlySet<string> = new Set(['_localImage', '_webimage']);

/**
 * The `metadataType` name of rich values in `xl/metadata.xml`.
 */
const RICH_VALUE_METADATA_TYPE = 'XLRICHVALUE';

/**
 * The local name of an element, its namespace prefix dropped: `metadata.xml` writes the rich-value
 * block as `xlrd:rvb`, and the prefix is the file's choice.
 */
function localName(name: string): string {
  return name.slice(name.indexOf(':') + 1);
}

/**
 * Refuses a part that lists more entries than a workbook can have cells: every entry is reached
 * through a cell's `vm`, so a longer list is not a workbook this reader accepts, the bound the
 * shared-string table has too.
 *
 * @param {number} length The entries read so far.
 * @param {string} part What the entries are.
 */
function assertEntryCount(length: number, part: string): void {
  if (length >= MAX_WORKBOOK_CELLS) {
    throwLimitExceeded(`The ${part} declares more than ${MAX_WORKBOOK_CELLS} entries, `
      + 'above the limit this reader accepts.');
  }
}

/**
 * Parses `xl/metadata.xml` into the rich value index of each value metadata block: entry `vm - 1`
 * is the index into `rdrichvalue.xml`, or `-1` when that block is not a rich value. A `valueMetadata`
 * block names a metadata type (`rc t`, 1-based) and a block of that type's `futureMetadata` (`rc v`,
 * 0-based); a rich value's future metadata block holds an `rvb` with the rich value index.
 *
 * @param {string} xml The part.
 * @returns {number[]}
 */
export function parseValueMetadata(xml: string): number[] {
  const typeNames: string[] = [];
  const richValueBlocks: number[] = [];
  const valueBlocks: Array<{ type: number; index: number } | null> = [];
  let section: 'types' | 'richFuture' | 'otherFuture' | 'value' | null = null;
  let inBlock = false;
  let blockRecorded = false;
  // A block with no `rvb` or `rc` still takes its place in the list.
  const finishBlock = () => {
    if (!blockRecorded) {
      if (section === 'richFuture') {
        richValueBlocks.push(-1);
      } else if (section === 'value') {
        valueBlocks.push(null);
      }
    }

    inBlock = false;
  };

  // The tokenizer fires no `close` for a self-closing element, so `<bk/>` and an empty
  // `<valueMetadata/>` are finished from `open`: a skipped `<bk/>` shifted every later `vm` index.
  tokenizeXml(xml, {
    open(rawName, attrs, selfClosing) {
      const name = localName(rawName);

      if (selfClosing && (name === 'metadataTypes' || name === 'futureMetadata' || name === 'valueMetadata')) {
        return;
      }

      if (name === 'metadataTypes') {
        section = 'types';
      } else if (name === 'futureMetadata') {
        section = attrs.name === RICH_VALUE_METADATA_TYPE ? 'richFuture' : 'otherFuture';
      } else if (name === 'valueMetadata') {
        section = 'value';
      } else if (name === 'metadataType' && section === 'types') {
        assertEntryCount(typeNames.length, 'metadata part');
        typeNames.push(attrs.name ?? '');
      } else if (name === 'bk' && (section === 'richFuture' || section === 'value')) {
        inBlock = true;
        blockRecorded = false;

        if (selfClosing) {
          finishBlock();
        }
      } else if (name === 'rvb' && section === 'richFuture' && inBlock && !blockRecorded) {
        assertEntryCount(richValueBlocks.length, 'metadata part');
        richValueBlocks.push(parseUnsignedIntAttr(attrs.i) ?? -1);
        blockRecorded = true;
      } else if (name === 'rc' && section === 'value' && inBlock && !blockRecorded) {
        const type = parseUnsignedIntAttr(attrs.t);
        const index = parseUnsignedIntAttr(attrs.v);

        assertEntryCount(valueBlocks.length, 'metadata part');
        valueBlocks.push(type === null || index === null ? null : { type, index });
        blockRecorded = true;
      }
    },
    close(rawName) {
      const name = localName(rawName);

      if (name === 'bk' && inBlock) {
        finishBlock();
      } else if (name === 'metadataTypes' || name === 'futureMetadata' || name === 'valueMetadata') {
        section = null;
      }
    },
  });

  return valueBlocks.map((block) => {
    if (block === null || typeNames[block.type - 1] !== RICH_VALUE_METADATA_TYPE) {
      return -1;
    }

    return richValueBlocks[block.index] ?? -1;
  });
}

/**
 * One rich value structure: its type (`_error`, `_localImage`, ...) and its key names in order.
 */
export interface RichValueStructure {
  type: string;
  keys: string[];
}

/**
 * Parses `xl/richData/rdrichvaluestructure.xml`.
 *
 * @param {string} xml The part.
 * @returns {RichValueStructure[]}
 */
export function parseRichValueStructures(xml: string): RichValueStructure[] {
  const structures: RichValueStructure[] = [];
  let current: RichValueStructure | null = null;

  tokenizeXml(xml, {
    open(rawName, attrs, selfClosing) {
      const name = localName(rawName);

      if (name === 's') {
        assertEntryCount(structures.length, 'rich value structure part');
        current = { type: attrs.t ?? '', keys: [] };
        structures.push(current);

        if (selfClosing) {
          current = null;
        }
      } else if (name === 'k' && current !== null) {
        assertEntryCount(current.keys.length, 'rich value structure part');
        current.keys.push(attrs.n ?? '');
      }
    },
    close(rawName) {
      if (localName(rawName) === 's') {
        current = null;
      }
    },
  });

  return structures;
}

/**
 * One rich value: the index of its structure and its values, in the structure's key order.
 */
export interface RichValue {
  structure: number;
  values: string[];
}

/**
 * Parses `xl/richData/rdrichvalue.xml`.
 *
 * @param {string} xml The part.
 * @returns {RichValue[]}
 */
export function parseRichValues(xml: string): RichValue[] {
  const values: RichValue[] = [];
  let current: RichValue | null = null;
  let text: string | null = null;

  tokenizeXml(xml, {
    open(rawName, attrs, selfClosing) {
      const name = localName(rawName);

      if (name === 'rv') {
        assertEntryCount(values.length, 'rich value part');
        current = { structure: parseUnsignedIntAttr(attrs.s) ?? -1, values: [] };
        values.push(current);

        if (selfClosing) {
          current = null;
        }
      } else if (name === 'v' && current !== null) {
        assertEntryCount(current.values.length, 'rich value part');

        if (selfClosing) {
          current.values.push('');
        } else {
          text = '';
        }
      }
    },
    text(chunk) {
      if (text !== null) {
        text += chunk;
      }
    },
    close(rawName) {
      const name = localName(rawName);

      if (name === 'v' && current !== null && text !== null) {
        current.values.push(text);
        text = null;
      } else if (name === 'rv') {
        current = null;
      }
    },
  });

  return values;
}

/**
 * Builds the lookup a sheet's `vm` cells are resolved through.
 *
 * @param {number[]} valueMetadata The rich value index of each value metadata block.
 * @param {RichValueStructure[]} structures The rich value structures.
 * @param {RichValue[]} richValues The rich values.
 * @returns {RichValueLookup}
 */
export function createRichValueLookup(
  valueMetadata: number[], structures: RichValueStructure[], richValues: RichValue[]
): RichValueLookup {
  return {
    resolve(vm) {
      const richValue = richValues[valueMetadata[vm - 1] ?? -1];
      const structure = richValue === undefined ? undefined : structures[richValue.structure];

      if (structure === undefined) {
        return null;
      }

      if (PICTURE_STRUCTURE_TYPES.has(structure.type)) {
        return { kind: 'picture' };
      }

      if (structure.type === '_error') {
        const errorType = parseUnsignedIntAttr(richValue.values[structure.keys.indexOf('errorType')]);
        const code = errorType === null ? undefined : RICH_VALUE_ERROR_CODES.get(errorType);

        return code === undefined ? { kind: 'other' } : { kind: 'error', code };
      }

      return { kind: 'other' };
    },
  };
}
