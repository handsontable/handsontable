import { AutocompleteEditor } from '../../editors/autocompleteEditor';
import { autocompleteRenderer } from '../../renderers/autocompleteRenderer';
import { autocompleteValidator } from '../../validators/autocompleteValidator';
import { valueGetter, valueSetter } from './accessors';

export const CELL_TYPE = 'autocomplete';
export const AutocompleteCellType = {
  CELL_TYPE,
  _complexDataFormat: true, // TODO: Replace with extending the data schema generator capabilities.
  editor: AutocompleteEditor,
  renderer: autocompleteRenderer,
  validator: autocompleteValidator,
  valueGetter,
  valueSetter,
};
