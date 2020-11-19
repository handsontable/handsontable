import { registerEditor } from '../editors';
import PasswordEditor from './passwordEditor';

export const EDITOR_TYPE = 'password';

registerEditor(EDITOR_TYPE, PasswordEditor);

export default PasswordEditor;
