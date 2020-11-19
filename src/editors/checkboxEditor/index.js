import { registerEditor } from '../editors';
import CheckboxEditor from './checkboxEditor';

export const EDITOR_TYPE = 'checkbox';

registerEditor(EDITOR_TYPE, CheckboxEditor);

export default CheckboxEditor;
