import { registerEditor } from '../editors';
import HandsontableEditor from './handsontableEditor';

export const EDITOR_TYPE = 'handsontable';

registerEditor(EDITOR_TYPE, HandsontableEditor);

export default HandsontableEditor;
