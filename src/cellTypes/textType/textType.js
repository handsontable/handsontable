import { getEditor } from '../../editors/editors';
import { getRenderer } from '../../renderers/renderers';

import { EDITOR_TYPE } from '../../editors/textEditor';
import { RENDERER_TYPE } from '../../renderers/textRenderer';

export default {
  editor: getEditor(EDITOR_TYPE),
  renderer: getRenderer(RENDERER_TYPE),
};
