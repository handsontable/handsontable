import { getEditor } from '../../editors/editors';
import { getRenderer } from '../../renderers/renderers';

import { EDITOR_TYPE } from '../../editors/handsontableEditor';
import { RENDERER_TYPE } from '../../renderers/autocompleteRenderer';

export default {
  editor: getEditor(EDITOR_TYPE),
  // displays small gray arrow on right side of the cell
  renderer: getRenderer(RENDERER_TYPE),
};
