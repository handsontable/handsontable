import { throwWithCause } from '../../../../../helpers/errors';
import { DROPPED_FEATURES, type DroppedFeatureName, type DroppedFeatures } from '../../../capabilities';
import { parseCellRef, parseMultiRangeRef, parseRangeRef } from '../../../cellRef';
import { EXCEL_EPOCH_OFFSET, MS_PER_DAY } from '../../../dates';
import { translateSharedFormula } from '../../../formulaRefs';
import { classifyTemporalFormat } from '../../../numFmtCode';
import {
  MAX_FORMULA_LENGTH, MAX_SHEET_CELLS, MAX_SHEET_COLUMNS, MAX_SHEET_ROWS, MAX_TRANSLATED_FORMULA_CHARS,
  MAX_WORKBOOK_CELLS, throwCellLimit, throwColumnLimit, throwLimitExceeded, throwRowLimit,
} from '../../../limits';
import {
  createCellSnapshot, createCoveredCellSnapshot, createSheetSnapshot, isProtectionOptionName, type CellSnapshot,
  type CellValidationSnapshot, type CellValue,
  type SheetProtectionOptions, type SheetSnapshot,
} from '../../../model';
import { MAX_COLUMN_WIDTH_UNITS, MAX_ROW_HEIGHT_POINTS } from '../../../units';
import { decodeOoxmlEscapes } from '../xml/escapes';
import { parseFiniteDoubleAttr, parseUnsignedIntAttr } from '../xml/numbers';
import { collectRichTextRuns } from '../xml/richText';
import { createLocalName, tokenizeXml, type XmlAttributes } from '../xml/tokenizer';
import { readCfRule } from './conditionalFormatting';
import { PROTECTION_INVERTED_OPTIONS } from './protection';
import type { ParsedSharedStrings } from './sharedStrings';
import type { DxfStyle, ParsedStyles } from './styles';

/**
 * What the workbook read has spent so far across its sheets, so many small sheets cannot slip
 * under a per-sheet cap together.
 */
export interface WorkbookBudget {
  /**
   * Cells declared so far, charged by the worksheet parser (`#settleWorkbookCharge`; `assertSheetFits`
   * for a single-step caller).
   */
  declaredCells: number;
  /**
   * Formula characters the shared-formula translation has run over so far, the master's length
   * charged once per slave. Absent reads as zero.
   */
  translatedFormulaChars?: number;
}

/**
 * Everything the sheet reader needs besides the part.
 */
export interface WorksheetReadContext {
  name: string;
  state: SheetSnapshot['state'];
  styles: ParsedStyles;
  sharedStrings: ParsedSharedStrings;
  comments: Map<string, string>;
  /**
   * The relationship ids of the sheet's drawing parts that place at least one anchor, which
   * `read.ts` resolves before the sheet is parsed. A `<drawing>` naming any other id records nothing:
   * Google Sheets links an empty drawing from every sheet. Left out (a caller driving the parser
   * alone), every `<drawing>` records `images`, as the parser cannot see the part.
   */
  imageDrawings?: ReadonlySet<string>;
  date1904: boolean;
  dropped: DroppedFeatures;
  budget: WorkbookBudget;
}

/**
 * Serial-number offset between the 1904 and 1900 date systems (4 years and 1 day).
 */
const DATE_1904_OFFSET = 1462;

/**
 * Refuses a sheet whose declared rectangle cannot be materialized. Same messages as the ExcelJS
 * adapter; `cellColCount` is the width the cell matrix needs, `layoutColCount` includes columns
 * that only carry a width or a hidden flag.
 */
function assertSheetRectangle(
  name: string,
  rowCount: number,
  cellColCount: number,
  layoutColCount: number
): void {
  if (rowCount > MAX_SHEET_ROWS) {
    throwRowLimit(name, rowCount);
  }

  if (layoutColCount > MAX_SHEET_COLUMNS) {
    throwColumnLimit(name, layoutColCount);
  }

  if (rowCount * cellColCount > MAX_SHEET_CELLS) {
    throwCellLimit(name, rowCount, cellColCount);
  }
}

/**
 * The rectangle check plus the running workbook budget, charged in one step. The worksheet parser
 * charges its sheet in two (the declared rectangle before a row exists, the real one at the end);
 * this is the single-step form for a caller that knows the final extent up front.
 */
export function assertSheetFits(
  name: string,
  rowCount: number,
  cellColCount: number,
  layoutColCount: number,
  budget: WorkbookBudget
): void {
  assertSheetRectangle(name, rowCount, cellColCount, layoutColCount);

  budget.declaredCells += sheetBudgetUnits(rowCount, cellColCount, layoutColCount);
  assertWorkbookBudget(budget.declaredCells);
}

/**
 * What one sheet costs the workbook budget. A zero-cell row still costs one array, the column layout
 * is added on top, and a sheet always costs at least one unit, whatever it declares: a sheet with no
 * `<row>` and no `<col>` charged `0 * 1 + 0 = 0`, so a workbook of empty sheets never advanced the
 * budget at all while each of those sheets still cost a full inflate and tokenize of its part.
 */
function sheetBudgetUnits(rowCount: number, cellColCount: number, layoutColCount: number): number {
  return Math.max((rowCount * Math.max(cellColCount, 1)) + layoutColCount, 1);
}

/**
 * Refuses the workbook once its running cell total crosses `MAX_WORKBOOK_CELLS`.
 */
function assertWorkbookBudget(declaredCells: number): void {
  if (declaredCells > MAX_WORKBOOK_CELLS) {
    throwLimitExceeded(`The workbook declares ${declaredCells} cells across its sheets, `
      + `above the ${MAX_WORKBOOK_CELLS}-cell limit this reader accepts.`);
  }
}

/**
 * Splits an A1 address into 0-based row and column.
 *
 * A1 notation is 1-based on both axes, so `A0` is not an address — but it matches the shape of one,
 * and subtracting 1 from it used to hand the reader a row of `-1`, which reached `rows[-1]` and
 * surfaced as an internal `TypeError` rather than as a refusal. A reference that does not match at
 * all (`1A`, an empty `r`) is still ignored, as before: only a well-shaped one that names row or
 * column zero is refused.
 */
function decodeAddress(ref: string): { row: number; col: number } | null {
  const parsed = parseCellRef(ref);

  if (!parsed) {
    return null;
  }

  if (parsed.row < 1 || parsed.col < 1) {
    throwWithCause(`The cell reference "${ref}" is not a valid A1 address; rows and columns start at 1.`);
  }

  return { row: parsed.row - 1, col: parsed.col - 1 };
}

/**
 * Parses a `<dimension ref>` (`A1:D5`, or a bare `A1`) into 1-based last row and column, without
 * the bounds `parseRangeRef` applies – a dimension past the caps has to be *seen* so it can be
 * refused with the right message rather than silently ignored.
 */
function parseDimension(ref: string): { endRow: number; endCol: number } | null {
  const parts = ref.split(':');
  const end = decodeAddress(parts[parts.length - 1]);

  return end === null ? null : { endRow: end.row + 1, endCol: end.col + 1 };
}

/**
 * Parses a numeric `<v>`.
 */
function toNumber(text: string): CellValue {
  const value = Number(text);

  return Number.isFinite(value) ? value : null;
}

/**
 * The state of the `<c>` being read. `row` and `col` are 0-based, resolved from `r` or, when the
 * file writes none, from the cell's position in its row.
 */
