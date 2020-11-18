import { registerCellType } from './index';
import { getEditor } from '../editors';
import { getRenderer } from '../renderers';
import { getValidator } from '../validators';

import { EDITOR_TYPE } from '../editors/dropdownEditor';
import { RENDERER_TYPE } from '../renderers/autocompleteRenderer';
import { VALIDATOR_TYPE } from '../validators/autocompleteValidator';

const CELL_TYPE = 'dropdown';

registerCellType(CELL_TYPE, {
  editor: getEditor(EDITOR_TYPE),
  // displays small gray arrow on right side of the cell
  renderer: getRenderer(RENDERER_TYPE),
  validator: getValidator(VALIDATOR_TYPE),
});
