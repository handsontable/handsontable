import { CellTypeObject } from '../base';
import { DropdownEditor } from '../../editors/dropdownEditor';
import { autocompleteRenderer } from '../../renderers/autocompleteRenderer';
import { autocompleteValidator } from '../../validators/autocompleteValidator';

export const CELL_TYPE: 'dropdown';
export interface DropdownCellType extends CellTypeObject {
  editor: DropdownEditor;
  renderer: typeof autocompleteRenderer;
  validator: typeof autocompleteValidator;
}
