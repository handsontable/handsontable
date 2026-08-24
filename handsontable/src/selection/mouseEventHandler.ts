import type { default as CellCoords } from '../3rdparty/walkontable/src/cell/coords';
import type { default as CellRange } from '../3rdparty/walkontable/src/cell/range';
import type { default as SelectionManager } from './selection';
import { isRightClick as isRightClickEvent, isLeftClick as isLeftClickEvent } from './../helpers/dom/event';

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
  selection: SelectionManager;
  cellRangeMapper: { toRenderable: (range: CellRange) => CellRange };
}

/**
 * Mouse up handler.
 *
 * @param {object} options The handler options.
 * @param {boolean} options.isLeftClick Indicates that event was fired using the left mouse button.
 * @param {Selection} options.selection The Selection class instance.
 * @param {CellRangeToRenderableMapper} options.cellRangeMapper Mapper for converting cell ranges
 * to renderable indexes.
 */
export function mouseUp({ isLeftClick, selection, cellRangeMapper }: MouseUpOptions) {
  const sel = selection;

  if (!isLeftClick || sel.settings.selectionMode !== 'multiple') {
    return;
  }

  const selectionRange = sel.getSelectedRange();
  const renderableRange = selectionRange
    .clone()
    .map(range => cellRangeMapper.toRenderable(range));
  const lastRenderableRange = renderableRange.current();

  // DEV-1771: ctrl+click toggle behavior.
  //
  // When the newly added layer is a single cell, check whether that same cell already
  // existed as a standalone single-cell layer (in visual coords). If it did, the user is
  // toggling it off — remove all copies of that single-cell layer. Otherwise the click
  // just moves the active focus; snap hover-extended ranges back to their bounds.
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
      if (duplicateLayerIndexes.length >= selectionRange.size()) {
        // All layers are being removed. Call deselect() before removing so that
        // the selection is still non-empty; deselect() would return early otherwise
        // and leave inProgress=true, causing the document-level mouseup handler to
        // call finish() with an empty selectedRange and crash.
        selection.deselect();
      } else {
        selectionRange.removeLayers(duplicateLayerIndexes);
        selection.markSource('deselect');
        selection.refresh();
        selection.markEndSource();
      }

      return;
    }

    selection.markSource('deselect');
    selection.refresh();
    selection.markEndSource();
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
      ...options,
    });
  }
}
