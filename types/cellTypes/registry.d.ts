import { GridSettings } from '../settings';
import { BaseRenderer } from '../renderers/base';
import { BaseValidator } from '../validators/base';
import { BaseEditor } from '../editors/base';

interface CellTypeObject extends GridSettings {
  renderer?: BaseRenderer;
  editor?: BaseEditor;
  validator?: BaseValidator;
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
