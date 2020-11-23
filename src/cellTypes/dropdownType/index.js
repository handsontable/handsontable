import { registerCellType } from '../cellTypes';
import dropdownType from './dropdownType';

export const CELL_TYPE = 'dropdown';

registerCellType(CELL_TYPE, dropdownType);

export default dropdownType;
