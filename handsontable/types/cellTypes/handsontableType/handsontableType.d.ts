import { CellTypeObject } from '../base';
import { HandsontableEditor } from '../../editors/handsontableEditor';
import { handsontableRenderer } from '../../renderers/handsontableRenderer';

export const CELL_TYPE: 'handsontable';
export interface HandsontableCellType extends CellTypeObject {
  editor: typeof HandsontableEditor;
  renderer: typeof handsontableRenderer;
}

export namespace HandsontableCellType {
  export { HandsontableEditor as editor };
  export { handsontableRenderer as renderer };
}
