/**
 * Every operation the grid does by dragging, and every way to do it without a drag that the product has
 * today. The pointer check (`pointer.spec.ts`) performs each drag (the positive control: it must have
 * the effect named here, or the test is red) and each alternative on a page as it loads, and judges
 * them with `dragFindings()` and `gestureFindings()` in `lib/pointer.mjs`: 2.5.7 needs a single-pointer
 * alternative that covers the whole drag, 2.1.1 a keyboard one. The evidence document cites this list,
 * so a reader sees every drag, its alternatives and whether each was proven.
 *
 * An entry:
 *
 * - `id`, `plugin` (the folder under `handsontable/src/plugins/`, or `core`), `operation` (one sentence);
 * - `gesture`: `drag`, `path` (a gesture that must follow a path) or `multipoint` (two fingers or more);
 * - `page` (a catalog id of `../pages.mjs`, reached in its state) or `fixture` and `query`;
 * - `drag`: the steps that perform it; `expect`: its effect (`dragEffects()` in `pointer-state.ts`);
 *   `compare`: a field of the drag state a `full` alternative must leave exactly as the drag left it;
 * - `alternatives`: each with `input` (`single-pointer`, `keyboard`, `pointer-modifier`), `covers`
 *   (`full`, or `partial` with the part it leaves out in `how`), `how` (one sentence), and `steps`;
 *   `prepare` runs before the state the alternative is compared with (an API call that sets up what a
 *   partial alternative undoes, never a drag). An operation with no alternative lists none: that absence
 *   is the finding.
 *
 * Every step but the last sets up: the state is read before the last step and after it, until the effect
 * shows (two seconds at most, for an autofit's timer or a tab's transition).
 *
 * Steps: `{ select: [row, col, row2?, col2?] }`, `{ api: 'colWidth' | 'rowHeight', index, size }` and
 * `{ api: 'empty', range: [row, col, row2, col2] }` go through the API; `hover`, `click` (with `button`, `modifiers`), `dblclick`, `drag` (`from`, then `to`, `by: [dx, dy]`
 * or both) and `touchDrag` drive a real pointer; `press` a key or a list of keys,
 * `pressUntilFocused` a key until the selector has the focus, `pressUntilHighlighted` a key until the
 * open menu highlights the text; `visible` waits for a selector. A point is `{ cell: [row, col] }`,
 * `{ colHeader }`, `{ rowHeader }` (the topmost copy), `{ selector, at? }` (`at: 'corner-end'` is four
 * pixels inside the bottom-end corner) or `{ text, within }` (a menu item).
 *
 * `lib/__tests__/pointer.test.mjs` fails on a plugin that follows the pointer (listens to `mousemove`,
 * `pointermove` or `touchmove`) and is neither here nor in `NOT_DRAG`, so a new drag is accounted for in
 * the change that adds it.
 */