interface CellState {
  row: number;
  col: number;
  type: string | undefined;
  styleIndex: number;
  formulaAttrs: XmlAttributes | null;
  formulaText: string;
  /**
   * Whether the `<f>` text crossed `MAX_FORMULA_LENGTH`. The text collected so far is discarded
   * and nothing more is appended, so the formula is dropped and the cached value kept.
   */
  formulaTooLong: boolean;
  valueText: string | null;
  /**
   * The joined, escape-decoded text of an inline string's `<is>`, or `null` while none has closed.
   */
  inlineText: string | null;
  /**
   * Whether the inline string held `<r>` runs, which the model cannot carry.
   */
  inlineRich: boolean;
}

/**
 * A shared-formula master seen so far.
 */
interface SharedMaster {
  text: string;
  row: number;
  col: number;
}

/**
 * A `<dataValidation>` waiting for the walk to finish: its `sqref` is clamped to the sheet's used
 * extent, which is not known until every row has been read.
 */
interface PendingValidation {
  sqref: string;
  formulae: string[];
  allowBlank: boolean;
}

/**
 * The `<dataValidation>` being read.
 */
interface ValidationState {
  sqref: string;
  type: string;
  allowBlank: boolean;
  formulae: string[];
}

/**
 * The `<conditionalFormatting>` block being read.
 */
interface CfState {
  ref: string;
  rules: Array<Record<string, unknown>>;
}

/**
 * The elements the cell state machine owns.
 */
const CELL_ELEMENTS = new Set(['c', 'f', 'v']);

/**
 * The elements of an inline string, forwarded to the same rich-text collector the shared-string
 * table is read with — so a `<rPh>` phonetic run is skipped and an `<r>` run is reported on both
 * paths. Only matched while the open `<c>` is typed `inlineStr`.
 */
const INLINE_STRING_ELEMENTS = new Set(['is', 'r', 'rPh', 't']);

/**
 * A zone designator at the end of an ISO 8601 date-time: `Z`, or an offset such as `+02:00`.
 */
const ZONED_DATE_TIME = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * The spellings a `t="d"` value may take: an ISO 8601 date (`2024-01-15`) or date-time with a `T`
 * (`2024-01-15T09:30:45`, optional fraction and zone). `Date.parse` reads anything else, such as
 * `2024-01-15 09:30:45` or `2024/01/15`, in the browser's time zone, so one file imported a
 * different value per zone; such a value is refused instead (`DROPPED_FEATURES.cellValueDate`).
 */
const ISO_DATE_VALUE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:[Zz]|[+-]\d{2}:?\d{2})?)?$/;

/**
 * The elements the conditional-formatting state machine owns.
 */
const CF_ELEMENTS = new Set(['conditionalFormatting', 'cfRule', 'formula']);

/**
 * The elements the data-validation state machine owns.
 */
const VALIDATION_ELEMENTS = new Set(['dataValidation', 'formula1', 'formula2']);

/**
 * The local names of the Excel 2010 extension elements a list validation is stored in when its
 * source sits on another sheet: `<x14:dataValidation>`, its `<xm:f>` formulae and its `<xm:sqref>`.
 * They are matched only inside an `<extLst>`, by the name after their prefix, which the file
 * chooses.
 */
const EXT_VALIDATION_ELEMENTS = new Set(['dataValidation', 'f', 'sqref']);

/**
 * The part of an element name after its namespace prefix.
 */
function afterPrefix(name: string): string {
  return name.slice(name.indexOf(':') + 1);
}

/**
 * Elements whose mere presence means a feature the model cannot carry, by the name it is recorded
 * under. Nothing else about them is read.
 */
const DROPPED_ON_OPEN = new Map<string, DroppedFeatureName>([
  ['autoFilter', DROPPED_FEATURES.autoFilter],
  ['hyperlink', DROPPED_FEATURES.hyperlink],
  ['tablePart', DROPPED_FEATURES.tables],
]);

/**
 * A `<pane>` split as a whole count of frozen rows or columns: a finite `xsd:double` rounded down,
 * or 0 when the text is not one or the count is negative or above `max`.
 */
function paneSplit(text: string | undefined, max: number): number {
  const value = parseFiniteDoubleAttr(text);

  if (value === null) {
    return 0;
  }

  const count = Math.floor(value);

  return count >= 0 && count <= max ? count : 0;
}

/**
 * Tells whether the `YYYY-MM-DD` part of an ISO value names a day that exists. `Date.parse` rolls
 * `2024-02-30` over to March 1 in Chromium and Firefox and refuses it in WebKit, so the same file
 * imported a different value per browser.
 */
function namesRealDay(text: string): boolean {
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(5, 7));
  const day = Number(text.slice(8, 10));
  const date = new Date(Date.UTC(2000, month - 1, day));

  date.setUTCFullYear(year);

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Reads an ISO date cell (`t="d"`) as a 1900-system serial number, or `null` for a value that is
 * not an ISO 8601 date or date-time with a `T` (`ISO_DATE_VALUE`).
 *
 * A date-time with no zone designator is read as UTC. `Date.parse` reads such a value as LOCAL
 * time (a date-only value it already reads as UTC), so the serial moved with the machine's zone:
 * `2024-01-15T12:00:00` read as 45306.458 in New York and 45306.5 in London. A serial has no zone
 * and OOXML writes the value without one, so `Z` is what the file means.
 */
function dateSerial(rawText: string): CellValue {
  const text = rawText.trim();

  if (!ISO_DATE_VALUE.test(text) || !namesRealDay(text)) {
    return null;
  }

  const iso = text.includes('T') && !ZONED_DATE_TIME.test(text) ? `${text}Z` : text;
  const ms = Date.parse(iso);

  return Number.isNaN(ms) ? null : (ms / MS_PER_DAY) + EXCEL_EPOCH_OFFSET;
}

/**
 * The state machine behind `parseWorksheet`. One instance reads one worksheet part: the tokenizer
 * is forward-only, so a `<c>`, a `<cfRule>` and a `<dataValidation>` are each assembled across
 * their open event, their children's text and their close event, and the fields below are that
 * half-built state.
 */
class WorksheetParser {
  /**
   * Everything the reader needs besides the part itself.
   */
  #ctx: WorksheetReadContext;

  /**
   * The snapshot being filled.
   */
  #sheet: SheetSnapshot;

  /**
   * The snapshot's OWN row array, aliased rather than copied: the rows the parser fills are what the
   * reader returns. `<dimension>` pre-allocates none of them; the count follows the last `<row>`.
   */
  #rows: Array<Array<CellSnapshot | null>>;

  /**
   * Shared-formula masters seen so far, by their `si`.
   */
  #shared = new Map<string, SharedMaster>();

  /**
   * Validations waiting for the sheet's used extent.
   */
  #pendingValidations: PendingValidation[] = [];

  /**
   * The width the cell matrix needs, grown by every cell and every merge.
   */
  #width = 0;

  /**
   * The last column any `<col>` element declares, which may be past the last cell.
   */
  #layoutColCount = 0;

  /**
   * The column count `<dimension>` declares, the bound the merge and validation passes clamp to.
   */
  #declaredColumns = 0;

  /**
   * The row count `<dimension>` declares, the bound a merge may grow the rows to.
   */
  #declaredRows = 0;

