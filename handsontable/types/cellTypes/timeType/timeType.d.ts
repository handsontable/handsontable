import { CellTypeObject } from '../base';
import { TimeEditor } from '../../editors/timeEditor';
import { textRenderer } from '../../renderers/textRenderer';
import { timeValidator } from '../../validators/timeValidator';

export const CELL_TYPE: 'time';
export interface TimeCellType extends CellTypeObject {
  editor: typeof TimeEditor;
  renderer: typeof textRenderer;
  validator: typeof timeValidator;
}

export namespace TimeCellType {
  export { TimeEditor as editor };
  export { textRenderer as renderer };
  export { timeValidator as validator };
}
