import Core from '../core';
import { BaseEditor } from './baseEditor';
import { Editors } from './index';

export function RegisteredEditor(editorClass: BaseEditor): void;
export class RegisteredEditor {
  constructor(editorClass: BaseEditor);

  getConstructor: () => BaseEditor;
  getInstance: (hotInstance: Core) => typeof BaseEditor;
}
export function _getEditorInstance(name: string, hotInstance: Core): typeof BaseEditor;

declare function _register(name: string, editorClass: typeof BaseEditor): void;
declare function _register(editorClass: typeof BaseEditor): void;
declare function _getItem<T extends keyof Editors>(name: T): Editors[T];
declare function _getItem(name: string): typeof BaseEditor;
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
