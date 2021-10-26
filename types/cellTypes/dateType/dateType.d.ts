import { CellTypeObject } from '../base';
import { DateEditor } from '../../editors/dateEditor';
import { autocompleteRenderer } from '../../renderers/autocompleteRenderer';
import { dateValidator } from '../../validators/dateValidator';

export const CELL_TYPE: 'date';
export interface DateCellType extends CellTypeObject {
  editor: DateEditor;
  renderer: typeof autocompleteRenderer;
  validator: typeof dateValidator;
}
