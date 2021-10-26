import { CellTypeObject } from '../base';
import { CheckboxEditor } from '../../editors/checkboxEditor';
import { checkboxRenderer } from '../../renderers/checkboxRenderer';

export const CELL_TYPE: 'checkbox';
export interface CheckboxCellType extends CellTypeObject {
  editor: CheckboxEditor;
  renderer: typeof checkboxRenderer;
}
