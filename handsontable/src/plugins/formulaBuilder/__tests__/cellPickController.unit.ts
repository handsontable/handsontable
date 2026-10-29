import type { FormulaEditor } from 'hyperformula-ui';
import { isImmediatePropagationStopped } from '../../../helpers/dom/event';
import { CellPickController } from '../cellPickController';
import type { HandsontableAdapter } from '../handsontableAdapter';
type CoreModule = typeof import('hyperformula-ui');

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('hyperformula-ui') as CoreModule;
const EPHEMERAL_COLOR = core.EPHEMERAL_COLOR;

afterEach(() => {
  document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  document.body.replaceChildren();
  jest.restoreAllMocks();
});

interface GridCoords {
  row: number;
  col: number;
}

interface EventFlags {
  row: boolean;
  column: boolean;
  cell: boolean;
}

interface HarnessOptions {
  editorValue?: string;
  refSelectionActive?: boolean;
  hasEditor?: boolean;
  hasAdapter?: boolean;
  barSelected?: GridCoords | null;
  rowOffset?: number;
  cellAtPoint?: GridCoords | null;
  hostActiveEditor?: { focus: () => void };
  /**
   * The visual column span each column header covers, by its column (a nested-header group).
   */
  headerSpans?: Record<number, { start: number; end: number }>;
  /**
   * Whether the formula bar hosts the edit (the in-cell editor is hidden).
   */
  barHosted?: boolean;
}

interface HolderStub {
  scrollTop: number;
  scrollLeft: number;
  getBoundingClientRect(): DOMRect;
}

/**
 * Builds a scroll-holder stub with a 200x100 viewport at the origin.
 *
 * @returns {HolderStub} The holder stub.
 */
function makeHolder(): HolderStub {
  return {
    scrollTop: 0,
    scrollLeft: 0,
    getBoundingClientRect: () =>
      ({ left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 }) as DOMRect,
  };
}

/**
 * Builds a {@link CellPickController} wired to adapter/editor stubs.
 *
 * @param {HarnessOptions} options Per-test harness overrides.
 * @returns {object} The controller plus every stub and spy it was wired with.
 */
function makeHarness(options: HarnessOptions = {}) {
  const {
    editorValue = '=SUM(',
    refSelectionActive = true,
    hasEditor = true,
    hasAdapter = true,
    barSelected = null,
    rowOffset = 0,
    cellAtPoint = null,
    hostActiveEditor,
    headerSpans = {},
    barHosted = false,
  } = options;
  const holder = makeHolder();
  const rootElement = document.createElement('div');
  const relisten = jest.fn();
  const unlisten = jest.fn();
  const adapterStub = {
    highlightRange: jest.fn(),
    clearEphemeralHighlight: jest.fn(),
    emitCellPick: jest.fn(),
    emitRangePick: jest.fn(),
    emitHeaderPick: jest.fn(),
    expandRangeOverMerges: jest.fn(range => range),
    getGridSize: jest.fn(() => ({ rows: 10, cols: 8 })),
    getCellAddressAt: jest.fn(() =>
      (cellAtPoint ? { sheet: '', row: cellAtPoint.row, col: cellAtPoint.col } : null),
    ),
    getAutoScrollTarget: () => holder,
  };
  const closeUnbalancedParens = jest.fn();
  // The text and caret the editor holds; a test changes them to stand for typing or a caret move.
  const editorState = { text: editorValue, caret: editorValue.length };
  const editorStub = {
    isFormula: () => editorValue.startsWith('='),
    isRefSelectionActive: () => refSelectionActive,
    getRefPreviewColor: () => EPHEMERAL_COLOR,
    closeUnbalancedParens,
    getValue: () => editorState.text,
    getCaretOffset: () => editorState.caret,
  };
  const emitSwitchToInline = jest.fn();
  const deferTask = jest.fn<void, [() => void]>();
  const controller = new CellPickController({
    core,
    getAdapter: () => (hasAdapter ? (adapterStub as unknown as HandsontableAdapter) : null),
    getActiveEditor: () => (hasEditor ? (editorStub as unknown as FormulaEditor) : null),
    getBarSelected: () => barSelected,
    toHfCoords: coords => ({ row: coords.row + rowOffset, col: coords.col }),
    emitSwitchToInline,
    getHostActiveEditor: () => hostActiveEditor,
    relisten,
    unlisten,
    isBarHostedEdit: () => barHosted,
    getRootElement: () => rootElement,
    getScrollHolder: () => holder as unknown as HTMLElement,
    getRootDocument: () => document,
    getColumnHeaderSpan: coords => headerSpans[coords.col] ?? { start: coords.col, end: coords.col },
    firstVisibleRow: () => 0,
    firstVisibleCol: () => 0,
    deferTask,
  });

  return {
    controller,
    adapterStub,
    deferTask,
    emitSwitchToInline,
    holder,
    closeUnbalancedParens,
    editorState,
    relisten,
    unlisten,
    rootElement,
  };
}

/**
 * Builds a fresh Handsontable event-controller flags object.
 *
 * @returns {EventFlags} All-false suppression flags.
 */
function makeFlags(): EventFlags {
  return { row: false, column: false, cell: false };
}

/**
 * Simulates a grid mousedown on the given cell.
 *
 * @param {CellPickController} controller The controller under test.
 * @param {GridCoords} coords The pressed cell coordinates.
 * @param {object} eventInit Extra mouse event fields (ctrlKey/metaKey).
 * @param {EventFlags} flags The event-controller flags passed to the hook.
 * @returns {object} The mousedown event and the flags object.
 */
function pressCell(
  controller: CellPickController,
  coords: GridCoords,
  eventInit: MouseEventInit = {},
  flags = makeFlags(),
) {
  const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true, buttons: 1, ...eventInit });

  controller.onBeforeMouseDown(event, coords, undefined, flags);

  return { event, flags };
}

/**
 * Simulates a grid mouseover on the given cell.
 *
 * @param {CellPickController} controller The controller under test.
 * @param {GridCoords} coords The hovered cell coordinates.
 * @param {EventFlags} flags The event-controller flags passed to the hook.
 * @param {MouseEvent} [event] The mouseover event passed to the hook.
 * @returns {EventFlags} The flags object.
 */
function hoverCell(
  controller: CellPickController,
  coords: GridCoords,
  flags = makeFlags(),
  event: MouseEvent | undefined = undefined,
) {
  controller.onBeforeMouseOver(event, coords, undefined, flags);

  return flags;
}

/**
 * Builds a single-cell range in HyperFormula coordinates.
 *
 * @param {number} row The row index.
 * @param {number} col The column index.
 * @returns {object} The single-cell range.
 */
function singleCellRange(row: number, col: number) {
  return {
    start: { sheet: '', row, col },
    end: { sheet: '', row, col },
  };
}

