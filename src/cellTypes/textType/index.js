import { registerCellType } from '../cellTypes';
import textType from './textType';

export const CELL_TYPE = 'text';

registerCellType(CELL_TYPE, textType);

export default textType;
