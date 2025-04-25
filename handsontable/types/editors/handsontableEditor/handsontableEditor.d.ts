import Core from '../../core';
import { TextEditor } from '../textEditor';

export const EDITOR_TYPE: 'handsontable';
export class HandsontableEditor extends TextEditor {
  constructor(instance: Core);

  htEditor: Core;
  htContainer: HTMLElement;

  getValue(): string;
  flipDropdownVerticallyIfNeeded(): { isFlipped: boolean, spaceAbove: number, spaceBelow: number};
  flipDropdownVertically(): void;
  unflipDropdownVertically(): void;
  flipDropdownHorizontallyIfNeeded(): { isFlipped: boolean, spaceInlineStart: number, spaceInlineEnd: number};
  flipDropdownHorizontally(): void;
  unflipDropdownHorizontally(): void;
  getDropdownHeight(): number;
  getDropdownWidth(): number;
  getTargetDropdownWidth(): number;
  getTargetDropdownHeight(): number;
}
