import { MultiSelectEditor } from '../../editors/multiSelectEditor';
import { multiSelectRenderer } from '../../renderers/multiSelectRenderer';
import { valueGetter, valueSetter } from './accessors';

export const CELL_TYPE = 'multiSelect';
export const MultiSelectCellType = {
  CELL_TYPE,
  editor: MultiSelectEditor,
  renderer: multiSelectRenderer,
  valueGetter,
  valueSetter,
};
