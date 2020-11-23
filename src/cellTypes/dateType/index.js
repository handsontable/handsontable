import { registerCellType } from '../cellTypes';
import dateType from './dateType';

export const CELL_TYPE = 'date';

registerCellType(CELL_TYPE, dateType);

export default dateType;
