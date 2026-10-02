import { DROPPED_FEATURES, type DroppedFeatures } from '../../../capabilities';
import { colIndexToLetter } from '../../../cellRef';
import { addFunctionPrefixes } from '../../../functionPrefixes';
import type { CellFormula, CellSnapshot, CellValue, MergeSnapshot, SheetSnapshot } from '../../../model';
import { clampCellText, clampColumnWidth, clampRowHeight } from '../../../writeLimits';
import { escapeXmlMarkup, escapeXmlText } from '../xml/escapes';
import { type XmlAttributeMap, XmlWriter } from '../xml/writer';
import type { SheetComment } from './comments';
import { conditionalFormattingXml, maxRulePriority } from './conditionalFormatting';
import { dataValidationsXml, type ValidationCell } from './dataValidation';
import { MAIN_NS, R_NS } from './package';
import { PROTECTION_ALLOW_OPTIONS, type ProtectionHash } from './protection';
import type { SharedStringTable } from './sharedStrings';
import type { StyleTable } from './styles';

/**
 * What the sheet writer hands back besides the part itself.
 */
export interface WorksheetWriteResult {
  xml: string;
  comments: SheetComment[];
  wroteFormula: boolean;
}

/**
 * The row height in points a sheet declares for rows that carry none, the value Excel itself
 * writes for the default 11pt Calibri.
 */
const DEFAULT_ROW_HEIGHT_POINTS = 15;

/**
 * A1 address of a 0-based cell.
 */
function address(row: number, col: number): string {
  return `${colIndexToLetter(col + 1)}${row + 1}`;
}

/**
 * A1 range of a merge.
 */
function mergeRef(merge: MergeSnapshot): string {
  return `${address(merge.row, merge.col)}:${address(merge.row + merge.rowspan - 1, merge.col + merge.colspan - 1)}`;
}

/**
 * Resolves overlapping merges: the first one wins, a later one that overlaps is recorded and
 * skipped. A single-cell "merge" is skipped silently: it merges nothing, and a `<mergeCell>` of
 * one cell is not something Excel itself writes. Returns the kept merges and the set of covered
 * (non-master) cell keys.
 */
function resolveMerges(
  merges: MergeSnapshot[],
  dropped: DroppedFeatures,
): { kept: MergeSnapshot[]; covered: Set<string> } {
  const occupied = new Set<string>();
  const covered = new Set<string>();
  const kept: MergeSnapshot[] = [];

  merges.forEach((merge) => {
    if (merge.rowspan <= 1 && merge.colspan <= 1) {
      return;
    }

    const keys: string[] = [];

    for (let r = merge.row; r < merge.row + merge.rowspan; r++) {
      for (let c = merge.col; c < merge.col + merge.colspan; c++) {
        keys.push(`${r}:${c}`);
      }
    }

    if (keys.some(key => occupied.has(key))) {
      dropped.record(DROPPED_FEATURES.mergeOverlap);

      return;
    }

    keys.forEach(key => occupied.add(key));
    keys.slice(1).forEach(key => covered.add(key));
    kept.push(merge);
  });

  return { kept, covered };
}

/**
 * The text a cell value must be written as, or `null` when the value can be written as a number or
 * a boolean. A non-finite number is the case this exists for: `NaN`, `Infinity` and `-Infinity`
 * are all `typeof 'number'` and would otherwise reach `<v>` verbatim, which Excel refuses to open.
 * It is a representation, not a lost feature, so nothing is recorded in `dropped`.
 */
function stringCellText(value: CellValue): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

/**
 * The `<v>` text of a cached formula result. A boolean is written as OOXML spells it.
 */
function formulaResultText(result: CellValue | undefined): string {
  if (typeof result === 'boolean') {
    return result ? '1' : '0';
  }

  return String(result);
}

/**
 * The start tag of one `<c>`, without its `>`. The cell path is the writer's hot loop, so the tag
 * is built by hand rather than through `XmlWriter#open`: `ref` is an A1 address and `s` a number,
 * neither of which the attribute escaper could change, and `t` is one of three literals.
 */
function cellStartTag(ref: string, styleAttr: number | undefined, t: 'b' | 's' | 'str' | undefined): string {
  let tag = `<c r="${ref}"`;

  if (styleAttr !== undefined) {
    tag += ` s="${styleAttr}"`;
  }

  if (t !== undefined) {
    tag += ` t="${t}"`;
  }

  return tag;
}

/**
 * One `<c>` element holding a formula, with its cached result when the snapshot carries one. The
 * formula is `ST_Formula`, so it is escaped for markup only (no reader decodes `_xHHHH_` there) and
 * a post-2007 function gets the `_xlfn.` prefix Excel stores, or Excel shows `#NAME?` until the
 * cell is entered again. A string result is `<v>` text, which the readers DO decode, so it goes
 * through the text escaper.
 */
