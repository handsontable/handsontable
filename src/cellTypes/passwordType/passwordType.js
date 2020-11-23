import { getEditor } from '../../editors/editors';
import { getRenderer } from '../../renderers/renderers';

import { EDITOR_TYPE } from '../../editors/passwordEditor';
import { RENDERER_TYPE } from '../../renderers/passwordRenderer';

export default {
  editor: getEditor(EDITOR_TYPE),
  renderer: getRenderer(RENDERER_TYPE),
  copyable: false,
};
