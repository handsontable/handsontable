import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  undo: true,
  beforeUndo(action: unknown) {
    const _action: unknown = action;
  },
  beforeRedo(action: unknown) {
    const _action: unknown = action;
  },
  afterUndo(action: unknown) {
    const _action: unknown = action;
  },
  afterRedo(action: unknown) {
    const _action: unknown = action;
  },
});
const plugin = hot.getPlugin('undoRedo');

plugin.undo();
plugin.redo();
plugin.clear();

const isUndoAvailable: boolean = plugin.isUndoAvailable();
const isRedoAvailable: boolean = plugin.isRedoAvailable();
