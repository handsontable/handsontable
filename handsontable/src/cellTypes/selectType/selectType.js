import { SelectEditor } from '../../editors/selectEditor';
import { selectRenderer } from '../../renderers/selectRenderer';

export const CELL_TYPE = 'select';
export const SelectCellType = {
  CELL_TYPE,
  editor: SelectEditor,
  renderer: selectRenderer,
};
