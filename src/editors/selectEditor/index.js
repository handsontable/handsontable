import { registerEditor } from '../index';
import SelectEditor from './selectEditor';

export const EDITOR_TYPE = 'select';

registerEditor(EDITOR_TYPE, SelectEditor);

export default SelectEditor;
