import { registerEditor } from '../editors';
import NumericEditor from './numericEditor';

export const EDITOR_TYPE = 'numeric';

registerEditor(EDITOR_TYPE, NumericEditor);

export default NumericEditor;
