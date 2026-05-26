import { MultiSelectEditor } from '../../editors/multiSelectEditor';
import { multiSelectRenderer } from '../../renderers/multiSelectRenderer';
import { multiSelectValidator } from '../../validators/multiSelectValidator';
import { valueGetter, valueSetter } from './accessors';

export const CELL_TYPE = 'multiselect';
export const MultiSelectCellType = {
  CELL_TYPE,
  _complexDataFormat: true,
  editor: MultiSelectEditor,
  renderer: multiSelectRenderer,
  validator: multiSelectValidator,
  valueGetter,
  valueSetter,
  parsePastedValue: true,
};
