import { registerCellType } from './cellTypes';
import { getEditor } from '../editors/editors';
import { getRenderer } from '../renderers/renderers';

import { EDITOR_TYPE } from '../editors/checkboxEditor';
import { RENDERER_TYPE } from '../renderers/checkboxRenderer';

const CELL_TYPE = 'checkbox';
const DEFINITION = {
  editor: getEditor(EDITOR_TYPE),
  renderer: getRenderer(RENDERER_TYPE),
};

registerCellType(CELL_TYPE, DEFINITION);

export default DEFINITION;

