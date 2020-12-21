import { NumericEditor } from '../../editors/numericEditor';
import { numericRenderer } from '../../renderers/numericRenderer';
import { numericValidator } from '../../validators/numericValidator';

export const CELL_TYPE = 'numeric';
export const NumericCellType = {
  CELL_TYPE,
  editor: NumericEditor,
  renderer: numericRenderer,
  validator: numericValidator,
  dataType: 'number',
};
