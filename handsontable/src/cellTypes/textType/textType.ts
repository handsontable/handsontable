import { TextEditor } from '../../editors/textEditor';
import { textRenderer } from '../../renderers/textRenderer';
import { CellTypeObject } from '../types';

export const CELL_TYPE = 'text';
// @ts-ignore - TextEditor is compatible with the expected editor type
export const TextCellType: CellTypeObject = {
  CELL_TYPE,
  editor: TextEditor,
  renderer: textRenderer,
};
