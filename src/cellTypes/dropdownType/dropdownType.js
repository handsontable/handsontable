import { DropdownEditor } from '../../editors/dropdownEditor';
import { autocompleteRenderer } from '../../renderers/autocompleteRenderer';
import { autocompleteValidator } from '../../validators/autocompleteValidator';

export const CELL_TYPE = 'dropdown';
export const DropdownCellType = {
  CELL_TYPE,
  editor: DropdownEditor,
  // displays small gray arrow on right side of the cell
  renderer: autocompleteRenderer,
  validator: autocompleteValidator,
};
