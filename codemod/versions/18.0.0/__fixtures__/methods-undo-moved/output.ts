import Handsontable from 'handsontable';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { useRef } from 'react';

const hot = new Handsontable(document.body, { undo: true });

hot.getPlugin('undoRedo').undo();
hot?.getPlugin('undoRedo').redo();
const canUndo = hot.getPlugin('undoRedo').isUndoAvailable();
const canRedo = hot.getPlugin('undoRedo').isRedoAvailable?.();
hot.getPlugin('undoRedo').clear();
const history = hot.getPlugin('undoRedo');
hot?.getPlugin('undoRedo')?.clear();
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
