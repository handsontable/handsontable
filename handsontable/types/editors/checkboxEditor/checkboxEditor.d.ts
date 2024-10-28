import Core from '../../core';
import { BaseEditor } from '../baseEditor';

export const EDITOR_TYPE: 'checkbox';
export class CheckboxEditor extends BaseEditor {
  constructor(instance: Core);
  close(): void;
  focus(): void;
  getValue(): any;
  open(): void;
  setValue(newValue?: any): void;
}
