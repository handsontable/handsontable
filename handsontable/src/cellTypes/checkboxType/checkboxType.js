import { CheckboxEditor } from '../../editors/checkboxEditor';
import { checkboxRenderer } from '../../renderers/checkboxRenderer';
import { valueSetter } from './accessors';

export const CELL_TYPE = 'checkbox';
export const CheckboxCellType = {
  CELL_TYPE,
  editor: CheckboxEditor,
  renderer: checkboxRenderer,
  valueSetter,
};
