import { registerCellType } from '../cellTypes';
import autocompleteType from './autocompleteType';

export const CELL_TYPE = 'autocomplete';

registerCellType(CELL_TYPE, autocompleteType);

export default autocompleteType;
