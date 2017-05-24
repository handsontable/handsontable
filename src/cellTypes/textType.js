import {isMobileBrowser} from './../helpers/browser';
import {getEditor} from './../editors';
import {getRenderer} from './../renderers';

const CELL_TYPE = 'text';

export default {
  editor: isMobileBrowser() ? getEditor('mobile') : getEditor(CELL_TYPE),
  renderer: getRenderer(CELL_TYPE),
};