describe('CellPickController.onBeforeMouseDown', () => {
  it('leaves the grid event untouched when no formula editor is active', () => {
    const { controller, adapterStub } = makeHarness({ hasEditor: false });
    const { flags } = pressCell(controller, { row: 1, col: 2 });

    expect(flags).toEqual({ row: false, column: false, cell: false });
    expect(adapterStub.highlightRange).not.toHaveBeenCalled();
  });

  it('leaves the grid event untouched when the editor value is not a formula', () => {
    const { controller, adapterStub } = makeHarness({ editorValue: 'plain text' });
    const { flags } = pressCell(controller, { row: 1, col: 2 });

    expect(flags).toEqual({ row: false, column: false, cell: false });
    expect(adapterStub.highlightRange).not.toHaveBeenCalled();
  });

  it('leaves the grid event untouched when a header press is ineligible', () => {
    const { controller, adapterStub } = makeHarness({ refSelectionActive: false });
    const { event, flags } = pressCell(controller, { row: -1, col: 2 });

    expect(flags).toEqual({ row: false, column: false, cell: false });
    expect(event.defaultPrevented).toBe(false);
    expect(isImmediatePropagationStopped(event)).toBe(false);
    expect(adapterStub.emitHeaderPick).not.toHaveBeenCalled();
  });

  it('ignores a corner header press', () => {
    const { controller, adapterStub } = makeHarness();
    const { flags } = pressCell(controller, { row: -1, col: -1 });

    expect(flags).toEqual({ row: false, column: false, cell: false });
    expect(adapterStub.emitHeaderPick).not.toHaveBeenCalled();
  });

  it('suppresses the event and emits switch-to-inline when the bar-selected cell is clicked', () => {
    const { controller, adapterStub, emitSwitchToInline } = makeHarness({
      barSelected: { row: 1, col: 2 },
    });
    const { event, flags } = pressCell(controller, { row: 1, col: 2 });

    expect(flags).toEqual({ row: true, column: true, cell: true });
    expect(event.defaultPrevented).toBe(true);
    expect(emitSwitchToInline).toHaveBeenCalledTimes(1);
    expect(adapterStub.highlightRange).not.toHaveBeenCalled();
  });

  it('claims the press that switches the bar-selected cell to inline editing', () => {
    // RowSelection's click selection runs from `afterOnCellMouseDown`, and DragToScroll reads the flag:
    // only a claimed press keeps both out.
    const { controller } = makeHarness({ barSelected: { row: 1, col: 2 } });
    const { event } = pressCell(controller, { row: 1, col: 2 });

    expect(isImmediatePropagationStopped(event)).toBe(true);
  });

  it('leaves the grid event untouched when the caret cannot take a reference', () => {
    const { controller, adapterStub } = makeHarness({ refSelectionActive: false });
    const { event, flags } = pressCell(controller, { row: 1, col: 2 });

    expect(flags).toEqual({ row: false, column: false, cell: false });
    expect(event.defaultPrevented).toBe(false);
    expect(isImmediatePropagationStopped(event)).toBe(false);
    expect(adapterStub.highlightRange).not.toHaveBeenCalled();
  });

  it('closes unbalanced parens before falling through to native commit on an ineligible press', () => {
    const { controller, closeUnbalancedParens } = makeHarness({ refSelectionActive: false });

    pressCell(controller, { row: 1, col: 2 });

    expect(closeUnbalancedParens).toHaveBeenCalledTimes(1);
  });

  it('does not close parens on an ineligible press when the value is not a formula', () => {
    const { controller, closeUnbalancedParens } = makeHarness({
      refSelectionActive: false,
      editorValue: 'plain text',
    });

    pressCell(controller, { row: 1, col: 2 });

    expect(closeUnbalancedParens).not.toHaveBeenCalled();
  });

  it('emits no pick and restores no focus on mouseup after an ineligible press', () => {
    const { controller, adapterStub } = makeHarness({ refSelectionActive: false });

    pressCell(controller, { row: 1, col: 2 });
    controller.onDocMouseUp();

    expect(adapterStub.emitCellPick).not.toHaveBeenCalled();
    expect(adapterStub.emitRangePick).not.toHaveBeenCalled();
  });

  it('still switches to inline when the bar-selected cell is pressed with an ineligible caret', () => {
    const { controller, emitSwitchToInline } = makeHarness({
      refSelectionActive: false,
      barSelected: { row: 1, col: 2 },
    });
    const { flags } = pressCell(controller, { row: 1, col: 2 });

    expect(emitSwitchToInline).toHaveBeenCalledTimes(1);
    expect(flags).toEqual({ row: true, column: true, cell: true });
  });

  it('highlights the clicked cell in hf coordinates when ref selection is active', () => {
    const { controller, adapterStub } = makeHarness({ rowOffset: 10 });

    pressCell(controller, { row: 1, col: 2 });

    expect(adapterStub.highlightRange).toHaveBeenCalledWith(
      singleCellRange(11, 2),
      EPHEMERAL_COLOR,
    );
  });
});

describe('CellPickController.onBeforeMouseOver', () => {
  it('extends the ephemeral highlight from the anchor to the hovered cell', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 1, col: 1 });
    hoverCell(controller, { row: 3, col: 4 });

    expect(adapterStub.highlightRange).toHaveBeenLastCalledWith(
      {
        start: { sheet: '', row: 1, col: 1 },
        end: { sheet: '', row: 3, col: 4 },
      },
      EPHEMERAL_COLOR,
    );
  });

  it('does not highlight on hover when no pick has started', () => {
    const { controller, adapterStub } = makeHarness();
    const flags = hoverCell(controller, { row: 3, col: 4 });

    expect(flags).toEqual({ row: true, column: true, cell: true });
    expect(adapterStub.highlightRange).not.toHaveBeenCalled();
  });

  it('ignores hover when the editor value is not a formula', () => {
    const { controller, adapterStub } = makeHarness({ editorValue: 'plain text' });
    const flags = hoverCell(controller, { row: 3, col: 4 });

    expect(flags).toEqual({ row: false, column: false, cell: false });
    expect(adapterStub.highlightRange).not.toHaveBeenCalled();
  });

  it('leaves hover untouched when the caret cannot take a reference and no pick is active', () => {
    const { controller, adapterStub } = makeHarness({ refSelectionActive: false });
    const flags = hoverCell(controller, { row: 3, col: 4 });

    expect(flags).toEqual({ row: false, column: false, cell: false });
    expect(adapterStub.highlightRange).not.toHaveBeenCalled();
  });
});

describe('CellPickController.onBeforeMouseOver header clamping', () => {
  it('clamps a header hover to the first row and keeps suppressing', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 2, col: 2 });

    const flags = hoverCell(controller, { row: -1, col: 3 });

    expect(flags).toEqual({ row: true, column: true, cell: true });
    expect(adapterStub.highlightRange).toHaveBeenLastCalledWith(
      {
        start: { sheet: '', row: 0, col: 2 },
        end: { sheet: '', row: 2, col: 3 },
      },
      EPHEMERAL_COLOR,
    );
  });
});

