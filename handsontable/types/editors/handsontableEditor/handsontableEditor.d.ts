import Core from '../../core';
import { TextEditor } from '../textEditor';

export const EDITOR_TYPE: 'handsontable';
export class HandsontableEditor extends TextEditor {
  constructor(instance: Core);

  htEditor: Core;
  htContainer: HTMLElement;
  isFlippedVertically: boolean;
  isFlippedHorizontally: boolean;

  getValue(): string;
  getDropdownHeight(): number;
  getDropdownWidth(): number;
  getTargetDropdownWidth(): number;
  getTargetDropdownHeight(): number;
}
