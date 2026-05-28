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

  if (isShiftKey && currentSelection) {
    if (coords.row >= 0 && coords.col >= 0 && !controller.cell) {
      sel.setRangeEnd(coords);

    } else if (selectedCorner && coords.row < 0 && !controller.column) {
      sel.setRangeEnd(cellCoordsFactory(currentSelection.to.row, coords.col));

    } else if (selectedRow && coords.col < 0 && !controller.row) {
      sel.setRangeEnd(cellCoordsFactory(coords.row, currentSelection.to.col));

    } else if (((!selectedCorner && !selectedRow && coords.col < 0) ||
               (selectedCorner && coords.col < 0)) && !controller.row) {
      sel.selectRows(Math.max(currentSelection.from.row, 0), coords.row, coords.col);

    } else if (((!selectedCorner && !selectedRow && coords.row < 0) ||
               (selectedRow && coords.row < 0)) && !controller.column) {
      sel.selectColumns(Math.max(currentSelection.from.col, 0), coords.col, coords.row);
    }

  } else {
    const allowRightClickSelection = !sel.inInSelection(coords);
    const performSelection = isLeftClick || (isRightClick && allowRightClickSelection);

    // clicked row header and when some column was selected
    if (coords.row < 0 && coords.col >= 0 && !controller.column) {
      if (performSelection) {
        sel.selectColumns(coords.col, coords.col, coords.row);
      }

    // clicked column header and when some row was selected
    } else if (coords.col < 0 && coords.row >= 0 && !controller.row) {
      if (performSelection) {
        sel.selectRows(coords.row, coords.row, coords.col);
      }

    } else if (coords.col >= 0 && coords.row >= 0 && !controller.cell) {
      if (performSelection) {
        sel.setRangeStart(coords);
      }
    } else if (coords.col < 0 && coords.row < 0) {
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
    sel.setRangeEnd(cellCoordsFactory(countRows - 1, coords.col));

  } else if (selectedRow && !controller.row) {
    sel.setRangeEnd(cellCoordsFactory(coords.row, countCols - 1));

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
  const dvs = sel.settings.disableVisualSelection;
  // Treat empty string and empty array as equivalent to `false` (nothing is actually disabled),
  // matching how the rest of the codebase normalizes this setting.
  const visualSelectionDisabled = dvs === true
    || (typeof dvs === 'string' && dvs.length > 0)
    || (Array.isArray(dvs) && dvs.length > 0);

  // The dedup-on-second-click behavior relies on visible selection feedback; without it,
  // toggling invisible layers produces highlight jumps once any visible range repaints.
  if (!isLeftClick || sel.settings.selectionMode !== 'multiple' || visualSelectionDisabled) {
    return;
  }

  const selectionRange = sel.getSelectedRange();
  const renderableRange = selectionRange
    .clone()
    .map(range => cellRangeMapper.toRenderable(range));
  const lastRenderableRange = renderableRange.current();

  if (
    renderableRange.size() > 1 &&
    !lastRenderableRange.isHeader() &&
    !sel.isMultiple(lastRenderableRange)
  ) {
    const ranges = renderableRange.findAll(lastRenderableRange);

    // Mark the selection source as 'deselect' so `afterSetRangeEnd` in core.js skips the
    // viewport scroll for this dedup-driven refresh. Other side effects (`closeEditor`,
    // per-range `render` + `prepareEditor`, and the final batched render in
    // `afterSelectionFinished`) are guarded against the 'deselect' source in the same way
    // the existing 'refresh' source is handled - so a single batched render still happens
    // once the refresh completes.
    if (ranges.length === renderableRange.size()) {
      // if the last selection range is the same as the first one (case when the single cell
      // is selected twice or more) remove duplicate ranges
      selection.markSource('deselect');
      selectionRange.pop();
      selection.refresh();
      selection.markEndSource();

    } else if (ranges.length > 1) {
      selection.markSource('deselect');
      selectionRange.removeLayers(ranges.map(({ layer }) => layer));
      selection.refresh();
      selection.markEndSource();
    }
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
