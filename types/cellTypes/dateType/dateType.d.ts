import { CellTypeObject } from '../base';
import { DateEditor } from '../../editors/dateEditor';
import { autocompleteRenderer } from '../../renderers/autocompleteRenderer';
import { dateValidator } from '../../validators/dateValidator';

export const CELL_TYPE: 'date';
export interface DateCellType extends CellTypeObject {
  editor: typeof DateEditor;
  renderer: typeof autocompleteRenderer;
  validator: typeof dateValidator;
}

export namespace DateCellType {
  export { DateEditor as editor };
  export { autocompleteRenderer as renderer };
  export { dateValidator as validator };
}
