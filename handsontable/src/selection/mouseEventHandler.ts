import type { default as CellCoords } from '../3rdparty/walkontable/src/cell/coords';
import type { default as CellRange } from '../3rdparty/walkontable/src/cell/range';
import type { default as SelectionManager } from './selection';
import { isRightClick as isRightClickEvent, isLeftClick as isLeftClickEvent } from './../helpers/dom/event';

/**
 * The cell that held the focus when the mouse went down, stored per Selection instance.
 *
 * `mouseDown` adds the clicked layer and moves the focus onto it, so by the time `mouseUp` runs
 * the previous focus is gone. `mouseUp` needs it to tell two intents apart: Ctrl+clicking the
 * focused cell deselects it, while Ctrl+clicking any other already-selected cell only moves the
 * focus there. The map is weak, so it holds no instance alive.
 */
const focusBeforeMouseDown = new WeakMap<SelectionManager, CellCoords | null>();

interface MouseDownOptions {
  isShiftKey: boolean;
  isLeftClick: boolean;
  isRightClick: boolean;
  coords: CellCoords;
  selection: SelectionManager;
  controller: { row?: boolean; column?: boolean; cell?: boolean };
  cellCoordsFactory: (row: number, col: number) => CellCoords;
}

/**
 * MouseDown handler.
 *
 * @param {object} options The handler options.
 * @param {boolean} options.isShiftKey The flag which indicates if the shift key is pressed.
 * @param {boolean} options.isLeftClick The flag which indicates if the left mouse button is pressed.
 * @param {boolean} options.isRightClick The flag which indicates if the right mouse button is pressed.
 * @param {CellRange} options.coords The CellCoords object with defined visual coordinates.
 * @param {Selection} options.selection The Selection class instance.
 * @param {object} options.controller An object with keys `row`, `column`, `cell` which indicate what
 *                                    operation will be performed in later selection stages.
 * @param {Function} options.cellCoordsFactory The function factory for CellCoords objects.
 */
export function mouseDown({
  isShiftKey, isLeftClick, isRightClick, coords, selection, controller, cellCoordsFactory,
}: MouseDownOptions) {
  const sel = selection;
  const currentSelection = sel.isSelected() ? sel.getSelectedRange().current() : null;
  const selectedCorner = sel.isSelectedByCorner();
  const selectedRow = sel.isSelectedByRowHeader();

  // Read before the click changes anything, and only for the mode that consumes it. Cloned
  // because the range keeps mutating its own highlight in place. The focus can sit on any layer,
  // not just the last one, because keyboard navigation rotates the active layer - so this is read
  // from the active range, not `current()`.
  focusBeforeMouseDown.set(sel, sel.isSelected() && sel.settings.selectionMode === 'multiple'
    ? sel.getActiveSelectedRange()?.highlight.clone() ?? null
    : null);

  sel.markSource('mouse');

  const coordsRow = coords.row ?? -1;
  const coordsCol = coords.col ?? -1;

  if (isShiftKey && currentSelection) {
    if (coordsRow >= 0 && coordsCol >= 0 && !controller.cell) {
      sel.setRangeEnd(coords);

    } else if (selectedCorner && coordsRow < 0 && !controller.column) {
      sel.setRangeEnd(cellCoordsFactory(currentSelection.to.row ?? 0, coordsCol));

    } else if (selectedRow && coordsCol < 0 && !controller.row) {
      sel.setRangeEnd(cellCoordsFactory(coordsRow, currentSelection.to.col ?? 0));

    } else if (((!selectedCorner && !selectedRow && coordsCol < 0) ||
               (selectedCorner && coordsCol < 0)) && !controller.row) {
      sel.selectRows(Math.max(currentSelection.from.row ?? 0, 0), coordsRow, coordsCol);

    } else if (((!selectedCorner && !selectedRow && coordsRow < 0) ||
               (selectedRow && coordsRow < 0)) && !controller.column) {
      sel.selectColumns(Math.max(currentSelection.from.col ?? 0, 0), coordsCol, coordsRow);
    }

  } else {
    const allowRightClickSelection = !sel.inInSelection(coords);
    const performSelection = isLeftClick || (isRightClick && allowRightClickSelection);

    // clicked row header and when some column was selected
    if (coordsRow < 0 && coordsCol >= 0 && !controller.column) {
      if (performSelection) {
        sel.selectColumns(coordsCol, coordsCol, coordsRow);
      }

    // clicked column header and when some row was selected
    } else if (coordsCol < 0 && coordsRow >= 0 && !controller.row) {
      if (performSelection) {
        sel.selectRows(coordsRow, coordsRow, coordsCol);
      }

    } else if (coordsCol >= 0 && coordsRow >= 0 && !controller.cell) {
      if (performSelection) {
        sel.setRangeStart(coords);
      }
    } else if (coordsCol < 0 && coordsRow < 0) {
      sel.selectAll(true, true, {
        disableHeadersHighlight: true,
        focusPosition: { row: 0, col: 0 },
      });
    }
  }

  sel.markEndSource();
}

