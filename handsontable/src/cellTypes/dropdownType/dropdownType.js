import { DropdownEditor } from '../../editors/dropdownEditor';
import { dropdownRenderer } from '../../renderers/dropdownRenderer';
import { dropdownValidator } from '../../validators/dropdownValidator';

export const CELL_TYPE = 'dropdown';
export const DropdownCellType = {
  CELL_TYPE,
  editor: DropdownEditor,
  // displays small gray arrow on right side of the cell
  renderer: dropdownRenderer,
  validator: dropdownValidator,
};
