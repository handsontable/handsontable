import { TimeEditor } from '../../editors/timeEditor';
import { textRenderer } from '../../renderers/textRenderer';
import { timeValidator } from '../../validators/timeValidator';

export const CELL_TYPE = 'time';
export const TimeCellType = {
  CELL_TYPE,
  editor: TimeEditor,
  // displays small gray arrow on right side of the cell
  renderer: textRenderer,
  validator: timeValidator,
};
