import { HandsontableEditor } from '../../editors/handsontableEditor';
import { handsontableRenderer } from '../../renderers/handsontableRenderer';

export const CELL_TYPE = 'handsontable';
export const HandsontableCellType = {
  CELL_TYPE,
  editor: HandsontableEditor,
  // displays small gray arrow on right side of the cell
  renderer: handsontableRenderer,
};
