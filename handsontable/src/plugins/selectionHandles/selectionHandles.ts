import type CellCoords from '../../3rdparty/walkontable/src/cell/coords';
import { BasePlugin } from '../base';
import { addClass, removeClass } from '../../helpers/dom/element';
import { getCellCoordsFromMousePosition } from '../../helpers/dom/cellCoords';
import { clampEdge, type HandleEdge } from './helpers';

export const PLUGIN_KEY = 'selectionHandles';
export const PLUGIN_PRIORITY = 24;

/**
 * Enables desktop selection edge handles and their resize interaction.
 */
export class SelectionHandles extends BasePlugin {
  /**
   * Returns the plugin key.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the plugin priority.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns the settings that trigger a plugin update.
   */
  static get SETTING_KEYS() {
    return [PLUGIN_KEY];
  }

  /**
   * Stores the active selection resize session.
   *
   * @type {object|null}
   */
  #drag: {
    edge: HandleEdge;
    layer: number;
    fromRow: number;
    toRow: number;
    fromCol: number;
    toCol: number;
    focusRow: number;
    focusCol: number;
  } | null = null;

  /**
   * Stores the last visual cell coordinate under the pointer.
   */
  #lastCoords: CellCoords | null = null;

  /**
   * Saves the host cursor while a resize is active.
   */
  #bodyCursor = '';

  /**
   * Checks whether the plugin is enabled in the Handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return this.hot.getSettings()[PLUGIN_KEY] === true;
  }

  /**
   * Enables handle hover and resize interactions.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    this.addHook('afterOnSelectionHandleMouseDown', this.#onHandleMouseDown);
    this.addHook('beforeOnCellMouseOver', this.#onCellMouseOver);
    this.eventManager.addEventListener(this.hot.rootElement, 'mouseleave', this.#onRootMouseLeave);
    this.eventManager.addEventListener(this.hot.rootDocument.documentElement, 'mouseup', this.#onDocumentMouseUp);
    super.enablePlugin();
  }

  /**
   * Updates the plugin after its setting changes.
   */
  updatePlugin(): void {
    this.disablePlugin();
    this.enablePlugin();
    super.updatePlugin();
  }

  /**
   * Disables the plugin and clears transient resize state.
   */
  disablePlugin(): void {
    super.disablePlugin();
    this.#endDrag();
    this.hot.selection.setHandlesHoveredLayer(null);
  }

  /**
   * Records the topmost range under the pointer.
   */
  #onCellMouseOver = (_event: MouseEvent, coords: CellCoords): void => {
    this.#lastCoords = coords;

    if (!this.#drag) {
      this.hot.selection.setHandlesHoveredLayer(this.hot.selection.getLayerContaining(coords));
    }
  };

  /**
   * Starts a selection resize session.
   */
  #onHandleMouseDown = (_event: MouseEvent, edge: HandleEdge): void => {
    const selection = this.hot.selection;
    const layer = selection.getHandlesHoveredLayer() ?? selection.getLayerLevel();
    const range = selection.getSelectedRange().peekByIndex(layer);

    if (!range) {
      return;
    }

    const start = range.getTopStartCorner();
    const end = range.getBottomEndCorner();
    const focus = range.highlight;
    const fromRow = start.row!;
    const fromCol = start.col!;
    const toRow = end.row!;
    const toCol = end.col!;

    this.#drag = {
      edge,
      layer,
      fromRow,
      fromCol,
      toRow,
      toCol,
      focusRow: focus.row ?? fromRow,
      focusCol: focus.col ?? fromCol,
    };
    this.#bodyCursor = this.hot.rootDocument.body.style.cursor;
    this.hot.rootDocument.body.style.cursor = edge === 'top' || edge === 'bottom' ? 'ns-resize' : 'ew-resize';
    addClass(this.hot.rootElement, `ht__resizing-selection--${edge}`);
    this.eventManager.addEventListener(this.hot.rootDocument.documentElement, 'mousemove', this.#onMouseMove);
    this.eventManager.addEventListener(this.hot.rootDocument.documentElement, 'mouseup', this.#endDrag);
  };

  /**
   * Applies a resize to the captured selection layer.
   */
  #onMouseMove = (event: Event): void => {
    if (!(event instanceof this.hot.rootWindow.MouseEvent)) {
      return;
    }

    if (!this.#drag) {
      return;
    }

    const { edge, layer, fromRow, toRow, fromCol, toCol, focusRow, focusCol } = this.#drag;
    const pointer = getCellCoordsFromMousePosition(this.hot, event.clientX, event.clientY);
    let anchor: CellCoords;
    let end: CellCoords;

    if (edge === 'top') {
      anchor = this.hot._createCellCoords(toRow, toCol);
      end = this.hot._createCellCoords(clampEdge({ edge, target: pointer.row!, oppositeIndex: toRow }), fromCol);
    } else if (edge === 'bottom') {
      anchor = this.hot._createCellCoords(fromRow, fromCol);
      end = this.hot._createCellCoords(clampEdge({ edge, target: pointer.row!, oppositeIndex: fromRow }), toCol);
    } else if (edge === 'start') {
      anchor = this.hot._createCellCoords(toRow, toCol);
      end = this.hot._createCellCoords(fromRow, clampEdge({ edge, target: pointer.col!, oppositeIndex: toCol }));
    } else {
      anchor = this.hot._createCellCoords(fromRow, fromCol);
      end = this.hot._createCellCoords(toRow, clampEdge({ edge, target: pointer.col!, oppositeIndex: fromCol }));
    }

    const range = this.hot.selection.getSelectedRange().peekByIndex(layer);

    if (!range) {
      return;
    }

    const row = Math.min(Math.max(focusRow, Math.min(anchor.row!, end.row!)), Math.max(anchor.row!, end.row!));
    const col = Math.min(Math.max(focusCol, Math.min(anchor.col!, end.col!)), Math.max(anchor.col!, end.col!));

    range.setFrom(anchor);
    range.setHighlight(this.hot._createCellCoords(row, col));
    this.hot.selection.setRangeEnd(end, layer);
  };

  /**
   * Clears hover state after the pointer leaves the grid.
   */
  #onRootMouseLeave = (): void => {
    if (!this.#drag) {
      this.hot.selection.setHandlesHoveredLayer(null);
    }
  };

  /**
   * Restores handle hover after ordinary selection drags.
   */
  #onDocumentMouseUp = (): void => {
    if (!this.#drag && this.#lastCoords) {
      this.hot.selection.setHandlesHoveredLayer(this.hot.selection.getLayerContaining(this.#lastCoords));
    }
  };

  /**
   * Ends the active resize session.
   */
  #endDrag = (): void => {
    if (!this.#drag) {
      return;
    }

    this.#drag = null;
    this.eventManager.removeEventListener(this.hot.rootDocument.documentElement, 'mousemove', this.#onMouseMove);
    this.eventManager.removeEventListener(this.hot.rootDocument.documentElement, 'mouseup', this.#endDrag);
    removeClass(this.hot.rootElement, [
      'ht__resizing-selection--top',
      'ht__resizing-selection--bottom',
      'ht__resizing-selection--start',
      'ht__resizing-selection--end',
    ]);
    this.hot.rootDocument.body.style.cursor = this.#bodyCursor;
  };
}
