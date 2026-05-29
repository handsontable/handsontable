import { staticRegister } from '../utils/staticRegister';
import { throwWithCause } from '../helpers/errors';
import { registerEditor } from '../editors/registry';
import { registerRenderer } from '../renderers/registry';
import { registerValidator } from '../validators/registry';
import type { CELL_TYPE as AUTOCOMPLETE_TYPE } from './autocompleteType';
import type { CELL_TYPE as CHECKBOX_TYPE } from './checkboxType';
import type { CELL_TYPE as DATE_TYPE } from './dateType';
import type { CELL_TYPE as DROPDOWN_TYPE } from './dropdownType';
import type { CELL_TYPE as HANDSONTABLE_TYPE } from './handsontableType';
import type { CELL_TYPE as INTL_DATE_TYPE } from './intlDateType';
import type { CELL_TYPE as INTL_TIME_TYPE } from './intlTimeType';
import type { CELL_TYPE as NUMERIC_TYPE } from './numericType';
import type { CELL_TYPE as PASSWORD_TYPE } from './passwordType';
import type { CELL_TYPE as SELECT_TYPE } from './selectType';
import type { CELL_TYPE as TEXT_TYPE } from './textType';
import type { CELL_TYPE as TIME_TYPE } from './timeType';

export interface CellTypeObject {
  CELL_TYPE: string;
  editor?: Function;
  renderer?: Function;
  validator?: Function;
  [key: string]: unknown;
}

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
    throwWithCause(`You declared cell type "${name}" as a string that is not mapped to a known object.
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
  if (typeof name !== 'string') {
    type = name;
    name = type.CELL_TYPE;
  }

  const { editor, renderer, validator } = type!;

  if (editor) {
    registerEditor(name, editor);
  }
  if (renderer) {
    registerRenderer(name, renderer);
  }
  if (validator) {
    registerValidator(name, validator);
  }

  register(name, type);
}

export {
  _register as registerCellType,
  _getItem as getCellType,
  hasItem as hasCellType,
  getNames as getRegisteredCellTypeNames,
  getValues as getRegisteredCellTypes,
};

/**
 * All built-in cell type names.
 */
export type CellType = typeof AUTOCOMPLETE_TYPE | typeof CHECKBOX_TYPE | typeof DATE_TYPE |
  typeof DROPDOWN_TYPE | typeof HANDSONTABLE_TYPE | typeof INTL_DATE_TYPE | typeof INTL_TIME_TYPE |
  typeof NUMERIC_TYPE | typeof PASSWORD_TYPE | typeof SELECT_TYPE | typeof TEXT_TYPE | typeof TIME_TYPE | string;
