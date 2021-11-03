import { CellTypes } from './index';
import { CellTypeObject } from './base';

declare function _register(type: CellTypeObject): void;
declare function _register(name: string, type: CellTypeObject): void;
declare function _getItem<T extends keyof CellTypes>(name: T): CellTypes[T];
declare function _getItem(name: string): CellTypeObject;
declare function hasItem(name: string): boolean;
declare function getNames(): string[];
declare function getValues(): CellTypeObject[];

export {
  _register as registerCellType,
  _getItem as getCellType,
  hasItem as hasCellType,
  getNames as getRegisteredCellTypeNames,
  getValues as getRegisteredCellTypes
};
