import { CellTypeObject } from '../base';
import { SelectEditor } from '../../editors/selectEditor';
import { selectRenderer } from '../../renderers/selectRenderer';

export const CELL_TYPE: 'select';
export interface SelectCellType extends CellTypeObject {
  editor: typeof SelectEditor;
  renderer: typeof selectRenderer;
}

export namespace SelectCellType {
  export { SelectEditor as editor };
  export { selectRenderer as renderer };
}
