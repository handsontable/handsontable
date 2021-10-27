import { CellTypeObject } from '../base';
import { AutocompleteEditor } from '../../editors/autocompleteEditor';
import { autocompleteRenderer } from '../../renderers/autocompleteRenderer';
import { autocompleteValidator } from '../../validators/autocompleteValidator';

export const CELL_TYPE: 'autocomplete';
export interface AutocompleteCellType extends CellTypeObject {
  editor: typeof AutocompleteEditor;
  renderer: typeof autocompleteRenderer;
  validator: typeof autocompleteValidator;
}
