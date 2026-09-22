import { throwWithCause } from '../../../../../helpers/errors';
import type { DroppedFeatures } from '../../../capabilities';
import { colLetterToIndex, parseMultiRangeRef, parseRangeRef } from '../../../cellRef';
import { translateSharedFormula } from '../../../formulaRefs';
import {
  MAX_SHEET_CELLS, MAX_SHEET_COLUMNS, MAX_SHEET_ROWS, MAX_WORKBOOK_CELLS, throwLimitExceeded,
} from '../../../limits';
import {
  createCellSnapshot, createSheetSnapshot, type CellSnapshot, type CellValue, type SheetSnapshot,
} from '../../../model';
import { createLocalName, tokenizeXml, type XmlAttributes } from '../xml/tokenizer';
import { decodeOoxmlEscapes } from '../xml/writer';
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
 * `<sheetProtection>` attributes that describe the password hash rather than a permission.
 */
const PROTECTION_HASH_ATTRS = new Set(['algorithmName', 'hashValue', 'saltValue', 'spinCount', 'password']);

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
export function assertSheetRectangle(
  name: string,
  rowCount: number,
  cellColCount: number,
  layoutColCount: number
): void {
  if (rowCount > MAX_SHEET_ROWS) {
    throwLimitExceeded(`The sheet "${name}" declares ${rowCount} rows, `
      + `above the ${MAX_SHEET_ROWS}-row limit this reader accepts.`);
  }

  if (layoutColCount > MAX_SHEET_COLUMNS) {
    throwLimitExceeded(`The sheet "${name}" declares ${layoutColCount} columns, `
      + `above the ${MAX_SHEET_COLUMNS}-column limit this reader accepts.`);
  }

  if (rowCount * cellColCount > MAX_SHEET_CELLS) {
    throwLimitExceeded(`The sheet "${name}" declares ${rowCount} × ${cellColCount} cells, `
      + `above the ${MAX_SHEET_CELLS}-cell limit this reader accepts.`);
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
  const match = /^\$?([A-Z]{1,3})\$?(\d{1,7})$/i.exec(ref);

  if (!match) {
    return null;
  }

  const row = Number(match[2]);
  const col = colLetterToIndex(match[1].toUpperCase());

  if (row < 1 || col < 1) {
    throwWithCause(`The cell reference "${ref}" is not a valid A1 address; rows and columns start at 1.`);
  }

  return { row: row - 1, col: col - 1 };
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
 * Parses `xl/worksheets/sheetN.xml` into a `SheetSnapshot`. Rows are allocated as they appear, so a
 * sheet with cells at row 1 and row 100000 costs two rows; a declared rectangle above the caps is
 * refused from `<dimension>` before any row is read, and a row past the cap is refused as it appears
 * when there is no dimension.
 */
export function parseWorksheet(xml: string, ctx: WorksheetReadContext): SheetSnapshot {
  const sheet = createSheetSnapshot(ctx.name);
  const { rows } = sheet;
  const { dropped } = ctx;
  const shared = new Map<string, SharedMaster>();
  const pendingValidations: Array<{ sqref: string; formulae: string[]; allowBlank: boolean }> = [];
  let width = 0;
  let layoutColCount = 0;
  let declaredCols = 0;
  // Cells covered so far by declared column and validation ranges. A `sqref` may repeat the same
  // range any number of times and a `<col>` span may cover the whole sheet, so the expansion work is
  // budgeted as a whole and each range is MEASURED before it is walked — a 2.6 kB file repeating one
  // whole-column range 200 times otherwise costs seconds of synchronous CPU.
  let spanCells = 0;
  // A repeated `<col hidden>`/`<row hidden>` declaration must not push duplicates: under the
  // `chargeSpan` ceiling a wide `<col hidden min="1" max="16384"/>` repeated many times still
  // builds a multi-million-element array that then gets sorted.
  const hiddenColSet = new Set<number>();
  const hiddenRowSet = new Set<number>();
  let cell: CellState | null = null;
  let inValue = false;
  let inFormula = false;
  let inInlineText = false;
  let validation: { sqref: string; type: string; allowBlank: boolean; formulae: string[] } | null = null;
  let validationFormula: string[] | null = null;
  let cf: { ref: string; rules: Array<Record<string, unknown>> } | null = null;
  let cfRule: { attrs: XmlAttributes; formulae: string[] } | null = null;
  let cfFormula: string[] | null = null;

  sheet.state = ctx.state;

  /**
   * Charges a declared span against the expansion budget, refusing the sheet when it runs out.
   */
  const chargeSpan = (cells: number): void => {
    spanCells += cells;

    if (spanCells > MAX_SHEET_CELLS) {
      throwLimitExceeded(`The sheet "${ctx.name}" declares column and validation ranges covering more than `
        + `${MAX_SHEET_CELLS} cells, above the limit this reader accepts.`);
    }
  };

  /**
   * Makes sure `rows` reaches `rowIndex`, refusing a row past the cap.
   */
  const ensureRow = (rowIndex: number): Array<CellSnapshot | null> => {
    // Belt and braces for the lower bound: `decodeAddress` refuses row zero, and a negative index
    // would otherwise skip the `while` below and return `rows[-1]`, which is `undefined`.
    if (rowIndex < 0) {
      throwWithCause(`The sheet "${ctx.name}" declares a row before the first one.`);
    }

    if (rowIndex + 1 > MAX_SHEET_ROWS) {
      throwLimitExceeded(`The sheet "${ctx.name}" declares ${rowIndex + 1} rows, `
        + `above the ${MAX_SHEET_ROWS}-row limit this reader accepts.`);
    }

    while (rows.length <= rowIndex) {
      rows.push([]);
    }

    return rows[rowIndex];
  };

  /**
   * Returns the cell at 0-based coordinates, creating it and growing the row on the way.
   */
  const cellAt = (rowIndex: number, colIndex: number): CellSnapshot => {
    if (colIndex + 1 > MAX_SHEET_COLUMNS) {
      throwLimitExceeded(`The sheet "${ctx.name}" declares ${colIndex + 1} columns, `
        + `above the ${MAX_SHEET_COLUMNS}-column limit this reader accepts.`);
    }

    const row = ensureRow(rowIndex);

    while (row.length <= colIndex) {
      row.push(null);
    }

    width = Math.max(width, colIndex + 1);

    if (rows.length * width > MAX_SHEET_CELLS) {
      throwLimitExceeded(`The sheet "${ctx.name}" declares ${rows.length} × ${width} cells, `
        + `above the ${MAX_SHEET_CELLS}-cell limit this reader accepts.`);
    }

    if (row[colIndex] === null) {
      row[colIndex] = createCellSnapshot();
    }

    return row[colIndex] as CellSnapshot;
  };

  /**
   * Finishes the `<cfRule>` being read, appending it to the block that carries it.
   *
   * A rule kind that needs no `<formula>` child is written self-closing — `top10`, `aboveAverage`
   * and `duplicateValues` all are, by both this engine's writer and ExcelJS's — and a self-closing
   * element fires no close event, so this also runs from the open handler. Without that the rule
   * was read as if it were not in the file at all, on both engines' bytes.
   */
  const finishCfRule = (): void => {
    if (cf && cfRule) {
      cf.rules.push(cfRuleFromXml(cfRule.attrs, cfRule.formulae, ctx.styles.dxfs as DxfStyle[]));
      cfRule = null;
    }
  };

  /**
   * Finishes the `<conditionalFormatting>` block being read. It too can arrive self-closing, when
   * the writer that produced it recognized none of the block's rules.
   */
  const finishConditionalFormatting = (): void => {
    if (cf) {
      sheet.conditionalFormatting.push(cf);
      cf = null;
    }
  };

  /**
   * Finishes the `<c>` being read.
   */
  const finishCell = (state: CellState): void => {
    const xf = ctx.styles.cellXfs[state.styleIndex] ?? ctx.styles.cellXfs[0];
    let value: CellValue = null;
    let formula: CellSnapshot['formula'] = null;

    const rawText = state.type === 'inlineStr' ? state.inlineText.join('') : state.valueText;

    if (rawText !== null) {
      switch (state.type) {
        case 's': {
          const index = Number(rawText);

          value = ctx.sharedStrings.strings[index] ?? null;

          if (ctx.sharedStrings.rich[index]) {
            dropped.record('richText');
          }
          break;
        }
        case 'str':
        case 'inlineStr':
          value = decodeOoxmlEscapes(rawText);
          break;
        case 'b':
          value = rawText === '1' || rawText === 'true';
          break;
        case 'e':
          value = rawText;
          break;
        case 'd': {
          const ms = Date.parse(rawText);

          value = Number.isNaN(ms) ? null : (ms / 86400000) + 25569;
          break;
        }
        default:
          value = toNumber(rawText);

          if (ctx.date1904 && typeof value === 'number' && isTemporalFormat(xf.numFmt)) {
            value += DATE_1904_OFFSET;
          }
      }
    }

    if (state.formulaAttrs !== null) {
      let text: string | null = state.formulaText;

      if (state.formulaAttrs.t === 'shared' && state.formulaAttrs.si !== undefined) {
        const master = shared.get(state.formulaAttrs.si);

        if (state.formulaText !== '') {
          shared.set(state.formulaAttrs.si, { text: state.formulaText, row: state.row, col: state.col });
        } else if (master) {
          text = translateSharedFormula(master.text, state.row - master.row, state.col - master.col);
        } else {
          text = null;
        }
      }

      if (text !== null && text !== '') {
        formula = value === null ? { text } : { text, result: value };
        value = null;
      }
    }

    const isEmpty = value === null && formula === null && xf.numFmt === null && xf.style === null && xf.locked === null;

    if (isEmpty) {
      // Still grow the width so the row is padded like a row with a real cell here would be.
      cellAt(state.row, state.col);
      rows[state.row][state.col] = null;

      return;
    }

    const target = cellAt(state.row, state.col);

    target.value = value;
    target.formula = formula;
    target.numFmt = xf.numFmt;
    target.style = xf.style;
    target.locked = xf.locked;
  };

  // Element names are matched with the ROOT element's namespace prefix stripped: a generator may
  // bind the main namespace to a prefix (`<x:worksheet xmlns:x="…"><x:c>`), and the whole sheet
  // would otherwise read as empty. Attribute names keep their prefix, and so does an `<extLst>`
  // extension element, whose local names collide with this schema's.
  const localName = createLocalName();

  tokenizeXml(xml, {
    open(rawName, attrs, selfClosing) {
      const name = localName(rawName);

      switch (name) {
        case 'dimension': {
          const dimension = attrs.ref === undefined ? null : parseDimension(attrs.ref);

          if (dimension) {
            // Refuse the declared rectangle before a single row exists. `<cols>` comes after
            // `<dimension>` in the part, so the layout width is not known yet; the workbook budget
            // is charged once at the end, when it is.
            assertSheetRectangle(ctx.name, dimension.endRow, dimension.endCol, dimension.endCol);
            declaredCols = dimension.endCol;
            // A declared tail row with no `<row>` element still exists, as `[]` – the ExcelJS
            // adapter reports `rowCount` from the same declaration.
            ensureRow(dimension.endRow - 1);
          }
          break;
        }
        case 'sheetView':
          sheet.rtl = attrs.rightToLeft === '1' || attrs.rightToLeft === 'true';
          break;
        case 'pane':
          if (attrs.state === 'frozen' || attrs.state === 'frozenSplit') {
            const cols = Number(attrs.xSplit ?? 0);
            const frozenRows = Number(attrs.ySplit ?? 0);

            sheet.freeze = cols > 0 || frozenRows > 0 ? { rows: frozenRows, cols } : null;
          }
          break;
        case 'col': {
          const min = Number(attrs.min);
          const max = Number(attrs.max);

          if (!Number.isFinite(min) || !Number.isFinite(max) || min < 1 || max < min) {
            break;
          }

          if (max > MAX_SHEET_COLUMNS) {
            throwLimitExceeded(`The sheet "${ctx.name}" declares ${max} columns, `
              + `above the ${MAX_SHEET_COLUMNS}-column limit this reader accepts.`);
          }

          chargeSpan(max - min + 1);
          layoutColCount = Math.max(layoutColCount, max);

          while (sheet.colWidths.length < max) {
            sheet.colWidths.push(null);
          }

          const widthValue = attrs.width === undefined ? null : Number(attrs.width);
          const hidden = attrs.hidden === '1' || attrs.hidden === 'true';

          for (let c = min; c <= max; c++) {
            if (widthValue !== null && Number.isFinite(widthValue)) {
              sheet.colWidths[c - 1] = widthValue;
            }

            if (hidden) {
              hiddenColSet.add(c - 1);
            }
          }
          break;
        }
        case 'row': {
          const r = Number(attrs.r);

          if (Number.isFinite(r) && r >= 1) {
            ensureRow(r - 1);

            if (attrs.ht !== undefined && Number.isFinite(Number(attrs.ht))) {
              while (sheet.rowHeights.length < r) {
                sheet.rowHeights.push(null);
              }

              sheet.rowHeights[r - 1] = Number(attrs.ht);
            }

            if (attrs.hidden === '1' || attrs.hidden === 'true') {
              hiddenRowSet.add(r - 1);
            }
          }
          break;
        }
        case 'c': {
          const decoded = attrs.r === undefined ? null : decodeAddress(attrs.r);

          if (decoded) {
            cell = {
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

            if (selfClosing) {
              finishCell(cell);
              cell = null;
            }
          }
          break;
        }
        case 'f':
          if (cell) {
            cell.formulaAttrs = attrs;
            inFormula = !selfClosing;
          }
          break;
        case 'v':
          if (cell) {
            cell.valueText = '';
            inValue = !selfClosing;
          }
          break;
        case 't':
          if (cell && cell.type === 'inlineStr') {
            inInlineText = !selfClosing;
          }
          break;
        case 'mergeCell': {
          const range = attrs.ref === undefined ? null : parseRangeRef(attrs.ref);

          if (range) {
            sheet.merges.push({
              row: range.startRow - 1,
              col: range.startCol - 1,
              rowspan: range.endRow - range.startRow + 1,
              colspan: range.endCol - range.startCol + 1,
            });
          }
          break;
        }
        case 'sheetProtection': {
          const options: Record<string, boolean> = {};

          Object.keys(attrs).forEach((key) => {
            const raw = attrs[key];

            if (PROTECTION_HASH_ATTRS.has(key) || !(raw === '1' || raw === 'true' || raw === '0' || raw === 'false')) {
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
            dropped.record('sheetProtection:password');
          }

          sheet.protection = { enabled: true, password: null, options };
          break;
        }
        case 'dataValidation':
          validation = {
            sqref: attrs.sqref ?? '',
            type: attrs.type ?? 'any',
            allowBlank: attrs.allowBlank === '1' || attrs.allowBlank === 'true',
            formulae: [],
          };
          break;
        case 'formula1':
        case 'formula2':
          if (validation) {
            validationFormula = [];
          }
          break;
        case 'conditionalFormatting':
          cf = { ref: attrs.sqref ?? '', rules: [] };

          if (selfClosing) {
            finishConditionalFormatting();
          }
          break;
        case 'cfRule':
          if (cf) {
            cfRule = { attrs, formulae: [] };

            if (selfClosing) {
              finishCfRule();
            }
          }
          break;
        case 'formula':
          if (cfRule) {
            cfFormula = [];
          }
          break;
        case 'autoFilter':
          dropped.record('autoFilter');
          break;
        case 'hyperlink':
          dropped.record('hyperlink');
          break;
        case 'drawing':
          dropped.record('images');
          break;
        case 'tablePart':
          dropped.record('tables');
          break;
        default:
          break;
      }
    },
    text(text) {
      if (cell && inValue) {
        cell.valueText = (cell.valueText ?? '') + text;
      } else if (cell && inFormula) {
        cell.formulaText += text;
      } else if (cell && inInlineText) {
        cell.inlineText.push(text);
      } else if (validationFormula) {
        validationFormula.push(text);
      } else if (cfFormula) {
        cfFormula.push(text);
      }
    },
    close(rawName) {
      const name = localName(rawName);

      switch (name) {
        case 'v':
          inValue = false;
          break;
        case 'f':
          inFormula = false;
          break;
        case 't':
          inInlineText = false;
          break;
        case 'c':
          if (cell) {
            finishCell(cell);
            cell = null;
          }
          break;
        case 'formula1':
        case 'formula2':
          if (validation && validationFormula) {
            validation.formulae.push(validationFormula.join(''));
          }

          validationFormula = null;
          break;
        case 'dataValidation':
          if (validation) {
            if (validation.type === 'list') {
              pendingValidations.push({
                sqref: validation.sqref, formulae: validation.formulae, allowBlank: validation.allowBlank,
              });
            } else {
              dropped.record(`dataValidation:${validation.type}`);
            }

            validation = null;
          }
          break;
        case 'formula':
          if (cfRule && cfFormula) {
            cfRule.formulae.push(cfFormula.join(''));
          }

          cfFormula = null;
          break;
        case 'cfRule':
          finishCfRule();
          break;
        case 'conditionalFormatting':
          finishConditionalFormatting();
          break;
        default:
          break;
      }
    },
  });

  // Merges: the master keeps its content, every covered cell reads as empty. A merge member with
  // no `<c>` element of its own is MATERIALIZED here as an explicit `null`, which is what ExcelJS
  // returns for the same file — without it a merge whose covered cells were never written (the
  // native writer emits no `<c>` for an unstyled covered cell) left the row one column short, and
  // `importFile`'s mapper, which takes the sheet width from the widest row, then dropped the merge.
  sheet.merges.forEach((merge) => {
    const lastRow = Math.min(merge.row + merge.rowspan, rows.length);
    // The dimension is the bound, the same one the validation pass below uses: both the native
    // writer and Excel include every merge in `<dimension>`, so a merge reaching past it is
    // malformed and stays clamped rather than growing the sheet on a hostile file's say-so.
    const lastCol = Math.min(merge.col + merge.colspan, Math.max(width, declaredCols, 1));

    if (lastRow <= merge.row || lastCol <= merge.col) {
      return;
    }

    // The third span kind, and the one the budget originally missed. Like the column and
    // validation spans it is measured before it is walked: `<mergeCell ref="A1:XFD1048576"/>` is
    // 32 bytes and would otherwise cost a full sweep of the sheet every time it appears. The
    // padding below walks no further than this charge already paid for.
    chargeSpan((lastRow - merge.row) * (lastCol - merge.col));

    // `assertSheetFits` below re-checks the rectangle with the grown width, so a whole-sheet merge
    // is still refused rather than silently widening the sheet.
    width = Math.max(width, lastCol);

    for (let r = merge.row; r < lastRow; r++) {
      const row = rows[r];

      while (row.length < lastCol) {
        row.push(null);
      }

      for (let c = merge.col; c < lastCol; c++) {
        if (r !== merge.row || c !== merge.col) {
          row[c] = null;
        }
      }
    }
  });

  // Comments: a note on an otherwise empty cell still creates the cell.
  ctx.comments.forEach((text, ref) => {
    const decoded = decodeAddress(ref);

    if (decoded) {
      cellAt(decoded.row, decoded.col).comment = text;
    }
  });

  // Validations: applied within the sheet's used extent only, so a whole-column `A1:A1048576`
  // touches the rows that exist rather than a million of them.
  pendingValidations.forEach(({ sqref, formulae, allowBlank }) => {
    parseMultiRangeRef(sqref).forEach((range) => {
      const lastRow = Math.min(range.endRow, rows.length);
      const lastCol = Math.min(range.endCol, Math.max(width, declaredCols, 1));

      if (lastRow < range.startRow || lastCol < range.startCol) {
        return;
      }

      chargeSpan((lastRow - range.startRow + 1) * (lastCol - range.startCol + 1));

      for (let r = range.startRow; r <= lastRow; r++) {
        for (let c = range.startCol; c <= lastCol; c++) {
          cellAt(r - 1, c - 1).validation = { type: 'list', formulae, allowBlank };
        }
      }
    });
  });

  // The rectangle again (the dimension may have lied low) and the workbook budget, now that the
  // real row count, cell width and column layout are all known.
  assertSheetFits(ctx.name, rows.length, width, Math.max(width, layoutColCount), ctx.budget);

  // Padding: a row that carries a cell is padded to the sheet width; a row that never got one stays [].
  rows.forEach((row) => {
    if (row.length > 0) {
      while (row.length < width) {
        row.push(null);
      }
    }
  });

  while (sheet.rowHeights.length < rows.length) {
    sheet.rowHeights.push(null);
  }

  sheet.rowHeights.length = rows.length;

  const finalLayoutCols = Math.max(width, layoutColCount);

  while (sheet.colWidths.length < finalLayoutCols) {
    sheet.colWidths.push(null);
  }

  sheet.hiddenRows = Array.from(hiddenRowSet).sort((a, b) => a - b);
  sheet.hiddenCols = Array.from(hiddenColSet).sort((a, b) => a - b);

  return sheet;
}
