import { CellTypeObject } from '../base';
import { DropdownEditor } from '../../editors/dropdownEditor';
import { autocompleteRenderer } from '../../renderers/autocompleteRenderer';
import { autocompleteValidator } from '../../validators/autocompleteValidator';

export const CELL_TYPE: 'dropdown';
export interface DropdownCellType extends CellTypeObject {
  editor: typeof DropdownEditor;
  renderer: typeof autocompleteRenderer;
  validator: typeof autocompleteValidator;
}

export namespace DropdownCellType {
  export { DropdownEditor as editor };
  export { autocompleteRenderer as renderer };
  export { autocompleteValidator as validator };
}
