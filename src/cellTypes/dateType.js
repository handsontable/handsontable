import { getEditor } from './../editors';
import { getRenderer } from './../renderers';
import { getValidator } from './../validators';

const CELL_TYPE = 'date';

export default {
  editor: getEditor(CELL_TYPE),
  // displays small gray arrow on right side of the cell
  renderer: getRenderer('autocomplete'),
  validator: getValidator(CELL_TYPE),
};
