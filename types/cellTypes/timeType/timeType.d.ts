import { CellTypeObject } from '../base';
import { TextEditor } from '../../editors/textEditor';
import { textRenderer } from '../../renderers/textRenderer';
import { timeValidator } from '../../validators/timeValidator';

export const CELL_TYPE: 'time';
export interface TimeCellType extends CellTypeObject {
  editor: typeof TextEditor;
  renderer: typeof textRenderer;
  validator: typeof timeValidator;
}
