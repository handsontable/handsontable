import Handsontable from 'handsontable/base';
import {
  AutocompleteCellType,
  CheckboxCellType,
  DateCellType,
  DropdownCellType,
  HandsontableCellType,
  NumericCellType,
  PasswordCellType,
  SelectCellType,
  TextCellType,
  TimeCellType,
  getCellType,
  registerAllCellTypes,
  registerCellType,
} from 'handsontable/cellTypes';

registerAllCellTypes();

registerCellType(AutocompleteCellType);
registerCellType(CheckboxCellType);
registerCellType(DateCellType);
registerCellType(DropdownCellType);
registerCellType(HandsontableCellType);
registerCellType(NumericCellType);
registerCellType(PasswordCellType);
registerCellType(SelectCellType);
registerCellType(TimeCellType);
registerCellType(TextCellType);

// custom cell types
registerCellType('copyable-cell', {
  copyPaste: true,
});

const mockTD = document.createElement('td');
const hot = new Handsontable(document.createElement('div'), {});
const cellProperties: Handsontable.CellProperties = {
  row: 0,
  col: 0,
  visualRow: 0,
  visualCol: 0,
  prop: 0,
  instance: hot,
};

const autocompleteCellType = getCellType('autocomplete');

new autocompleteCellType.editor(hot);
autocompleteCellType.renderer(hot, mockTD, 0, 0, 0, 'A1', cellProperties);
autocompleteCellType.validator.call(cellProperties, 'A1', () => {});

const checkboxCellType = getCellType('checkbox');

new checkboxCellType.editor(hot);
checkboxCellType.renderer(hot, mockTD, 0, 0, 0, 'A1', cellProperties);

const dateCellType = getCellType('date');

new dateCellType.editor(hot);
dateCellType.renderer(hot, mockTD, 0, 0, 0, 'A1', cellProperties);
dateCellType.validator.call(cellProperties, 'A1', () => {});

const dropdownCellType = getCellType('dropdown');

new dropdownCellType.editor(hot);
dropdownCellType.renderer(hot, mockTD, 0, 0, 0, 'A1', cellProperties);
dropdownCellType.validator.call(cellProperties, 'A1', () => {});

const handsontableCellType = getCellType('handsontable');

new handsontableCellType.editor(hot);
handsontableCellType.renderer(hot, mockTD, 0, 0, 0, 'A1', cellProperties);

const numericCellType = getCellType('numeric');

new numericCellType.editor(hot);
numericCellType.renderer(hot, mockTD, 0, 0, 0, 'A1', cellProperties);
numericCellType.validator.call(cellProperties, 'A1', () => {});

const textCellType = getCellType('text');

new textCellType.editor(hot);
textCellType.renderer(hot, mockTD, 0, 0, 0, 'A1', cellProperties);

const timeCellType = getCellType('time');

new timeCellType.editor(hot);
timeCellType.renderer(hot, mockTD, 0, 0, 0, 'A1', cellProperties);
timeCellType.validator.call(cellProperties, 'A1', () => {});

const customCellType = getCellType('copyable-cell');

const copyPaste: boolean = customCellType.copyPaste === true;
