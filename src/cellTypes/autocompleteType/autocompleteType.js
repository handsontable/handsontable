import { AutocompleteEditor } from '../../editors/autocompleteEditor';
import { autocompleteRenderer } from '../../renderers/autocompleteRenderer';
import { autocompleteValidator } from '../../validators/autocompleteValidator';

export const CELL_TYPE = 'autocomplete';
export const AutocompleteType = {
  editor: AutocompleteEditor,
  renderer: autocompleteRenderer,
  validator: autocompleteValidator,
};