describe('CellPickController.onBeforeMouseOver past the rendered area', () => {
  // The plugin registers the same listener for `beforeOnCellMouseOver` and
  // `beforeOnCellMouseOverOutside`; the latter reports the edge cell.

  it('extends the pick range to the edge cell reported outside the grid', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 1, col: 1 });
    hoverCell(controller, { row: 5, col: 2 });
    controller.onDocMouseUp();

    expect(adapterStub.emitRangePick).toHaveBeenCalledWith({
      ref: {
        start: { sheet: '', row: 1, col: 1 },
        end: { sheet: '', row: 5, col: 2 },
      },
      append: false,
    });
  });

  it('stops the hover event while a cell drag is active', () => {
    const { controller } = makeHarness();
    const event = new MouseEvent('mouseover', { cancelable: true });

    pressCell(controller, { row: 1, col: 1 });

    const flags = hoverCell(controller, { row: 5, col: 2 }, makeFlags(), event);

    expect(flags).toEqual({ row: true, column: true, cell: true });
    expect(isImmediatePropagationStopped(event)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it('stops the hover event while a header drag is active', () => {
    const { controller } = makeHarness();
    const event = new MouseEvent('mouseover', { cancelable: true });

    pressCell(controller, { row: -1, col: 1 });
    hoverCell(controller, { row: 3, col: 4 }, makeFlags(), event);

    expect(isImmediatePropagationStopped(event)).toBe(true);
  });

  it('suppresses native extension but does not stop the event before a drag starts', () => {
    const { controller, adapterStub } = makeHarness();
    const event = new MouseEvent('mouseover', { cancelable: true });
    const flags = hoverCell(controller, { row: 5, col: 2 }, makeFlags(), event);

    expect(flags).toEqual({ row: true, column: true, cell: true });
    expect(isImmediatePropagationStopped(event)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(adapterStub.highlightRange).not.toHaveBeenCalled();
  });

  it('does not stop the hover event after the drag finished', () => {
    const { controller } = makeHarness();
    const event = new MouseEvent('mouseover', { cancelable: true });

    pressCell(controller, { row: 1, col: 1 });
    controller.onDocMouseUp();
    hoverCell(controller, { row: 5, col: 2 }, makeFlags(), event);

    expect(isImmediatePropagationStopped(event)).toBe(false);
  });

  it('extends a cell drag to a hover at row 0 and column 0', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 3, col: 3 });
    hoverCell(controller, { row: 0, col: 0 });
    controller.onDocMouseUp();

    expect(adapterStub.emitRangePick).toHaveBeenCalledWith({
      ref: {
        start: { sheet: '', row: 0, col: 0 },
        end: { sheet: '', row: 3, col: 3 },
      },
      append: false,
    });
  });
});

describe('CellPickController gesture claim', () => {
  it('prevents the default and stops the immediate propagation of a cell pick mousedown', () => {
    const { controller } = makeHarness();
    const { event } = pressCell(controller, { row: 1, col: 2 });

    // A stopped event makes the core skip its selection and DragToScroll stay out.
    expect(event.defaultPrevented).toBe(true);
    expect(isImmediatePropagationStopped(event)).toBe(true);
  });

  it('prevents the default and stops the immediate propagation of a header pick mousedown', () => {
    const { controller } = makeHarness();
    const { event } = pressCell(controller, { row: -1, col: 2 });

    expect(event.defaultPrevented).toBe(true);
    expect(isImmediatePropagationStopped(event)).toBe(true);
  });

  it('lets a pick mousedown bubble to the document, so an open menu closes', () => {
    const { controller } = makeHarness();
    const { event } = pressCell(controller, { row: 1, col: 2 });

    // Only the grid's own flag: `cancelBubble` would keep the press from the document listener
    // that closes a context menu or a dropdown menu.
    expect(isImmediatePropagationStopped(event)).toBe(true);
    expect(event.cancelBubble).toBe(false);
  });

  it('does not stop a mousedown that falls through to native handling', () => {
    const { controller } = makeHarness({ refSelectionActive: false });
    const { event } = pressCell(controller, { row: 1, col: 2 });

    expect(isImmediatePropagationStopped(event)).toBe(false);
  });

  it('does not stop a mousedown whose cell cannot be mapped to HyperFormula space', () => {
    const { controller, adapterStub } = makeHarness({ rowOffset: -10 });
    const { event, flags } = pressCell(controller, { row: 1, col: 2 });

    expect(isImmediatePropagationStopped(event)).toBe(false);
    expect(flags).toEqual({ row: false, column: false, cell: false });
    expect(adapterStub.highlightRange).not.toHaveBeenCalled();
  });

  it.each([
    [{ row: 0, col: 1 }],
    [{ row: 1, col: 0 }],
    [{ row: 0, col: 0 }],
  ])('treats a press at %p as a cell pick, not a header pick', (coords) => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, coords);

    expect(controller.isHeaderPickActive()).toBe(false);

    controller.onDocMouseUp();

    expect(adapterStub.emitCellPick).toHaveBeenCalledWith({
      ref: { sheet: '', row: coords.row, col: coords.col },
      append: false,
    });
    expect(adapterStub.emitHeaderPick).not.toHaveBeenCalled();
  });
});

describe('CellPickController drag listeners', () => {
  /**
   * Lists the event types bound on a target through the spied method.
   *
   * @param {jest.SpyInstance} spy The `addEventListener`/`removeEventListener` spy.
   * @returns {string[]}
   */
  function typesOf(spy: jest.SpyInstance): string[] {
    return spy.mock.calls.map(call => call[0] as string);
  }

  it('adds no document or window listener while idle', () => {
    const documentAdd = jest.spyOn(document, 'addEventListener');
    const windowAdd = jest.spyOn(window, 'addEventListener');
    const { controller } = makeHarness({ refSelectionActive: false });

    // An ineligible press and a hover do not start a drag either.
    pressCell(controller, { row: 1, col: 2 });
    hoverCell(controller, { row: 2, col: 2 });

    expect(typesOf(documentAdd)).not.toContain('mousemove');
    expect(typesOf(documentAdd)).not.toContain('mouseup');
    expect(typesOf(documentAdd)).not.toContain('scroll');
    expect(typesOf(windowAdd)).not.toContain('blur');
  });

  it.each([
    ['a cell drag', { row: 1, col: 1 }],
    ['a header drag', { row: -1, col: 1 }],
  ])('binds mouseup, mousemove, capture scroll and window blur for %s and removes them on finish', (
    _label,
    coords,
  ) => {
    const documentAdd = jest.spyOn(document, 'addEventListener');
    const documentRemove = jest.spyOn(document, 'removeEventListener');
    const windowAdd = jest.spyOn(window, 'addEventListener');
    const windowRemove = jest.spyOn(window, 'removeEventListener');
    const { controller } = makeHarness();

    pressCell(controller, coords);

    expect(documentAdd).toHaveBeenCalledWith('mouseup', controller.onDocMouseUp);
    expect(documentAdd).toHaveBeenCalledWith('mousemove', controller.onDocMouseMove);
    expect(documentAdd).toHaveBeenCalledWith('scroll', controller.onDocScroll, { capture: true });
    expect(windowAdd).toHaveBeenCalledWith('blur', controller.onWindowBlur);
    expect(documentRemove).not.toHaveBeenCalledWith('mousemove', controller.onDocMouseMove);

    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(documentRemove).toHaveBeenCalledWith('mouseup', controller.onDocMouseUp);
    expect(documentRemove).toHaveBeenCalledWith('mousemove', controller.onDocMouseMove);
    expect(documentRemove).toHaveBeenCalledWith('scroll', controller.onDocScroll, { capture: true });
    expect(windowRemove).toHaveBeenCalledWith('blur', controller.onWindowBlur);
  });

  it('finishes the pick through the bound document mouseup listener', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 2, col: 3 });
    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(adapterStub.emitCellPick).toHaveBeenCalledWith({
      ref: { sheet: '', row: 2, col: 3 },
      append: false,
    });

    // The listener is gone: a later document mouseup re-enters nothing.
    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(adapterStub.emitCellPick).toHaveBeenCalledTimes(1);
  });

  it('removes the drag listeners on reset', () => {
    const documentRemove = jest.spyOn(document, 'removeEventListener');
    const windowRemove = jest.spyOn(window, 'removeEventListener');
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 2, col: 3 });
    controller.reset();

    expect(documentRemove).toHaveBeenCalledWith('mousemove', controller.onDocMouseMove);
    expect(documentRemove).toHaveBeenCalledWith('mouseup', controller.onDocMouseUp);
    expect(windowRemove).toHaveBeenCalledWith('blur', controller.onWindowBlur);

    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(adapterStub.emitCellPick).not.toHaveBeenCalled();
  });
});

