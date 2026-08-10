import type { FormulaEditor } from '@hfe/core';
import { CellPickController } from '../cellPickController';
import type { HandsontableAdapter } from '../handsontableAdapter';
import type { CoreModule } from '../types';

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('@hfe/core') as CoreModule;
const EPHEMERAL_COLOR = core.EPHEMERAL_COLOR;

afterEach(() => {
  document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
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
  } = options;
  const holder = makeHolder();
  const adapterStub = {
    highlightRange: jest.fn(),
    clearEphemeralHighlight: jest.fn(),
    emitCellPick: jest.fn(),
    emitRangePick: jest.fn(),
    emitHeaderPick: jest.fn(),
    getGridSize: jest.fn(() => ({ rows: 10, cols: 8 })),
    getCellAddressAt: jest.fn(() =>
      (cellAtPoint ? { sheet: '', row: cellAtPoint.row, col: cellAtPoint.col } : null),
    ),
  };
  const closeUnbalancedParens = jest.fn();
  const editorStub = {
    isFormula: () => editorValue.startsWith('='),
    isRefSelectionActive: () => refSelectionActive,
    getRefPreviewColor: () => EPHEMERAL_COLOR,
    closeUnbalancedParens,
  };
  const emitSwitchToInline = jest.fn();
  const suspendDragToScroll = jest.fn();
  const resumeDragToScroll = jest.fn();
  const controller = new CellPickController({
    core,
    getAdapter: () => (hasAdapter ? (adapterStub as unknown as HandsontableAdapter) : null),
    getActiveEditor: () => (hasEditor ? (editorStub as unknown as FormulaEditor) : null),
    getBarSelected: () => barSelected,
    toHfCoords: coords => ({ row: coords.row + rowOffset, col: coords.col }),
    emitSwitchToInline,
    getHostActiveEditor: () => hostActiveEditor,
    getScrollHolder: () => holder as unknown as HTMLElement,
    getRootDocument: () => document,
    suspendDragToScroll,
    resumeDragToScroll,
  });

  return {
    controller,
    adapterStub,
    emitSwitchToInline,
    holder,
    suspendDragToScroll,
    resumeDragToScroll,
    closeUnbalancedParens,
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
 * @returns {object} The synthetic event and the flags object.
 */
function pressCell(
  controller: CellPickController,
  coords: GridCoords,
  eventInit: { ctrlKey?: boolean; metaKey?: boolean; clientX?: number; clientY?: number } = {},
  flags = makeFlags(),
) {
  const event = { preventDefault: jest.fn(), ...eventInit };

  controller.onBeforeMouseDown(event, coords, undefined, flags);

  return { event, flags };
}

/**
 * Simulates a grid mouseover on the given cell.
 *
 * @param {CellPickController} controller The controller under test.
 * @param {GridCoords} coords The hovered cell coordinates.
 * @param {EventFlags} flags The event-controller flags passed to the hook.
 * @returns {EventFlags} The flags object.
 */
function hoverCell(controller: CellPickController, coords: GridCoords, flags = makeFlags()) {
  controller.onBeforeMouseOver(undefined, coords, undefined, flags);

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
    expect(event.preventDefault).not.toHaveBeenCalled();
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
    expect(event.preventDefault).toHaveBeenCalled();
    expect(emitSwitchToInline).toHaveBeenCalledTimes(1);
    expect(adapterStub.highlightRange).not.toHaveBeenCalled();
  });

  it('leaves the grid event untouched when the caret cannot take a reference', () => {
    const { controller, adapterStub } = makeHarness({ refSelectionActive: false });
    const { event, flags } = pressCell(controller, { row: 1, col: 2 });

    expect(flags).toEqual({ row: false, column: false, cell: false });
    expect(event.preventDefault).not.toHaveBeenCalled();
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

describe('CellPickController.onBeforeMouseOverOutside', () => {
  /**
   * Simulates a mouseover outside the rendered grid area.
   *
   * @param {CellPickController} controller The controller under test.
   * @param {GridCoords} coords The edge cell coordinates reported by Handsontable.
   * @param {EventFlags} flags The event-controller flags passed to the hook.
   * @returns {EventFlags} The flags object.
   */
  function hoverOutside(controller: CellPickController, coords: GridCoords, flags = makeFlags()) {
    controller.onBeforeMouseOverOutside(undefined, coords, undefined, flags);

    return flags;
  }

  it('suppresses native selection extension while a pick is active', () => {
    const { controller } = makeHarness();

    pressCell(controller, { row: 1, col: 1 });

    const flags = hoverOutside(controller, { row: 5, col: 2 });

    expect(flags).toEqual({ row: true, column: true, cell: true });
  });

  it('extends the pick range to the outside edge cell', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: 1, col: 1 });
    hoverOutside(controller, { row: 5, col: 2 });

    expect(adapterStub.highlightRange).toHaveBeenLastCalledWith(
      {
        start: { sheet: '', row: 1, col: 1 },
        end: { sheet: '', row: 5, col: 2 },
      },
      EPHEMERAL_COLOR,
    );

    controller.onDocMouseUp();

    expect(adapterStub.emitRangePick).toHaveBeenCalledWith({
      ref: {
        start: { sheet: '', row: 1, col: 1 },
        end: { sheet: '', row: 5, col: 2 },
      },
      append: false,
    });
  });

  it('suppresses the event while editing a formula even before a pick starts', () => {
    const { controller, adapterStub } = makeHarness();
    const flags = hoverOutside(controller, { row: 5, col: 2 });

    expect(flags).toEqual({ row: true, column: true, cell: true });
    expect(adapterStub.highlightRange).not.toHaveBeenCalled();
  });
});

describe('CellPickController.onDocMouseUp', () => {
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

  it('suspends drag-to-scroll when a pick starts and resumes it on mouseup', () => {
    const { controller, suspendDragToScroll, resumeDragToScroll } = makeHarness();

    pressCell(controller, { row: 1, col: 1 });

    expect(suspendDragToScroll).toHaveBeenCalledTimes(1);
    expect(resumeDragToScroll).not.toHaveBeenCalled();

    controller.onDocMouseUp();

    expect(resumeDragToScroll).toHaveBeenCalledTimes(1);
  });

  it('does not suspend drag-to-scroll when ref selection is inactive', () => {
    const { controller, suspendDragToScroll } = makeHarness({ refSelectionActive: false });

    pressCell(controller, { row: 1, col: 1 });

    expect(suspendDragToScroll).not.toHaveBeenCalled();
  });

  it('resumes drag-to-scroll when the pick is reset', () => {
    const { controller, resumeDragToScroll } = makeHarness();

    pressCell(controller, { row: 1, col: 1 });
    controller.reset();

    expect(resumeDragToScroll).toHaveBeenCalledTimes(1);
  });

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
    expect(event.preventDefault).toHaveBeenCalled();
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

describe('CellPickController header drag lost-mouseup fallback', () => {
  it('finishes a header drag when the mouse moves with no button held', () => {
    const { controller, adapterStub } = makeHarness();

    pressCell(controller, { row: -1, col: 2 });
    controller.onDocMouseMove(new MouseEvent('mousemove', { buttons: 0 }));

    expect(controller.isHeaderPickActive()).toBe(false);
    expect(adapterStub.emitHeaderPick).toHaveBeenCalledTimes(1);
  });
});
