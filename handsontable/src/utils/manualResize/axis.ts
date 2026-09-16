import type { HotInstance } from '../../core/types';
import type { default as CellCoords } from '../../3rdparty/walkontable/src/cell/coords';
import type { IndexMapper } from '../../translations';
import { closest } from '../../helpers/dom/element';

/**
 * The direction a resize drag moves the header edge in. A row is resized vertically, a column
 * horizontally.
 */
export type ResizeOrientation = 'vertical' | 'horizontal';

/**
 * A header's position relative to the overlay that renders it, as `getRelativeCellPosition()`
 * reports it.
 */
export type HeaderPosition = {
  top: number,
  start: number,
};

/**
 * Everything the shared resize gesture needs to know about one axis.
 *
 * Only `orientation` decides the geometry – which CSS property moves, which one stays, what is
 * measured, and which pointer coordinate is read. The remaining entries hold the parts that are
 * genuinely different between the two plugins rather than mirrored.
 */
export interface ResizeAxis {
  /**
   * The direction the header edge is dragged in.
   */
  orientation: ResizeOrientation;
  /**
   * The CSS class of the resize handle element.
   */
  handleClassName: string;
  /**
   * The CSS class of the resize guide element.
   */
  guideClassName: string;
  /**
   * The hook fired before a size is applied.
   */
  beforeResizeHook: 'beforeRowResize' | 'beforeColumnResize';
  /**
   * The hook fired after a size is applied.
   */
  afterResizeHook: 'afterRowResize' | 'afterColumnResize';
  /**
   * Returns the index mapper of this axis.
   */
  getIndexMapper(hot: HotInstance): IndexMapper;
  /**
   * Returns this axis' index from a coordinate.
   */
  getCoordsIndex(coords: CellCoords): number | null;
  /**
   * Checks whether the current selection was made through this axis' headers.
   */
  isSelectedByHeader(hot: HotInstance): boolean;
  /**
   * Checks whether an element sits inside a header that belongs to this axis.
   */
  isHeaderElement(hot: HotInstance, element: HTMLElement): boolean;
  /**
   * Checks whether a header may show the resize handle at all.
   */
  canResizeHeader(header: HTMLElement): boolean;
  /**
   * Resolves the header's position against the overlay that renders it.
   */
  getHeaderPosition(hot: HotInstance, header: HTMLElement, coords: CellCoords): HeaderPosition | undefined;
  /**
   * Returns the size reported to the resize hooks.
   */
  getHookSize(hot: HotInstance, index: number, newSize: number | null): number | null;
}

/**
 * The row axis, used by the `ManualRowResize` plugin.
 */
export const ROW_RESIZE_AXIS: ResizeAxis = {
  orientation: 'vertical',
  handleClassName: 'manualRowResizer',
  guideClassName: 'manualRowResizerGuide',
  beforeResizeHook: 'beforeRowResize',
  afterResizeHook: 'afterRowResize',

  getIndexMapper(hot) {
    return hot.rowIndexMapper;
  },

  getCoordsIndex(coords) {
    return coords.row;
  },

  isSelectedByHeader(hot) {
    return hot.selection.isSelectedByRowHeader();
  },

  isHeaderElement(hot, element) {
    const tbody = closest(element, ['TBODY'], hot.rootElement);
    const {
      inlineStartOverlay,
      topInlineStartCornerOverlay,
      bottomInlineStartCornerOverlay,
    } = hot.view._wt.wtOverlays;

    return [
      inlineStartOverlay.clone?.wtTable.TBODY,
      topInlineStartCornerOverlay.clone?.wtTable.TBODY,
      bottomInlineStartCornerOverlay.clone?.wtTable.TBODY,
    ].includes(tbody as HTMLTableSectionElement);
  },

  canResizeHeader() {
    return true;
  },

  getHeaderPosition(hot, header, coords) {
    const { view } = hot;
    const { _wt: wt } = view;
    const row = coords.row ?? 0;
    const column = coords.col ?? 0;
    // Read "fixedRowsTop" and "fixedRowsBottom" through the Walkontable as in that context, the fixed
    // rows are modified (reduced by the number of hidden rows) by TableView module.
    const fixedRowTop = row < (wt.getSetting('fixedRowsTop') as number);
    const fixedRowBottom = row >= view.countNotHiddenRowIndexes(0, 1) - (wt.getSetting('fixedRowsBottom') as number);
    let position;

    if (fixedRowTop) {
      position = wt.wtOverlays.topInlineStartCornerOverlay.getRelativeCellPosition(header, row, column);

    } else if (fixedRowBottom) {
      position = wt.wtOverlays.bottomInlineStartCornerOverlay.getRelativeCellPosition(header, row, column);
    }

    // If the TH is not a child of the top-left/bottom-left overlay, recalculate using
    // the left overlay – as this overlay contains the rest of the headers.
    if (!position) {
      position = wt.wtOverlays.inlineStartOverlay.getRelativeCellPosition(header, row, column);
    }

    return position;
  },

  getHookSize(hot, row, newSize) {
    // A declared row height is a minimum, not a target, so a row renders taller than the dragged size
    // when its content needs it – and the hooks report what renders.
    // TODO: this should utilize `hot.getRowHeight` after it's fixed and working properly.
    const walkontableHeight = hot.view._wt.wtTable.getRowHeight(row);

    if (walkontableHeight !== undefined && newSize !== null && newSize < walkontableHeight) {
      return walkontableHeight;
    }

    return newSize;
  },
};

/**
 * The column axis, used by the `ManualColumnResize` plugin.
 */
export const COLUMN_RESIZE_AXIS: ResizeAxis = {
  orientation: 'horizontal',
  handleClassName: 'manualColumnResizer',
  guideClassName: 'manualColumnResizerGuide',
  beforeResizeHook: 'beforeColumnResize',
  afterResizeHook: 'afterColumnResize',

  getIndexMapper(hot) {
    return hot.columnIndexMapper;
  },

  getCoordsIndex(coords) {
    return coords.col;
  },

  isSelectedByHeader(hot) {
    return hot.selection.isSelectedByColumnHeader();
  },

  isHeaderElement(hot, element) {
    const thead = closest(element, ['THEAD'], hot.rootElement) as HTMLElement | null;
    const { topOverlay, topInlineStartCornerOverlay } = hot.view._wt.wtOverlays;

    return ([
      topOverlay.clone!.wtTable.THEAD,
      topInlineStartCornerOverlay.clone!.wtTable.THEAD,
    ] as (HTMLElement | null)[]).includes(thead);
  },

  canResizeHeader(header) {
    // A header spanning several columns (nested headers) has no single column to resize.
    const colspan = header.getAttribute('colspan');

    return colspan === null || colspan === '1';
  },

  getHeaderPosition(hot, header, coords) {
    const { _wt: wt } = hot.view;
    const row = coords.row ?? 0;
    const column = coords.col ?? 0;
    // Read "fixedColumnsStart" through the Walkontable as in that context, the fixed columns
    // are modified (reduced by the number of hidden columns) by TableView module.
    const fixedColumn = column < (wt.getSetting('fixedColumnsStart') as number);
    let position;

    if (fixedColumn) {
      position = wt.wtOverlays.topInlineStartCornerOverlay.getRelativeCellPosition(header, row, column);
    }

    // If the TH is not a child of the top-left overlay, recalculate using
    // the top overlay – as this overlay contains the rest of the headers.
    if (!position) {
      position = wt.wtOverlays.topOverlay.getRelativeCellPosition(header, row, column);
    }

    return position;
  },

  getHookSize(_hot, _column, newSize) {
    return newSize;
  },
};
