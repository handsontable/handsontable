import { AutocompleteCellType, CELL_TYPE as AUTOCOMPLETE_TYPE } from './autocompleteType';
import { CheckboxCellType, CELL_TYPE as CHECKBOX_TYPE } from './checkboxType';
import { DateCellType, CELL_TYPE as DATE_TYPE } from './dateType';
import { DropdownCellType, CELL_TYPE as DROPDOWN_TYPE } from './dropdownType';
import { HandsontableCellType, CELL_TYPE as HANDSONTABLE_TYPE } from './handsontableType';
import { IntlDateCellType, CELL_TYPE as INTL_DATE_TYPE } from './intlDateType';
import { IntlTimeCellType, CELL_TYPE as INTL_TIME_TYPE } from './intlTimeType';
import { MultiSelectCellType, LEGACY_CELL_TYPE as LEGACY_MULTISELECT_TYPE } from './multiSelectType';
export { CELL_TYPE as MULTISELECT_TYPE } from './multiSelectType';
import { NumericCellType, CELL_TYPE as NUMERIC_TYPE } from './numericType';
import { PasswordCellType, CELL_TYPE as PASSWORD_TYPE } from './passwordType';
import { SelectCellType, CELL_TYPE as SELECT_TYPE } from './selectType';
import { TextCellType, CELL_TYPE as TEXT_TYPE } from './textType';
import { TimeCellType, CELL_TYPE as TIME_TYPE } from './timeType';
import {
  registerCellType,
} from './registry';

/**
 * Registers all available cell types.
 */
export function registerAllCellTypes() {
  registerCellType(AutocompleteCellType);
  registerCellType(CheckboxCellType);
  registerCellType(DateCellType);
  registerCellType(DropdownCellType);
  registerCellType(HandsontableCellType);
  registerCellType(IntlDateCellType);
  registerCellType(IntlTimeCellType);
  registerCellType(MultiSelectCellType);
  registerCellType(LEGACY_MULTISELECT_TYPE, MultiSelectCellType);
  registerCellType(NumericCellType);
  registerCellType(PasswordCellType);
  registerCellType(SelectCellType);
  registerCellType(TextCellType);
  registerCellType(TimeCellType);
}

export {
  AutocompleteCellType, AUTOCOMPLETE_TYPE,
  CheckboxCellType, CHECKBOX_TYPE,
  DateCellType, DATE_TYPE,
  DropdownCellType, DROPDOWN_TYPE,
  HandsontableCellType, HANDSONTABLE_TYPE,
  IntlDateCellType, INTL_DATE_TYPE,
  IntlTimeCellType, INTL_TIME_TYPE,
  MultiSelectCellType,
  NumericCellType, NUMERIC_TYPE,
  PasswordCellType, PASSWORD_TYPE,
  SelectCellType, SELECT_TYPE,
  TextCellType, TEXT_TYPE,
  TimeCellType, TIME_TYPE,
};

export {
  getCellType,
  getRegisteredCellTypeNames,
  getRegisteredCellTypes,
  hasCellType,
  registerCellType,
} from './registry';

/**
 * All built-in cell type names.
 */
export type CellType = typeof AUTOCOMPLETE_TYPE | typeof CHECKBOX_TYPE | typeof DATE_TYPE |
  typeof DROPDOWN_TYPE | typeof HANDSONTABLE_TYPE | typeof INTL_DATE_TYPE | typeof INTL_TIME_TYPE |
  typeof NUMERIC_TYPE | typeof PASSWORD_TYPE | typeof SELECT_TYPE | typeof TEXT_TYPE | typeof TIME_TYPE | string;
