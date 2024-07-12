import { CellTypeObject } from '../base';
import { DropdownEditor } from '../../editors/dropdownEditor';
import { dropdownRenderer } from '../../renderers/dropdownRenderer';
import { dropdownValidator } from '../../validators/dropdownValidator';

export const CELL_TYPE: 'dropdown';
export interface DropdownCellType extends CellTypeObject {
  editor: typeof DropdownEditor;
  renderer: typeof dropdownRenderer;
  validator: typeof dropdownValidator;
}

export namespace DropdownCellType {
  export { DropdownEditor as editor };
  export { dropdownRenderer as renderer };
  export { dropdownValidator as validator };
}
