import { getEditor } from './../editors';
import { getRenderer } from './../renderers';

const CELL_TYPE = 'password';

export default {
  editor: getEditor(CELL_TYPE),
  renderer: getRenderer(CELL_TYPE),
  copyable: false,
};
