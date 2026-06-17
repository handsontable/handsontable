import { DateEditor } from '../../editors/dateEditor';
import { dateRenderer, valueFormatter } from '../../renderers/dateRenderer';
import {
  SOURCE_DATA_WARNING_MESSAGE,
  dateValidator,
  sourceDataValidator,
} from '../../validators/dateValidator';
import { emptyStringToNull } from '../../helpers/mixed';

export const CELL_TYPE: 'date' = 'date';
export const DateCellType = {
  CELL_TYPE,
  editor: DateEditor,
  renderer: dateRenderer,
  validator: dateValidator,
  sourceDataValidator,
  sourceDataWarningMessage: SOURCE_DATA_WARNING_MESSAGE,
  valueFormatter,
  valueSetter: emptyStringToNull,
};
