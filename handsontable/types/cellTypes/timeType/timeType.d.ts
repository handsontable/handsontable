import { CellTypeObject } from '../base';
import { TimeEditor } from '../../editors/timeEditor';
import { timeRenderer } from '../../renderers/timeRenderer';
import { timeValidator } from '../../validators/timeValidator';

export const CELL_TYPE: 'time';
export interface TimeCellType extends CellTypeObject {
  editor: typeof TimeEditor;
  renderer: typeof timeRenderer;
  validator: typeof timeValidator;
}

export namespace TimeCellType {
  export { TimeEditor as editor };
  export { timeRenderer as renderer };
  export { timeValidator as validator };
}
