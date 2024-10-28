import { CellTypeObject } from '../base';
import { NumericEditor } from '../../editors/numericEditor';
import { numericRenderer } from '../../renderers/numericRenderer';
import { numericValidator } from '../../validators/numericValidator';

export const CELL_TYPE: 'numeric';
export interface NumericCellType extends CellTypeObject {
  editor: typeof NumericEditor;
  renderer: typeof numericRenderer;
  validator: typeof numericValidator;
}

export namespace NumericCellType {
  export { NumericEditor as editor };
  export { numericRenderer as renderer };
  export { numericValidator as validator };
}
