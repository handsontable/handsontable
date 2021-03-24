import { DateEditor } from '../../editors/dateEditor';
import { autocompleteRenderer } from '../../renderers/autocompleteRenderer';
import { dateValidator } from '../../validators/dateValidator';

export const CELL_TYPE = 'date';
export const DateCellType = {
  CELL_TYPE,
  editor: DateEditor,
  // displays small gray arrow on right side of the cell
  renderer: autocompleteRenderer,
  validator: dateValidator,
};