interface MouseOverOptions {
  isLeftClick: boolean;
  coords: CellCoords;
  selection: SelectionManager;
  controller: { row?: boolean; column?: boolean; cell?: boolean };
  cellCoordsFactory: (row: number, col: number) => CellCoords;
}

/**
 * MouseOver handler.
 *
 * @param {object} options The handler options.
 * @param {boolean} options.isLeftClick Indicates that event was fired using the left mouse button.
 * @param {CellRange} options.coords The CellCoords object with defined visual coordinates.
 * @param {Selection} options.selection The Selection class instance.
 * @param {object} options.controller An object with keys `row`, `column`, `cell` which indicate what
 *                                    operation will be performed in later selection stages.
 * @param {Function} options.cellCoordsFactory The function factory for CellCoords objects.
 */
export function mouseOver({ isLeftClick, coords, selection, controller, cellCoordsFactory }: MouseOverOptions) {
  if (!isLeftClick) {
    return;
  }

  const sel = selection;
  const selectedRow = sel.isSelectedByRowHeader();
  const selectedColumn = sel.isSelectedByColumnHeader();
  const countCols = sel.tableProps.countCols();
  const countRows = sel.tableProps.countRows();

  sel.markSource('mouse');

  if (selectedColumn && !controller.column) {
    sel.setRangeEnd(cellCoordsFactory(countRows - 1, coords.col ?? 0));

  } else if (selectedRow && !controller.row) {
    sel.setRangeEnd(cellCoordsFactory(coords.row ?? 0, countCols - 1));

  } else if (!controller.cell) {
    sel.setRangeEnd(coords);
  }

  sel.markEndSource();
}

interface MouseUpOptions {
  isLeftClick: boolean;
  isDoubleClick: boolean;
  selection: SelectionManager;
  cellRangeMapper: { toRenderable: (range: CellRange) => CellRange };
}

/**
 * Redraws the selection after this handler changed its layers.
 *
 * The source stays `deselect` on every path, including the one that only moves the focus. It is
 * what the hooks have always reported here, and renaming it would change the public hook payload.
 *
 * @param {Selection} selection The Selection class instance.
 */
function refreshLayers(selection: SelectionManager) {
  selection.markSource('deselect');
  selection.refresh();
  selection.markEndSource();
}

/**
 * Mouse up handler.
 *
 * @param {object} options The handler options.
 * @param {boolean} options.isLeftClick Indicates that event was fired using the left mouse button.
 * @param {boolean} options.isDoubleClick Indicates that event closed a double-click.
 * @param {Selection} options.selection The Selection class instance.
 * @param {CellRangeToRenderableMapper} options.cellRangeMapper Mapper for converting cell ranges
 * to renderable indexes.
 */
