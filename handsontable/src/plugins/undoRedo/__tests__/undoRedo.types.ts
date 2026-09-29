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

// The object form keeps a bounded history.
new Handsontable(document.createElement('div'), {
  undo: { maxHistory: 100 },
});

// @ts-expect-error `maxHistory` is a number.
new Handsontable(document.createElement('div'), { undo: { maxHistory: '100' } });

// Hosts and plugins group their work into one undo step through the operation API.
const grouped: number = hot.runOperation('custom', 'myApp.custom', () => 1);
