import { registerCellType } from './index';
import { getEditor } from '../editors';
import { getRenderer } from '../renderers';

import { EDITOR_TYPE } from '../editors/checkboxEditor';
import { RENDERER_TYPE } from '../renderers/checkboxRenderer';

const CELL_TYPE = 'checkbox';

registerCellType(CELL_TYPE, {
  editor: getEditor(EDITOR_TYPE),
  renderer: getRenderer(RENDERER_TYPE),
});
