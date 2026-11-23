import type { HotInstance } from '../types';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';
import { announce, getAnnouncementCount } from '../../utils/a11yAnnouncer';
import { getColumnLabel, getRowLabel } from '../../utils/headerLabel';
import {
  SELECTION_ANNOUNCEMENT_ADDED,
  SELECTION_ANNOUNCEMENT_ADDED_ALL,
  SELECTION_ANNOUNCEMENT_ADDED_CELL,
  SELECTION_ANNOUNCEMENT_ADDED_COLUMN,
  SELECTION_ANNOUNCEMENT_ADDED_COLUMNS,
  SELECTION_ANNOUNCEMENT_ADDED_RANGE,
  SELECTION_ANNOUNCEMENT_ADDED_ROW,
  SELECTION_ANNOUNCEMENT_ADDED_ROWS,
  SELECTION_ANNOUNCEMENT_ALL,
  SELECTION_ANNOUNCEMENT_COLUMN,
  SELECTION_ANNOUNCEMENT_COLUMNS,
  SELECTION_ANNOUNCEMENT_RANGE,
  SELECTION_ANNOUNCEMENT_ROW,
  SELECTION_ANNOUNCEMENT_ROWS,
} from '../../i18n/constants';
import { classifyRange, type SelectedRangeKind } from './classifyRange';

/**
 * How long the announcer waits after the last selection change before it announces, in milliseconds.
 * Holding Shift+Arrow repeats the key faster than that, so the user hears the range where they stopped.
 */
const ANNOUNCEMENT_DELAY = 200;

/**
 * The phrases of a standalone announcement and of the description inside "Selection added", per range kind.
 * A one-cell selection has no standalone phrase: the focus already reads the cell.
 */
const PHRASES: Record<SelectedRangeKind, { single: string | null, many: string | null, added: string }> = {
  cell: { single: null, many: null, added: SELECTION_ANNOUNCEMENT_ADDED_CELL },
  range: { single: SELECTION_ANNOUNCEMENT_RANGE, many: null, added: SELECTION_ANNOUNCEMENT_ADDED_RANGE },
  all: { single: SELECTION_ANNOUNCEMENT_ALL, many: null, added: SELECTION_ANNOUNCEMENT_ADDED_ALL },
  columns: {
    single: SELECTION_ANNOUNCEMENT_COLUMN,
    many: SELECTION_ANNOUNCEMENT_COLUMNS,
    added: SELECTION_ANNOUNCEMENT_ADDED_COLUMN,
  },
  rows: {
    single: SELECTION_ANNOUNCEMENT_ROW,
    many: SELECTION_ANNOUNCEMENT_ROWS,
    added: SELECTION_ANNOUNCEMENT_ADDED_ROW,
  },
};

/**
 * The phrases for several whole columns or rows inside "Selection added".
 */
const ADDED_MANY_PHRASES: Partial<Record<SelectedRangeKind, string>> = {
  columns: SELECTION_ANNOUNCEMENT_ADDED_COLUMNS,
  rows: SELECTION_ANNOUNCEMENT_ADDED_ROWS,
};

/**
 * Installs the selection announcer. After the user selects a range with the keyboard or the mouse, it tells
 * screen readers what the selection covers, in the polite live region: a block of cells, whole columns or rows,
 * or every cell. A selection added with Ctrl/Cmd also names the number of selections. A selection the
 * application sets through the API, and a one-cell selection, are not announced.
 *
 * The keyboard announcement waits until the keys stop, and the mouse announcement waits for the mouse button
 * to be released, so one user action makes one announcement. When another feature announces for the same
 * action (a header click that also sorts), that announcement wins and the selection is not announced. The count
 * of announcements is read before each selection change, so an announcement made for an earlier key press does
 * not silence a later one.
 *
 * The delay is set and cleared with the `setTimeout()` and `clearTimeout()` of the realm the bundle runs in, not
 * with `hot._registerTimeout()` and `hot.rootWindow.clearTimeout()`: for a grid built in an iframe from the parent
 * page's bundle those two belong to different realms, so the clear never cancelled the timer, and every cancelled
 * handle stayed in the instance's timeout list. `afterDestroy` cancels a pending timer.
 *
 * @param {Core} hot The Handsontable instance.
 */
export function installSelectionAnnouncer(hot: HotInstance) {
  const { selection } = hot;
  let isPending = false;
  let announcementCountAtStart = 0;
  let announcedLayerCount = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  const reset = () => {
    cancel();
    isPending = false;
    announcedLayerCount = 0;
  };
  const flush = () => {
    timeoutId = null;

    if (!isPending) {
      return;
    }

    isPending = false;

    const layerCount = selection.getSelectedRange().size();
    const isLayerAdded = layerCount > 1 && layerCount > announcedLayerCount;

    announcedLayerCount = layerCount;

    if (getAnnouncementCount() !== announcementCountAtStart || !hot.getSettings().ariaTags) {
      return;
    }

    const message = buildSelectionMessage(hot, isLayerAdded);

    if (message !== '') {
      announce(message, 'polite');
    }
  };
  const schedule = () => {
    cancel();

    if (hot.isDestroyed) {
      isPending = false;

      return;
    }

    timeoutId = setTimeout(flush, ANNOUNCEMENT_DELAY);
  };
  const isUserSource = () => {
    const source = selection.getSelectionSource();

    return source === 'keyboard' || source === 'mouse';
  };

  selection.addLocalHook('beforeSetRangeEnd', () => {
    if (isUserSource()) {
      announcementCountAtStart = getAnnouncementCount();
    }
  });
  selection.addLocalHook('afterSetRangeEnd', () => {
    const source = selection.getSelectionSource();

    if (source === 'keyboard') {
      isPending = true;
      schedule();

    } else if (source === 'mouse') {
      isPending = true;
      cancel();
    }
  });
  selection.addLocalHook('afterSelectionFinished', () => {
    if (isPending) {
      schedule();
    }
  });
  selection.addLocalHook('afterDeselect', reset);
  hot.addHook('afterDestroy', reset);
}

