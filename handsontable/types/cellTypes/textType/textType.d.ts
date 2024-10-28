import { CellTypeObject } from '../base';
import { TextEditor } from '../../editors/textEditor';
import { textRenderer } from '../../renderers/textRenderer';

export const CELL_TYPE: 'text';
export interface TextCellType extends CellTypeObject {
  editor: typeof TextEditor;
  renderer: typeof textRenderer;
}

export namespace TextCellType {
  export { TextEditor as editor };
  export { textRenderer as renderer };
}
