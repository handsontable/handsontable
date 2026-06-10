import { TimeEditor } from '../../editors/timeEditor';
import { timeRenderer, valueFormatter } from '../../renderers/timeRenderer';
import {
  SOURCE_DATA_WARNING_MESSAGE,
  timeValidator,
  sourceDataValidator,
} from '../../validators/timeValidator';

export const CELL_TYPE: 'time' = 'time';
export const TimeCellType = {
  CELL_TYPE,
  editor: TimeEditor,
  renderer: timeRenderer,
  validator: timeValidator,
  sourceDataValidator,
  sourceDataWarningMessage: SOURCE_DATA_WARNING_MESSAGE,
  valueFormatter,
};
