/**
 * Type contract for the public surface touched by the `remove_row` undo fix (#5833).
 *
 * Undoing a row removal restores the values of columns whose `data` option is an accessor
 * function. That fix must not change what `Core#colToProp` and `BaseEditor#prop` declare: widening
 * a return type or a readable field narrows what consumers may do with the value, which breaks
 * code that compiles today. The assignments below are exactly the patterns that broke, so they
 * have to keep compiling.
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
// `Core#colToProp` reads as `string | number`
// ---------------------------------------------------------------------------
const columnProp: string | number = hot.colToProp(0);

hot.setDataAtRowProp(0, hot.colToProp(0), 'x');
hot.propToCol(hot.colToProp(0));
hot.propToCol(columnProp);

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
