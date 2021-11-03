import { AutocompleteCellType, CELL_TYPE as AUTOCOMPLETE_TYPE } from './autocompleteType';
import { CheckboxCellType, CELL_TYPE as CHECKBOX_TYPE } from './checkboxType';
import { DateCellType, CELL_TYPE as DATE_TYPE } from './dateType';
import { DropdownCellType, CELL_TYPE as DROPDOWN_TYPE } from './dropdownType';
import { HandsontableCellType, CELL_TYPE as HANDSONTABLE_TYPE } from './handsontableType';
import { NumericCellType, CELL_TYPE as NUMERIC_TYPE } from './numericType';
import { PasswordCellType, CELL_TYPE as PASSWORD_TYPE } from './passwordType';
import { TextCellType, CELL_TYPE as TEXT_TYPE } from './textType';
import { TimeCellType, CELL_TYPE as TIME_TYPE } from './timeType';

export function registerAllCellTypes(): void;

export interface CellTypes {
  autocomplete: typeof AutocompleteCellType;
  checkbox: typeof CheckboxCellType;
  date: typeof DateCellType;
  dropdown: typeof DropdownCellType;
  handsontable: typeof HandsontableCellType;
  numeric: typeof NumericCellType;
  password: typeof PasswordCellType;
  text: typeof TextCellType;
  time: typeof TimeCellType;
}

/**
 * The default cell type aliases the table has built-in.
 */
export type CellType = keyof CellTypes;

export {
  AutocompleteCellType, AUTOCOMPLETE_TYPE,
  CheckboxCellType, CHECKBOX_TYPE,
  DateCellType, DATE_TYPE,
  DropdownCellType, DROPDOWN_TYPE,
  HandsontableCellType, HANDSONTABLE_TYPE,
  NumericCellType, NUMERIC_TYPE,
  PasswordCellType, PASSWORD_TYPE,
  TextCellType, TEXT_TYPE,
  TimeCellType, TIME_TYPE
};
export {
  getCellType,
  getRegisteredCellTypeNames,
  getRegisteredCellTypes,
  hasCellType,
  registerCellType
} from './registry';