export function mouseUp({ isLeftClick, isDoubleClick, selection, cellRangeMapper }: MouseUpOptions) {
  const sel = selection;
  const focusedBefore = focusBeforeMouseDown.get(sel) ?? null;

  focusBeforeMouseDown.delete(sel);

  if (!isLeftClick || sel.settings.selectionMode !== 'multiple') {
    return;
  }

  const selectionRange = sel.getSelectedRange();
  const renderableRange = selectionRange
    .clone()
    .map(range => cellRangeMapper.toRenderable(range));
  const lastRenderableRange = renderableRange.current();

  // DEV-1771 / DEV-2761: ctrl+click toggle behavior.
  //
  // When the newly added layer is a single cell, check whether that same cell already
  // existed as a standalone single-cell layer (in visual coords). If it did, the click
  // landed on a cell that was already selected, and the intent depends on where the focus
  // was before the click:
  //
  //   - it was on that very cell  -> the user is toggling it off, so every copy goes;
  //   - it was anywhere else      -> the user is moving the focus onto an already-selected
  //                                  cell, so the layer just clicked stays and only the
  //                                  stale copies behind it go.
  //
  // Removing every copy in the second case is what made the focus land on an unrelated cell
  // (DEV-2761): the cell the user clicked stopped being selected, so the focus fell back to
  // whichever layer happened to remain.
  //
  // With no duplicate at all the click just moves the active focus, and the refresh snaps
  // hover-extended ranges back to their bounds.
  //
  // The guard `isSingleCell()` (on the *visual* range, not the renderable one) prevents
  // a false-positive toggle when a range collapses to a single renderable cell because
  // hidden columns/rows make its `from` and `to` renderable coords identical.
  if (
    lastRenderableRange &&
    renderableRange.size() > 1 &&
    !lastRenderableRange.isHeader() &&
    !sel.isMultiple(lastRenderableRange)
  ) {
    const duplicateLayerIndexes = renderableRange
      .findAll(lastRenderableRange)
      .filter(({ layer }) => selectionRange.peekByIndex(layer)?.isSingleCell())
      .map(({ layer }) => layer);

    if (duplicateLayerIndexes.length >= 2) {
      const clickedCell = selectionRange.current()?.highlight;
      // The closing mouseup of a double-click must never deselect. Its mousedown already moved
      // the focus onto the clicked cell, so the "toggling it off" test below would match and
      // double-clicking a selected cell would drop it.
      // `isSet()` matters: `isEqual` compares the raw row and col, so two coordinates that carry
      // no position at all would read as equal to each other.
      const isTogglingOff = !isDoubleClick &&
        focusedBefore !== null &&
        clickedCell?.isSet() === true &&
        focusedBefore.isEqual(clickedCell);

      if (!isTogglingOff) {
        // `findAll` walks the layers in order, so every copy but the last one is stale. Keeping
        // the last one keeps the focus on the cell the user clicked.
        selectionRange.removeLayers(duplicateLayerIndexes.slice(0, -1));
        refreshLayers(selection);

        return;
      }

      if (duplicateLayerIndexes.length >= selectionRange.size()) {
        // All layers are being removed. Call deselect() before removing so that
        // the selection is still non-empty; deselect() would return early otherwise
        // and leave inProgress=true, causing the document-level mouseup handler to
        // call finish() with an empty selectedRange and crash.
        selection.deselect();
      } else {
        selectionRange.removeLayers(duplicateLayerIndexes);
        refreshLayers(selection);
      }

      return;
    }

    refreshLayers(selection);
  }
}

const handlers = new Map<string, Function>([
  ['touchstart', mouseDown],
  ['touchend', mouseUp],
  ['mousedown', mouseDown],
  ['mouseover', mouseOver],
  ['mousemove', mouseOver],
  ['mouseup', mouseUp],
]);

/**
 * Mouse handler for selection functionality.
 *
 * @param {Event} event An native event to handle.
 * @param {object} options The handler options.
 * @param {CellRange} options.coords The CellCoords object with defined visual coordinates.
 * @param {Selection} options.selection The Selection class instance.
 * @param {object} options.controller An object with keys `row`, `column`, `cell` which indicate what
 *                                    operation will be performed in later selection stages.
 * @param {Function} options.cellCoordsFactory The function factory for CellCoords objects.
 */
export function handleMouseEvent(event: Event, options: Record<string, unknown>) {
  const handler = handlers.get(event.type);

  if (handler) {
    handler({
      isShiftKey: (event as KeyboardEvent).shiftKey,
      isLeftClick: isLeftClickEvent(event) || event.type === 'touchstart',
      isRightClick: isRightClickEvent(event),
      // `detail` counts the clicks in the current sequence, so it is 2 on the mouseup that closes
      // a double-click. Touch events report 0.
      isDoubleClick: ((event as MouseEvent).detail ?? 0) > 1,
      ...options,
    });
  }
}
