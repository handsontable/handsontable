import { CheckboxEditor } from '../../editors/checkboxEditor';
import { checkboxRenderer } from '../../renderers/checkboxRenderer';

export const CELL_TYPE = 'checkbox';
export const CheckboxType = {
  editor: CheckboxEditor,
  renderer: checkboxRenderer,
};
