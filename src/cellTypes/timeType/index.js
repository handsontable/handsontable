import { registerCellType } from '../cellTypes';
import timeType from './timeType';

export const CELL_TYPE = 'time';

registerCellType(CELL_TYPE, timeType);

export default timeType;
