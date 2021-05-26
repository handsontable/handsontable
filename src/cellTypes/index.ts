export { AutocompleteCellType, CELL_TYPE as AUTOCOMPLETE_TYPE } from './autocompleteType';
export { CheckboxCellType, CELL_TYPE as CHECKBOX_TYPE } from './checkboxType';
export { DateCellType, CELL_TYPE as DATE_TYPE } from './dateType';
export { DropdownCellType, CELL_TYPE as DROPDOWN_TYPE } from './dropdownType';
export { HandsontableCellType, CELL_TYPE as HANDSONTABLE_TYPE } from './handsontableType';
export { NumericCellType, CELL_TYPE as NUMERIC_TYPE } from './numericType';
export { PasswordCellType, CELL_TYPE as PASSWORD_TYPE } from './passwordType';
export { TextCellType, CELL_TYPE as TEXT_TYPE } from './textType';
export { TimeCellType, CELL_TYPE as TIME_TYPE } from './timeType';

export {
  getCellType,
  getRegisteredCellTypeNames,
  getRegisteredCellTypes,
  hasCellType,
  registerCellType,
} from './registry';
