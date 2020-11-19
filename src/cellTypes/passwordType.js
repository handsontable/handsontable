import { registerCellType } from './index';
import { getEditor } from '../editors';
import { getRenderer } from '../renderers';

import { EDITOR_TYPE } from '../editors/passwordEditor';
import { RENDERER_TYPE } from '../renderers/passwordRenderer';

const CELL_TYPE = 'password';
const DEFINITION = {
  editor: getEditor(EDITOR_TYPE),
  renderer: getRenderer(RENDERER_TYPE),
  copyable: false,
};

registerCellType(CELL_TYPE, DEFINITION);

export default DEFINITION;
