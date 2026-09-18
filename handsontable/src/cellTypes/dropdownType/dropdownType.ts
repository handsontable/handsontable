import { DropdownEditor } from '../../editors/dropdownEditor';
import { dropdownRenderer } from '../../renderers/dropdownRenderer';
import { dropdownValidator } from '../../validators/dropdownValidator';
import { valueGetter, valueSetter } from './accessors';

export const CELL_TYPE: 'dropdown' = 'dropdown';
export const DropdownCellType = {
  CELL_TYPE,
  editor: DropdownEditor,
  renderer: dropdownRenderer, // displays small gray arrow on right side of the cell
  validator: dropdownValidator,
  filter: false,
  strict: true,
  valueGetter,
  valueSetter,
  parsePastedValue: true,
  // See `autocompleteType.ts`: one-line-with-ellipsis by default (DEV-28), overridable per column
  // with `textEllipsis: false`.
  textEllipsis: true,
};
