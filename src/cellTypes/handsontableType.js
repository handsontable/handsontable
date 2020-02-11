import { getEditor } from './../editors';
import { getRenderer } from './../renderers';

const CELL_TYPE = 'handsontable';

export default {
  editor: getEditor(CELL_TYPE),
  // displays small gray arrow on right side of the cell
  renderer: getRenderer('autocomplete'),
};
