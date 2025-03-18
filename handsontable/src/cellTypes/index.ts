import { TextCellType, CELL_TYPE as TEXT_TYPE } from './textType';
import {
  registerCellType,
} from './registry';

/**
 * Registers all available cell types.
 */
export function registerAllCellTypes() {
  registerCellType(TextCellType);
}

export {
  TextCellType, TEXT_TYPE,
};

export {
  getCellType,
  registerCellType,
} from './registry';
