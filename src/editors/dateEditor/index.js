import { registerEditor } from '../index';
import DateEditor from './dateEditor';

export const EDITOR_TYPE = 'date';

registerEditor(EDITOR_TYPE, DateEditor);

export default DateEditor;
