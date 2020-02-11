import { getEditor } from './../editors';
import { getRenderer } from './../renderers';
import { getValidator } from './../validators';

const CELL_TYPE = 'autocomplete';

export default {
  editor: getEditor(CELL_TYPE),
  renderer: getRenderer(CELL_TYPE),
  validator: getValidator(CELL_TYPE),
};
