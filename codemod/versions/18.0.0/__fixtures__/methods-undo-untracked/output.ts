import Handsontable from 'handsontable';

declare const editor: { undo(): void };
declare const history: { redo(): void };

editor.undo();
history.redo();

export function undoOn(hot) {
  // TODO(handsontable-codemod 18.0.0/core-undo-methods): Call them on the plugin: hot.getPlugin('undoRedo').
  hot.undo();
}

export function wire(hot, undo) {
  // TODO(handsontable-codemod 18.0.0/core-undo-methods): Call them on the plugin: hot.getPlugin('undoRedo').
  const fn = hot.redo;
  undo();
}

export const grid = Handsontable;