/**
 * Builds the announcement for the current selection, or an empty string when there is nothing to announce.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {boolean} isLayerAdded `true` when the user action added a selection layer, which the announcement
 * names together with the number of layers. Extending a layer that is already there is described as a range.
 * @returns {string}
 */
function buildSelectionMessage(hot: HotInstance, isLayerAdded: boolean): string {
  const { selection } = hot;
  const range = selection.getActiveSelectedRange();

  if (!range) {
    return '';
  }

  const kind = classifyRange(getRangeEdges(range), {
    rowCount: hot.countRows(),
    columnCount: hot.countCols(),
  }, selection.isMultiple(range) === true);

  if (isLayerAdded) {
    return translate(hot, SELECTION_ANNOUNCEMENT_ADDED, {
      selection: describeAddedRange(hot, range, kind),
      count: selection.getSelectedRange().size(),
    });
  }

  return describeRange(hot, range, kind);
}

/**
 * Builds the standalone phrase for a range (for example "Columns A to C selected").
 *
 * @param {Core} hot The Handsontable instance.
 * @param {CellRange} range The range to describe.
 * @param {SelectedRangeKind} kind What the range covers.
 * @returns {string}
 */
function describeRange(hot: HotInstance, range: CellRange, kind: SelectedRangeKind): string {
  const { single, many } = PHRASES[kind];

  if (single === null) {
    return '';
  }

  if (kind === 'range') {
    return translate(hot, single, getCornerLabels(hot, range));
  }

  return translateSpan(hot, range, kind, single, many);
}

/**
 * Builds the description of an added range for "Selection added" (for example "columns A to C").
 *
 * @param {Core} hot The Handsontable instance.
 * @param {CellRange} range The range to describe.
 * @param {SelectedRangeKind} kind What the range covers.
 * @returns {string}
 */
function describeAddedRange(hot: HotInstance, range: CellRange, kind: SelectedRangeKind): string {
  const { added } = PHRASES[kind];

  if (kind === 'cell') {
    const { startColumn, startRow } = getCornerLabels(hot, range);

    return translate(hot, added, { column: startColumn, row: startRow });
  }

  if (kind === 'range') {
    return translate(hot, added, getCornerLabels(hot, range));
  }

  return translateSpan(hot, range, kind, added, ADDED_MANY_PHRASES[kind] ?? null);
}

/**
 * Translates the phrase for whole columns, whole rows or every cell, picking the one-item phrase or the
 * phrase for several items.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {CellRange} range The range to describe.
 * @param {SelectedRangeKind} kind `columns`, `rows` or `all`.
 * @param {string} singlePhrase The phrase for one column or row, or for every cell.
 * @param {string|null} manyPhrase The phrase for several columns or rows.
 * @returns {string}
 */
function translateSpan(
  hot: HotInstance,
  range: CellRange,
  kind: SelectedRangeKind,
  singlePhrase: string,
  manyPhrase: string | null,
): string {
  const { top, start, bottom, end } = getRangeEdges(range);

  if (kind === 'columns') {
    return start === end || manyPhrase === null
      ? translate(hot, singlePhrase, { column: getColumnLabel(hot, start) })
      : translate(hot, manyPhrase, { startColumn: getColumnLabel(hot, start), endColumn: getColumnLabel(hot, end) });
  }

  if (kind === 'rows') {
    return top === bottom || manyPhrase === null
      ? translate(hot, singlePhrase, { row: getRowLabel(hot, top) })
      : translate(hot, manyPhrase, { startRow: getRowLabel(hot, top), endRow: getRowLabel(hot, bottom) });
  }

  return translate(hot, singlePhrase, {});
}

/**
 * Returns the labels of the anchor cell and of the end cell of a range, in the order the user selected them.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {CellRange} range The range.
 * @returns {{ startColumn: string, startRow: string|number, endColumn: string, endRow: string|number }}
 */
function getCornerLabels(hot: HotInstance, range: CellRange) {
  const fromRow = Math.max(range.from.row ?? 0, 0);
  const fromColumn = Math.max(range.from.col ?? 0, 0);
  const toRow = Math.max(range.to.row ?? 0, 0);
  const toColumn = Math.max(range.to.col ?? 0, 0);

  return {
    startColumn: getColumnLabel(hot, fromColumn),
    startRow: getRowLabel(hot, fromRow),
    endColumn: getColumnLabel(hot, toColumn),
    endRow: getRowLabel(hot, toRow),
  };
}

/**
 * Returns the visual edges of a range, clamped to the cells, so a range that includes headers reads as the
 * cells it covers.
 *
 * @param {CellRange} range The range.
 * @returns {{ top: number, start: number, bottom: number, end: number }}
 */
function getRangeEdges(range: CellRange) {
  const topStart = range.getTopStartCorner();
  const bottomEnd = range.getBottomEndCorner();

  return {
    top: Math.max(topStart.row ?? 0, 0),
    start: Math.max(topStart.col ?? 0, 0),
    bottom: Math.max(bottomEnd.row ?? 0, 0),
    end: Math.max(bottomEnd.col ?? 0, 0),
  };
}

/**
 * Translates a phrase and returns it as a string.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {string} phrase The phrase key.
 * @param {object} variables The values for the phrase placeholders.
 * @returns {string}
 */
function translate(hot: HotInstance, phrase: string, variables: Record<string, unknown>): string {
  return String(hot.getTranslatedPhrase(phrase, variables) ?? '');
}
