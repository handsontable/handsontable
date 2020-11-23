import { registerCellType } from '../cellTypes';
import numericType from './numericType';

export const CELL_TYPE = 'numeric';

registerCellType(CELL_TYPE, numericType);

export default numericType;
