import { stringify } from '../helpers/mixed';
import { localeLowerCase } from '../helpers/string';
import type { HotInstance } from '../core/types';

/**
 * The cell meta keys the checkbox helpers read.
 */
export interface CheckboxMeta {
  type?: unknown;
  readOnly?: unknown;
  checkedTemplate?: unknown;
  uncheckedTemplate?: unknown;
  locale?: unknown;
}

/**
 * Tells whether the cell meta describes a checkbox cell.
 *
 * @param {object} meta The cell meta.
 * @returns {boolean}
 */
export function isCheckboxMeta(meta: CheckboxMeta): boolean {
  return meta.type === 'checkbox';
}

/**
 * Returns the values a checkbox cell stores, with the checkbox renderer's defaults.
 *
 * @param {object} meta The cell meta.
 * @returns {{ checked: *, unchecked: * }}
 */
export function getCheckboxTemplates(meta: CheckboxMeta): { checked: unknown; unchecked: unknown } {
  return {
    checked: meta.checkedTemplate === undefined ? true : meta.checkedTemplate,
    unchecked: meta.uncheckedTemplate === undefined ? false : meta.uncheckedTemplate,
  };
}

/**
 * Which of a checkbox cell's two templates a value stands for.
 */
export type CheckboxState = 'checked' | 'unchecked';

/**
 * Tells which template a value matches: the value is the template itself, or reads the same as it,
 * ignoring case – so `'TRUE'` and `'False'` stand for `true` and `false`, and `'YES'` for a `'yes'`
 * template. An exact match on either template wins over a case-insensitive one, so two templates that
 * differ only in letter case keep both states. The checkbox renderer and its Space/Enter toggle, the
 * checkbox value setter, the `checkbox` validator, the XLSX export, and the checkbox column helpers
 * below all match through this function, so they read a value the same way (DEV-355). The checkbox
 * column sort uses it too, but maps a case variant only onto a template the column defines; with the
 * default templates it keeps sorting by the default comparator. A new surface that reads checkbox
 * state calls it too.
 *
 * @param {*} value The cell value.
 * @param {object} meta The cell meta.
 * @returns {string|null} `'checked'`, `'unchecked'`, or `null` when the value matches neither template.
 */
export function matchCheckboxTemplate(value: unknown, meta: CheckboxMeta): CheckboxState | null {
  const templates = getCheckboxTemplates(meta);
  const locale = typeof meta.locale === 'string' ? meta.locale : undefined;
  const text = localeLowerCase(stringify(value), locale);
  const matches = (template: unknown) => text === localeLowerCase(stringify(template), locale);

  // An exact match on either template wins over a case-insensitive one, so two templates that
  // differ only in letter case (`'Y'` and `'y'`) keep both states.
  if (value === templates.checked) {
    return 'checked';
  }

  if (value === templates.unchecked) {
    return 'unchecked';
  }

  if (matches(templates.checked)) {
    return 'checked';
  }

  return matches(templates.unchecked) ? 'unchecked' : null;
}

/**
 * Tells whether a value renders as a checked checkbox (see `matchCheckboxTemplate()`).
 *
 * @param {*} value The cell value.
 * @param {object} meta The cell meta.
 * @returns {boolean}
 */
export function isCheckedValue(value: unknown, meta: CheckboxMeta): boolean {
  return matchCheckboxTemplate(value, meta) === 'checked';
}

/**
 * Returns the cell meta of a checkbox column's cell in a physical row, with the dynamic extension
 * applied (the `cells` function, `setCellMeta()` values, the `beforeGetCellMeta` and
 * `afterGetCellMeta` hooks). It resolves the row by its physical index, so a row the Filters plugin
 * filtered out (it has no visual index) still gets its own meta, not the column's: a read-only cell
 * stays read-only while it is filtered out. Nothing is stored for a cell that has no meta of its own.
 *
 * For a row without a visual index the hooks get the physical row index in the `visualRow` slot, the
 * way the Filters plugin stamps the cells it reads.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} physicalRow Physical row index.
 * @param {number} column Visual column index.
 * @returns {object}
 */
export function getCheckboxCellMeta(hot: HotInstance, physicalRow: number, column: number): CheckboxMeta {
  const visualRow = hot.toVisualRow(physicalRow);

  if (visualRow !== null) {
    return hot.getCellMetaTransient(visualRow, column) as CheckboxMeta;
  }

  const physicalColumn = hot.toPhysicalColumn(column) ?? column;

  return hot._getMetaManager().getCellMetaTransient(physicalRow, physicalColumn, {
    visualRow: physicalRow,
    visualColumn: column,
  }) as CheckboxMeta;
}

/**
 * Writes the checked or unchecked template into a checkbox column, for the given physical rows.
 * Rows with a visual index go through `setDataAtCell()` (validated, one `afterChange`); rows the
 * Filters plugin filtered out have no visual index and go through `setSourceDataAtCell()`. Cells that
 * are read-only, are not checkboxes, or already hold the value are skipped; each row's own cell meta
 * decides that, filtered-out rows included (see {@link getCheckboxCellMeta}).
 *
 * Run it inside one operation (`runOperation()` or `batch()`) so it is one undo step.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} column Visual column index.
 * @param {number[]} physicalRows Physical row indexes.
 * @param {boolean} checked `true` to check, `false` to uncheck.
 * @param {string} source The change source.
 * @returns {number} The number of cells written.
 */
export function writeCheckboxColumn(
  hot: HotInstance,
  column: number,
  physicalRows: number[],
  checked: boolean,
  source: string,
): number {
  const prop = hot.colToProp(column) ?? column;
  const visibleChanges: Array<[number, number, unknown]> = [];
  const hiddenChanges: Array<[number, unknown]> = [];

  physicalRows.forEach((physicalRow) => {
    const visualRow = hot.toVisualRow(physicalRow);
    const meta = getCheckboxCellMeta(hot, physicalRow, column);

    if (meta.readOnly || !isCheckboxMeta(meta)) {
      return;
    }

    const value = visualRow === null ?
      hot.getSourceDataAtCell(physicalRow, prop) : hot.getDataAtCell(visualRow, column);

    if (isCheckedValue(value, meta) === checked) {
      return;
    }

    const templates = getCheckboxTemplates(meta);
    const nextValue = checked ? templates.checked : templates.unchecked;

    if (visualRow === null) {
      hiddenChanges.push([physicalRow, nextValue]);
    } else {
      visibleChanges.push([visualRow, column, nextValue]);
    }
  });

  if (visibleChanges.length > 0) {
    hot.setDataAtCell(visibleChanges, source);
  }

  if (hiddenChanges.length > 0) {
    hot.setSourceDataAtCell(hiddenChanges.map(([physicalRow, value]) => [physicalRow, prop, value]), 0, null, source);
  }

  return visibleChanges.length + hiddenChanges.length;
}
