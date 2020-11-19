import { registerCellType } from './index';
import { getEditor } from '../editors';
import { getRenderer } from '../renderers';

import { EDITOR_TYPE } from '../editors/textEditor';
import { RENDERER_TYPE } from '../renderers/textRenderer';

const CELL_TYPE = 'text';
const DEFINITION = {
  editor: getEditor(EDITOR_TYPE),
  renderer: getRenderer(RENDERER_TYPE),
};

registerCellType(CELL_TYPE, DEFINITION);

export default DEFINITION;
