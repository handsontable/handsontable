import { CheckboxEditor } from '../../editors/checkboxEditor';
import { checkboxRenderer } from '../../renderers/checkboxRenderer';

export const CELL_TYPE = 'checkbox';
export const CheckboxCellType = {
  CELL_TYPE,
  editor: CheckboxEditor,
  renderer: checkboxRenderer,
};
