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
 * Tells whether a value renders as a checked checkbox. Mirrors `checkboxRenderer`: the value is the
 * checked template, or reads the same as it, ignoring case.
 *
 * @param {*} value The cell value.
 * @param {object} meta The cell meta.
 * @returns {boolean}
 */
export function isCheckedValue(value: unknown, meta: CheckboxMeta): boolean {
  const { checked } = getCheckboxTemplates(meta);
  const locale = meta.locale as string | undefined;

  return value === checked ||
    localeLowerCase(stringify(value), locale) === localeLowerCase(stringify(checked), locale);
}

/**
 * Writes the checked or unchecked template into a checkbox column, for the given physical rows.
 * Rows with a visual index go through `setDataAtCell()` (validated, one `afterChange`); rows the
 * Filters plugin filtered out have no visual index and go through `setSourceDataAtCell()`. Cells that
 * are read-only, are not checkboxes, or already hold the value are skipped.
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
  const columnMeta = hot.getColumnMeta(column) as CheckboxMeta;
  const visibleChanges: Array<[number, number, unknown]> = [];
  const hiddenChanges: Array<[number, unknown]> = [];

  physicalRows.forEach((physicalRow) => {
    const visualRow = hot.toVisualRow(physicalRow);
    const meta = (visualRow === null ? columnMeta : hot.getCellMetaTransient(visualRow, column)) as CheckboxMeta;

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