describe('CellPickController.onDocMouseUp', () => {
  describe('handing the keyboard back to the grid', () => {
    /**
     * Releases the pressed button over the given element, the way a real `mouseup` reaches the
     * document listener.
     *
     * @param {CellPickController} controller The controller under test.
     * @param {HTMLElement} target The element under the pointer.
     */
    function releaseOver(controller: CellPickController, target: HTMLElement): void {
      const event = new MouseEvent('mouseup', { bubbles: true, composed: true });

      target.addEventListener('mouseup', controller.onDocMouseUp, { once: true });
      target.dispatchEvent(event);
    }

    it('unlistens, and does not relisten, after a bar-hosted pick released inside the grid', () => {
      const { controller, relisten, unlisten, rootElement } = makeHarness({ barHosted: true });
      const cell = document.createElement('td');

      rootElement.append(cell);
      document.body.append(rootElement);
      pressCell(controller, { row: 2, col: 3 });
      releaseOver(controller, cell);

      expect(relisten).not.toHaveBeenCalled();
      expect(unlisten).toHaveBeenCalledTimes(1);
    });

    it('does not relisten after a bar-hosted pick released inside a grid rendered in a shadow root', () => {
      const { controller, relisten, unlisten, rootElement } = makeHarness({ barHosted: true });
      const host = document.createElement('div');
      const shadowRoot = host.attachShadow({ mode: 'open' });
      const cell = document.createElement('td');

      rootElement.append(cell);
      shadowRoot.append(rootElement);
      document.body.append(host);
      pressCell(controller, { row: 2, col: 3 });
      releaseOver(controller, cell);

      expect(relisten).not.toHaveBeenCalled();
      expect(unlisten).toHaveBeenCalledTimes(1);
    });

    it('relistens after a bar-hosted pick released outside the grid', () => {
      const { controller, relisten, unlisten, rootElement } = makeHarness({ barHosted: true });
      const outside = document.createElement('div');

      document.body.append(rootElement, outside);
      pressCell(controller, { row: 2, col: 3 });
      releaseOver(controller, outside);

      expect(relisten).toHaveBeenCalledTimes(1);
      expect(unlisten).not.toHaveBeenCalled();
    });

    it('relistens after a bar-hosted pick whose button was released outside the window', () => {
      const { controller, relisten } = makeHarness({ barHosted: true });

      pressCell(controller, { row: 2, col: 3 });
      document.dispatchEvent(new MouseEvent('mousemove', { buttons: 0 }));

      expect(relisten).toHaveBeenCalledTimes(1);
    });

    it('relistens after an in-cell pick released inside the grid', () => {
      const { controller, relisten, unlisten, rootElement } = makeHarness({ barHosted: false });
      const cell = document.createElement('td');

      rootElement.append(cell);
      document.body.append(rootElement);
      pressCell(controller, { row: 2, col: 3 });
      releaseOver(controller, cell);

      expect(relisten).toHaveBeenCalledTimes(1);
      expect(unlisten).not.toHaveBeenCalled();
    });
  });

  it('emits a cell pick when press and release land on the same cell', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 2, col: 3 });
    controller.onDocMouseUp();

    expect(adapterStub.clearEphemeralHighlight).toHaveBeenCalledTimes(1);
    expect(adapterStub.emitCellPick).toHaveBeenCalledWith({
      ref: { sheet: '', row: 2, col: 3 },
      append: false,
    });
    expect(adapterStub.emitRangePick).not.toHaveBeenCalled();
  });

  it('emits a normalized range pick when the drag covers multiple cells', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 3, col: 4 });
    hoverCell(controller, { row: 1, col: 2 });
    controller.onDocMouseUp();

    expect(adapterStub.emitRangePick).toHaveBeenCalledWith({
      ref: {
        start: { sheet: '', row: 1, col: 2 },
        end: { sheet: '', row: 3, col: 4 },
      },
      append: false,
    });
    expect(adapterStub.emitCellPick).not.toHaveBeenCalled();
  });

  it('emits a range pick grown over the merged cells it touches, and previews the grown range', () => {
    const { controller, adapterStub } = makeHarness();
    const grown = { start: { sheet: '', row: 0, col: 0 }, end: { sheet: '', row: 3, col: 4 } };

    adapterStub.expandRangeOverMerges.mockImplementation(() => grown);
    pressCell(controller, { row: 3, col: 4 });
    hoverCell(controller, { row: 1, col: 2 });

    expect(adapterStub.highlightRange).toHaveBeenLastCalledWith(grown, EPHEMERAL_COLOR);

    controller.onDocMouseUp();

    expect(adapterStub.emitRangePick).toHaveBeenCalledWith({ ref: grown, append: false });
  });

  it('does not grow a single-cell pick over a merge', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 3, col: 4 });
    controller.onDocMouseUp();

    expect(adapterStub.expandRangeOverMerges).not.toHaveBeenCalled();
    expect(adapterStub.emitCellPick).toHaveBeenCalledTimes(1);
  });

  it('emits an append=true cell pick when the mousedown held ctrl', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 2, col: 3 }, { ctrlKey: true });
    controller.onDocMouseUp();

    expect(adapterStub.emitCellPick).toHaveBeenCalledWith({
      ref: { sheet: '', row: 2, col: 3 },
      append: true,
    });
  });

  it('restores focus to the element focused before the pick', () => {
    const { controller } = makeHarness();
    const originButton = document.createElement('button');
    const stealingInput = document.createElement('input');

    document.body.append(originButton, stealingInput);
    originButton.focus();
    pressCell(controller, { row: 0, col: 0 });
    stealingInput.focus();
    controller.onDocMouseUp();

    expect(document.activeElement).toBe(originButton);

    originButton.remove();
    stealingInput.remove();
  });

  it('does nothing when no pick is in progress', () => {
    const { controller, adapterStub } = makeHarness();

    controller.onDocMouseUp();

    expect(adapterStub.clearEphemeralHighlight).not.toHaveBeenCalled();
    expect(adapterStub.emitCellPick).not.toHaveBeenCalled();
    expect(adapterStub.emitRangePick).not.toHaveBeenCalled();
  });

  it('clears the pick so a second mouseup emits nothing', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 2, col: 3 });
    controller.onDocMouseUp();
    controller.onDocMouseUp();

    expect(adapterStub.emitCellPick).toHaveBeenCalledTimes(1);
  });
});

