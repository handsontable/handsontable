import { registerEditor } from '../index';
import TextEditor from './textEditor';

export const EDITOR_TYPE = 'text';

registerEditor(EDITOR_TYPE, TextEditor);

export default TextEditor;
