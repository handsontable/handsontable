import { TextCellType, CELL_TYPE as TEXT_TYPE } from './textType';
import {
  registerCellType,
} from './registry';
import { CellTypeObject } from './types';

/**
 * Registers all available cell types.
 */
export function registerAllCellTypes(): void {
  registerCellType(TextCellType);
}

export {
  TextCellType, TEXT_TYPE,
};

export {
  getCellType,
  registerCellType,
} from './registry';

export type { CellTypeObject, EditorConstructor, TypedRenderer, ValidatorFunction } from './types';
