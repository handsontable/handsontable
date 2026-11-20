import Handsontable from 'handsontable';

declare const editor: { undo(): void };
declare const history: { redo(): void };

editor.undo();
history.redo();

export function undoOn(hot) {
  hot.undo();
}

export function wire(hot, undo) {
  const fn = hot.redo;
  undo();
}

export const grid = Handsontable;
