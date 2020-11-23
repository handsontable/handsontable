import { getEditor } from '../../editors/editors';
import { getRenderer } from '../../renderers/renderers';
import { getValidator } from '../../validators/validators';

import { EDITOR_TYPE } from '../../editors/numericEditor';
import { RENDERER_TYPE } from '../../renderers/numericRenderer';
import { VALIDATOR_TYPE } from '../../validators/numericValidator';

export default {
  editor: getEditor(EDITOR_TYPE),
  renderer: getRenderer(RENDERER_TYPE),
  validator: getValidator(VALIDATOR_TYPE),
  dataType: 'number',
};