function formulaCellXml(ref: string, styleAttr: number | undefined, formula: CellFormula): string {
  const { text } = formula;
  const cached = formula.result;
  // A cached result is written into `<v>` just like a plain value, so a non-finite number is
  // demoted to its text form here too and the cell is then typed `str`.
  const result = typeof cached === 'number' && !Number.isFinite(cached) ? String(cached) : cached;
  const hasResult = 'result' in formula && result !== undefined && result !== null;
  let t: 'str' | 'b' | undefined;

  if (hasResult && typeof result === 'string') {
    t = 'str';
  } else if (hasResult && typeof result === 'boolean') {
    t = 'b';
  }

  const value = hasResult ? `<v>${escapeXmlText(formulaResultText(result))}</v>` : '';

  return `${cellStartTag(ref, styleAttr, t)}><f>${escapeXmlMarkup(addFunctionPrefixes(text))}</f>${value}</c>`;
}

/**
 * One `<c>` element holding a plain value, typed by the shape the value has. The `<v>` text is a
 * shared-string index, a number or a boolean digit, none of which needs escaping; the string
 * itself is escaped where it is written, in `xl/sharedStrings.xml`, and cut to the length Excel
 * stores in one cell first.
 */
function valueCellXml(
  ref: string,
  styleAttr: number | undefined,
  value: CellValue,
  strings: SharedStringTable,
  dropped: DroppedFeatures,
): string {
  const asString = stringCellText(value);

  if (asString !== null) {
    return `${cellStartTag(ref, styleAttr, 's')}><v>${strings.add(clampCellText(asString, dropped))}</v></c>`;
  }

  if (typeof value === 'boolean') {
    return `${cellStartTag(ref, styleAttr, 'b')}><v>${value ? '1' : '0'}</v></c>`;
  }

  return `${cellStartTag(ref, styleAttr, undefined)}><v>${String(value)}</v></c>`;
}

/**
 * Writes one `<c>` element as ONE string — the writer's array held three per cell before, which
 * was most of an export's peak memory. A covered merge cell keeps its style and loses its content.
 */
function writeCell(
  w: XmlWriter,
  ref: string,
  cell: CellSnapshot,
  isCovered: boolean,
  styles: StyleTable,
  strings: SharedStringTable,
  dropped: DroppedFeatures,
): boolean {
  const s = styles.xfIndex({ numFmt: cell.numFmt, style: cell.style, locked: cell.locked });
  const styleAttr = s === 0 ? undefined : s;

  if (isCovered || (cell.value === null && cell.formula === null)) {
    if (styleAttr !== undefined) {
      w.raw(`${cellStartTag(ref, styleAttr, undefined)}/>`);
    }

    return false;
  }

  if (cell.formula !== null) {
    w.raw(formulaCellXml(ref, styleAttr, cell.formula));

    return true;
  }

  w.raw(valueCellXml(ref, styleAttr, cell.value, strings, dropped));

  return false;
}

/**
 * The extent `<dimension>` declares and every later pass iterates over.
 */
interface SheetExtent {
  rowCount: number;
  colCount: number;
}

/**
 * What the `<sheetData>` pass needs besides the writer, and the shared state it reads.
 */
interface SheetDataContext {
  sheet: SheetSnapshot;
  rowCount: number;
  colCount: number;
  hiddenRows: Set<number>;
  covered: Set<string>;
  styles: StyleTable;
  strings: SharedStringTable;
  dropped: DroppedFeatures;
}

/**
 * What the `<sheetData>` pass collects for the parts written after it.
 */
interface SheetDataResult {
  comments: SheetComment[];
  validations: ValidationCell[];
  wroteFormula: boolean;
}

/**
 * The last row and column the sheet reaches, across its cells, its sizes, its hidden indexes and
 * its merges.
 */
function measureExtent(sheet: SheetSnapshot, merges: MergeSnapshot[]): SheetExtent {
  // Loops rather than `Math.max(...spread)`: a million-row sheet would overflow the argument list.
  let rowCount = Math.max(sheet.rows.length, sheet.rowHeights.length);
  let colCount = Math.max(1, sheet.colWidths.length);

  sheet.hiddenRows.forEach((r) => {
    rowCount = Math.max(rowCount, r + 1);
  });
  sheet.rows.forEach((row) => {
    colCount = Math.max(colCount, row.length);
  });
  sheet.hiddenCols.forEach((c) => {
    colCount = Math.max(colCount, c + 1);
  });
  merges.forEach((m) => {
    rowCount = Math.max(rowCount, m.row + m.rowspan);
    colCount = Math.max(colCount, m.col + m.colspan);
  });

  return { rowCount, colCount };
}

