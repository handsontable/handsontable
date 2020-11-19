import { registerEditor } from '../editors';
import DropdownEditor from './dropdownEditor';

export const EDITOR_TYPE = 'dropdown';

registerEditor(EDITOR_TYPE, DropdownEditor);

export default DropdownEditor;
