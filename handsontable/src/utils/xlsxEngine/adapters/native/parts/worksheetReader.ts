import { throwWithCause } from '../../../../../helpers/errors';
import { DROPPED_FEATURES, type DroppedFeatureName, type DroppedFeatures } from '../../../capabilities';
import { parseCellRef, parseMultiRangeRef, parseRangeRef } from '../../../cellRef';
import { EXCEL_EPOCH_OFFSET, MS_PER_DAY } from '../../../dates';
import { translateSharedFormula } from '../../../formulaRefs';
import {
  MAX_SHEET_CELLS, MAX_SHEET_COLUMNS, MAX_SHEET_ROWS, MAX_WORKBOOK_CELLS, throwCellLimit,
  throwColumnLimit, throwLimitExceeded, throwRowLimit,
} from '../../../limits';
import {
  createCellSnapshot, createSheetSnapshot, isProtectionOptionName, type CellSnapshot, type CellValue,
  type SheetProtectionOptions, type SheetSnapshot,
} from '../../../model';
import { decodeOoxmlEscapes } from '../xml/escapes';
import { createLocalName, tokenizeXml, type XmlAttributes } from '../xml/tokenizer';
import { cfRuleFromXml } from './conditionalFormatting';
import { PROTECTION_INVERTED_OPTIONS } from './protection';
import type { ParsedSharedStrings } from './sharedStrings';
import type { DxfStyle, ParsedStyles } from './styles';

/**
 * Cells declared so far across the workbook, so many small sheets cannot slip under the per-sheet cap.
 */
export interface WorkbookBudget {
  declaredCells: number;
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
  date1904: boolean;
  dropped: DroppedFeatures;
  budget: WorkbookBudget;
}

/**
 * Serial-number offset between the 1904 and 1900 date systems (4 years and 1 day).
 */
const DATE_1904_OFFSET = 1462;

/**
 * The `date1904` shift applies to cells whose format reads as a date or time; this mirrors the
 * import's own heuristic loosely (any of the temporal codes outside quotes and brackets).
 */
function isTemporalFormat(numFmt: string | null): boolean {
  if (numFmt === null) {
    return false;
  }

  const stripped = numFmt.replace(/\[[^\]]*\]/g, '').replace(/"[^"]*"/g, '');

  return /[ymdhs]/i.test(stripped);
}

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
 * The rectangle check plus the running workbook budget. A zero-cell row still costs one array
 * (`max(cellColCount, 1)`), the column layout is added on top, and the whole sheet costs at least
 * one unit, so many empty sheets cannot slip under the cap together.
 */
