import { HandsontableEditor } from '../../editors/handsontableEditor';
import { autocompleteRenderer } from '../../renderers/autocompleteRenderer';

export const CELL_TYPE = 'handsontable';
export const HandsontableType = {
  editor: HandsontableEditor,
  // displays small gray arrow on right side of the cell
  renderer: autocompleteRenderer,
};
