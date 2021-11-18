import Core from '../../core';
import { BaseEditor } from '../baseEditor';

export const EDITOR_TYPE: 'text';
export class TextEditor extends BaseEditor {
  constructor(instance: Core);

  TEXTAREA: HTMLElement;
  TEXTAREA_PARENT: HTMLElement;
  textareaStyle: CSSStyleDeclaration;
  textareaParentStyle: CSSStyleDeclaration;

  close(): void;
  focus(): void;
  getValue(): any;
  open(event?: Event): void;
  setValue(newValue?: any): void;
  createElements(): void;
  hideEditableElement(): void;
  showEditableElement(): void;
  refreshValue(): void;
  refreshDimensions(force?: boolean): void;
  bindEvents(): void;
}
