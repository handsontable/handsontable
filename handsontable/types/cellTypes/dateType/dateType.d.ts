import { CellTypeObject } from '../base';
import { DateEditor } from '../../editors/dateEditor';
import { dateRenderer } from '../../renderers/dateRenderer';
import { dateValidator } from '../../validators/dateValidator';

export const CELL_TYPE: 'date';
export interface DateCellType extends CellTypeObject {
  editor: typeof DateEditor;
  renderer: typeof dateRenderer;
  validator: typeof dateValidator;
}

export namespace DateCellType {
  export { DateEditor as editor };
  export { dateRenderer as renderer };
  export { dateValidator as validator };
}
