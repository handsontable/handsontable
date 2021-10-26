import { CellTypeObject } from '../base';
import { TextEditor } from '../../editors/textEditor';
import { textRenderer } from '../../renderers/textRenderer';

export const CELL_TYPE: 'text';
export interface TextCellType extends CellTypeObject {
  editor: TextEditor;
  renderer: typeof textRenderer;
}
