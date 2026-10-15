import type { HotInstance } from '../../../../core/types';
import type { IndexMapper } from '../../../../translations';
import { MAX_ANIMATED_CELLS } from '../switchTiming';

/**
 * A box in pixels, relative to the padding edge of the grid element (`hot.rootGridElement`).
 */
export interface GridBox {
  /**
   * The distance from the grid's left padding edge.
   */
  left: number;
  /**
   * The distance from the grid's top padding edge.
   */
  top: number;
  /**
   * The width.
   */
  width: number;
  /**
   * The height.
   */
  height: number;
}

/**
 * One cell on screen: a body cell, a column header, or a row header.
 */
export interface VisibleCell {
  /**
   * The visual `row:column` pair. Headers use the negative indexes `getCell()` takes.
   */
  key: string;
  /**
   * Whether the cell is a column or a row header.
   */
  isHeader: boolean;
  /**
   * Whether the cell is a column header.
   */
  isColumnHeader: boolean;
  /**
   * The cell element: the topmost one, so a frozen cell is taken from its overlay.
   */
  element: HTMLTableCellElement;
  /**
   * The position of the cell's column among the visible columns, in on-screen inline order.
   * Row headers share the first position.
   */
  group: number;
  /**
   * The overlay class (`ht_master`, `ht_clone_top`, ...) of the pane that paints the cell.
   */
  pane: string;
  /**
   * The cell's padding box, so its borders stay outside.
   */
  box: GridBox;
}

/**
 * The visible cells and the panes that clip them.
 */
export interface VisibleCellSet {
  /**
   * Every visible cell, each element once.
   */
  cells: VisibleCell[];
  /**
   * How many visible column positions the cells span.
   */
  groupCount: number;
  /**
   * The visible box of each pane, keyed by its overlay class. A pane that is not shown is absent.
   */
  panes: Map<string, GridBox>;
}

/**
 * The overlay classes of the panes, in the order the grid stacks them, lowest first.
 */
export const PANE_CLASSES = [
  'ht_master',
  'ht_clone_inline_start',
  'ht_clone_inline_end',
  'ht_clone_bottom',
  'ht_clone_bottom_inline_start_corner',
  'ht_clone_bottom_inline_end_corner',
  'ht_clone_top',
  'ht_clone_top_inline_start_corner',
  'ht_clone_top_inline_end_corner',
];

/**
 * Matches the root element of any pane.
 */
const PANE_SELECTOR = PANE_CLASSES.map(name => `.${name}`).join(', ');

/**
 * Tells whether a value is a usable visual index.
 */
