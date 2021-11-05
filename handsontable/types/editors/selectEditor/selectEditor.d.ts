import Core from '../../core';
import { RowObject, CellValue } from '../../common';
import { BaseEditor } from '../baseEditor';

export const EDITOR_TYPE: 'select';
export class SelectEditor extends BaseEditor {
  constructor(instance: Core);
  close(): void;
  focus(): void;
  getValue(): any;
  open(): void;
  setValue(newValue?: any): void;
  prepareOptions(optionsToPrepare?: RowObject | CellValue[]): void;
  refreshDimensions(): void;
  refreshValue(): void;
}
