import { DateEditor } from '../../editors/dateEditor';
import { dateRenderer, valueFormatter } from '../../renderers/dateRenderer';
import { dateValidator } from '../../validators/dateValidator';

export const CELL_TYPE = 'date';
export const DateCellType = {
  CELL_TYPE,
  editor: DateEditor,
  renderer: dateRenderer,
  validator: dateValidator,
  valueFormatter,
};
