import Core from '../core';
import { BaseEditor } from './base';
import { Editors } from './index';

export function RegisteredEditor(editorClass: BaseEditor): void;
export class RegisteredEditor {
  constructor(editorClass: BaseEditor);

  getConstructor: () => BaseEditor;
  getInstance: (hotInstance: Core) => any;
}
export function _getEditorInstance(name: string, hotInstance: Core): BaseEditor;

declare function _register(name: string, editorClass: BaseEditor): void;
declare function _getItem<T extends keyof Editors>(name: T): Editors[T];
declare function hasItem(name: string): boolean;
declare function getNames(): string[];
declare function getValues(): BaseEditor[];

export {
  _register as registerEditor,
  _getItem as getEditor,
  _getEditorInstance as getEditorInstance,
  hasItem as hasEditor,
  getNames as getRegisteredEditorNames,
  getValues as getRegisteredEditors
};
