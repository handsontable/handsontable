import { CellTypeObject } from '../base';
import { HandsontableEditor } from '../../editors/handsontableEditor';
import { autocompleteRenderer } from '../../renderers/autocompleteRenderer';

export const CELL_TYPE: 'handsontable';
export interface HandsontableCellType extends CellTypeObject {
  editor: typeof HandsontableEditor;
  renderer: typeof autocompleteRenderer;
}

export namespace HandsontableCellType {
  export { HandsontableEditor as editor };
  export { autocompleteRenderer as renderer };
}
