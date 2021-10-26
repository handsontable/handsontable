import { GridSettings } from '../settings';

interface CellTypeObject extends GridSettings {
  // renderer?: renderers.Base;
  // editor?: typeof _editors.Base;
  // validator?: validators.Base;
  /**
   * Custom properties which will be accessible in `cellProperties`
   */
  [key: string]: any;
}

declare function _register(name: string, type: CellTypeObject): void;
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
