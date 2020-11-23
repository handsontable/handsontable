import { registerCellType } from '../cellTypes';
import checkboxType from './checkboxType';

export const CELL_TYPE = 'checkbox';

registerCellType(CELL_TYPE, checkboxType);

export default checkboxType;
