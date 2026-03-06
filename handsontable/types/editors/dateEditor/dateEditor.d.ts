import { PikadayOptions } from '@handsontable/pikaday';
import Core from '../../core';
import { TextEditor } from '../textEditor';

export const EDITOR_TYPE: 'date';
export class DateEditor extends TextEditor {
  constructor(instance: Core);

  parentDestroyed: boolean;

  destroyElements(): void;
  open(event?: Event): void;
  showDatepicker(event?: Event): void;
  hideDatepicker(): void;
  getDatePickerConfig(): PikadayOptions;
}
