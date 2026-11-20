// A file that only mentions Handsontable in a comment is not a Handsontable file.
import { createEditor } from './editor.js';

const editor = createEditor();
const hot = editor.grid;
const plugin = editor.plugin;

editor.undo();
editor.redo();
hot.undo();
hot.clearUndo();
plugin.saveManualColumnWidths();
plugin.loadManualRowHeights();
const unwrapped = helper.sanitize(editor.text);

export const history = hot.undoRedo;