describe('CellPickController autoscroll', () => {
  /**
   * Feeds a document mousemove with the primary button held to the controller.
   *
   * @param {CellPickController} controller The controller under test.
   * @param {number} x The pointer clientX.
   * @param {number} y The pointer clientY.
   */
  function moveTo(controller: CellPickController, x: number, y: number) {
    controller.onDocMouseMove({ clientX: x, clientY: y, buttons: 1 } as MouseEvent);
  }

  it('scrolls the holder down when the pointer moves below it', () => {
    const { controller, holder } = makeHarness();

    pressCell(controller, { row: 1, col: 1 });
    moveTo(controller, 50, 140);

    expect(holder.scrollTop).toBeGreaterThan(0);
    controller.onDocMouseUp();
  });

  it('scrolls the holder right when the pointer moves past its right edge', () => {
    const { controller, holder } = makeHarness();

    pressCell(controller, { row: 1, col: 1 });
    moveTo(controller, 260, 50);

    expect(holder.scrollLeft).toBeGreaterThan(0);
    controller.onDocMouseUp();
  });

  it('does not scroll while the pointer stays inside the holder', () => {
    const { controller, holder } = makeHarness();

    pressCell(controller, { row: 1, col: 1 });
    moveTo(controller, 50, 50);

    expect(holder.scrollTop).toBe(0);
    expect(holder.scrollLeft).toBe(0);
    controller.onDocMouseUp();
  });

  it('does not scroll when no pick is in progress', () => {
    const { controller, holder } = makeHarness();

    moveTo(controller, 50, 140);

    expect(holder.scrollTop).toBe(0);
  });

  it('extends the pick range to the edge cell while autoscrolling', () => {
    const { controller, adapterStub } = makeHarness({ cellAtPoint: { row: 6, col: 1 } });

    pressCell(controller, { row: 1, col: 1 });
    moveTo(controller, 50, 140);

    expect(adapterStub.highlightRange).toHaveBeenLastCalledWith(
      {
        start: { sheet: '', row: 1, col: 1 },
        end: { sheet: '', row: 6, col: 1 },
      },
      EPHEMERAL_COLOR,
    );

    controller.onDocMouseUp();

    expect(adapterStub.emitRangePick).toHaveBeenCalledWith({
      ref: {
        start: { sheet: '', row: 1, col: 1 },
        end: { sheet: '', row: 6, col: 1 },
      },
      append: false,
    });
  });

  it('finalizes the pick on a buttonless mousemove (button released off-window)', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 2, col: 3 });
    controller.onDocMouseMove({ clientX: 50, clientY: 50, buttons: 0 } as MouseEvent);

    expect(adapterStub.emitCellPick).toHaveBeenCalledWith({
      ref: { sheet: '', row: 2, col: 3 },
      append: false,
    });
  });

  it('finalizes the pick on window blur', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 2, col: 3 });
    controller.onWindowBlur();

    expect(adapterStub.emitCellPick).toHaveBeenCalledWith({
      ref: { sheet: '', row: 2, col: 3 },
      append: false,
    });
  });
});

describe('CellPickController.onDocScroll', () => {
  it('re-extends the active pick to the cell under the stationary pointer', () => {
    const { controller, adapterStub } = makeHarness({ cellAtPoint: { row: 4, col: 2 } });

    pressCell(controller, { row: 1, col: 1 }, { clientX: 40, clientY: 30 });
    controller.onDocScroll();

    expect(adapterStub.getCellAddressAt).toHaveBeenCalledWith(40, 30);
    expect(adapterStub.highlightRange).toHaveBeenLastCalledWith(
      {
        start: { sheet: '', row: 1, col: 1 },
        end: { sheet: '', row: 4, col: 2 },
      },
      EPHEMERAL_COLOR,
    );

    controller.onDocMouseUp();
  });

  it('replays the latest mousemove position, not the mousedown seed', () => {
    const { controller, adapterStub } = makeHarness({ cellAtPoint: { row: 4, col: 2 } });

    pressCell(controller, { row: 1, col: 1 }, { clientX: 40, clientY: 30 });
    controller.onDocMouseMove({ clientX: 60, clientY: 70, buttons: 1 } as MouseEvent);
    controller.onDocScroll();

    expect(adapterStub.getCellAddressAt).toHaveBeenLastCalledWith(60, 70);
    controller.onDocMouseUp();
  });

  it('does nothing when no pick is in progress', () => {
    const { controller, adapterStub } = makeHarness({ cellAtPoint: { row: 4, col: 2 } });

    controller.onDocScroll();

    expect(adapterStub.getCellAddressAt).not.toHaveBeenCalled();
    expect(adapterStub.highlightRange).not.toHaveBeenCalled();
  });

  it('does nothing when the pick started without pointer coordinates', () => {
    const { controller, adapterStub } = makeHarness({ cellAtPoint: { row: 4, col: 2 } });

    controller.onBeforeMouseDown(undefined, { row: 1, col: 1 }, undefined, makeFlags());
    adapterStub.getCellAddressAt.mockClear();
    controller.onDocScroll();

    expect(adapterStub.getCellAddressAt).not.toHaveBeenCalled();
    controller.onDocMouseUp();
  });
});

describe('CellPickController header picking', () => {
  it('emits a column header pick and suppresses the event on a single-column press', () => {
    const { controller, adapterStub } = makeHarness();
    const { event, flags } = pressCell(controller, { row: -1, col: 2 });

    controller.onDocMouseUp();

    expect(flags).toEqual({ row: true, column: true, cell: true });
    expect(event.defaultPrevented).toBe(true);
    expect(adapterStub.emitHeaderPick).toHaveBeenCalledWith({
      axis: 'column',
      sheet: '',
      start: 2,
      end: 2,
      append: false,
    });
  });

  it('emits a row header pick on a single-row press', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 3, col: -1 });
    controller.onDocMouseUp();

    expect(adapterStub.emitHeaderPick).toHaveBeenCalledWith({
      axis: 'row',
      sheet: '',
      start: 3,
      end: 3,
      append: false,
    });
  });

  it('extends a column header drag through a hover over the body into a range pick', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: -1, col: 1 });
    hoverCell(controller, { row: -1, col: 4 });
    hoverCell(controller, { row: 5, col: 6 });
    controller.onDocMouseUp();

    expect(adapterStub.emitHeaderPick).toHaveBeenCalledWith({
      axis: 'column',
      sheet: '',
      start: 1,
      end: 6,
      append: false,
    });
  });

  it('maps a row header press through hf coordinates', () => {
    const { controller, adapterStub } = makeHarness({ rowOffset: 2 });

    pressCell(controller, { row: 3, col: -1 });
    controller.onDocMouseUp();

    expect(adapterStub.emitHeaderPick).toHaveBeenCalledWith({
      axis: 'row',
      sheet: '',
      start: 5,
      end: 5,
      append: false,
    });
  });
});

describe('CellPickController header picking modifiers and axes', () => {
  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Meta', { metaKey: true }],
  ])('sets append on a header pick pressed with %s', (_label, modifiers) => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: -1, col: 2 }, modifiers);
    controller.onDocMouseUp();

    expect(adapterStub.emitHeaderPick).toHaveBeenCalledWith({
      axis: 'column',
      sheet: '',
      start: 2,
      end: 2,
      append: true,
    });
  });

  it('extends a row header drag along the row axis through a body hover', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 2, col: -1 });
    hoverCell(controller, { row: 5, col: 6 });
    controller.onDocMouseUp();

    expect(adapterStub.emitHeaderPick).toHaveBeenCalledWith({
      axis: 'row',
      sheet: '',
      start: 2,
      end: 5,
      append: false,
    });
  });

  it('keeps a row header drag in place over a column header and still suppresses', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 2, col: -1 });

    const flags = hoverCell(controller, { row: -1, col: 3 });

    controller.onDocMouseUp();

    expect(flags).toEqual({ row: true, column: true, cell: true });
    expect(adapterStub.emitHeaderPick).toHaveBeenCalledWith({
      axis: 'row',
      sheet: '',
      start: 2,
      end: 2,
      append: false,
    });
  });

  it('extends a column header drag to column 0', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: -1, col: 3 });
    hoverCell(controller, { row: -1, col: 0 });
    controller.onDocMouseUp();

    expect(adapterStub.emitHeaderPick).toHaveBeenCalledWith({
      axis: 'column',
      sheet: '',
      start: 0,
      end: 3,
      append: false,
    });
  });

  it('extends a row header drag to row 0', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 3, col: -1 });
    hoverCell(controller, { row: 0, col: -1 });
    controller.onDocMouseUp();

    expect(adapterStub.emitHeaderPick).toHaveBeenCalledWith({
      axis: 'row',
      sheet: '',
      start: 0,
      end: 3,
      append: false,
    });
  });
});

