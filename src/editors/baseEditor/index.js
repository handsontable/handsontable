import { registerEditor } from '../index';
import BaseEditor, { EditorState } from './baseEditor';

export const EDITOR_TYPE = 'base';

registerEditor(EDITOR_TYPE, BaseEditor);

export {
  EditorState,
};

export default BaseEditor;