export const DRAG_OPERATIONS = [
  {
    id: 'fill-handle', plugin: 'autofill', gesture: 'drag', operation: 'Fill cells by dragging the fill handle',
    fixture: 'fill-handle-drag.html', expect: 'value-changes', compare: 'data',
    drag: [{ select: [1, 1] }, { drag: { from: { selector: '.ht_master .wtBorder.current.corner' }, to: { cell: [4, 1] } } }],
    alternatives: [
      { input: 'single-pointer', covers: 'partial', how: 'A double-click on the fill handle copies the selection down, as far as the column beside it has data',
        prepare: [{ api: 'empty', range: [2, 1, 6, 1] }], steps: [{ select: [1, 1] }, { dblclick: { selector: '.ht_master .wtBorder.current.corner' } }] },
      { input: 'keyboard', covers: 'full', how: 'Ctrl+C, then Shift+arrows over the target range, then Ctrl+V repeats the copied block',
        steps: [{ select: [1, 1] }, { press: ['ControlOrMeta+c', 'ArrowDown', 'Shift+ArrowDown', 'Shift+ArrowDown', 'ControlOrMeta+v'] }] },
      { input: 'keyboard', covers: 'partial', how: 'Ctrl+Enter fills a range with the active cell\'s value, one value only',
        steps: [{ select: [1, 1] }, { press: ['Shift+ArrowDown', 'Shift+ArrowDown', 'Shift+ArrowDown', 'ControlOrMeta+Enter'] }] },
    ],
  },
  {
    id: 'column-move', plugin: 'manualColumnMove', gesture: 'drag', operation: 'Move a column by dragging its selected header',
    page: 'shared-demo', expect: 'moves',
    drag: [{ click: { colHeader: 1 } }, { drag: { from: { colHeader: 1 }, to: { colHeader: 3 } } }],
    alternatives: [],
  },
  {
    id: 'row-move', plugin: 'manualRowMove', gesture: 'drag', operation: 'Move a row by dragging its selected header',
    page: 'shared-demo', expect: 'moves',
    drag: [{ click: { rowHeader: 1 } }, { drag: { from: { rowHeader: 1 }, to: { rowHeader: 4 } } }],
    alternatives: [],
  },
  {
    id: 'column-resize', plugin: 'manualColumnResize', gesture: 'drag', operation: 'Resize a column by dragging the handle on its header edge',
    fixture: 'manual-resize-contextmenu.html', expect: 'resizes',
    drag: [{ hover: { colHeader: 1 } }, { drag: { from: { selector: '.manualColumnResizer' }, by: [60, 0] } }],
    alternatives: [
      { input: 'single-pointer', covers: 'partial', how: 'A double-click on the handle fits the column to its content, never to another width',
        prepare: [{ api: 'colWidth', index: 1, size: 200 }], steps: [{ hover: { colHeader: 1 } }, { dblclick: { selector: '.manualColumnResizer' } }] },
    ],
  },
  {
    id: 'row-resize', plugin: 'manualRowResize', gesture: 'drag', operation: 'Resize a row by dragging the handle on its header edge',
    fixture: 'manual-resize-contextmenu.html', expect: 'resizes',
    drag: [{ hover: { rowHeader: 1 } }, { drag: { from: { selector: '.manualRowResizer' }, by: [0, 30] } }],
    alternatives: [
      { input: 'single-pointer', covers: 'partial', how: 'A double-click on the handle fits the row to its content, never to another height',
        prepare: [{ api: 'rowHeight', index: 1, size: 80 }], steps: [{ hover: { rowHeader: 1 } }, { dblclick: { selector: '.manualRowResizer' } }] },
    ],
  },
  {
    id: 'move-cells', plugin: 'moveCells', gesture: 'drag', operation: 'Move a range by dragging the selection by its border',
    fixture: 'selection-features.html', expect: 'value-changes',
    drag: [{ select: [1, 1] }, { drag: { from: { selector: '.ht_master .wtMoveZone' }, to: { cell: [4, 3] } } }],
    alternatives: [
      { input: 'keyboard', covers: 'partial', how: 'Ctrl+X, then the target cell, then Ctrl+V moves the values, without the cell meta a move carries',
        steps: [{ select: [1, 1] }, { press: ['ControlOrMeta+x', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ControlOrMeta+v'] }] },
    ],
  },
  {
    id: 'freeze-columns', plugin: 'freezeBar', gesture: 'drag', operation: 'Freeze more columns by dragging the column freeze bar',
    fixture: 'limit-fixed-to-viewport.html', query: 'bar=1&menu=1&start=1&top=1', expect: 'freezes',
    drag: [{ drag: { from: { selector: '.ht-freeze-bar--start:not(.ht-freeze-bar--segment)' }, by: [120, 0] } }],
    alternatives: [
      { input: 'keyboard', covers: 'full', how: 'F6 moves the focus to the bar\'s separator, and an arrow key freezes one column more',
        steps: [{ select: [1, 1] }, { pressUntilFocused: { key: 'F6', selector: '[data-ht-freeze-separator="start"]' } }, { press: 'ArrowRight' }] },
      { input: 'single-pointer', covers: 'partial', how: 'The context menu\'s Freeze column moves one selected column to the frozen ones, never sets the count',
        steps: [{ click: { colHeader: 3 } }, { click: { colHeader: 3 }, button: 'right' }, { click: { text: 'Freeze column', within: '.htContextMenu' } }] },
    ],
  },
  {
    id: 'freeze-rows', plugin: 'freezeBar', gesture: 'drag', operation: 'Freeze more rows by dragging the row freeze bar',
    fixture: 'limit-fixed-to-viewport.html', query: 'bar=1&menu=1&start=1&top=1', expect: 'freezes',
    drag: [{ drag: { from: { selector: '.ht-freeze-bar--top:not(.ht-freeze-bar--segment)' }, by: [0, 60] } }],
    alternatives: [
      { input: 'keyboard', covers: 'full', how: 'F6 moves the focus to the bar\'s separator, and an arrow key freezes one row more',
        steps: [{ select: [1, 1] }, { pressUntilFocused: { key: 'F6', selector: '[data-ht-freeze-separator="top"]' } }, { press: 'ArrowDown' }] },
    ],
  },
  {
    id: 'sheet-tab-move', plugin: 'sheetsBar', gesture: 'drag', operation: 'Reorder the sheets by dragging a tab',
    page: 'sheets-bar', expect: 'sheet-order-changes', compare: 'sheets',
    drag: [{ drag: { from: { text: 'Alpha', within: '.ht-sheets-bar' }, to: { text: 'Beta', within: '.ht-sheets-bar' }, by: [10, 0] } }],
    alternatives: [
      { input: 'single-pointer', covers: 'full', how: 'The active tab\'s chevron opens its menu, and Move right moves the sheet one place',
        steps: [{ click: { selector: '.ht-sheets-bar__tab--active .ht-sheets-bar__tab-chevron' } }, { click: { text: 'Move right', within: '.htSheetsBarMenu' } }] },
      { input: 'keyboard', covers: 'full', how: 'Enter on the active tab opens its menu, and Move right moves the sheet one place',
        steps: [{ focus: '.ht-sheets-bar__tab--active' }, { press: 'Enter' }, { pressUntilHighlighted: { key: 'ArrowDown', text: 'Move right' } }, { press: 'Enter' }] },
    ],
  },
  {
    id: 'range-selection', plugin: 'core', gesture: 'drag', operation: 'Select a range of cells by dragging across them',
    page: 'shared-demo', expect: 'selection-changes', compare: 'selected',
    drag: [{ drag: { from: { cell: [1, 1] }, to: { cell: [3, 3] } } }],
    alternatives: [
      { input: 'keyboard', covers: 'full', how: 'Shift+arrows extend the selection from the active cell',
        steps: [{ select: [1, 1] }, { press: ['Shift+ArrowDown', 'Shift+ArrowDown', 'Shift+ArrowRight', 'Shift+ArrowRight'] }] },
      { input: 'pointer-modifier', covers: 'full', how: 'A click, then a Shift+click, selects the range between them',
        steps: [{ click: { cell: [1, 1] } }, { click: { cell: [3, 3] }, modifiers: ['Shift'] }] },
      { input: 'single-pointer', covers: 'partial', how: 'A click on a header selects its whole column or row, never a range of cells',
        steps: [{ click: { colHeader: 1 } }] },
    ],
  },
  {
    id: 'selection-handle', plugin: 'selectionHandles', gesture: 'drag', operation: 'Extend the selection by dragging its handle',
    page: 'selection-handles', expect: 'selection-changes', compare: 'selected',
    drag: [{ drag: { from: { selector: '.ht_master .wtSelectionHandle--bottom' }, to: { cell: [5, 2] } } }],
    alternatives: [
      { input: 'keyboard', covers: 'full', how: 'Shift+arrows extend the selection from the active cell',
        steps: [{ press: ['Shift+ArrowDown', 'Shift+ArrowDown'] }] },
      { input: 'pointer-modifier', covers: 'full', how: 'A Shift+click extends the selection to the clicked cell',
        steps: [{ click: { cell: [5, 3] }, modifiers: ['Shift'] }] },
    ],
  },
  {
    id: 'touch-selection-handles', plugin: 'multipleSelectionHandles', gesture: 'drag', operation: 'Extend the selection on a phone by dragging a handle',
    page: 'mobile-selection-handles', expect: 'selection-changes',
    drag: [{ touchDrag: { from: { selector: '.ht_master .htBorders .bottomSelectionHandle-HitArea' }, to: { cell: [4, 1] } } }],
    alternatives: [
      { input: 'keyboard', covers: 'full', how: 'Shift+arrows on a keyboard attached to the phone extend the selection',
        steps: [{ press: ['Shift+ArrowDown', 'Shift+ArrowDown'] }] },
    ],
  },
  {
    id: 'comment-resize', plugin: 'comments', gesture: 'drag', operation: 'Resize the comment editor by dragging the grip in its corner',
    page: 'comments', expect: 'resizes',
    drag: [{ drag: { from: { selector: '.htCommentTextArea', at: 'corner-end' }, by: [60, 40] } }],
    alternatives: [],
  },
];

/**
 * Plugins that follow the pointer without a drag operation of their own, and why.
 */
export const NOT_DRAG = {
  dragToScroll: 'scrolls the grid while another drag (a range selection, a fill) reaches the edge; it is part of those drags',
};