/**
 * Writes `<sheetViews>`, with the frozen pane when the sheet declares one.
 */
function writeSheetViews(w: XmlWriter, sheet: SheetSnapshot): void {
  w.open('sheetViews').open('sheetView', { workbookViewId: 0, rightToLeft: sheet.rtl ? '1' : undefined });

  if (sheet.freeze) {
    const { rows: frozenRows, cols: frozenColumns } = sheet.freeze;
    let activePane = 'bottomLeft';

    if (frozenColumns > 0 && frozenRows > 0) {
      activePane = 'bottomRight';
    } else if (frozenColumns > 0) {
      activePane = 'topRight';
    }

    w.leaf('pane', {
      xSplit: frozenColumns > 0 ? frozenColumns : undefined,
      ySplit: frozenRows > 0 ? frozenRows : undefined,
      topLeftCell: address(frozenRows, frozenColumns),
      activePane,
      state: 'frozen',
    });
    w.leaf('selection', { pane: activePane });
  }

  w.close().close();
}

/**
 * One `<col>` element, serialized on its own so an all-default column can be left out entirely.
 */
function colEntryXml(index: number, width: number | null, hidden: boolean): string {
  const inner = new XmlWriter(false);

  inner.leaf('col', {
    min: index + 1,
    max: index + 1,
    width: width ?? undefined,
    customWidth: width !== null ? '1' : undefined,
    hidden: hidden ? '1' : undefined,
  });

  return inner.toString();
}

/**
 * Writes `<cols>`, which is left out entirely when no column carries a width or is hidden. A width
 * past what Excel stores is written at Excel's maximum.
 */
function writeCols(
  w: XmlWriter, sheet: SheetSnapshot, hiddenCols: Set<number>, colCount: number, dropped: DroppedFeatures,
): void {
  const colEntries: string[] = [];

  for (let c = 0; c < colCount; c++) {
    const declared = sheet.colWidths[c] ?? null;
    const width = declared === null ? null : clampColumnWidth(declared, dropped);
    const hidden = hiddenCols.has(c);

    if (width !== null || hidden) {
      colEntries.push(colEntryXml(c, width, hidden));
    }
  }

  if (colEntries.length > 0) {
    w.open('cols').raw(colEntries.join('')).close();
  }
}

/**
 * The attributes of one `<row>`.
 */
function rowAttributes(rowIndex: number, height: number | null, hidden: boolean): XmlAttributeMap {
  return {
    r: rowIndex + 1,
    ht: height ?? undefined,
    customHeight: height !== null ? '1' : undefined,
    hidden: hidden ? '1' : undefined,
  };
}

/**
 * Writes the `<c>` elements of one row, collecting the comments, the validations and whether a
 * formula was written into `collected`.
 */
function writeRowCells(
  w: XmlWriter,
  context: SheetDataContext,
  columnLetters: string[],
  rowIndex: number,
  row: Array<CellSnapshot | null>,
  collected: SheetDataResult,
): void {
  const { covered, styles, strings, dropped } = context;
  // A `${row}:${col}` key per cell is only worth allocating when a merge can match it.
  const hasMerges = covered.size > 0;
  const rowNumber = rowIndex + 1;

  for (let c = 0; c < row.length; c++) {
    const cell = row[c];

    if (cell === null) {
      continue;
    }

    const ref = `${columnLetters[c] ?? colIndexToLetter(c + 1)}${rowNumber}`;
    const isCovered = hasMerges && covered.has(`${rowIndex}:${c}`);

    if (writeCell(w, ref, cell, isCovered, styles, strings, dropped)) {
      collected.wroteFormula = true;
    }

    if (cell.comment !== null) {
      collected.comments.push({ ref, row: rowIndex, col: c, text: cell.comment });
    }

    if (cell.validation !== null) {
      collected.validations.push({ row: rowIndex, col: c, validation: cell.validation });
    }
  }
}

/**
 * Writes `<sheetData>`. A row with no cell, no height and no hidden flag is written not at all. A
 * height past what Excel stores is written at Excel's maximum.
 */