  /**
   * Cells covered so far by declared column, merge and validation ranges. A `sqref` may repeat the
   * same range any number of times and a `<col>` span may cover the whole sheet, so the expansion
   * work is budgeted as a whole and each range is MEASURED before it is walked — a 2.6 kB file
   * repeating one whole-column range 200 times otherwise costs seconds of synchronous CPU.
   */
  #spanCells = 0;

  /**
   * Hidden columns, as a set: a repeated `<col hidden>` declaration must not push duplicates.
   * Under the `#chargeSpan` ceiling a wide `<col hidden min="1" max="16384"/>` repeated many times
   * still builds a multi-million-element array that then gets sorted.
   */
  #hiddenColSet = new Set<number>();

  /**
   * Hidden rows, as a set, for the same reason.
   */
  #hiddenRowSet = new Set<number>();

  /**
   * The `<c>` being read.
   */
  #cell: CellState | null = null;

  /**
   * Whether the text arriving belongs to a `<v>`.
   */
  #inValue = false;

  /**
   * Whether the text arriving belongs to an `<f>`.
   */
  #inFormula = false;

  /**
   * The 0-based index of the `<row>` being read, or `null` outside one — before the first row and
   * after every `</row>`. A `<c>` with no `r` lands in this row, so one outside any row is ignored.
   */
  #currentRow: number | null = null;

  /**
   * The 0-based index of the last `<row>` opened, or `null` before the first one. A `<row>` with
   * no `r` is the row after this one. Kept apart from `#currentRow`, which `</row>` clears.
   */
  #lastRow: number | null = null;

  /**
   * The 0-based column a `<c>` with no `r` lands in: the one after the previous cell of the row,
   * column A at the start of a row. ECMA-376 makes `r` optional on both elements, and a reader
   * that dropped such a cell lost its value silently.
   */
  #nextCol = 0;

