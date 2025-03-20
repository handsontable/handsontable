import staticRegister from '../utils/staticRegister';
import { registerEditor } from '../editors/registry';
import { registerRenderer } from '../renderers/registry';
import { registerValidator } from '../validators/registry';
import { CellTypeObject } from './types';

const {
  register,
  getItem,
  hasItem,
  getNames,
  getValues,
} = staticRegister('cellTypes');

/**
 * Retrieve cell type object.
 *
 * @param {string} name Cell type identification.
 * @returns {object} Returns cell type object.
 */
function _getItem(name: string): CellTypeObject {
  if (!hasItem(name)) {
    throw Error(`You declared cell type "${name}" as a string that is not mapped to a known object.
                 Cell type must be an object or a string mapped to an object registered by
                 "Handsontable.cellTypes.registerCellType" method`);
  }

  return getItem(name) as CellTypeObject;
}

/**
 * Register cell type under specified name.
 *
 * @param {string} name Cell type identification.
 * @param {object} type An object with contains keys (eq: `editor`, `renderer`, `validator`) which describes specified behaviour of the cell.
 */
function _register(name: string | CellTypeObject, type?: CellTypeObject): void {
  let cellName: string;
  let cellType: CellTypeObject;

  if (typeof name !== 'string') {
    cellType = name;
    cellName = cellType.CELL_TYPE;
  } else {
    cellName = name;
    cellType = type as CellTypeObject;
  }

  const { editor, renderer, validator } = cellType;

  if (editor) {
    registerEditor(cellName, editor);
  }
  if (renderer) {
    registerRenderer(cellName, renderer);
  }
  if (validator) {
    registerValidator(cellName, validator);
  }

  register(cellName, cellType);
}

export {
  _register as registerCellType,
  _getItem as getCellType,
  hasItem as hasCellType,
  getNames as getRegisteredCellTypeNames,
  getValues as getRegisteredCellTypes,
};
