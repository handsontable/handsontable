import Handsontable from 'handsontable';
import { Action } from 'handsontable/plugins/undoRedo';

const hot = new Handsontable(document.createElement('div'), {
  undo: true,
  beforeUndo(action) {
    const _action: Action = action;
  },
  beforeRedo(action) {
    const _action: Action = action;
  },
  afterUndo(action) {
    const _action: Action = action;
  },
  afterRedo(action) {
    const _action: Action = action;
  },
});
const plugin = hot.getPlugin('undoRedo');

plugin.undo();
plugin.redo();
plugin.clear();

const isUndoAvailable: boolean = plugin.isUndoAvailable();
const isRedoAvailable: boolean = plugin.isRedoAvailable();
