import { ExtendedEditor } from 'handsontable/editors/factory';

export interface Shortcut {
  keys: string[][];
  callback: (editorInstance: ExtendedEditor<any>, event: KeyboardEvent) => boolean | void;
  group?: string;
  runOnlyIf?: () => boolean;
  captureCtrl?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  relativeToGroup?: string;
  position?: 'before' | 'after';
  forwardToContext?: any;
}
