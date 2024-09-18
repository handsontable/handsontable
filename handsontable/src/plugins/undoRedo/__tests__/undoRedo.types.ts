import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  undo: true,
});
const plugin = hot.getPlugin('undoRedo');

plugin.undo();
plugin.redo();
plugin.clear();

const isUndoAvailable: boolean = plugin.isUndoAvailable();
const isRedoAvailable: boolean = plugin.isRedoAvailable();
