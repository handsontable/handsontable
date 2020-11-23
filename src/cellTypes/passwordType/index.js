import { registerCellType } from '../cellTypes';
import passwordType from './passwordType';

export const CELL_TYPE = 'password';

registerCellType(CELL_TYPE, passwordType);

export default passwordType;
