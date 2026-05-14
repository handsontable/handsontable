import Handsontable from 'handsontable/base';
import type { HotInstance } from 'handsontable';
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
  CELL_TYPE: 'copyable-cell',
  copyPaste: true,
});

const mockTD = document.createElement('td');
const hot: HotInstance = Handsontable(document.createElement('div'), {});

interface CellProperties {
  row: number;
  col: number;
  visualRow: number;
  visualCol: number;
  prop: string | number;
  instance: HotInstance;
  [key: string]: unknown;
}

const cellProperties: CellProperties = {
  row: 0,
  col: 0,
  visualRow: 0,
  visualCol: 0,
  prop: 0,
  instance: hot,
};

const autocompleteCellType = getCellType('autocomplete');

new (autocompleteCellType.editor as any)(hot);
(autocompleteCellType.renderer as Function)(hot, mockTD, 0, 0, 0, 'A1', cellProperties);
(autocompleteCellType.validator as Function).call(cellProperties, 'A1', () => {});

const checkboxCellType = getCellType('checkbox');

new (checkboxCellType.editor as any)(hot);
(checkboxCellType.renderer as Function)(hot, mockTD, 0, 0, 0, 'A1', cellProperties);

const dateCellType = getCellType('date');

new (dateCellType.editor as any)(hot);
(dateCellType.renderer as Function)(hot, mockTD, 0, 0, 0, 'A1', cellProperties);
(dateCellType.validator as Function).call(cellProperties, 'A1', () => {});

const dropdownCellType = getCellType('dropdown');

new (dropdownCellType.editor as any)(hot);
(dropdownCellType.renderer as Function)(hot, mockTD, 0, 0, 0, 'A1', cellProperties);
(dropdownCellType.validator as Function).call(cellProperties, 'A1', () => {});

const handsontableCellType = getCellType('handsontable');

new (handsontableCellType.editor as any)(hot);
(handsontableCellType.renderer as Function)(hot, mockTD, 0, 0, 0, 'A1', cellProperties);

const numericCellType = getCellType('numeric');

new (numericCellType.editor as any)(hot);
(numericCellType.renderer as Function)(hot, mockTD, 0, 0, 0, 'A1', cellProperties);
(numericCellType.validator as Function).call(cellProperties, 'A1', () => {});

const textCellType = getCellType('text');

new (textCellType.editor as any)(hot);
(textCellType.renderer as Function)(hot, mockTD, 0, 0, 0, 'A1', cellProperties);

const timeCellType = getCellType('time');

new (timeCellType.editor as any)(hot);
(timeCellType.renderer as Function)(hot, mockTD, 0, 0, 0, 'A1', cellProperties);
(timeCellType.validator as Function).call(cellProperties, 'A1', () => {});

const customCellType = getCellType('copyable-cell');

const copyPaste: boolean = customCellType.copyPaste === true;
