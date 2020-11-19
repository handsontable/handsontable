import { registerCellType } from './cellTypes';
import { getEditor } from '../editors/editors';
import { getRenderer } from '../renderers/renderers';
import { getValidator } from '../validators/validators';

import { EDITOR_TYPE } from '../editors/dateEditor';
import { RENDERER_TYPE } from '../renderers/autocompleteRenderer';
import { VALIDATOR_TYPE } from '../validators/dateValidator';

const CELL_TYPE = 'date';
const DEFINITION = {
  editor: getEditor(EDITOR_TYPE),
  // displays small gray arrow on right side of the cell
  renderer: getRenderer(RENDERER_TYPE),
  validator: getValidator(VALIDATOR_TYPE),
};

registerCellType(CELL_TYPE, DEFINITION);

export default DEFINITION;
