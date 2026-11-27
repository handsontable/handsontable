import Handsontable from 'handsontable';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { useRef } from 'react';

const hot = new Handsontable(document.body, { undo: true });

hot.undo();
hot?.redo();
const canUndo = hot.isUndoAvailable();
const canRedo = hot.isRedoAvailable?.();
hot.clearUndo();
const history = hot.undoRedo;
hot?.undoRedo?.clear();
hot.undoRedo.isUndoAvailable();

export class Grid {
  private hot!: Handsontable;

  constructor(element: HTMLElement) {
    this.hot = new Handsontable(element, {});
  }

  back(): void {
    return this.hot.undo();
  }

  forward = async() => await this.hot?.redo();
}

export function useHistory() {
  const hotRef = useRef<HotTableRef>(null);

  return {
    undo: () => hotRef.current?.hotInstance?.undo(),
    reset: () => hotRef.current?.hotInstance?.clearUndo(),
  };
}

function legacy(other) {
  return other.clearUndo();
}

hot.getPlugin('undoRedo').undo();
hot.getPlugin('undoRedo').isUndoAvailable();