function writeSheetData(w: XmlWriter, context: SheetDataContext): SheetDataResult {
  const { sheet, rowCount, colCount, hiddenRows, dropped } = context;
  const collected: SheetDataResult = { comments: [], validations: [], wroteFormula: false };
  // The column letters once per sheet rather than once per cell: `colIndexToLetter` is a loop
  // and a string build, and every row repeats the same first `colCount` answers.
  const columnLetters = Array.from({ length: colCount }, (_unused, c) => colIndexToLetter(c + 1));

  w.open('sheetData');

  for (let r = 0; r < rowCount; r++) {
    const row = sheet.rows[r] ?? [];
    const declaredHeight = sheet.rowHeights[r] ?? null;
    const height = declaredHeight === null ? null : clampRowHeight(declaredHeight, dropped);
    const hidden = hiddenRows.has(r);
    const hasCells = row.some(cell => cell !== null);

    if (!hasCells && height === null && !hidden) {
      continue;
    }

    w.open('row', rowAttributes(r, height, hidden));
    writeRowCells(w, context, columnLetters, r, row, collected);
    w.close();
  }

  w.close();

  return collected;
}

/**
 * Writes `<sheetProtection>`, which an unprotected sheet does not carry at all.
 */
function writeSheetProtection(w: XmlWriter, sheet: SheetSnapshot, passwordHash: ProtectionHash | null): void {
  if (!sheet.protection?.enabled) {
    return;
  }

  const { options } = sheet.protection;
  const attrs: XmlAttributeMap = { sheet: '1' };

  if (options.selectLockedCells === false) {
    attrs.selectLockedCells = '1';
  }

  if (options.selectUnlockedCells === false) {
    attrs.selectUnlockedCells = '1';
  }

  // `objects` and `scenarios` default to "allowed" like every other permission, so the attribute
  // is written only when the caller locked them down. Writing them unconditionally made ExcelJS's
  // reader — which inverts both — report `objects: false, scenarios: false` on native bytes.
  if (options.objects === false) {
    attrs.objects = '1';
  }

  if (options.scenarios === false) {
    attrs.scenarios = '1';
  }

  PROTECTION_ALLOW_OPTIONS.forEach((key) => {
    if (options[key] === true) {
      attrs[key] = '0';
    }
  });

  if (passwordHash) {
    attrs.algorithmName = passwordHash.algorithmName;
    attrs.hashValue = passwordHash.hashValue;
    attrs.saltValue = passwordHash.saltValue;
    attrs.spinCount = String(passwordHash.spinCount);
  }

  w.leaf('sheetProtection', attrs);
}

/**
 * Writes `<mergeCells>`, which a sheet with no surviving merge does not carry at all.
 */
function writeMergeCells(w: XmlWriter, merges: MergeSnapshot[]): void {
  if (merges.length === 0) {
    return;
  }

  w.open('mergeCells', { count: merges.length });
  merges.forEach(merge => w.leaf('mergeCell', { ref: mergeRef(merge) }));
  w.close();
}

/**
 * Serializes `xl/worksheets/sheetN.xml` for one snapshot. Child order is schema-fixed; a wrong
 * order makes Excel offer to "repair" the file — this function IS that order.
 */
export function worksheetXml(
  sheet: SheetSnapshot,
  styles: StyleTable,
  strings: SharedStringTable,
  dropped: DroppedFeatures,
  passwordHash: ProtectionHash | null,
): WorksheetWriteResult {
  const { kept: merges, covered } = resolveMerges(sheet.merges, dropped);
  const { rowCount, colCount } = measureExtent(sheet, merges);
  const hiddenRows = new Set(sheet.hiddenRows);
  const hiddenCols = new Set(sheet.hiddenCols);

  const w = new XmlWriter().open('worksheet', { xmlns: MAIN_NS, 'xmlns:r': R_NS });

  w.leaf('dimension', { ref: rowCount === 0 ? 'A1' : `A1:${address(rowCount - 1, colCount - 1)}` });

  writeSheetViews(w, sheet);
  w.leaf('sheetFormatPr', { defaultRowHeight: DEFAULT_ROW_HEIGHT_POINTS });
  writeCols(w, sheet, hiddenCols, colCount, dropped);

  const { comments, validations, wroteFormula } = writeSheetData(w, {
    sheet, rowCount, colCount, hiddenRows, covered, styles, strings, dropped,
  });

  writeSheetProtection(w, sheet, passwordHash);
  writeMergeCells(w, merges);

  const priority = { next: maxRulePriority(sheet.conditionalFormatting) + 1 };

  sheet.conditionalFormatting.forEach(({ ref, rules }) => {
    w.raw(conditionalFormattingXml(ref, rules, styles, priority, dropped));
  });

  w.raw(dataValidationsXml(validations));
  w.leaf('pageMargins', {
    left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3,
  });

  if (comments.length > 0) {
    w.leaf('legacyDrawing', { 'r:id': 'rId2' });
  }

  return { xml: w.close().toString(), comments, wroteFormula };
}
