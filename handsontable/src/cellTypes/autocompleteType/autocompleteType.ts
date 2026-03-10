import { AutocompleteEditor } from '../../editors/autocompleteEditor';
import { autocompleteRenderer } from '../../renderers/autocompleteRenderer';
import { autocompleteValidator } from '../../validators/autocompleteValidator';
import { valueGetter, valueSetter } from './accessors';

export const CELL_TYPE: 'autocomplete' = 'autocomplete';
export const AutocompleteCellType = {
  CELL_TYPE,
  editor: AutocompleteEditor,
  renderer: autocompleteRenderer,
  validator: autocompleteValidator,
  valueGetter,
  valueSetter,
  parsePastedValue: true,
};
