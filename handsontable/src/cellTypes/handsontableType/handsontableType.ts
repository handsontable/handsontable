import { HandsontableEditor } from '../../editors/handsontableEditor';
import { handsontableRenderer } from '../../renderers/handsontableRenderer';

export const CELL_TYPE: 'handsontable' = 'handsontable';
export const HandsontableCellType = {
  CELL_TYPE,
  editor: HandsontableEditor,
  // displays small gray arrow on right side of the cell
  renderer: handsontableRenderer,
  // See `autocompleteType.ts`: one-line-with-ellipsis by default (DEV-28), overridable per column
  // with `textEllipsis: false`.
  textEllipsis: true,
};