describe('CellPickController collapsible indicator handling', () => {
  it('does not start a header pick when the mousedown target is a collapsible indicator', () => {
    const { controller } = makeHarness();
    const indicator = document.createElement('div');

    indicator.className = 'collapsibleIndicator expanded';
    document.body.appendChild(indicator);

    const event = new MouseEvent('mousedown', { bubbles: true });

    Object.defineProperty(event, 'target', { value: indicator });

    const eventController = makeFlags();

    controller.onBeforeMouseDown(event, { row: -1, col: 0 }, undefined, eventController);

    expect(eventController.column).toBe(false); // not suppressed
    expect(controller.isHeaderPickActive()).toBe(false); // no pick begun

    indicator.remove();
  });
});

describe('CellPickController.reset', () => {
  it('abandons an in-progress pick', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 2, col: 3 });
    controller.reset();
    controller.onDocMouseUp();

    expect(adapterStub.emitCellPick).not.toHaveBeenCalled();
    expect(adapterStub.emitRangePick).not.toHaveBeenCalled();
  });

  it('keeps claiming the hovers of a drag it cancelled until the button is released', () => {
    // Escape closes the edit mid-drag. The grid saw the press as its own, so a hover it is handed
    // would extend a native range selection from the edited cell.
    const { controller: dragging, adapterStub } = makeHarness();

    pressCell(dragging, { row: 2, col: 3 });
    dragging.reset();

    const during = new MouseEvent('mouseover', { cancelable: true });
    const flags = hoverCell(dragging, { row: 4, col: 4 }, makeFlags(), during);

    expect(flags).toEqual({ row: true, column: true, cell: true });
    expect(isImmediatePropagationStopped(during)).toBe(true);

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    const after = new MouseEvent('mouseover', { cancelable: true });

    hoverCell(dragging, { row: 4, col: 4 }, makeFlags(), after);

    expect(isImmediatePropagationStopped(after)).toBe(false);
    expect(adapterStub.emitRangePick).not.toHaveBeenCalled();
  });

  it('releases a cancelled drag on a buttonless mousemove', () => {
    const { controller } = makeHarness();

    pressCell(controller, { row: 2, col: 3 });
    controller.reset();
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, buttons: 0 }));

    const after = new MouseEvent('mouseover', { cancelable: true });

    hoverCell(controller, { row: 4, col: 4 }, makeFlags(), after);

    expect(isImmediatePropagationStopped(after)).toBe(false);
  });

  it('claims nothing after a reset with no drag in progress', () => {
    const { controller } = makeHarness({ refSelectionActive: false });

    controller.reset();

    const after = new MouseEvent('mouseover', { cancelable: true });
    const flags = hoverCell(controller, { row: 4, col: 4 }, makeFlags(), after);

    expect(flags).toEqual({ row: false, column: false, cell: false });
    expect(isImmediatePropagationStopped(after)).toBe(false);
  });
});

/**
 * Simulates the trailing click Handsontable's dropdown menu button receives
 * after a header mousedown/mouseup pair.
 *
 * @returns {MouseEvent} The dispatched click event.
 */
function clickHeaderMenuButton(): MouseEvent {
  const headerCell = document.createElement('th');
  const menuButton = document.createElement('button');

  menuButton.className = 'changeType';
  headerCell.append(menuButton);
  document.body.append(headerCell);

  const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

  menuButton.dispatchEvent(clickEvent);
  headerCell.remove();

  return clickEvent;
}

describe('trailing header click swallow', () => {
  it('prevents the trailing header click after an eligible header press', () => {
    const { controller } = makeHarness();

    pressCell(controller, { row: -1, col: 2 });
    controller.onDocMouseUp();

    expect(clickHeaderMenuButton().defaultPrevented).toBe(true);
  });

  it('swallows only one trailing click', () => {
    const { controller } = makeHarness();

    pressCell(controller, { row: -1, col: 2 });
    controller.onDocMouseUp();
    clickHeaderMenuButton();

    expect(clickHeaderMenuButton().defaultPrevented).toBe(false);
  });

  it('leaves clicks alone after an ineligible header press', () => {
    const { controller } = makeHarness({ refSelectionActive: false });

    pressCell(controller, { row: -1, col: 2 });
    controller.onDocMouseUp();

    expect(clickHeaderMenuButton().defaultPrevented).toBe(false);
  });

  it('passes a non-header click through and disarms', () => {
    const { controller } = makeHarness();

    pressCell(controller, { row: -1, col: 2 });
    controller.onDocMouseUp();

    const outsideTarget = document.createElement('div');

    document.body.append(outsideTarget);

    const outsideClick = new MouseEvent('click', { bubbles: true, cancelable: true });

    outsideTarget.dispatchEvent(outsideClick);
    outsideTarget.remove();

    expect(outsideClick.defaultPrevented).toBe(false);
    expect(clickHeaderMenuButton().defaultPrevented).toBe(false);
  });

  it('disarms on reset', () => {
    const { controller } = makeHarness();

    pressCell(controller, { row: -1, col: 2 });
    controller.reset();

    expect(clickHeaderMenuButton().defaultPrevented).toBe(false);
  });
});

describe('CellPickController.isHeaderPickActive', () => {
  it('reports active between an eligible header press and mouseup', () => {
    const { controller } = makeHarness();

    expect(controller.isHeaderPickActive()).toBe(false);

    pressCell(controller, { row: -1, col: 2 });

    expect(controller.isHeaderPickActive()).toBe(true);

    controller.onDocMouseUp();

    expect(controller.isHeaderPickActive()).toBe(false);
  });

  it('stays inactive for an ineligible header press', () => {
    const { controller } = makeHarness({ refSelectionActive: false });

    pressCell(controller, { row: -1, col: 2 });

    expect(controller.isHeaderPickActive()).toBe(false);
  });
});

describe('CellPickController header pick focus restore', () => {
  it('restores the pre-pick focus instead of the host cell editor after a header pick', () => {
    const hostFocus = jest.fn();
    const { controller } = makeHarness({ hostActiveEditor: { focus: hostFocus } });
    const barInput = document.createElement('input');

    document.body.append(barInput);
    barInput.focus();
    pressCell(controller, { row: -1, col: 2 });
    controller.onDocMouseUp();

    expect(document.activeElement).toBe(barInput);
    expect(hostFocus).not.toHaveBeenCalled();
    barInput.remove();
  });
});

