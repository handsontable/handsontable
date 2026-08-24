import Handsontable from 'handsontable';
import type { HotInstance } from 'handsontable';
import {
  AutocompleteCellType,
  CheckboxCellType,
  DateCellType,
  DropdownCellType,
  HandsontableCellType,
  NumericCellType,
  PasswordCellType,
  TextCellType,
  TimeCellType,
  getCellType,
  registerCellType,
} from 'handsontable/cellTypes';
import { BaseEditor } from 'handsontable/editors';

interface CellProperties {
  row: number;
  col: number;
  instance: HotInstance;
  visualRow: number;
  visualCol: number;
  prop: string | number;
  [key: string]: unknown;
}

const elem = document.createElement('div');
const hot: HotInstance = Handsontable(elem, {});

const cellProperties: CellProperties = {
  row: 0,
  col: 0,
  instance: hot,
  visualRow: 0,
  visualCol: 0,
  prop: 'foo'
};

const TD = document.createElement('td');

// Verify the built-in cellTypes exist and have the correct shape
new AutocompleteCellType.editor(hot);
AutocompleteCellType.renderer(hot, TD, 0, 0, 'prop', 'foo', cellProperties);
AutocompleteCellType.validator.apply(cellProperties, ['', (valid: boolean) => {}]);

new CheckboxCellType.editor(hot);
CheckboxCellType.renderer(hot, TD, 0, 0, 'prop', 'foo', cellProperties);

new DateCellType.editor(hot);
DateCellType.renderer(hot, TD, 0, 0, 'prop', 'foo', cellProperties);
DateCellType.validator.apply(cellProperties, ['', (valid: boolean) => {}]);

new DropdownCellType.editor(hot);
DropdownCellType.renderer(hot, TD, 0, 0, 'prop', 'foo', cellProperties);
DropdownCellType.validator.apply(cellProperties, ['', (valid: boolean) => {}]);

new HandsontableCellType.editor(hot);
HandsontableCellType.renderer(hot, TD, 0, 0, 'prop', 'foo', cellProperties);

new NumericCellType.editor(hot);
NumericCellType.renderer(hot, TD, 0, 0, 'prop', 'foo', cellProperties);
NumericCellType.validator.apply(cellProperties, ['', (valid: boolean) => {}]);

new PasswordCellType.editor(hot);
PasswordCellType.renderer(hot, TD, 0, 0, 'prop', 'foo');

new TextCellType.editor(hot);
TextCellType.renderer(hot, TD, 0, 0, 'prop', 'foo', cellProperties);

new TimeCellType.editor(hot);
TimeCellType.renderer(hot, TD, 0, 0, 'prop', 'foo', cellProperties);
TimeCellType.validator.apply(cellProperties, ['', (valid: boolean) => {}]);

// Verify top-level cellTypes API
const autocomplete = getCellType('autocomplete');

new (autocomplete.editor as any)(hot);
(autocomplete.renderer as Function)(hot, TD, 0, 0, 'prop', 'foo', cellProperties);
(autocomplete.validator as Function).apply(cellProperties, ['', (valid: boolean) => {}]);

class CustomEditor extends BaseEditor {
  open() {}
  close() {}
  getValue() {}
  setValue(value: any) {}
  focus() {}
}

registerCellType('custom', {
  CELL_TYPE: 'custom',
  editor: CustomEditor,
  renderer: (hot: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
             prop: number | string, value: unknown, cellProperties: Record<string, unknown>) => TD,
  validator: (value: unknown, callback: (valid: boolean) => void) => {},
  className: 'my-cell',
  allowInvalid: true,
  myCustomCellState: 'complete',
});
