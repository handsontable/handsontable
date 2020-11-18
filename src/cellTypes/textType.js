import { registerCellType } from './index';
import { getEditor } from '../editors';
import { getRenderer } from '../renderers';

import { EDITOR_TYPE } from '../editors/textEditor';
import { RENDERER_TYPE } from '../renderers/textRenderer';

const CELL_TYPE = 'text';

registerCellType(CELL_TYPE, {
  editor: getEditor(EDITOR_TYPE),
  renderer: getRenderer(RENDERER_TYPE),
});
