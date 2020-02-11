import { getEditor } from './../editors';
import { getRenderer } from './../renderers';

const CELL_TYPE = 'checkbox';

export default {
  editor: getEditor(CELL_TYPE),
  renderer: getRenderer(CELL_TYPE),
};