describe('CellPickController focus restore inside a shadow root', () => {
  it('restores the focus to the element inside an open shadow root, not to its host', () => {
    const { controller } = makeHarness();
    const host = document.createElement('div');
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const innerInput = document.createElement('input');
    const stealingInput = document.createElement('input');

    shadowRoot.appendChild(innerInput);
    document.body.append(host, stealingInput);
    innerInput.focus();

    // The document reports the host; only the shadow root knows the real target.
    expect(document.activeElement).toBe(host);

    pressCell(controller, { row: 1, col: 1 });
    stealingInput.focus();
    controller.onDocMouseUp();

    expect(document.activeElement).toBe(host);
    expect(shadowRoot.activeElement).toBe(innerInput);
  });
});

describe('CellPickController header drag lost-mouseup fallback', () => {
  it('finishes a header drag when the mouse moves with no button held', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: -1, col: 2 });
    controller.onDocMouseMove(new MouseEvent('mousemove', { buttons: 0 }));

    expect(controller.isHeaderPickActive()).toBe(false);
    expect(adapterStub.emitHeaderPick).toHaveBeenCalledTimes(1);
  });
});

describe('CellPickController press filter', () => {
  it.each([
    ['the secondary (right) button', 2],
    ['the middle button', 1],
  ])('does not pick on %s', (_name, button) => {
    const { controller, adapterStub } = makeHarness();
    const { event, flags } = pressCell(controller, { row: 1, col: 1 }, { button });

    controller.onDocMouseUp();

    expect(flags).toEqual({ row: false, column: false, cell: false });
    expect(event.defaultPrevented).toBe(false);
    expect(adapterStub.emitCellPick).not.toHaveBeenCalled();
  });

  it('does not pick a header on the secondary button', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: -1, col: 2 }, { button: 2 });
    controller.onDocMouseUp();

    expect(adapterStub.emitHeaderPick).not.toHaveBeenCalled();
  });

  it('picks on a tap, and the tap finishes the pick without a mouseup', () => {
    const { controller, adapterStub } = makeHarness();
    const touch = { identifier: 7, clientX: 10, clientY: 10 } as unknown as Touch;
    const event = new Event('touchend', { cancelable: true }) as unknown as MouseEvent;

    Object.defineProperty(event, 'changedTouches', { value: [touch] });
    Object.defineProperty(event, 'touches', { value: [] });
    controller.onBeforeMouseDown(event, { row: 1, col: 1 }, undefined, makeFlags());

    expect(adapterStub.emitCellPick).toHaveBeenCalledTimes(1);
    expect(controller.isHeaderPickActive()).toBe(false);
  });

  it('cancels the touchend of a tap pick, so the browser fires no compatibility mousedown', () => {
    const { controller } = makeHarness();

    controller.onBeforeMouseDown(makeTapPress(), { row: 1, col: 1 }, undefined, makeFlags());

    expect(dispatchTouchEnd().defaultPrevented).toBe(true);
    // One-shot: the next tap's touchend is left alone.
    expect(dispatchTouchEnd().defaultPrevented).toBe(false);
  });

  it('cancels the touchend of a header tap pick', () => {
    const { controller, adapterStub } = makeHarness();

    controller.onBeforeMouseDown(makeTapPress(), { row: -1, col: 1 }, undefined, makeFlags());

    expect(adapterStub.emitHeaderPick).toHaveBeenCalledTimes(1);
    expect(dispatchTouchEnd().defaultPrevented).toBe(true);
  });

  it('stops cancelling once the task that dispatched the tap is over', () => {
    const { controller, deferTask } = makeHarness();

    controller.onBeforeMouseDown(makeTapPress(), { row: 1, col: 1 }, undefined, makeFlags());
    expect(deferTask).toHaveBeenCalledTimes(1);
    deferTask.mock.calls[0][0]();

    expect(dispatchTouchEnd().defaultPrevented).toBe(false);
  });

  it('stops cancelling on reset', () => {
    const { controller } = makeHarness();

    controller.onBeforeMouseDown(makeTapPress(), { row: 1, col: 1 }, undefined, makeFlags());
    controller.reset();

    expect(dispatchTouchEnd().defaultPrevented).toBe(false);
  });

  it('leaves no header click swallow armed after a header tap pick, which fires no click', () => {
    const { controller } = makeHarness();
    const th = document.createElement('th');

    document.body.appendChild(th);
    controller.onBeforeMouseDown(makeTapPress(), { row: -1, col: 1 }, undefined, makeFlags());

    // A click without a mousedown before it (a keyboard activation) must reach the header.
    expect(clickOn(th).defaultPrevented).toBe(false);
  });
});

describe('CellPickController nested-header group picks', () => {
  it('picks every column a nested-header group covers', () => {
    const { controller, adapterStub } = makeHarness({ headerSpans: { 2: { start: 2, end: 4 } } });

    pressCell(controller, { row: -2, col: 2 });
    controller.onDocMouseUp();

    expect(adapterStub.emitHeaderPick).toHaveBeenCalledWith({
      axis: 'column',
      sheet: '',
      start: 2,
      end: 4,
      append: false,
    });
  });

  it('keeps the whole start group when the drag moves toward the start', () => {
    const { controller, adapterStub } = makeHarness({ headerSpans: { 4: { start: 4, end: 6 } } });

    pressCell(controller, { row: -2, col: 4 });
    controller.onBeforeMouseOver(new MouseEvent('mouseover'), { row: -1, col: 1 }, undefined, makeFlags());
    controller.onDocMouseUp();

    expect(adapterStub.emitHeaderPick).toHaveBeenCalledWith({
      axis: 'column',
      sheet: '',
      start: 1,
      end: 6,
      append: false,
    });
  });
});

/**
 * Builds the press Walkontable hands the hook for a tap: the `touchstart` it deferred to `touchend`.
 *
 * @returns {MouseEvent} The touch press, typed the way the hook receives it.
 */
function makeTapPress(): MouseEvent {
  const touch = { identifier: 3, clientX: 10, clientY: 10 } as unknown as Touch;
  const event = new Event('touchstart', { cancelable: true }) as unknown as MouseEvent;

  Object.defineProperty(event, 'changedTouches', { value: [touch] });
  Object.defineProperty(event, 'touches', { value: [touch] });

  return event;
}

/**
 * Dispatches a cancelable `touchend` on the document and returns it.
 *
 * @returns {Event} The dispatched event.
 */
function dispatchTouchEnd(): Event {
  const event = new Event('touchend', { bubbles: true, cancelable: true });

  document.dispatchEvent(event);

  return event;
}

/**
 * Simulates a grid mousedown whose target is the given element.
 *
 * @param {CellPickController} controller The controller under test.
 * @param {GridCoords} coords The pressed cell coordinates.
 * @param {Element} target The pressed element.
 * @returns {object} The mousedown event and the flags object.
 */
function pressElement(controller: CellPickController, coords: GridCoords, target: Element) {
  const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true, buttons: 1 });
  const flags = makeFlags();

  Object.defineProperty(event, 'target', { value: target });
  controller.onBeforeMouseDown(event, coords, undefined, flags);

  return { event, flags };
}

/**
 * Dispatches a click on the element and returns it.
 *
 * @param {Element} target The clicked element.
 * @returns {MouseEvent} The dispatched click event.
 */
function clickOn(target: Element): MouseEvent {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });

  target.dispatchEvent(event);

  return event;
}

