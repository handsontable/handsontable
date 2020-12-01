import { TextEditor } from '../../editors/textEditor';
import { textRenderer } from '../../renderers/textRenderer';

export const CELL_TYPE = 'text';
export const TextCellType = {
  editor: TextEditor,
  renderer: textRenderer,
};