  /**
   * The rich-text collector an inline string's elements are forwarded to. One per parser, because
   * one `<is>` is open at a time; the names it receives are already normalized, so its own
   * normalizer strips nothing.
   */
  #inlineRuns = collectRichTextRuns('is', () => {}, (text, isRich) => {
    if (this.#cell !== null) {
      this.#cell.inlineText = text;
      this.#cell.inlineRich = isRich;
    }
  });

  /**
   * The `<dataValidation>` being read.
   */
  #validation: ValidationState | null = null;

  /**
   * The text chunks of the `<formula1>`/`<formula2>` being read.
   */
  #validationFormula: string[] | null = null;

  /**
   * How many `<extLst>` elements are open. Inside one, only the extension validation elements are
   * read; nothing else in an extension list belongs to the main schema.
   */
  #extDepth = 0;

  /**
   * The `<x14:dataValidation>` being read inside an `<extLst>`.
   */
  #extValidation: ValidationState | null = null;

  /**
   * The text chunks of the `<xm:f>` or `<xm:sqref>` being read inside an extension validation.
   */
  #extText: string[] | null = null;

  /**
   * The cells a list validation materialized in slots that held nothing, one object per
   * `<dataValidation>` shared by every such slot it covers. A whole-column range over rows that hold
   * no cells otherwise allocated a cell snapshot per covered slot. Kept apart so a later validation
   * replaces such a cell in its slot instead of rewriting the object the earlier one shares.
   */
  #validationOnlyCells = new WeakSet<CellSnapshot>();

  /**
   * How many units this sheet has charged the workbook budget so far: the declared rectangle once
   * `<dimension>` is read, the real extent once the walk is done.
   */
  #chargedCells = 0;

  /**
   * How many cells the workbook budget still allowed when this sheet started, which the cell walk
   * checks its own extent against as it grows, so the budget refuses before the cells exist rather
   * than after.
   */
  #workbookRoom: number;

  /**
   * The `<conditionalFormatting>` block being read.
   */
  #cf: CfState | null = null;

  /**
   * The `<cfRule>` being read.
   */
  #cfRule: { attrs: XmlAttributes; formulae: string[] } | null = null;

  /**
   * The text chunks of the `<formula>` being read inside a `<cfRule>`.
   */
  #cfFormula: string[] | null = null;

  /**
   * Strips the prefix this part's root element carries. Element names are matched with the ROOT
   * element's namespace prefix stripped: a generator may bind the main namespace to a prefix
   * (`<x:worksheet xmlns:x="…"><x:c>`), and the whole sheet would otherwise read as empty.
   * Attribute names keep their prefix, and so does an `<extLst>` extension element, whose local
   * names collide with this schema's.
   */
  #localName = createLocalName();

  /**
   * Starts a reader for one sheet.
   */
  constructor(ctx: WorksheetReadContext) {
    this.#ctx = ctx;
    this.#sheet = createSheetSnapshot(ctx.name);
    this.#rows = this.#sheet.rows;
    this.#sheet.state = ctx.state;
    this.#workbookRoom = MAX_WORKBOOK_CELLS - ctx.budget.declaredCells;
  }

  /**
   * Reads the part and returns the snapshot. The three post-walk passes run in this order because
   * each one depends on the extent the previous one grew.
   */
  parse(xml: string): SheetSnapshot {
    tokenizeXml(xml, {
      open: (rawName, attrs, selfClosing) => this.#open(rawName, attrs, selfClosing),
      text: text => this.#text(text),
      close: rawName => this.#close(rawName),
    });

    this.#materializeMerges();
    this.#applyComments();
    this.#applyValidations();
    this.#finalize();

    return this.#sheet;
  }

  /**
   * Charges a declared span against the expansion budget, refusing the sheet when it runs out.
   */
  #chargeSpan(cells: number): void {
    this.#spanCells += cells;

    if (this.#spanCells > MAX_SHEET_CELLS) {
      throwLimitExceeded(`The sheet "${this.#ctx.name}" declares column and validation ranges covering more than `
        + `${MAX_SHEET_CELLS} cells, above the limit this reader accepts.`);
    }
  }

  /**
   * Makes sure `rows` reaches `rowIndex`, refusing a row past the cap.
   */
  #ensureRow(rowIndex: number): Array<CellSnapshot | null> {
    // Belt and braces: every caller hands a whole, non-negative index (`#resolveRowIndex`,
    // `decodeAddress` and the dimension range all parse whole numbers from 1 up), so this guard is
    // unreachable from a file. It stays because a negative or fractional index would skip the
    // `while` below and return `undefined` (`rows[-1]`, `rows[1.5]`), and the next cell written
    // into it would raise an internal `TypeError` instead of this refusal.
    if (rowIndex < 0 || !Number.isInteger(rowIndex)) {
      throwWithCause(`The sheet "${this.#ctx.name}" declares a row outside the sheet.`);
    }

    if (rowIndex + 1 > MAX_SHEET_ROWS) {
      throwRowLimit(this.#ctx.name, rowIndex + 1);
    }

    while (this.#rows.length <= rowIndex) {
      this.#rows.push([]);
    }

    return this.#rows[rowIndex];
  }

  /**
   * Returns the row holding the slot at 0-based coordinates, growing the row and the sheet's width
   * to reach it and refusing a slot past the caps. The slot itself is left as it is.
   */
  #reserveSlot(rowIndex: number, colIndex: number): Array<CellSnapshot | null> {
    if (colIndex + 1 > MAX_SHEET_COLUMNS) {
      throwColumnLimit(this.#ctx.name, colIndex + 1);
    }

    const row = this.#ensureRow(rowIndex);

    while (row.length <= colIndex) {
      row.push(null);
    }

    this.#width = Math.max(this.#width, colIndex + 1);

    const cells = this.#rows.length * this.#width;

    if (cells > MAX_SHEET_CELLS) {
      throwCellLimit(this.#ctx.name, this.#rows.length, this.#width);
    }

    // The workbook budget is charged for real at the end of the sheet, but by then the cells exist:
    // 2048 sheets of 4000 cells each sat under the cap and cost 1.58 GB first. The extent only ever
    // grows, so refusing here as soon as it outgrows the room left never refuses a sheet the final
    // charge would have accepted.
    if (cells > this.#workbookRoom) {
      assertWorkbookBudget(MAX_WORKBOOK_CELLS - this.#workbookRoom + cells);
    }

    return row;
  }

  /**
   * Returns the cell at 0-based coordinates, creating it and growing the row on the way.
   */
  #cellAt(rowIndex: number, colIndex: number): CellSnapshot {
    const row = this.#reserveSlot(rowIndex, colIndex);
    let cell = row[colIndex];

    if (cell === null) {
      cell = createCellSnapshot();
      row[colIndex] = cell;
    }

    return cell;
  }

  /**
   * Settles this sheet's charge against the workbook budget at `units`, refusing the workbook when
   * the total crosses the cap. A later call replaces an earlier one rather than adding to it, so the
   * declared rectangle charged up front is given back when the real extent turns out smaller.
   */
  #settleWorkbookCharge(units: number): void {
    const { budget } = this.#ctx;

    budget.declaredCells += units - this.#chargedCells;
    this.#chargedCells = units;
    assertWorkbookBudget(budget.declaredCells);
  }

  /**
   * Handles an element's open event, routing it to the state machine that owns it.
   */
  #open(rawName: string, attrs: XmlAttributes, selfClosing: boolean): void {
    const name = this.#localName(rawName);

    if (this.#extDepth > 0 || name === 'extLst') {
      this.#openExtElement(name, attrs, selfClosing);

      return;
    }

    if (this.#isInlineStringElement(name)) {
      this.#inlineRuns.open(name, attrs, selfClosing);

      return;
    }

    if (CELL_ELEMENTS.has(name)) {
      this.#openCellElement(name, attrs, selfClosing);

      return;
    }

    if (CF_ELEMENTS.has(name)) {
      this.#openCfElement(name, attrs, selfClosing);

      return;
    }

    if (VALIDATION_ELEMENTS.has(name)) {
      this.#openValidationElement(name, attrs);

      return;
    }

    const droppedFeature = DROPPED_ON_OPEN.get(name);

    if (droppedFeature !== undefined) {
      this.#ctx.dropped.record(droppedFeature);

      return;
    }

    this.#openSheetElement(name, attrs, selfClosing);
  }

  /**
   * Handles an open element that describes the sheet itself rather than one of its state machines.
   */
  #openSheetElement(name: string, attrs: XmlAttributes, selfClosing: boolean): void {
    if (name === 'dimension') {
      this.#openDimension(attrs);
    } else if (name === 'sheetView') {
      this.#sheet.rtl = attrs.rightToLeft === '1' || attrs.rightToLeft === 'true';
    } else if (name === 'pane') {
      this.#openPane(attrs);
    } else if (name === 'col') {
      this.#openCol(attrs);
    } else if (name === 'row') {
      this.#openRow(attrs, selfClosing);
    } else if (name === 'mergeCell') {
      this.#openMergeCell(attrs);
    } else if (name === 'sheetProtection') {
      this.#openProtection(attrs);
    } else if (name === 'drawing') {
      this.#openDrawing(attrs);
    }
  }

  /**
   * Reads `<drawing>`, recording `images` when the drawing part it names places anything on the
   * sheet. The relationship id is read from `r:id`, or from any other prefix's `id` when the file
   * binds the relationships namespace to another one.
   */
  #openDrawing(attrs: XmlAttributes): void {
    const { imageDrawings } = this.#ctx;

    if (imageDrawings === undefined) {
      this.#ctx.dropped.record(DROPPED_FEATURES.images);

      return;
    }

    const idKey = attrs['r:id'] === undefined ? Object.keys(attrs).find(key => key.endsWith(':id')) : 'r:id';

    if (idKey !== undefined && imageDrawings.has(attrs[idKey])) {
      this.#ctx.dropped.record(DROPPED_FEATURES.images);
    }
  }

  /**
   * Reads `<dimension>`, the sheet's declared rectangle.
   */
  #openDimension(attrs: XmlAttributes): void {
    const dimension = attrs.ref === undefined ? null : parseDimension(attrs.ref);

    if (dimension) {
      // Refuse the declared rectangle before a single row exists, and charge it against the workbook
      // budget now rather than once the cells are built. `<cols>` comes after `<dimension>` in the
      // part, so the layout width is not known yet; the charge is settled at the real extent at the
      // end, which gives back whatever the declaration overstated.
      assertSheetRectangle(this.#ctx.name, dimension.endRow, dimension.endCol, dimension.endCol);
      this.#settleWorkbookCharge(sheetBudgetUnits(dimension.endRow, dimension.endCol, dimension.endCol));
      // The declaration bounds the merge and validation clamps, and allocates nothing: the row
      // count follows the last `<row>` or `<c>`, as ExcelJS's does. Pre-allocating the declared
      // rows made three rows under `A1:B5000` a 5000-row sheet, and a million-row declaration with
      // no row at all a million empty arrays that a validation then filled with cells.
      this.#declaredColumns = dimension.endCol;
      this.#declaredRows = dimension.endRow;
    }
  }

  /**
   * Reads `<pane>`, the frozen rows and columns. ECMA-376 types both splits as `xsd:double`, and
   * Google Sheets writes `xSplit="3.0"`, so a split is read as a finite double and rounded down. One
   * that is negative, non-finite or past the sheet's own limit on its axis reads as no split there.
   */
  #openPane(attrs: XmlAttributes): void {
    if (attrs.state === 'frozen' || attrs.state === 'frozenSplit') {
      const frozenColumns = paneSplit(attrs.xSplit, MAX_SHEET_COLUMNS);
      const frozenRows = paneSplit(attrs.ySplit, MAX_SHEET_ROWS);

      this.#sheet.freeze = frozenColumns > 0 || frozenRows > 0
        ? { rows: frozenRows, cols: frozenColumns }
        : null;
    }
  }

  /**
   * Reads one `<col>`, which declares a width and a hidden flag for a whole span of columns. A
   * `min` or `max` that is not a positive whole number, or a `min` past the `max`, makes the whole
   * element ignored; a `width` outside (0, `MAX_COLUMN_WIDTH_UNITS`] is ignored on its own.
   */
  #openCol(attrs: XmlAttributes): void {
    const min = parseUnsignedIntAttr(attrs.min);
    const max = parseUnsignedIntAttr(attrs.max);

    if (min === null || max === null || min < 1 || max < min) {
      return;
    }

    if (max > MAX_SHEET_COLUMNS) {
      throwColumnLimit(this.#ctx.name, max);
    }

    this.#chargeSpan(max - min + 1);
    this.#layoutColCount = Math.max(this.#layoutColCount, max);

    while (this.#sheet.colWidths.length < max) {
      this.#sheet.colWidths.push(null);
    }

    const declaredWidth = parseFiniteDoubleAttr(attrs.width);
    const widthValue = declaredWidth !== null && declaredWidth > 0 && declaredWidth <= MAX_COLUMN_WIDTH_UNITS
      ? declaredWidth
      : null;

    this.#applyColumnSpan(min, max, widthValue, attrs.hidden === '1' || attrs.hidden === 'true');
  }

  /**
   * Applies one `<col>`'s width and hidden flag to every column of its span.
   */
  #applyColumnSpan(min: number, max: number, widthValue: number | null, hidden: boolean): void {
    for (let c = min; c <= max; c++) {
      if (widthValue !== null) {
        this.#sheet.colWidths[c - 1] = widthValue;
      }

      if (hidden) {
        this.#hiddenColSet.add(c - 1);
      }
    }
  }

  /**
   * The 0-based row a `<row>` declares: from its `r`, or the row after the previous one when the
   * file writes none (the first such row is row 1). An `r` that is not a positive whole number
   * (`0`, `-1`, `2.5`, `1e308`, `0x10`, an empty one) is ignored like an absent one, so the row
   * is placed implicitly.
   */
  #resolveRowIndex(r: string | undefined): number {
    const declared = parseUnsignedIntAttr(r);

    if (declared !== null && declared >= 1) {
      return declared - 1;
    }

    return this.#lastRow === null ? 0 : this.#lastRow + 1;
  }

  /**
   * Reads one `<row>`'s own attributes. Its cells arrive as separate elements; a self-closing row
   * has none, so it is closed right here, because no close event will arrive for it.
   */
  #openRow(attrs: XmlAttributes, selfClosing: boolean): void {
    const rowIndex = this.#resolveRowIndex(attrs.r);

    this.#lastRow = rowIndex;
    this.#currentRow = selfClosing ? null : rowIndex;
    this.#nextCol = 0;
    this.#ensureRow(rowIndex);

    const height = parseFiniteDoubleAttr(attrs.ht);

    if (height !== null && height >= 0 && height <= MAX_ROW_HEIGHT_POINTS) {
      while (this.#sheet.rowHeights.length <= rowIndex) {
        this.#sheet.rowHeights.push(null);
      }

      this.#sheet.rowHeights[rowIndex] = height;
    }

    if (attrs.hidden === '1' || attrs.hidden === 'true') {
      this.#hiddenRowSet.add(rowIndex);
    }
  }

  /**
   * Reads one `<mergeCell>`. The members are materialized after the walk.
   *
   * Each one is charged a unit of the span budget as it is collected. The materializing pass charges
   * only a merge that still reaches the sheet, so a tiny sheet carrying any number of merges far
   * outside it kept them all, uncharged, on the snapshot.
   */
  #openMergeCell(attrs: XmlAttributes): void {
    const range = attrs.ref === undefined ? null : parseRangeRef(attrs.ref);

    if (range) {
      this.#chargeSpan(1);
      this.#sheet.merges.push({
        row: range.startRow - 1,
        col: range.startCol - 1,
        rowspan: range.endRow - range.startRow + 1,
        colspan: range.endCol - range.startCol + 1,
      });
    }
  }

  /**
   * Reads `<sheetProtection>` through the model's allow-list.
   */
  #openProtection(attrs: XmlAttributes): void {
    // The schema defaults `sheet` to false: `<sheetProtection formatCells="0"/>` alone (Apache POI
    // writes it) records permissions for a sheet nobody protected, which Excel opens as an OPEN
    // sheet - and reading it as protected imported every cell read-only. Such an element reads as
    // no protection at all and records nothing, exactly as the ExcelJS adapter reads it.
    if (attrs.sheet !== '1' && attrs.sheet !== 'true') {
      return;
    }

    const options: SheetProtectionOptions = {};

    // An ALLOW-LIST, not a shape test: the element's attributes come verbatim from the file,
    // and copying every boolean-shaped one kept an unknown attribute in the snapshot for the
    // import's lifetime — including `constructor` and `toString`, which became own properties
    // and made `options.hasOwnProperty(…)` throw for any consumer that called it.
    Object.keys(attrs).forEach((key) => {
      const raw = attrs[key];

      if (!isProtectionOptionName(key) || !(raw === '1' || raw === 'true' || raw === '0' || raw === 'false')) {
        return;
      }

      const flag = raw === '1' || raw === 'true';

      // OOXML stores a permission as `1` when the action is LOCKED, while the model (and
      // ExcelJS) say `true` for "allowed": `formatColumns="0"` reads back as `formatColumns: true`.
      options[key] = PROTECTION_INVERTED_OPTIONS.has(key) ? !flag : flag;
    });

    // The file carries a salted hash (or the legacy 16-bit `password`), never the password
    // itself, so it is reported and not modelled: a re-export cannot pretend to know it.
    if (attrs.hashValue !== undefined || attrs.algorithmName !== undefined || attrs.password !== undefined) {
      this.#ctx.dropped.record(DROPPED_FEATURES.sheetProtectionPassword);
    }

    this.#sheet.protection = { enabled: true, password: null, options };
  }

  /**
   * Handles the open event of a `<c>` or one of its children.
   */
  #openCellElement(name: string, attrs: XmlAttributes, selfClosing: boolean): void {
    if (name === 'c') {
      this.#openCell(attrs, selfClosing);

      return;
    }

    const cell = this.#cell;

    if (cell === null) {
      return;
    }

    if (name === 'f') {
      cell.formulaAttrs = attrs;
      this.#inFormula = !selfClosing;
    } else if (name === 'v') {
      cell.valueText = '';
      this.#inValue = !selfClosing;
    }
  }

  /**
   * The 0-based coordinates a `<c>` declares: from its `r`, or the column after the previous cell
   * of the current row when the file writes none. A `<c>` with no `r` outside any `<row>` has no
   * row to land in and is ignored, like one whose `r` does not parse.
   */
  #resolveCellAddress(r: string | undefined): { row: number; col: number } | null {
    if (r !== undefined) {
      return decodeAddress(r);
    }

    return this.#currentRow === null ? null : { row: this.#currentRow, col: this.#nextCol };
  }

  /**
   * Opens a `<c>`. A self-closing one — a styled cell with no content — is finished right here,
   * because no close event will arrive for it.
   */
  #openCell(attrs: XmlAttributes, selfClosing: boolean): void {
    const address = this.#resolveCellAddress(attrs.r);

    if (address === null) {
      return;
    }

    const cell: CellState = {
      row: address.row,
      col: address.col,
      type: attrs.t,
      // `xsd:unsignedInt` only: `Number()` read `s="0x1"` and `s="1e0"` as 1.
      styleIndex: parseUnsignedIntAttr(attrs.s) ?? 0,
      formulaAttrs: null,
      formulaText: '',
      formulaTooLong: false,
      valueText: null,
      inlineText: null,
      inlineRich: false,
    };

    this.#nextCol = address.col + 1;
    this.#cell = cell;

    if (selfClosing) {
      this.#finishCell(cell);
      this.#cell = null;
    }
  }

  /**
   * Whether an element belongs to the inline string of the open `<c>`.
   */
  #isInlineStringElement(name: string): boolean {
    return this.#cell !== null && this.#cell.type === 'inlineStr' && INLINE_STRING_ELEMENTS.has(name);
  }

  /**
   * Handles the open event of a `<conditionalFormatting>`, a `<cfRule>` or a rule's `<formula>`.
   */
  #openCfElement(name: string, attrs: XmlAttributes, selfClosing: boolean): void {
    if (name === 'conditionalFormatting') {
      this.#cf = { ref: attrs.sqref ?? '', rules: [] };

      if (selfClosing) {
        this.#finishConditionalFormatting();
      }

      return;
    }

    if (name === 'formula') {
      if (this.#cfRule) {
        this.#cfFormula = [];
      }

      return;
    }

    if (this.#cf) {
      this.#cfRule = { attrs, formulae: [] };

      if (selfClosing) {
        this.#finishCfRule();
      }
    }
  }

  /**
   * Handles the open event of a `<dataValidation>` or one of its formula children.
   */
  #openValidationElement(name: string, attrs: XmlAttributes): void {
    if (name === 'dataValidation') {
      this.#validation = {
        sqref: attrs.sqref ?? '',
        type: attrs.type ?? 'any',
        allowBlank: attrs.allowBlank === '1' || attrs.allowBlank === 'true',
        formulae: [],
      };

      return;
    }

    if (this.#validation) {
      this.#validationFormula = [];
    }
  }

  /**
   * Appends a piece of `<f>` text, dropping the formula as soon as it crosses the cap. The check
   * sits here, where the text is collected, so no regex ever runs over an unbounded formula (the
   * shared-formula translation below and the import's reference shift both would) and the text
   * held stays bounded: once the cap is crossed the collected text is discarded and every later
   * piece of the same `<f>` is ignored. The cell keeps its cached value.
   */
  #appendFormulaText(cell: CellState, text: string): void {
    if (cell.formulaTooLong) {
      return;
    }

    if (cell.formulaText.length + text.length > MAX_FORMULA_LENGTH) {
      cell.formulaText = '';
      cell.formulaTooLong = true;

      return;
    }

    cell.formulaText += text;
  }

  /**
   * Charges one shared-formula translation against the workbook budget, refusing the workbook
   * once the sum crosses `MAX_TRANSLATED_FORMULA_CHARS`. Charged before the translation runs, so
   * the refusal lands before the work it bounds.
   */
  #chargeTranslation(length: number): void {
    const { budget } = this.#ctx;

    budget.translatedFormulaChars = (budget.translatedFormulaChars ?? 0) + length;

    if (budget.translatedFormulaChars > MAX_TRANSLATED_FORMULA_CHARS) {
      throwLimitExceeded('The workbook\'s shared formulas translate to more than '
        + `${MAX_TRANSLATED_FORMULA_CHARS} characters, above the limit this reader accepts.`);
    }
  }

  /**
   * Accumulates character data into whichever element is collecting it.
   */
  #text(text: string): void {
    const cell = this.#cell;

    if (this.#extText !== null) {
      this.#extText.push(text);
    } else if (cell && this.#inValue) {
      cell.valueText = (cell.valueText ?? '') + text;
    } else if (cell && this.#inFormula) {
      this.#appendFormulaText(cell, text);
    } else if (cell && cell.type === 'inlineStr') {
      this.#inlineRuns.text(text);
    } else if (this.#validationFormula) {
      this.#validationFormula.push(text);
    } else if (this.#cfFormula) {
      this.#cfFormula.push(text);
    }
  }

  /**
   * Handles an element's close event, routing it to the state machine that owns it.
   */
  #close(rawName: string): void {
    const name = this.#localName(rawName);

    if (this.#extDepth > 0) {
      this.#closeExtElement(name);
    } else if (this.#isInlineStringElement(name)) {
      this.#inlineRuns.close(name);
    } else if (CELL_ELEMENTS.has(name)) {
      this.#closeCellElement(name);
    } else if (CF_ELEMENTS.has(name)) {
      this.#closeCfElement(name);
    } else if (VALIDATION_ELEMENTS.has(name)) {
      this.#closeValidationElement(name);
    } else if (name === 'row') {
      // A `<c>` with no `r` after this belongs to no row, like one before the first.
      this.#currentRow = null;
    }
  }

  /**
   * Closes a `<c>` or one of its children.
   */
  #closeCellElement(name: string): void {
    if (name === 'v') {
      this.#inValue = false;
    } else if (name === 'f') {
      this.#inFormula = false;
    } else {
      this.#closeCell();
    }
  }

  /**
   * Closes the `<c>` being read.
   */
  #closeCell(): void {
    const cell = this.#cell;

    if (cell) {
      this.#finishCell(cell);
      this.#cell = null;
    }
  }

  /**
   * Closes a `<conditionalFormatting>`, a `<cfRule>` or a rule's `<formula>`.
   */
  #closeCfElement(name: string): void {
    if (name === 'cfRule') {
      this.#finishCfRule();

      return;
    }

    if (name === 'conditionalFormatting') {
      this.#finishConditionalFormatting();

      return;
    }

    const cfRule = this.#cfRule;

    if (cfRule && this.#cfFormula) {
      cfRule.formulae.push(this.#cfFormula.join(''));
    }

    this.#cfFormula = null;
  }

  /**
   * Closes a `<dataValidation>` or one of its formula children.
   */
  #closeValidationElement(name: string): void {
    if (name === 'dataValidation') {
      this.#closeValidation();

      return;
    }

    const validation = this.#validation;

    if (validation && this.#validationFormula) {
      validation.formulae.push(this.#validationFormula.join(''));
    }

    this.#validationFormula = null;
  }

  /**
   * Files a finished `<dataValidation>`. Only a list validation has a model to go into.
   */
  #closeValidation(): void {
    const validation = this.#validation;

    if (validation !== null) {
      this.#fileValidation(validation);
      this.#validation = null;
    }
  }

  /**
   * Queues a finished list validation for the post-walk pass, or records a kind the model has no room
   * for. Both the main `<dataValidation>` and the extension `<x14:dataValidation>` end here.
   */
  #fileValidation(validation: ValidationState): void {
    if (validation.type === 'list') {
      this.#pendingValidations.push({
        sqref: validation.sqref, formulae: validation.formulae, allowBlank: validation.allowBlank,
      });
    } else {
      this.#ctx.dropped.recordUnsupported('dataValidation', validation.type);
    }
  }

  /**
   * Handles an open element inside an `<extLst>` (or the `<extLst>` itself). Excel 2010 and later
   * store a list validation whose source range sits on another sheet ONLY here, as
   * `<x14:dataValidation>` with `<xm:f>` formulae and an `<xm:sqref>`, and leave it out of
   * `<dataValidations>`; ignoring the extension lost the dropdown with nothing recorded.
   */
  #openExtElement(name: string, attrs: XmlAttributes, selfClosing: boolean): void {
    if (name === 'extLst') {
      this.#extDepth += selfClosing ? 0 : 1;

      return;
    }

    const local = afterPrefix(name);

    if (!EXT_VALIDATION_ELEMENTS.has(local)) {
      return;
    }

    if (local === 'dataValidation') {
      this.#extValidation = {
        sqref: '',
        type: attrs.type ?? 'any',
        allowBlank: attrs.allowBlank === '1' || attrs.allowBlank === 'true',
        formulae: [],
      };
    } else if (this.#extValidation !== null && !selfClosing) {
      this.#extText = [];
    }
  }

  /**
   * Handles a close event inside an `<extLst>`.
   */
  #closeExtElement(name: string): void {
    if (name === 'extLst') {
      this.#extDepth -= 1;

      return;
    }

    const local = afterPrefix(name);
    const validation = this.#extValidation;

    if (validation === null || !EXT_VALIDATION_ELEMENTS.has(local)) {
      return;
    }

    if (local === 'dataValidation') {
      this.#fileValidation(validation);
      this.#extValidation = null;
    } else if (this.#extText !== null) {
      const text = this.#extText.join('');

      if (local === 'f') {
        validation.formulae.push(text);
      } else {
        validation.sqref = text;
      }
    }

    this.#extText = null;
  }

  /**
   * Finishes the `<cfRule>` being read, appending it to the block that carries it.
   *
   * A rule kind that needs no `<formula>` child is written self-closing — `top10`, `aboveAverage`
   * and `duplicateValues` all are, by both this engine's writer and ExcelJS's — and a self-closing
   * element fires no close event, so this also runs from the open handler. Without that the rule
   * was read as if it were not in the file at all, on both engines' bytes.
   */
  #finishCfRule(): void {
    const cfRule = this.#cfRule;

    if (this.#cf && cfRule) {
      const rule = readCfRule(cfRule.attrs, cfRule.formulae, this.#ctx.styles.dxfs as DxfStyle[], this.#ctx.dropped);

      if (rule !== null) {
        this.#cf.rules.push(rule);
      }

      this.#cfRule = null;
    }
  }

  /**
   * Finishes the `<conditionalFormatting>` block being read. It too can arrive self-closing, when
   * the writer that produced it recognized none of the block's rules.
   */
  #finishConditionalFormatting(): void {
    const cf = this.#cf;

    if (cf) {
      this.#sheet.conditionalFormatting.push(cf);
      this.#cf = null;
    }
  }

  /**
   * The shared string at an index, recording rich text as a dropped feature on the way.
   */
  #sharedString(index: number): CellValue {
    if (this.#ctx.sharedStrings.rich[index]) {
      this.#ctx.dropped.record(DROPPED_FEATURES.richText);
    }

    return this.#ctx.sharedStrings.strings[index] ?? null;
  }

  /**
   * A numeric `<v>`, shifted into the 1900 system when the workbook counts from 1904 and the cell's
   * format reads as a date or a date-time. The question is answered by `classifyTemporalFormat`,
   * the import's own classification: a reader-local letter test saw the `h` of `0.0\h` (a literal)
   * and of `CHF`, and shifted serials the import then showed as numbers. A time format is not
   * shifted: a time of day or an elapsed `[h]:mm` value is a fraction of a day or a duration, the
   * same number in either date system, and shifted, a 12:00 duration imported as 1462.5.
   */
  #numberValue(rawText: string, numFmt: string | null): CellValue {
    const value = toNumber(rawText);

    if (this.#ctx.date1904 && typeof value === 'number' && numFmt !== null) {
      const kind = classifyTemporalFormat(numFmt);

      if (kind === 'date' || kind === 'datetime') {
        return value + DATE_1904_OFFSET;
      }
    }

    return value;
  }

  /**
   * An ISO date cell's serial, or `null` with `DROPPED_FEATURES.cellValueDate` recorded when the
   * text is not an ISO 8601 date or date-time (`dateSerial`) or names no real instant.
   */
  #dateValue(rawText: string): CellValue {
    const serial = dateSerial(rawText);

    if (serial === null) {
      this.#ctx.dropped.record(DROPPED_FEATURES.cellValueDate);
    }

    return serial;
  }

  /**
   * Decodes a cell's text by the `t` attribute that types it.
   *
   * An empty `<v/>` or `<v></v>` holds no value and reads as an empty cell: `Number('')` is `0`,
   * so it used to read as shared string 0 or as the number 0. The two string kinds are the
   * exception, because an empty string IS their value — `<c t="str"><f>""</f><v></v></c>` is how
   * Excel stores a formula that evaluates to the empty string. An inline string arrives already
   * decoded by the rich-text collector, so it is not decoded a second time (`_x005F_x0041_` would
   * otherwise collapse to `A`).
   */
  #decodeValue(state: CellState, rawText: string, numFmt: string | null): CellValue {
    if (rawText === '' && state.type !== 'str' && state.type !== 'inlineStr') {
      return null;
    }

    switch (state.type) {
      case 's':
        return this.#sharedString(Number(rawText));
      case 'str':
        return decodeOoxmlEscapes(rawText);
      case 'inlineStr':
        return rawText;
      case 'b':
        return rawText === '1' || rawText === 'true';
      case 'e':
        return rawText;
      case 'd':
        return this.#dateValue(rawText);
      default:
        return this.#numberValue(rawText, numFmt);
    }
  }

  /**
   * The formula text of a cell that carries an `<f>`, or `null` when it resolves to none.
   *
   * A shared formula is translated per slave: the master's text moves by the offset between the
   * two cells, relative components only.
   */
  #readFormula(state: CellState, attrs: XmlAttributes): string | null {
    if (attrs.t !== 'shared' || attrs.si === undefined) {
      return state.formulaText;
    }

    const master = this.#shared.get(attrs.si);

    if (state.formulaText !== '') {
      this.#shared.set(attrs.si, { text: state.formulaText, row: state.row, col: state.col });

      return state.formulaText;
    }

    if (master) {
      this.#chargeTranslation(master.text.length);

      return translateSharedFormula(master.text, state.row - master.row, state.col - master.col);
    }

    return null;
  }

  /**
   * Finishes the `<c>` being read.
   */
  #finishCell(state: CellState): void {
    const { cellXfs } = this.#ctx.styles;
    const xf = cellXfs[state.styleIndex] ?? cellXfs[0];
    const rawText = state.type === 'inlineStr' ? state.inlineText : state.valueText;
    let value: CellValue = rawText === null ? null : this.#decodeValue(state, rawText, xf.numFmt);
    let formula: CellSnapshot['formula'] = null;

    if (state.inlineRich) {
      this.#ctx.dropped.record(DROPPED_FEATURES.richText);
    }

    if (state.formulaTooLong) {
      this.#ctx.dropped.record(DROPPED_FEATURES.formulaTooLong);
    } else if (state.formulaAttrs !== null) {
      const text = this.#readFormula(state, state.formulaAttrs);

      if (text !== null && text !== '') {
        formula = value === null ? { text } : { text, result: value };
        value = null;
      }
    }

    const isEmpty = value === null && formula === null && xf.numFmt === null && xf.style === null && xf.locked === null;

    if (isEmpty) {
      // Still grow the width so the row is padded like a row with a real cell here would be.
      this.#cellAt(state.row, state.col);
      this.#rows[state.row][state.col] = null;

      return;
    }

    const target = this.#cellAt(state.row, state.col);

    target.value = value;
    target.formula = formula;
    target.numFmt = xf.numFmt;
    target.style = xf.style;
    target.locked = xf.locked;
  }

  /**
   * Merges: the master keeps its content, every covered cell keeps only its own style and lock. A merge member with
   * no `<c>` element of its own is MATERIALIZED here as an explicit `null`, which is what ExcelJS
   * returns for the same file — without it a merge whose covered cells were never written left the
   * row one column short, and `importFile`'s mapper, which takes the sheet width from the widest
   * row, then dropped the merge. The native writer used to emit no `<c>` for an unstyled covered
   * cell; it now writes every covered member and an empty master. The pass stays for files from
   * other producers that still leave covered cells out (Google Sheets, openpyxl, older exports).
   */
  #materializeMerges(): void {
    // The dimension is the column bound: both the
    // native writer and Excel include every merge in `<dimension>`, so a merge reaching past it is
    // malformed and stays clamped rather than growing the sheet on a hostile file's say-so. A sheet
    // that declares NO dimension (openpyxl's write-only mode, ExcelJS's streaming writer) has no
    // such bound, and clamping to the widest row cropped a merge whose covered cells carry no `<c>`:
    // there the merge widens the sheet, and the span charge below bounds a hostile one.
    const colBound = this.#declaredColumns === 0 ? MAX_SHEET_COLUMNS : Math.max(this.#width, this.#declaredColumns, 1);
    // Rows follow the same rule. Google Sheets writes a `<row>` only for a row that has a cell or a
    // height, and no `<dimension>`, so the last row of a merge over empty cells has no `<row>`:
    // clamping to the rows that exist cut `A6:B7` to one row and the grid to six rows, where
    // ExcelJS grows the sheet to the merge. A declared dimension still bounds the growth.
    const rowBound = this.#declaredRows === 0 ? MAX_SHEET_ROWS : Math.max(this.#rows.length, this.#declaredRows);

    // A merge that clamps to nothing is DROPPED rather than kept: it covers no cell the sheet holds,
    // and keeping it left any number of far-away merges on the snapshot of a one-cell sheet.
    this.#sheet.merges = this.#sheet.merges.filter((merge) => {
      const lastRow = Math.min(merge.row + merge.rowspan, rowBound);
      const lastCol = Math.min(merge.col + merge.colspan, colBound);

      if (lastRow <= merge.row || lastCol <= merge.col) {
        return false;
      }

      // The third span kind, and the one the budget originally missed. Like the column and
      // validation spans it is measured before it is walked: `<mergeCell ref="A1:XFD1048576"/>` is
      // 32 bytes and would otherwise cost a full sweep of the sheet every time it appears. The
      // padding below walks no further than this charge already paid for.
      this.#chargeSpan((lastRow - merge.row) * (lastCol - merge.col));

      // `#finalize` re-checks the rectangle with the grown width and row count, so a whole-sheet
      // merge is still refused rather than silently growing the sheet.
      this.#width = Math.max(this.#width, lastCol);
      this.#ensureRow(lastRow - 1);

      this.#padMergeMembers(merge.row, merge.col, lastRow, lastCol);

      return true;
    });
  }

  /**
   * Pads every row of a merge's row range up to its last column and empties every member but the
   * master down to its own style and lock (`createCoveredCellSnapshot`). The span this walks was
   * already charged by the caller.
   */
  #padMergeMembers(startRow: number, startCol: number, lastRow: number, lastCol: number): void {
    for (let r = startRow; r < lastRow; r++) {
      const row = this.#rows[r];

      while (row.length < lastCol) {
        row.push(null);
      }

      for (let c = startCol; c < lastCol; c++) {
        const member = row[c];

        if ((r !== startRow || c !== startCol) && member !== null) {
          row[c] = createCoveredCellSnapshot(member.style, member.locked);
        }
      }
    }
  }

  /**
   * Comments: a note on an otherwise empty cell still creates the cell.
   */
  #applyComments(): void {
    this.#ctx.comments.forEach((text, ref) => {
      const decoded = decodeAddress(ref);

      if (decoded) {
        this.#cellAt(decoded.row, decoded.col).comment = text;
      }
    });
  }

  /**
   * Validations: applied within the sheet's used extent only, so a whole-column `A1:A1048576`
   * touches the rows that exist rather than a million of them.
   */
  #applyValidations(): void {
    this.#pendingValidations.forEach(({ sqref, formulae, allowBlank }) => {
      // One object per `<dataValidation>`, shared by every cell it covers: nothing downstream
      // mutates a cell's validation, and a whole-column range no longer allocates one per cell.
      const validation: CellValidationSnapshot = { type: 'list', formulae, allowBlank };
      const shared: { cell: CellSnapshot | null } = { cell: null };

      parseMultiRangeRef(sqref).forEach((range) => {
        this.#applyValidationRange(range, validation, shared);
      });
    });
  }

  /**
   * Applies one list validation to every cell of one clamped range. Both axes clamp to what the
   * sheet USES - its rows and its widest row - never to `<dimension>`: a sparse sheet under a wide
   * dimension otherwise had every slot of the rectangle walked and kept by the mapper, and the
   * ExcelJS adapter reads a validation only on the cells it walks, so neither engine widens a sheet
   * for one.
   */
  #applyValidationRange(
    range: { startRow: number; startCol: number; endRow: number; endCol: number },
    validation: CellValidationSnapshot,
    shared: { cell: CellSnapshot | null },
  ): void {
    const lastRow = Math.min(range.endRow, this.#rows.length);
    const lastCol = Math.min(range.endCol, Math.max(this.#width, 1));

    if (lastRow < range.startRow || lastCol < range.startCol) {
      return;
    }

    this.#chargeSpan((lastRow - range.startRow + 1) * (lastCol - range.startCol + 1));

    for (let r = range.startRow; r <= lastRow; r++) {
      for (let c = range.startCol; c <= lastCol; c++) {
        this.#validateSlot(r - 1, c - 1, validation, shared);
      }
    }
  }

  /**
   * Puts one validation on one slot. A cell the sheet already holds takes the validation itself; a
   * slot that held nothing - or only another validation's shared cell - takes this validation's
   * shared cell, created on first use.
   */
  #validateSlot(
    rowIndex: number,
    colIndex: number,
    validation: CellValidationSnapshot,
    shared: { cell: CellSnapshot | null },
  ): void {
    const row = this.#reserveSlot(rowIndex, colIndex);
    const existing = row[colIndex];

    if (existing !== null && !this.#validationOnlyCells.has(existing)) {
      existing.validation = validation;

      return;
    }

    if (shared.cell === null) {
      shared.cell = createCellSnapshot();
      shared.cell.validation = validation;
      this.#validationOnlyCells.add(shared.cell);
    }

    row[colIndex] = shared.cell;
  }

  /**
   * The caps once more (the dimension may have lied low) and the workbook budget, now that the real
   * row count, cell width and column layout are all known — then the padding those numbers decide.
   */
  #finalize(): void {
    const sheet = this.#sheet;

    const layoutColCount = Math.max(this.#width, this.#layoutColCount);

    assertSheetRectangle(this.#ctx.name, this.#rows.length, this.#width, layoutColCount);
    this.#settleWorkbookCharge(sheetBudgetUnits(this.#rows.length, this.#width, layoutColCount));

    // Padding: a row that carries a cell is padded to the sheet width; a row that never got one stays [].
    this.#rows.forEach((row) => {
      if (row.length > 0) {
        while (row.length < this.#width) {
          row.push(null);
        }
      }
    });

    while (sheet.rowHeights.length < this.#rows.length) {
      sheet.rowHeights.push(null);
    }

    sheet.rowHeights.length = this.#rows.length;

    const finalLayoutColumns = Math.max(this.#width, this.#layoutColCount);

    while (sheet.colWidths.length < finalLayoutColumns) {
      sheet.colWidths.push(null);
    }

    sheet.hiddenRows = Array.from(this.#hiddenRowSet).sort((a, b) => a - b);
    sheet.hiddenCols = Array.from(this.#hiddenColSet).sort((a, b) => a - b);
  }
}

/**
 * Parses `xl/worksheets/sheetN.xml` into a `SheetSnapshot`. Rows are allocated as they appear, so a
 * sheet with cells at row 1 and row 100000 costs two rows; a declared rectangle above the caps is
 * refused from `<dimension>` before any row is read, and a row past the cap is refused as it appears
 * when there is no dimension.
 */
export function parseWorksheet(xml: string, ctx: WorksheetReadContext): SheetSnapshot {
  return new WorksheetParser(ctx).parse(xml);
}
