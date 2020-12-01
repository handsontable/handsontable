import { TextEditor } from '../../editors/textEditor';
import { textRenderer } from '../../renderers/textRenderer';
import { timeValidator } from '../../validators/timeValidator';

export const CELL_TYPE = 'time';
export const TimeCellType = {
  editor: TextEditor,
  // displays small gray arrow on right side of the cell
  renderer: textRenderer,
  validator: timeValidator,
};
