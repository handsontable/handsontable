import type { DroppedFeatures } from '../../../capabilities';
import { colIndexToLetter } from '../../../cellRef';
import type { CellSnapshot, MergeSnapshot, SheetSnapshot } from '../../../model';
import { XmlWriter } from '../xml/writer';
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
 * skipped. Returns the kept merges and the set of covered (non-master) cell keys.
 */
function resolveMerges(
  merges: MergeSnapshot[],
  dropped: DroppedFeatures,
): { kept: MergeSnapshot[]; covered: Set<string> } {
  const occupied = new Set<string>();
  const covered = new Set<string>();
  const kept: MergeSnapshot[] = [];

  merges.forEach((merge) => {
    const keys: string[] = [];

    for (let r = merge.row; r < merge.row + merge.rowspan; r++) {
      for (let c = merge.col; c < merge.col + merge.colspan; c++) {
        keys.push(`${r}:${c}`);
      }
    }

    if (keys.some(key => occupied.has(key))) {
      dropped.record('merge:overlap');

      return;
    }

    keys.forEach(key => occupied.add(key));
    keys.slice(1).forEach(key => covered.add(key));
    kept.push(merge);
  });

  return { kept, covered };
}

/**
 * Writes one `<c>` element. A covered merge cell keeps its style and loses its content.
 */
function writeCell(
  w: XmlWriter,
  ref: string,
  cell: CellSnapshot,
  isCovered: boolean,
  styles: StyleTable,
  strings: SharedStringTable,
): boolean {
  const s = styles.xfIndex({ numFmt: cell.numFmt, style: cell.style, locked: cell.locked });
  const styleAttr = s === 0 ? undefined : s;

  if (isCovered || (cell.value === null && cell.formula === null)) {
    if (styleAttr !== undefined) {
      w.leaf('c', { r: ref, s: styleAttr });
    }

    return false;
  }

  if (cell.formula !== null) {
    const { text, result } = cell.formula;
    const hasResult = 'result' in cell.formula && result !== undefined && result !== null;
    let t: 'str' | 'b' | undefined;

    if (hasResult && typeof result === 'string') {
      t = 'str';
    } else if (hasResult && typeof result === 'boolean') {
      t = 'b';
    }

    w.open('c', { r: ref, s: styleAttr, t }).leaf('f', undefined, text);

    if (hasResult) {
      let resultText: string;

      if (typeof result === 'boolean') {
        resultText = result ? '1' : '0';
      } else {
        resultText = String(result);
      }

      w.leaf('v', undefined, resultText);
    }

    w.close();

    return true;
  }

  const { value } = cell;

  if (typeof value === 'string') {
    w.open('c', { r: ref, s: styleAttr, t: 's' }).leaf('v', undefined, String(strings.add(value))).close();
  } else if (typeof value === 'boolean') {
    w.open('c', { r: ref, s: styleAttr, t: 'b' }).leaf('v', undefined, value ? '1' : '0').close();
  } else {
    w.open('c', { r: ref, s: styleAttr }).leaf('v', undefined, String(value)).close();
  }

  return false;
}

/**
 * Serializes `xl/worksheets/sheetN.xml` for one snapshot. Child order is schema-fixed; a wrong
 * order makes Excel offer to "repair" the file.
 */
export function worksheetXml(
  sheet: SheetSnapshot,
  styles: StyleTable,
  strings: SharedStringTable,
  dropped: DroppedFeatures,
  passwordHash: ProtectionHash | null,
): WorksheetWriteResult {
  const { kept: merges, covered } = resolveMerges(sheet.merges, dropped);
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
  const comments: SheetComment[] = [];
  const validations: ValidationCell[] = [];
  const hiddenRows = new Set(sheet.hiddenRows);
  const hiddenCols = new Set(sheet.hiddenCols);
  let wroteFormula = false;

  const w = new XmlWriter().open('worksheet', { xmlns: MAIN_NS, 'xmlns:r': R_NS });

  w.leaf('dimension', { ref: rowCount === 0 ? 'A1' : `A1:${address(rowCount - 1, colCount - 1)}` });

  w.open('sheetViews').open('sheetView', { workbookViewId: 0, rightToLeft: sheet.rtl ? '1' : undefined });

  if (sheet.freeze) {
    const { rows, cols } = sheet.freeze;
    let activePane = 'bottomLeft';

    if (cols > 0 && rows > 0) {
      activePane = 'bottomRight';
    } else if (cols > 0) {
      activePane = 'topRight';
    }

    w.leaf('pane', {
      xSplit: cols > 0 ? cols : undefined,
      ySplit: rows > 0 ? rows : undefined,
      topLeftCell: address(rows, cols),
      activePane,
      state: 'frozen',
    });
    w.leaf('selection', { pane: activePane });
  }

  w.close().close();
  w.leaf('sheetFormatPr', { defaultRowHeight: 15 });

  const colEntries: string[] = [];

  for (let c = 0; c < colCount; c++) {
    const width = sheet.colWidths[c] ?? null;
    const hidden = hiddenCols.has(c);

    if (width !== null || hidden) {
      const inner = new XmlWriter(false);

      inner.leaf('col', {
        min: c + 1,
        max: c + 1,
        width: width ?? undefined,
        customWidth: width !== null ? '1' : undefined,
        hidden: hidden ? '1' : undefined,
      });
      colEntries.push(inner.toString());
    }
  }

  if (colEntries.length > 0) {
    w.open('cols').raw(colEntries.join('')).close();
  }

  w.open('sheetData');

  for (let r = 0; r < rowCount; r++) {
    const row = sheet.rows[r] ?? [];
    const height = sheet.rowHeights[r] ?? null;
    const hidden = hiddenRows.has(r);
    const hasCells = row.some(cell => cell !== null);

    if (!hasCells && height === null && !hidden) {
      continue;
    }

    w.open('row', {
      r: r + 1,
      ht: height ?? undefined,
      customHeight: height !== null ? '1' : undefined,
      hidden: hidden ? '1' : undefined,
    });

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];

      if (cell === null) {
        continue;
      }

      const ref = address(r, c);

      if (writeCell(w, ref, cell, covered.has(`${r}:${c}`), styles, strings)) {
        wroteFormula = true;
      }

      if (cell.comment !== null) {
        comments.push({ ref, row: r, col: c, text: cell.comment });
      }

      if (cell.validation !== null) {
        validations.push({ row: r, col: c, validation: cell.validation });
      }
    }

    w.close();
  }

  w.close();

  if (sheet.protection?.enabled) {
    const { options } = sheet.protection;
    const attrs: Record<string, string | undefined> = { sheet: '1' };

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

  if (merges.length > 0) {
    w.open('mergeCells', { count: merges.length });
    merges.forEach(merge => w.leaf('mergeCell', { ref: mergeRef(merge) }));
    w.close();
  }

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
