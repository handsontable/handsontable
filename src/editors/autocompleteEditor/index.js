import { registerEditor } from '../editors';
import AutocompleteEditor from './autocompleteEditor';

export const EDITOR_TYPE = 'autocomplete';

registerEditor(EDITOR_TYPE, AutocompleteEditor);

export default AutocompleteEditor;
