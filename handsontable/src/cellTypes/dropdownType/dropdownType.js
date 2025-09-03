import { DropdownEditor } from '../../editors/dropdownEditor';
import { dropdownRenderer } from '../../renderers/dropdownRenderer';
import { dropdownValidator } from '../../validators/dropdownValidator';
import { valueGetter, valueSetter } from './accessors';

export const CELL_TYPE = 'dropdown';
export const DropdownCellType = {
  CELL_TYPE,
  editor: DropdownEditor,
  renderer: dropdownRenderer, // displays small gray arrow on right side of the cell
  validator: dropdownValidator,
  filter: false,
  strict: true,
  valueGetter,
  valueSetter,
};
