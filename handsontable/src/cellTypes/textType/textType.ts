import { TextEditor } from '../../editors/textEditor';
import { textRenderer } from '../../renderers/textRenderer';

export const CELL_TYPE: 'text' = 'text';
export const TextCellType = {
  CELL_TYPE,
  editor: TextEditor,
  renderer: textRenderer,
};
