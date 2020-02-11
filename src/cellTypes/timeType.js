import { getEditor } from './../editors';
import { getRenderer } from './../renderers';
import { getValidator } from './../validators';

const CELL_TYPE = 'time';

export default {
  editor: getEditor('text'),
  // displays small gray arrow on right side of the cell
  renderer: getRenderer('text'),
  validator: getValidator(CELL_TYPE),
};
