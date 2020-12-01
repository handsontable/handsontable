import { CheckboxEditor } from '../../editors/checkboxEditor';
import { checkboxRenderer } from '../../renderers/checkboxRenderer';

export const CELL_TYPE = 'checkbox';
export const CheckboxCellType = {
  editor: CheckboxEditor,
  renderer: checkboxRenderer,
};