describe('CellPickController presses on other plugins\' controls', () => {
  it.each([
    ['a CheckboxHeader checkbox', 'input', 'htCheckboxRendererInput htCheckboxHeaderInput', { row: -1, col: 3 }],
    ['a NestedRows button', 'div', 'ht_nestingButton ht_nestingCollapse', { row: 4, col: -1 }],
    ['a RowSelection header cell', 'th', 'htRowSelectionCell', { row: 1, col: -1 }],
    ['a RowSelection header checkbox', 'input', 'htCheckboxRendererInput htRowSelectionCheckbox', { row: -1, col: 0 }],
  ])('leaves a header press on %s to its plugin', (_name, tagName, className, coords) => {
    const { controller, adapterStub } = makeHarness();
    const control = document.createElement(tagName);

    control.className = className;
    document.body.append(control);

    const { event, flags } = pressElement(controller, coords, control);

    expect(flags).toEqual({ row: false, column: false, cell: false });
    expect(isImmediatePropagationStopped(event)).toBe(false);
    expect(controller.isHeaderPickActive()).toBe(false);
    controller.onDocMouseUp();
    expect(adapterStub.emitHeaderPick).not.toHaveBeenCalled();
  });

  it('starts a header pick on the header text next to a control', () => {
    const { controller } = makeHarness();
    const headerCell = document.createElement('th');
    const label = document.createElement('span');

    headerCell.append(label);
    document.body.append(headerCell);

    const { flags } = pressElement(controller, { row: -1, col: 3 }, label);

    expect(flags).toEqual({ row: true, column: true, cell: true });
    expect(controller.isHeaderPickActive()).toBe(true);
  });

  it('leaves a cell press on a RowSelection checkbox to its plugin', () => {
    const { controller, adapterStub } = makeHarness();
    const checkbox = document.createElement('input');

    checkbox.type = 'checkbox';
    checkbox.className = 'htCheckboxRendererInput htRowSelectionCheckbox';
    document.body.append(checkbox);

    const { event, flags } = pressElement(controller, { row: 2, col: 0 }, checkbox);

    controller.onDocMouseUp();

    expect(flags).toEqual({ row: false, column: false, cell: false });
    expect(isImmediatePropagationStopped(event)).toBe(false);
    expect(adapterStub.emitCellPick).not.toHaveBeenCalled();
  });
});

describe('CellPickController picks on a checkbox cell', () => {
  it('picks the cell and keeps the checkbox from toggling on the trailing click', () => {
    const { controller, adapterStub } = makeHarness();
    const checkbox = document.createElement('input');

    checkbox.type = 'checkbox';
    checkbox.className = 'htCheckboxRendererInput';
    document.body.append(checkbox);

    pressElement(controller, { row: 1, col: 3 }, checkbox);
    controller.onDocMouseUp();

    const click = clickOn(checkbox);

    expect(adapterStub.emitCellPick).toHaveBeenCalledTimes(1);
    expect(click.defaultPrevented).toBe(true);
    expect(checkbox.checked).toBe(false);
  });

  it('keeps a label that holds the checkbox from toggling it', () => {
    const { controller } = makeHarness();
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    const text = document.createElement('span');

    checkbox.type = 'checkbox';
    label.append(checkbox, text);
    document.body.append(label);

    pressElement(controller, { row: 1, col: 3 }, text);
    controller.onDocMouseUp();

    expect(clickOn(text).defaultPrevented).toBe(true);
    expect(checkbox.checked).toBe(false);
  });

  it('swallows only the first trailing click', () => {
    const { controller } = makeHarness();
    const checkbox = document.createElement('input');

    checkbox.type = 'checkbox';
    document.body.append(checkbox);

    pressElement(controller, { row: 1, col: 3 }, checkbox);
    controller.onDocMouseUp();
    clickOn(checkbox);

    expect(clickOn(checkbox).defaultPrevented).toBe(false);
    expect(checkbox.checked).toBe(true);
  });

  it('leaves the clicks of a cell without a checkbox alone', () => {
    const { controller } = makeHarness();
    const label = document.createElement('label');

    document.body.append(label);

    pressElement(controller, { row: 1, col: 3 }, label);
    controller.onDocMouseUp();

    expect(clickOn(label).defaultPrevented).toBe(false);
  });
});

describe('CellPickController Shift+press', () => {
  it('extends the pending pick to a range anchored where that pick was', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 0, col: 1 });
    controller.onDocMouseUp();
    pressCell(controller, { row: 2, col: 3 }, { shiftKey: true });
    controller.onDocMouseUp();

    expect(adapterStub.emitRangePick).toHaveBeenCalledWith({
      ref: { start: { sheet: '', row: 0, col: 1 }, end: { sheet: '', row: 2, col: 3 } },
      append: false,
    });
  });

  it('keeps the first anchor over repeated Shift+presses, as the grid does', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 2, col: 2 });
    controller.onDocMouseUp();
    pressCell(controller, { row: 4, col: 4 }, { shiftKey: true });
    controller.onDocMouseUp();
    pressCell(controller, { row: 0, col: 0 }, { shiftKey: true });
    controller.onDocMouseUp();

    expect(adapterStub.emitRangePick).toHaveBeenLastCalledWith({
      ref: { start: { sheet: '', row: 0, col: 0 }, end: { sheet: '', row: 2, col: 2 } },
      append: false,
    });
  });

  it('picks the pressed cell when the editor changed since the last pick', () => {
    const { controller, adapterStub, editorState } = makeHarness();

    pressCell(controller, { row: 0, col: 1 });
    controller.onDocMouseUp();
    editorState.text += '+';
    editorState.caret += 1;
    pressCell(controller, { row: 2, col: 3 }, { shiftKey: true });
    controller.onDocMouseUp();

    expect(adapterStub.emitRangePick).not.toHaveBeenCalled();
    expect(adapterStub.emitCellPick).toHaveBeenLastCalledWith({ ref: { sheet: '', row: 2, col: 3 }, append: false });
  });

  it('picks the pressed cell when the caret moved since the last pick', () => {
    const { controller, adapterStub, editorState } = makeHarness();

    pressCell(controller, { row: 0, col: 1 });
    controller.onDocMouseUp();
    editorState.caret -= 1;
    pressCell(controller, { row: 2, col: 3 }, { shiftKey: true });
    controller.onDocMouseUp();

    expect(adapterStub.emitRangePick).not.toHaveBeenCalled();
  });

  it('picks the pressed cell when no pick was made in the edit', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 2, col: 3 }, { shiftKey: true });
    controller.onDocMouseUp();

    expect(adapterStub.emitCellPick).toHaveBeenCalledWith({ ref: { sheet: '', row: 2, col: 3 }, append: false });
  });

  it('forgets the pending pick on reset (the edit closed)', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 0, col: 1 });
    controller.onDocMouseUp();
    controller.reset();
    pressCell(controller, { row: 2, col: 3 }, { shiftKey: true });
    controller.onDocMouseUp();

    expect(adapterStub.emitRangePick).not.toHaveBeenCalled();
  });

  it('appends, without extending, when Ctrl/Cmd is held too', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 0, col: 1 });
    controller.onDocMouseUp();
    pressCell(controller, { row: 2, col: 3 }, { shiftKey: true, ctrlKey: true });
    controller.onDocMouseUp();

    expect(adapterStub.emitCellPick).toHaveBeenLastCalledWith({ ref: { sheet: '', row: 2, col: 3 }, append: true });
  });
});
