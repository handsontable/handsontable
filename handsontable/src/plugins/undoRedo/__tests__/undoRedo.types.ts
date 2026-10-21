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

// `0` keeps no steps, and `Infinity` (the default) keeps them all.
new Handsontable(document.createElement('div'), { undo: { maxHistory: 0 } });
new Handsontable(document.createElement('div'), { undo: { maxHistory: Infinity } });

// A recorded step names the operations it ran and their sources; an action registered through `done()`
// may not, so the fields are optional.
new Handsontable(document.createElement('div'), {
  afterUndo(action) {
    const actionType: string = action.actionType;
    const source: string | undefined = action.source;
    const operations: string[] | undefined = action.operations;
    const sources: Array<string | undefined> | undefined = action.sources;
  },
});

// Hosts and plugins group their work into one undo step through the operation API.
const grouped: number = hot.runOperation('custom', () => 1, 'myApp.custom');
const groupedWithoutSource: string = hot.runOperation('custom', () => 'x');

// @ts-expect-error The callback comes second and the source last.
hot.runOperation('custom', 'myApp.custom', () => 1);