function isIndex(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

/**
 * Maps a run of renderable indexes to visual ones, dropping the ones that do not resolve.
 */
function renderableRun(
  toVisual: (renderableIndex: number) => number | null,
  from: number,
  count: number,
): number[] {
  const indexes: number[] = [];

  for (let renderable = Math.max(from, 0); renderable < from + count; renderable++) {
    const visual = toVisual(renderable);

    if (isIndex(visual)) {
      indexes.push(visual);
    }
  }

  return indexes;
}

/**
 * Returns the visual indexes that render from the visual index `first` to `last`, so an index a
 * hidden row or column holds between them is never walked. Answers none when either end is
 * missing or does not render.
 */
function renderableSpan(mapper: IndexMapper, first: unknown, last: unknown): number[] {
  const from = isIndex(first) ? mapper.getRenderableFromVisualIndex(first) : null;
  const to = isIndex(last) ? mapper.getRenderableFromVisualIndex(last) : null;

  if (!isIndex(from) || !isIndex(to)) {
    return [];
  }

  return renderableRun(index => mapper.getVisualFromRenderableIndex(index), from, to - from + 1);
}

/**
 * Returns the given index lists merged in order, each index once.
 */
function mergeUnique(...lists: number[][]): number[] {
  return Array.from(new Set(lists.flat()));
}

/**
 * Returns the visual rows on screen: the frozen top rows, the visible rows of the scrollable
 * part, and the frozen bottom rows.
 */
function visibleRows(hot: HotInstance): number[] {
  const mapper = hot.rowIndexMapper;
  const toVisual = (index: number) => mapper.getVisualFromRenderableIndex(index);
  const renderableCount = hot.view.countRenderableRows();
  const bottomCount = hot.view.countNotHiddenFixedRowsBottom();

  return mergeUnique(
    renderableRun(toVisual, 0, hot.view.countNotHiddenFixedRowsTop()),
    renderableSpan(mapper, hot.getFirstPartiallyVisibleRow(), hot.getLastPartiallyVisibleRow()),
    renderableRun(toVisual, renderableCount - bottomCount, bottomCount),
  );
}

/**
 * Returns the visual columns on screen, in on-screen inline order: the frozen start columns,
 * the visible columns of the scrollable part, and the frozen end columns.
 */
function visibleColumns(hot: HotInstance): number[] {
  const mapper = hot.columnIndexMapper;
  const toVisual = (index: number) => mapper.getVisualFromRenderableIndex(index);
  const renderableCount = hot.view.countRenderableColumns();
  const endCount = hot.view.countNotHiddenFixedColumnsEnd();

  return mergeUnique(
    renderableRun(toVisual, 0, hot.view.countNotHiddenFixedColumnsStart()),
    renderableSpan(mapper, hot.getFirstPartiallyVisibleColumn(), hot.getLastPartiallyVisibleColumn()),
    renderableRun(toVisual, renderableCount - endCount, endCount),
  );
}

/**
 * Returns the negative indexes of every header level along one axis: `-1` to `-count`.
 */
function headerLevels(count: number): number[] {
  return Array.from({ length: Math.max(count, 0) }, (_, index) => -(index + 1));
}

/**
 * Returns the overlay class of the pane that paints a cell. The answer is kept per table
 * section, which every cell of a row group shares.
 */
function paneOf(element: HTMLElement, panesBySection: Map<Element | null, string>): string {
  const section = element.parentElement?.parentElement ?? null;
  let pane = panesBySection.get(section);

  if (pane === undefined) {
    const root = element.closest(PANE_SELECTOR);

    pane = PANE_CLASSES.find(name => root?.classList.contains(name)) ?? 'ht_master';
    panesBySection.set(section, pane);
  }

  return pane;
}

/**
 * The largest difference, in pixels, two boxes may have along any edge and still count as one.
 */
const BOX_TOLERANCE = 0.5;

/**
 * Tells whether two boxes are the same box, to within half a pixel.
 */
export function isSameBox(first: GridBox, second: GridBox): boolean {
  return Math.abs(first.left - second.left) <= BOX_TOLERANCE
    && Math.abs(first.top - second.top) <= BOX_TOLERANCE
    && Math.abs(first.width - second.width) <= BOX_TOLERANCE
    && Math.abs(first.height - second.height) <= BOX_TOLERANCE;
}

/**
 * The panes the grid scrolls along with the scrollable part on one axis: the column header and
 * bottom bands follow its horizontal offset, the frozen column bands its vertical one.
 */
const FOLLOWING_PANES: Array<[string, 'x' | 'y']> = [
  ['ht_clone_top', 'x'],
  ['ht_clone_bottom', 'x'],
  ['ht_clone_inline_start', 'y'],
  ['ht_clone_inline_end', 'y'],
];

/**
 * Returns, per pane that follows the scrollable part, how far its cells move once it follows the
 * scrollable part's current offset. A programmatic scroll, such as the one a switch restores,
 * moves the scrollable part at once, while the panes follow from its `scroll` event at the start
 * of the next frame, still before that frame is painted. A cell measured in between sits where
 * the previous offset left it, so its box is moved by this distance. A pane that follows already
 * moves by zero, and so does every pane when the window scrolls the grid on that axis.
 */
function paneLag(hot: HotInstance, holder: HTMLElement | null): Map<string, { x: number, y: number }> {
  const lag = new Map<string, { x: number, y: number }>();

  if (holder === null) {
    return lag;
  }

  FOLLOWING_PANES.forEach(([name, axis]) => {
    const paneHolder = hot.rootElement.querySelector<HTMLElement>(`:scope > .${name} .wtHolder`);

    if (paneHolder !== null) {
      lag.set(name, axis === 'x'
        ? { x: paneHolder.scrollLeft - holder.scrollLeft, y: 0 }
        : { x: 0, y: paneHolder.scrollTop - holder.scrollTop });
    }
  });

  return lag;
}

/**
 * Returns the scrollable part of the grid's master pane, or `null` when the grid is not
 * rendered.
 */
export function masterHolder(hot: HotInstance): HTMLElement | null {
  return hot.view ? hot.view._wt.wtTable.holder : null;
}

/**
 * Collects the visible cells into a set, or answers `null` when they are more than the
 * animation allows.
 */
export function collectVisibleCells(hot: HotInstance): VisibleCellSet | null {
  if (!hot.view) {
    return null;
  }

  const rows = visibleRows(hot);
  const columns = visibleColumns(hot);
  const columnHeaders = headerLevels(hot.countColHeaders());
  const rowHeaders = headerLevels(hot.countRowHeaders());

  if ((rows.length + columnHeaders.length) * (columns.length + rowHeaders.length) > MAX_ANIMATED_CELLS) {
    return null;
  }

  const origin = gridOrigin(hot);
  const lag = paneLag(hot, masterHolder(hot));
  const seen = new Set<HTMLElement>();
  const panesBySection = new Map<Element | null, string>();
  const cells: VisibleCell[] = [];
  const addCell = (row: number, column: number, group: number): boolean => {
    const element = hot.getCell(row, column, true);

    if (element === null || seen.has(element)) {
      return false;
    }

    const box = paddingBox(element, origin);

    if (box.width === 0 || box.height === 0) {
      return false;
    }

    const pane = paneOf(element, panesBySection);
    const shift = lag.get(pane);

    if (shift !== undefined) {
      box.left += shift.x;
      box.top += shift.y;
    }

    seen.add(element);
    cells.push({
      key: `${row}:${column}`,
      isHeader: row < 0 || column < 0,
      isColumnHeader: row < 0,
      element,
      group,
      pane,
      box,
    });

    return true;
  };
  let groupCount = 0;

  columns.forEach((column) => {
    let found = false;

    columnHeaders.forEach((row) => {
      found = addCell(row, column, groupCount) || found;
    });
    rows.forEach((row) => {
      found = addCell(row, column, groupCount) || found;
    });

    if (found) {
      groupCount += 1;
    }
  });
  rowHeaders.forEach((column) => {
    rows.forEach(row => addCell(row, column, 0));
  });

  return { cells, groupCount, panes: measurePanes(hot, origin) };
}

/**
 * The viewport position of the grid element's padding edge, which every box is relative to.
 */
function gridOrigin(hot: HotInstance): { x: number, y: number } {
  const grid = hot.rootGridElement;
  const rect = grid.getBoundingClientRect();

  return { x: rect.left + grid.clientLeft, y: rect.top + grid.clientTop };
}

/**
 * Returns an element's padding box relative to the grid origin.
 */
function paddingBox(element: HTMLElement, origin: { x: number, y: number }): GridBox {
  const rect = element.getBoundingClientRect();

  return {
    left: rect.left + element.clientLeft - origin.x,
    top: rect.top + element.clientTop - origin.y,
    width: element.clientWidth,
    height: element.clientHeight,
  };
}

/**
 * Returns the viewport rect of a shown pane overlay, or `null` when the pane is not shown.
 */
function overlayRect(hot: HotInstance, className: string): DOMRect | null {
  const overlay = hot.rootElement.querySelector(`:scope > .${className}`);

  if (overlay === null) {
    return null;
  }

  const rect = overlay.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0 ? rect : null;
}

/**
 * Returns the edges between the pane bands along both axes, in viewport coordinates. The
 * scrollable part's client box is split by the frozen overlays that are shown.
 */
function bandEdges(hot: HotInstance, holder: HTMLElement) {
  const rect = holder.getBoundingClientRect();
  const left = rect.left + holder.clientLeft;
  const top = rect.top + holder.clientTop;
  const right = left + holder.clientWidth;
  const bottom = top + holder.clientHeight;
  const topBand = overlayRect(hot, 'ht_clone_top');
  const bottomBand = overlayRect(hot, 'ht_clone_bottom');
  const startBand = overlayRect(hot, 'ht_clone_inline_start');
  const endBand = overlayRect(hot, 'ht_clone_inline_end');
  const leftBand = hot.isRtl() ? endBand : startBand;
  const rightBand = hot.isRtl() ? startBand : endBand;

  return {
    x: [left, leftBand?.right ?? left, rightBand?.left ?? right, right],
    y: [top, topBand?.bottom ?? top, bottomBand?.top ?? bottom, bottom],
  };
}

/**
 * Returns the visible box of every shown pane, relative to the grid origin. Each pane gets
 * the band it paints, so a cell scrolled under a frozen band is cut where the band starts.
 */
function measurePanes(hot: HotInstance, origin: { x: number, y: number }): Map<string, GridBox> {
  const panes = new Map<string, GridBox>();
  const holder = masterHolder(hot);

  if (holder === null) {
    return panes;
  }

  const { x, y } = bandEdges(hot, holder);
  const isRtl = hot.isRtl();
  const startColumn = isRtl ? 2 : 0;
  const endColumn = isRtl ? 0 : 2;
  const layout: Array<[string, number, number]> = [
    ['ht_master', 1, 1],
    ['ht_clone_top', 1, 0],
    ['ht_clone_bottom', 1, 2],
    ['ht_clone_inline_start', startColumn, 1],
    ['ht_clone_inline_end', endColumn, 1],
    ['ht_clone_top_inline_start_corner', startColumn, 0],
    ['ht_clone_top_inline_end_corner', endColumn, 0],
    ['ht_clone_bottom_inline_start_corner', startColumn, 2],
    ['ht_clone_bottom_inline_end_corner', endColumn, 2],
  ];

  layout.forEach(([name, column, row]) => {
    const width = x[column + 1] - x[column];
    const height = y[row + 1] - y[row];

    if (width > 0 && height > 0) {
      panes.set(name, { left: x[column] - origin.x, top: y[row] - origin.y, width, height });
    }
  });

  return panes;
}
