import { DateEditor } from '../../editors/dateEditor';
import { dateRenderer } from '../../renderers/dateRenderer';
import { dateValidator } from '../../validators/dateValidator';

export const CELL_TYPE = 'date';
export const DateCellType = {
  CELL_TYPE,
  editor: DateEditor,
  // displays small gray arrow on right side of the cell
  renderer: dateRenderer,
  validator: dateValidator,
};
