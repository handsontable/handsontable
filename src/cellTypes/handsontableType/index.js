import { registerCellType } from '../cellTypes';
import handsontableType from './handsontableType';

export const CELL_TYPE = 'handsontable';

registerCellType(CELL_TYPE, handsontableType);

export default handsontableType;
