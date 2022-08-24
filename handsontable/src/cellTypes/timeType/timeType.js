import { TimeEditor } from '../../editors/timeEditor';
import { timeRenderer } from '../../renderers/timeRenderer';
import { timeValidator } from '../../validators/timeValidator';

export const CELL_TYPE = 'time';
export const TimeCellType = {
  CELL_TYPE,
  editor: TimeEditor,
  renderer: timeRenderer,
  validator: timeValidator,
};
