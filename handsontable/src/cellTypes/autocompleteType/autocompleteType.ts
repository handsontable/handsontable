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
  // Keep a long value on one line, truncated with an ellipsis, so it stays clear of the dropdown
  // arrow instead of wrapping around it (DEV-28). This is a type-level default: set
  // `textEllipsis: false` on the column (or in `cells`/`setCellMeta`) to restore wrapping.
  textEllipsis: true,
};
