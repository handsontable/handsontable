import Handsontable from 'handsontable';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { useRef } from 'react';

const hot = new Handsontable(document.body, { undo: true });

hot.getPlugin('undoRedo').undo();
hot?.getPlugin('undoRedo').redo();
const canUndo = hot.getPlugin('undoRedo').isUndoAvailable();
// TODO(handsontable-codemod 18.0.0/core-undo-methods): isRedoAvailable?.() is an optional call, which the tool does not rewrite: the plugin method...
const canRedo = hot.isRedoAvailable?.();
hot.getPlugin('undoRedo').clear();
// TODO(handsontable-codemod 18.0.0/core-undo-methods): Call them on the plugin: hot.getPlugin('undoRedo').
const history = hot.undoRedo;
// TODO(handsontable-codemod 18.0.0/core-undo-methods): Call them on the plugin: hot.getPlugin('undoRedo').
hot?.undoRedo?.clear();
hot.getPlugin('undoRedo').isUndoAvailable();

export class Grid {
  private hot!: Handsontable;

  constructor(element: HTMLElement) {
    this.hot = new Handsontable(element, {});
  }

  back(): void {
    return this.hot.getPlugin('undoRedo').undo();
  }

  forward = async() => await this.hot?.getPlugin('undoRedo').redo();
}

export function useHistory() {
  const hotRef = useRef<HotTableRef>(null);

  return {
    undo: () => hotRef.current?.hotInstance?.getPlugin('undoRedo').undo(),
    reset: () => hotRef.current?.hotInstance?.getPlugin('undoRedo').clear(),
  };
}

function legacy(other) {
  return other.clearUndo();
}

hot.getPlugin('undoRedo').undo();
hot.getPlugin('undoRedo').isUndoAvailable();
