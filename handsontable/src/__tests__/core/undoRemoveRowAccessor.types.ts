/**
 * Type contract for the public surface touched by the `remove_row` undo fix (#5833).
 *
 * Undoing a row removal restores the values of columns whose `data` option is an accessor
 * function. That fix must not change what `BaseEditor#prop` declares: widening a return type or a
 * readable field narrows what consumers may do with the value, which breaks code that compiles
 * today. The assignments below are exactly the patterns that broke, so they have to keep compiling.
 *
 * `Core#colToProp` and `Core#propToCol` are the deliberate exception. Both widened to `| null` for
 * #7031, so this file now pins the *narrowed* shape a consumer has to write instead — the same
 * migration every affected consumer performs. That widening is the breaking change; everything
 * else here still guarantees the old shape.
 *
 * Uses actual assignments (no `declare`) so every line is proven by the compiler against the
 * generated `tmp/` types.
 */

import Handsontable from 'handsontable';
import type {
  CellValue,
  ColumnDataGetterSetterFunction,
  HotInstance,
  RowObject,
} from 'handsontable';
import { TextEditor } from 'handsontable/editors';

const element = document.createElement('div');
const hot: HotInstance = new Handsontable.Core(element, {});

// ---------------------------------------------------------------------------
// `Core#colToProp` reads as `string | number | null` (widened for #7031), and
// `Core#propToCol` as `number | null`. A consumer narrows once and reuses it —
// the migration guide shows this same shape.
// ---------------------------------------------------------------------------
const columnProp: string | number | null = hot.colToProp(0);

if (columnProp !== null) {
  const narrowedProp: string | number = columnProp;

  hot.setDataAtRowProp(0, narrowedProp, 'x');

  const columnIndex: number | null = hot.propToCol(narrowedProp);

  if (columnIndex !== null) {
    const narrowedIndex: number = columnIndex;

    hot.selectCell(0, narrowedIndex);
  }
}

// ---------------------------------------------------------------------------
// `BaseEditor#prop` reads as `number | string | null`
// ---------------------------------------------------------------------------
const editor = new TextEditor(hot);
const editorProp: string | number = editor.prop!;

hot.setDataAtRowProp(editor.row!, editor.prop!, 'x');
hot.propToCol(editorProp);

// ---------------------------------------------------------------------------
// The source-data accessors accept a `columns[].data` accessor function
// ---------------------------------------------------------------------------
const userAccessor: ColumnDataGetterSetterFunction = (
  row: RowObject | CellValue[], value?: CellValue
) => {
  const record = row as RowObject;

  if (value === undefined) {
    return record.name;
  }

  record.name = value;

  return undefined;
};

hot.setSourceDataAtCell(0, userAccessor, 'x');

const accessorValue: unknown = hot.getSourceDataAtCell(0, userAccessor);

// ---------------------------------------------------------------------------
// `modifySourceData` receives `number | string | ColumnDataGetterSetterFunction`
// as `column`, and (method-syntax bivariance) a pre-widening narrow handler
// still compiles
// ---------------------------------------------------------------------------
new Handsontable.Core(element, {
  modifySourceData(row: number, column: number | string | ColumnDataGetterSetterFunction) {
    if (typeof column === 'function') {
      column({ name: 'x' });
    }
  },
});

new Handsontable.Core(element, {
  // The `column: number` shape every existing handler was written against must keep compiling.
  modifySourceData(row: number, column: number) {},
});
