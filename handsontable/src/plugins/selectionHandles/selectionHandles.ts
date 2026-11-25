import type CellCoords from '../../3rdparty/walkontable/src/cell/coords';
import { BasePlugin } from '../base';
import { addClass, removeClass } from '../../helpers/dom/element';
import { getCellCoordsFromMousePosition } from '../../helpers/dom/cellCoords';
import { isRightClick } from '../../helpers/dom/event';
import { armPick, type ArmedPick } from '../../utils/armedPick';
import { announce } from '../../utils/a11yAnnouncer';
import * as C from '../../i18n/constants';
import { clampEdge, type HandleEdge } from './helpers';
import { LICENSE } from './feature.generated';

export const PLUGIN_KEY = 'selectionHandles';
export const PLUGIN_PRIORITY = 24;

/**
 * How far the pointer must move after the press on a handle before the press counts as a drag, in pixels. A press
 * and release that stay within it are a click, which arms the "click, then click" way to resize the selection.
 */
const DRAG_THRESHOLD = 3;

interface ResizeSession {
  edge: HandleEdge;
  layer: number;
  fromRow: number;
  toRow: number;
  fromCol: number;
  toCol: number;
  focusRow: number;
  focusCol: number;
}

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
   * Returns the license token of the plugin, its display name, where it is checked, and the tokens it
   * requires.
   */
  static get LICENSE() {
    return LICENSE;
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
  #drag: ResizeSession | null = null;

  /**
   * The "click, then click" gesture in progress: a click on a handle armed it, and the next click on the grid picks
   * where the edge goes.
   */
  #pick: ArmedPick | null = null;

  /**
   * The edge whose handle armed the pick in progress.
   */
  #pickEdge: HandleEdge | null = null;

  /**
   * Whether the press being released came on the handle that armed the pick, which makes its click end the pick
   * instead of arming it again.
   */
  #pressedWhileArmed = false;

  /**
   * Whether the pointer moved past the threshold since the press on a handle, which makes the press a drag.
   */
  #pressMoved = false;

  /**
   * Where the press on a handle happened, to tell a click from a drag.
   */
  #pressStart: { clientX: number; clientY: number } | null = null;

  /**
   * Stores the last visual cell coordinate under the pointer.
   */
  #lastCoords: CellCoords | null = null;

  /**
   * Whether the pointer is over the grid, kept through a pick, whose hover is frozen.
   */
  #pointerInside = false;

  /**
   * Saves the host cursor while a resize is active.
   */
  #bodyCursor = '';

  /**
   * Stores the latest pointer position so scrolling can continue the resize.
   */
  #pointerPosition: { clientX: number; clientY: number } | null = null;

  /**
   * Checks whether the plugin is enabled in the Handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return this.hot.getSettings()[PLUGIN_KEY] === true;
  }

  /**
   * Checks whether a resize drag is currently in progress. Reachable through `getPlugin` because
   * DragToScroll needs it — it must not start auto-scrolling for a press this plugin rejected — but
   * internal, not part of the public API.
   *
   * @private
   * @returns {boolean}
   */
  isDragActive(): boolean {
    return this.#drag !== null;
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
    this.addHook('afterScroll', this.#onAfterScroll);
    this.addHook('afterSelection', this.#onAfterSelection);
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
    this.#pick?.cancel();
    this.#endDrag();
    this.hot.selection.setHandlesHoveredLayer(null);
  }

  /**
   * Destroys the plugin and clears an active resize interaction.
   */
  destroy(): void {
    this.#pick?.cancel();
    this.#endDrag();
    super.destroy();
  }

  /**
   * Records the topmost range under the pointer.
   */
  #onCellMouseOver = (_event: MouseEvent, coords: CellCoords): void => {
    this.#lastCoords = coords;
    this.#pointerInside = true;

    // while a pick waits the armed handle stays: the cell it is waiting for lies outside the selection, so a hover
    // that followed the pointer would take the handle away just when the user moves to that cell
    if (!this.#drag && !this.#pick) {
      this.hot.selection.setHandlesHoveredLayer(this.hot.selection.getLayerContaining(coords));
    }
  };

  /**
   * Starts a selection resize session.
   */
  #onHandleMouseDown = (event: MouseEvent, edge: HandleEdge): void => {
    // A right-press opens the context menu; it must not also start (and on release, commit) a resize.
    if (isRightClick(event)) {
      return;
    }

    const selection = this.hot.selection;
    const layer = selection.getHandlesHoveredLayer() ?? selection.getLayerLevel();
    const range = selection.getSelectedRange().peekByIndex(layer);

    if (!range) {
      return;
    }

    // a press on the handle that armed a pick ends it, and its release must not arm it again. On another handle it
    // arms that one.
    this.#pressedWhileArmed = this.#pick !== null && this.#pickEdge === edge;
    this.#pressMoved = false;
    this.#pick?.cancel();

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
    this.#pointerPosition = { clientX: event.clientX, clientY: event.clientY };
    this.#pressStart = { clientX: event.clientX, clientY: event.clientY };
    this.#bodyCursor = this.hot.rootDocument.body.style.cursor;
    this.hot.rootDocument.body.style.cursor = edge === 'top' || edge === 'bottom' ? 'ns-resize' : 'ew-resize';
    addClass(this.hot.rootElement, `ht__resizing-selection--${edge}`);
    this.eventManager.addEventListener(this.hot.rootDocument.documentElement, 'mousemove', this.#onMouseMove);
    this.eventManager.addEventListener(this.hot.rootDocument.documentElement, 'mouseup', this.#onHandleMouseUp);
  };

  /**
   * Ends the resize session. A press and release that did not move are a click on the handle, which arms the
   * "click, then click" gesture, the single-pointer way to do what the drag does.
   */
  #onHandleMouseUp = (): void => {
    const session = this.#drag;
    const isClick = !this.#pressMoved && !this.#pressedWhileArmed;

    this.#pressedWhileArmed = false;
    this.#endDrag();

    if (session && isClick) {
      this.#startPick(session);
    }
  };

  /**
   * Starts waiting for the click that picks where the edge of a selection goes.
   *
   * @param {ResizeSession} session The selection and the edge, as they were when the handle was pressed.
   */
  #startPick(session: ResizeSession): void {
    const root = this.hot.rootElement;

    this.#pickEdge = session.edge;
    addClass(root, `ht__picking-selection--${session.edge}`);
    this.#pick = armPick({
      doc: this.hot.rootDocument,
      root,
      // a press on any handle is left to the handle: it ends the pick, and on another handle it starts that one
      isAnchor: target => target instanceof Element && target.closest('.wtSelectionHandle') !== null,
      onPick: (event) => {
        const range = this.hot.selection.getSelectedRange().peekByIndex(session.layer);
        const start = range?.getTopStartCorner();
        const end = range?.getBottomEndCorner();

        // the selection changed since the handle was clicked (a key moved it), so the edge no longer exists
        if (start?.row === session.fromRow && start.col === session.fromCol
          && end?.row === session.toRow && end.col === session.toCol) {
          this.#resizeSelection(event.clientX, event.clientY, session);
        }
      },
      onEnd: (reason) => {
        this.#pick = null;
        this.#pickEdge = null;
        removeClass(root, `ht__picking-selection--${session.edge}`);
        this.#syncHoveredLayer();

        if (reason === 'escape') {
          announce(String(this.hot.getTranslatedPhrase(C.ARMED_PICK_CANCELED) ?? ''), 'polite');
        }
      },
    });

    announce(String(this.hot.getTranslatedPhrase(C.ARMED_PICK_STARTED) ?? ''), 'polite');
  }

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

    if (!this.#pressMoved && this.#pressStart) {
      const { clientX, clientY } = this.#pressStart;

      this.#pressMoved = Math.hypot(event.clientX - clientX, event.clientY - clientY) >= DRAG_THRESHOLD;
    }

    this.#pointerPosition = { clientX: event.clientX, clientY: event.clientY };

    // A wobble within the threshold is a click, so it must not resize: the handle is a thin strip on a cell border, and
    // a pointer that slips onto the next cell would change the selection the pick is armed for.
    if (!this.#pressMoved) {
      return;
    }

    this.#resizeSelection(event.clientX, event.clientY, this.#drag);
  };

  /**
   * Continues the resize after DragToScroll changes the rendered viewport.
   */
  #onAfterScroll = (): void => {
    if (this.#drag && this.#pressMoved && this.#pointerPosition) {
      this.#resizeSelection(this.#pointerPosition.clientX, this.#pointerPosition.clientY, this.#drag);
    }
  };

  /**
   * Resizes the selected range toward the given pointer coordinates.
   *
   * @param {number} clientX The pointer's viewport X coordinate.
   * @param {number} clientY The pointer's viewport Y coordinate.
   * @param {ResizeSession | null} session The selection and the edge to resize: the drag in progress, or what a click on
   * a handle armed.
   */
  #resizeSelection(clientX: number, clientY: number, session: ResizeSession | null): void {
    if (!session) {
      return;
    }

    const { edge, layer, fromRow, toRow, fromCol, toCol, focusRow, focusCol } = session;
    const pointer = getCellCoordsFromMousePosition(this.hot, clientX, clientY);
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
    range.setTo(anchor);
    range.setHighlight(this.hot._createCellCoords(row, col));
    this.hot.selection.setRangeEnd(end, layer);
  }

  /**
   * Clears hover state after the pointer leaves the grid.
   */
  #onRootMouseLeave = (): void => {
    this.#pointerInside = false;

    if (!this.#drag && !this.#pick) {
      this.hot.selection.setHandlesHoveredLayer(null);
    }
  };

  /**
   * Restores handle hover after ordinary selection drags.
   */
  #onDocumentMouseUp = (): void => {
    if (!this.#drag && !this.#pick && this.#lastCoords) {
      this.hot.selection.setHandlesHoveredLayer(this.hot.selection.getLayerContaining(this.#lastCoords));
    }
  };

  /**
   * Ends a waiting pick when the selection changes (a key moved it, or the pick itself resized it): the handle it was
   * armed on no longer sits on the range, and the click it waits for would be lost.
   */
  #onAfterSelection = (): void => {
    this.#pick?.cancel();
  };

  /**
   * Gives the hover back to the pointer once a pick ends: the layer under it, or none when it is outside the grid.
   */
  #syncHoveredLayer(): void {
    if (!this.enabled) {
      return;
    }

    this.hot.selection.setHandlesHoveredLayer(
      this.#pointerInside && this.#lastCoords ? this.hot.selection.getLayerContaining(this.#lastCoords) : null
    );
  }

  /**
   * Ends the active resize session.
   */
  #endDrag = (): void => {
    if (!this.#drag) {
      return;
    }

    this.#drag = null;
    this.#pointerPosition = null;
    this.#pressStart = null;
    this.eventManager.removeEventListener(this.hot.rootDocument.documentElement, 'mousemove', this.#onMouseMove);
    this.eventManager.removeEventListener(this.hot.rootDocument.documentElement, 'mouseup', this.#onHandleMouseUp);
    removeClass(this.hot.rootElement, [
      'ht__resizing-selection--top',
      'ht__resizing-selection--bottom',
      'ht__resizing-selection--start',
      'ht__resizing-selection--end',
    ]);
    this.hot.rootDocument.body.style.cursor = this.#bodyCursor;
  };
}
