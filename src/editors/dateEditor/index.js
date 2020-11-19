import { registerEditor } from '../editors';
import DateEditor from './dateEditor';

export const EDITOR_TYPE = 'date';

registerEditor(EDITOR_TYPE, DateEditor);

export default DateEditor;
