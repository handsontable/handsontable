import { MultiSelectEditor } from '../../editors/multiSelectEditor';
import { multiSelectRenderer } from '../../renderers/multiSelectRenderer';
import { valueGetter, valueSetter } from './accessors';

export const CELL_TYPE = 'multiSelect';
export const MultiSelectCellType = {
  CELL_TYPE,
  _complexDataFormat: true, // TODO: Replace with extending the data schema generator capabilities.
  editor: MultiSelectEditor,
  renderer: multiSelectRenderer,
  valueGetter,
  valueSetter,
};
