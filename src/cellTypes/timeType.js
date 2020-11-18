import { registerCellType } from './index';
import { getEditor } from '../editors';
import { getRenderer } from '../renderers';
import { getValidator } from '../validators';

import { EDITOR_TYPE } from '../editors/textEditor';
import { RENDERER_TYPE } from '../renderers/textRenderer';
import { VALIDATOR_TYPE } from '../validators/timeValidator';

const CELL_TYPE = 'time';

registerCellType(CELL_TYPE, {
  editor: getEditor(EDITOR_TYPE),
  // displays small gray arrow on right side of the cell
  renderer: getRenderer(RENDERER_TYPE),
  validator: getValidator(VALIDATOR_TYPE),
});