export function assertSheetFits(
  name: string,
  rowCount: number,
  cellColCount: number,
  layoutColCount: number,
  budget: WorkbookBudget
): void {
  assertSheetRectangle(name, rowCount, cellColCount, layoutColCount);

  // A sheet always costs at least one unit, whatever it declares: a sheet with no `<row>` and no
  // `<col>` charged `0 * 1 + 0 = 0`, so a workbook of empty sheets never advanced the budget at all
  // while each of those sheets still cost a full inflate and tokenize of its part.
  budget.declaredCells += Math.max((rowCount * Math.max(cellColCount, 1)) + layoutColCount, 1);

  if (budget.declaredCells > MAX_WORKBOOK_CELLS) {
    throwLimitExceeded(`The workbook declares ${budget.declaredCells} cells across its sheets, `
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
 * The state of the `<c>` being read.
 */
interface CellState {
  ref: string;
  row: number;
  col: number;
  type: string | undefined;
  styleIndex: number;
  formulaAttrs: XmlAttributes | null;
  formulaText: string;
  valueText: string | null;
  inlineText: string[];
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
const CELL_ELEMENTS = new Set(['c', 'f', 'v', 't']);

/**
 * The elements the conditional-formatting state machine owns.
 */
const CF_ELEMENTS = new Set(['conditionalFormatting', 'cfRule', 'formula']);

/**
 * The elements the data-validation state machine owns.
 */
const VALIDATION_ELEMENTS = new Set(['dataValidation', 'formula1', 'formula2']);

/**
 * Elements whose mere presence means a feature the model cannot carry, by the name it is recorded
 * under. Nothing else about them is read.
 */
const DROPPED_ON_OPEN = new Map<string, DroppedFeatureName>([
  ['autoFilter', DROPPED_FEATURES.autoFilter],
  ['hyperlink', DROPPED_FEATURES.hyperlink],
  ['drawing', DROPPED_FEATURES.images],
  ['tablePart', DROPPED_FEATURES.tables],
]);

/**
 * Reads an ISO date cell (`t="d"`) as a 1900-system serial number.
 */
function dateSerial(rawText: string): CellValue {
  const ms = Date.parse(rawText);

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
   * The snapshot's OWN row array, aliased rather than copied: the declared tail rows a
   * `<dimension>` pre-allocates are part of what the reader returns.
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
   * Whether the text arriving belongs to an inline string's `<t>`.
   */
  #inInlineText = false;

  /**
   * The `<dataValidation>` being read.
   */
  #validation: ValidationState | null = null;

  /**
   * The text chunks of the `<formula1>`/`<formula2>` being read.
   */
  #validationFormula: string[] | null = null;

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
    // Belt and braces for the lower bound: `decodeAddress` refuses row zero, and a negative index
    // would otherwise skip the `while` below and return `rows[-1]`, which is `undefined`.
    if (rowIndex < 0) {
      throwWithCause(`The sheet "${this.#ctx.name}" declares a row before the first one.`);
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
   * Returns the cell at 0-based coordinates, creating it and growing the row on the way.
   */
  #cellAt(rowIndex: number, colIndex: number): CellSnapshot {
    if (colIndex + 1 > MAX_SHEET_COLUMNS) {
      throwColumnLimit(this.#ctx.name, colIndex + 1);
    }

    const row = this.#ensureRow(rowIndex);

    while (row.length <= colIndex) {
      row.push(null);
    }

    this.#width = Math.max(this.#width, colIndex + 1);

    if (this.#rows.length * this.#width > MAX_SHEET_CELLS) {
      throwCellLimit(this.#ctx.name, this.#rows.length, this.#width);
    }

    if (row[colIndex] === null) {
      row[colIndex] = createCellSnapshot();
    }

    return row[colIndex] as CellSnapshot;
  }

  /**
   * Handles an element's open event, routing it to the state machine that owns it.
   */
  #open(rawName: string, attrs: XmlAttributes, selfClosing: boolean): void {
    const name = this.#localName(rawName);

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

    this.#openSheetElement(name, attrs);
  }

  /**
   * Handles an open element that describes the sheet itself rather than one of its state machines.
   */
  #openSheetElement(name: string, attrs: XmlAttributes): void {
    if (name === 'dimension') {
      this.#openDimension(attrs);
    } else if (name === 'sheetView') {
      this.#sheet.rtl = attrs.rightToLeft === '1' || attrs.rightToLeft === 'true';
    } else if (name === 'pane') {
      this.#openPane(attrs);
    } else if (name === 'col') {
      this.#openCol(attrs);
    } else if (name === 'row') {
      this.#openRow(attrs);
    } else if (name === 'mergeCell') {
      this.#openMergeCell(attrs);
    } else if (name === 'sheetProtection') {
      this.#openProtection(attrs);
    }
  }

  /**
   * Reads `<dimension>`, the sheet's declared rectangle.
   */
  #openDimension(attrs: XmlAttributes): void {
    const dimension = attrs.ref === undefined ? null : parseDimension(attrs.ref);

    if (dimension) {
      // Refuse the declared rectangle before a single row exists. `<cols>` comes after
      // `<dimension>` in the part, so the layout width is not known yet; the workbook budget
      // is charged once at the end, when it is.
      assertSheetRectangle(this.#ctx.name, dimension.endRow, dimension.endCol, dimension.endCol);
      this.#declaredColumns = dimension.endCol;
      // A declared tail row with no `<row>` element still exists, as `[]` – the ExcelJS
      // adapter reports `rowCount` from the same declaration.
      this.#ensureRow(dimension.endRow - 1);
    }
  }

  /**
   * Reads `<pane>`, the frozen rows and columns.
   */
  #openPane(attrs: XmlAttributes): void {
    if (attrs.state === 'frozen' || attrs.state === 'frozenSplit') {
      const frozenColumns = Number(attrs.xSplit ?? 0);
      const frozenRows = Number(attrs.ySplit ?? 0);

      this.#sheet.freeze = frozenColumns > 0 || frozenRows > 0
        ? { rows: frozenRows, cols: frozenColumns }
        : null;
    }
  }

  /**
   * Reads one `<col>`, which declares a width and a hidden flag for a whole span of columns.
   */
  #openCol(attrs: XmlAttributes): void {
    const min = Number(attrs.min);
    const max = Number(attrs.max);

    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 1 || max < min) {
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

    const widthValue = attrs.width === undefined ? null : Number(attrs.width);

    this.#applyColumnSpan(min, max, widthValue, attrs.hidden === '1' || attrs.hidden === 'true');
  }

  /**
   * Applies one `<col>`'s width and hidden flag to every column of its span.
   */
  #applyColumnSpan(min: number, max: number, widthValue: number | null, hidden: boolean): void {
    for (let c = min; c <= max; c++) {
      if (widthValue !== null && Number.isFinite(widthValue)) {
        this.#sheet.colWidths[c - 1] = widthValue;
      }

      if (hidden) {
        this.#hiddenColSet.add(c - 1);
      }
    }
  }

  /**
   * Reads one `<row>`'s own attributes. Its cells arrive as separate elements.
   */
  #openRow(attrs: XmlAttributes): void {
    const r = Number(attrs.r);

    if (!Number.isFinite(r) || r < 1) {
      return;
    }

    this.#ensureRow(r - 1);

    if (attrs.ht !== undefined && Number.isFinite(Number(attrs.ht))) {
      while (this.#sheet.rowHeights.length < r) {
        this.#sheet.rowHeights.push(null);
      }

      this.#sheet.rowHeights[r - 1] = Number(attrs.ht);
    }

    if (attrs.hidden === '1' || attrs.hidden === 'true') {
      this.#hiddenRowSet.add(r - 1);
    }
  }

  /**
   * Reads one `<mergeCell>`. The members are materialized after the walk.
   */
  #openMergeCell(attrs: XmlAttributes): void {
    const range = attrs.ref === undefined ? null : parseRangeRef(attrs.ref);

    if (range) {
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
    } else if (name === 't' && cell.type === 'inlineStr') {
      this.#inInlineText = !selfClosing;
    }
  }

  /**
   * Opens a `<c>`. A self-closing one — a styled cell with no content — is finished right here,
   * because no close event will arrive for it.
   */
  #openCell(attrs: XmlAttributes, selfClosing: boolean): void {
    const decoded = attrs.r === undefined ? null : decodeAddress(attrs.r);

    if (decoded === null) {
      return;
    }

    const cell: CellState = {
      ref: attrs.r as string,
      row: decoded.row,
      col: decoded.col,
      type: attrs.t,
      styleIndex: Number(attrs.s ?? 0),
      formulaAttrs: null,
      formulaText: '',
      valueText: null,
      inlineText: [],
    };

    this.#cell = cell;

    if (selfClosing) {
      this.#finishCell(cell);
      this.#cell = null;
    }
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
   * Accumulates character data into whichever element is collecting it.
   */
  #text(text: string): void {
    const cell = this.#cell;

    if (cell && this.#inValue) {
      cell.valueText = (cell.valueText ?? '') + text;
    } else if (cell && this.#inFormula) {
      cell.formulaText += text;
    } else if (cell && this.#inInlineText) {
      cell.inlineText.push(text);
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

    if (CELL_ELEMENTS.has(name)) {
      this.#closeCellElement(name);
    } else if (CF_ELEMENTS.has(name)) {
      this.#closeCfElement(name);
    } else if (VALIDATION_ELEMENTS.has(name)) {
      this.#closeValidationElement(name);
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
    } else if (name === 't') {
      this.#inInlineText = false;
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

    if (validation === null) {
      return;
    }

    if (validation.type === 'list') {
      this.#pendingValidations.push({
        sqref: validation.sqref, formulae: validation.formulae, allowBlank: validation.allowBlank,
      });
    } else {
      this.#ctx.dropped.recordUnsupported('dataValidation', validation.type);
    }

    this.#validation = null;
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
      this.#cf.rules.push(cfRuleFromXml(cfRule.attrs, cfRule.formulae, this.#ctx.styles.dxfs as DxfStyle[]));
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
   * format reads as a date or a time.
   */
  #numberValue(rawText: string, numFmt: string | null): CellValue {
    const value = toNumber(rawText);

    if (this.#ctx.date1904 && typeof value === 'number' && isTemporalFormat(numFmt)) {
      return value + DATE_1904_OFFSET;
    }

    return value;
  }

  /**
   * Decodes a cell's text by the `t` attribute that types it.
   */
  #decodeValue(state: CellState, rawText: string, numFmt: string | null): CellValue {
    switch (state.type) {
      case 's':
        return this.#sharedString(Number(rawText));
      case 'str':
      case 'inlineStr':
        return decodeOoxmlEscapes(rawText);
      case 'b':
        return rawText === '1' || rawText === 'true';
      case 'e':
        return rawText;
      case 'd':
        return dateSerial(rawText);
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
    const rawText = state.type === 'inlineStr' ? state.inlineText.join('') : state.valueText;
    let value: CellValue = rawText === null ? null : this.#decodeValue(state, rawText, xf.numFmt);
    let formula: CellSnapshot['formula'] = null;

    if (state.formulaAttrs !== null) {
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
   * Merges: the master keeps its content, every covered cell reads as empty. A merge member with
   * no `<c>` element of its own is MATERIALIZED here as an explicit `null`, which is what ExcelJS
   * returns for the same file — without it a merge whose covered cells were never written (the
   * native writer emits no `<c>` for an unstyled covered cell) left the row one column short, and
   * `importFile`'s mapper, which takes the sheet width from the widest row, then dropped the merge.
   */
  #materializeMerges(): void {
    this.#sheet.merges.forEach((merge) => {
      const lastRow = Math.min(merge.row + merge.rowspan, this.#rows.length);
      // The dimension is the bound, the same one the validation pass below uses: both the native
      // writer and Excel include every merge in `<dimension>`, so a merge reaching past it is
      // malformed and stays clamped rather than growing the sheet on a hostile file's say-so.
      const lastCol = Math.min(merge.col + merge.colspan, Math.max(this.#width, this.#declaredColumns, 1));

      if (lastRow <= merge.row || lastCol <= merge.col) {
        return;
      }

      // The third span kind, and the one the budget originally missed. Like the column and
      // validation spans it is measured before it is walked: `<mergeCell ref="A1:XFD1048576"/>` is
      // 32 bytes and would otherwise cost a full sweep of the sheet every time it appears. The
      // padding below walks no further than this charge already paid for.
      this.#chargeSpan((lastRow - merge.row) * (lastCol - merge.col));

      // `assertSheetFits` below re-checks the rectangle with the grown width, so a whole-sheet merge
      // is still refused rather than silently widening the sheet.
      this.#width = Math.max(this.#width, lastCol);

      this.#padMergeMembers(merge.row, merge.col, lastRow, lastCol);
    });
  }

  /**
   * Pads every row of a merge's row range up to its last column and blanks every member but the
   * master. The span this walks was already charged by the caller.
   */
  #padMergeMembers(startRow: number, startCol: number, lastRow: number, lastCol: number): void {
    for (let r = startRow; r < lastRow; r++) {
      const row = this.#rows[r];

      while (row.length < lastCol) {
        row.push(null);
      }

      for (let c = startCol; c < lastCol; c++) {
        if (r !== startRow || c !== startCol) {
          row[c] = null;
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
      parseMultiRangeRef(sqref).forEach((range) => {
        this.#applyValidationRange(range, formulae, allowBlank);
      });
    });
  }

  /**
   * Applies one list validation to every cell of one clamped range.
   */
  #applyValidationRange(
    range: { startRow: number; startCol: number; endRow: number; endCol: number },
    formulae: string[],
    allowBlank: boolean,
  ): void {
    const lastRow = Math.min(range.endRow, this.#rows.length);
    const lastCol = Math.min(range.endCol, Math.max(this.#width, this.#declaredColumns, 1));

    if (lastRow < range.startRow || lastCol < range.startCol) {
      return;
    }

    this.#chargeSpan((lastRow - range.startRow + 1) * (lastCol - range.startCol + 1));

    for (let r = range.startRow; r <= lastRow; r++) {
      for (let c = range.startCol; c <= lastCol; c++) {
        this.#cellAt(r - 1, c - 1).validation = { type: 'list', formulae, allowBlank };
      }
    }
  }

  /**
   * The caps once more (the dimension may have lied low) and the workbook budget, now that the real
   * row count, cell width and column layout are all known — then the padding those numbers decide.
   */
  #finalize(): void {
    const sheet = this.#sheet;

    assertSheetFits(this.#ctx.name, this.#rows.length, this.#width, Math.max(this.#width, this.#layoutColCount),
      this.#ctx.budget);

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
