import Core from '../../core';
import { BaseEditor } from '../baseEditor';

export const EDITOR_TYPE: 'text';
export class TextEditor extends BaseEditor {
  constructor(instance: Core);
  close(): void;
  focus(): void;
  getValue(): any;
  open(event?: Event): void;
  setValue(newValue?: any): void;
}
