import { HyperFormula } from 'hyperformula';
import { EDITOR_STATE } from '../../../editors/baseEditor';
import { getEditor } from '../../../editors/registry';
import { registerAsRootInstance } from '../../../utils/rootInstance';
import { FormulaBuilder } from '../formulaBuilder';
import type { CoreModule } from '../types';
import { makeGridSelectionApiStub } from './helpers/stubs';
import type { GridSelectionApiStub } from './helpers/stubs';

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('@hfe/core') as CoreModule;

const EDITING_CELL_CLASS = 'ht-formula-builder__editing-cell';

type HookRegistrar = jest.Mock<void, [string, (...args: unknown[]) => unknown]>;

interface IndexMapperStub {
  getRenderableFromVisualIndex(visualIndex: number): number | null;
  getVisualFromRenderableIndex(renderableIndex: number): number | null;
  getRenderableIndexesLength(): number;
}

interface LayoutManagerStub {
  register: jest.Mock<void, [string, HTMLElement, { side: string; weight: number }]>;
  unregister: jest.Mock<void, [string, string]>;
}

interface HotStubShape {
  rootElement: HTMLElement;
  rootDocument: Document;
  rootWindow: Window & typeof globalThis;
  getSettings: () => Record<string, unknown>;
  getPlugin: (pluginName: string) => unknown;
  updateSettings: jest.Mock;
  addHook: HookRegistrar;
  removeHook: HookRegistrar;
  getActiveEditor: () => unknown;
  getCell: () => HTMLElement;
  getCoords: () => unknown;
  countRows: () => number;
  countCols: () => number;
  render: jest.Mock;
  getFirstRenderedVisibleRow: () => number;
  getLastRenderedVisibleRow: () => number;
  getFirstRenderedVisibleColumn: () => number;
  getLastRenderedVisibleColumn: () => number;
  getFirstFullyVisibleRow: () => number;
  getLastFullyVisibleRow: () => number;
  getFirstFullyVisibleColumn: () => number;
  getLastFullyVisibleColumn: () => number;
  getDataAtCell: (row: number, col: number) => unknown;
  setDataAtCell: jest.Mock;
  scrollViewportTo: jest.Mock;
  getSelectedRangeLast: () => unknown;
  getSelectedLast: () => number[] | undefined;
  getCellMetaTransient: (row: number, col: number) => Record<string, unknown>;
  selectCell: jest.Mock;
  selectCells: jest.Mock;
  view: GridSelectionApiStub['view'];
  selection: GridSelectionApiStub['selection'];
  guid: GridSelectionApiStub['guid'];
  _createCellCoords: GridSelectionApiStub['_createCellCoords'];
  _createCellRange: GridSelectionApiStub['_createCellRange'];
  getLayoutManager: () => LayoutManagerStub;
  getCurrentThemeName: () => string | null;
  isRtl: () => boolean;
  themeManager?: { getClassName: () => string | undefined };
  rowIndexMapper?: IndexMapperStub;
  columnIndexMapper?: IndexMapperStub;
}

/**
 * Builds a fully-wired Handsontable stub around a real HyperFormula engine and
 * a fake (enabled) Formulas plugin exposing identity axis syncers.
 *
 * @param {object} pluginSettings Extra `formulaBuilder` settings merged over the `builder` key.
 * @returns {object} The engine, fake formulas plugin, settings, spies, and the hot stub.
 */
function makeFullHotStub(pluginSettings: Record<string, unknown> = {}) {
  const engine = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
  const identitySyncer = {
    getHfIndexFromVisualIndex: (visualIndex: number) => visualIndex,
    getVisualIndexFromHfIndex: (hfIndex: number) => hfIndex,
  };
  const formulas = {
    enabled: true,
    engine: engine as HyperFormula | null,
    sheetId: 0,
    rowAxisSyncer: identitySyncer,
    columnAxisSyncer: identitySyncer,
  };
  const settings: Record<string, unknown> = {
    formulaBuilder: { builder: core, ...pluginSettings },
  };
  const updateSettings = jest.fn((next: Record<string, unknown>) => Object.assign(settings, next));
  const layoutManager: LayoutManagerStub = { register: jest.fn(), unregister: jest.fn() };
  const hot: HotStubShape = {
    rootElement: document.createElement('div'),
    rootDocument: document,
    rootWindow: window,
    getSettings: () => settings,
    getPlugin: pluginName => (pluginName === 'formulas' ? formulas : undefined),
    updateSettings,
    addHook: jest.fn(),
    removeHook: jest.fn(),
    getActiveEditor: () => undefined,
    getCell: () => document.createElement('td'),
    getCoords: () => null,
    countRows: () => 0,
    countCols: () => 0,
    render: jest.fn(),
    getFirstRenderedVisibleRow: () => 0,
    getLastRenderedVisibleRow: () => 100,
    getFirstRenderedVisibleColumn: () => 0,
    getLastRenderedVisibleColumn: () => 100,
    getFirstFullyVisibleRow: () => -1,
    getLastFullyVisibleRow: () => -1,
    getFirstFullyVisibleColumn: () => -1,
    getLastFullyVisibleColumn: () => -1,
    getDataAtCell: () => null,
    setDataAtCell: jest.fn(),
    scrollViewportTo: jest.fn(() => true),
    getSelectedRangeLast: () => undefined,
    getSelectedLast: () => undefined,
    getCellMetaTransient: () => ({}),
    selectCell: jest.fn(),
    selectCells: jest.fn(),
    ...makeGridSelectionApiStub(),
    getLayoutManager: () => layoutManager,
    getCurrentThemeName: () => null,
    isRtl: () => false,
    rowIndexMapper: {
      getRenderableFromVisualIndex: visual => visual,
      getVisualFromRenderableIndex: renderable => renderable,
      getRenderableIndexesLength: () => 0,
    },
    columnIndexMapper: {
      getRenderableFromVisualIndex: visual => visual,
      getVisualFromRenderableIndex: renderable => renderable,
      getRenderableIndexesLength: () => 0,
    },
  };

  return { engine, formulas, settings, updateSettings, layoutManager, hot };
}

/**
 * Returns the callback registered under a hook name on the stub.
 *
 * @param {object} stub The stub bundle returned by `makeFullHotStub`.
 * @param {string} hookName The hook name to look up.
 * @returns {Function} The registered hook callback.
 */
function findHook(
  stub: ReturnType<typeof makeFullHotStub>,
  hookName: string,
): (...args: unknown[]) => unknown {
  const call = stub.hot.addHook.mock.calls.find(entry => entry[0] === hookName);

  if (!call) {
    throw new Error(`hook ${hookName} not registered`);
  }

  return call[1];
}

/**
 * Reads the patched `refreshDimensions` method off the registered formula editor class.
 *
 * @returns {Function} The prototype method.
 */
function formulaEditorRefreshDimensions(): (this: unknown, force?: boolean) => void {
  const editorClass = getEditor('formula') as unknown as {
    prototype: { refreshDimensions(force?: boolean): void };
  };

  return editorClass.prototype.refreshDimensions;
}

describe('FormulaBuilder plugin registration', () => {
  it('exposes the plugin key, priority, and setting keys', () => {
    expect(FormulaBuilder.PLUGIN_KEY).toBe('formulaBuilder');
    expect(FormulaBuilder.PLUGIN_PRIORITY).toBe(270);
    expect(FormulaBuilder.SETTING_KEYS).toEqual(['formulaBuilder', 'formulas']);
  });
});

describe('FormulaBuilder.enablePlugin validation', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns and stays disabled when the settings carry no builder module', () => {
    const stub = makeFullHotStub();

    stub.settings.formulaBuilder = true;

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('`builder`'));
    expect(plugin.enabled).toBe(false);
  });

  it('warns and stays disabled when the formulas plugin is missing', () => {
    const stub = makeFullHotStub();

    stub.hot.getPlugin = () => undefined;

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Formulas plugin'));
    expect(plugin.enabled).toBe(false);
  });

  it('warns and stays disabled when the formulas plugin has no engine', () => {
    const stub = makeFullHotStub();

    stub.formulas.engine = null;

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Formulas plugin'));
    expect(plugin.enabled).toBe(false);
  });
});

it('registers the formula named editor on enable', () => {
  const stub = makeFullHotStub();
  const plugin = new FormulaBuilder(stub.hot as never);

  plugin.enablePlugin();

  expect(typeof getEditor('formula')).toBe('function');
});

it('parks the editor invisibly but focusable when its cell scrolls out of view', () => {
  const stub = makeFullHotStub();
  const plugin = new FormulaBuilder(stub.hot as never);

  plugin.enablePlugin();

  const refreshDimensions = formulaEditorRefreshDimensions();

  let closed = false;

  const inputEl = document.createElement('div');

  inputEl.appendChild(document.createElement('span'));

  const editor = {
    state: EDITOR_STATE.EDITING,
    input: inputEl,
    getEditedCell: () => null,
    close: () => {
      closed = true;
    },
    container: { style: { display: '', opacity: '', pointerEvents: '' } },
    TD: document.createElement('td') as HTMLElement | null,
  };

  refreshDimensions.call(editor);

  expect(closed).toBe(false);
  expect(editor.container.style.display).not.toBe('none');
  expect(editor.container.style.opacity).toBe('0');
  expect(editor.container.style.pointerEvents).toBe('none');
  expect(editor.TD).toBeNull();
});

it('keeps the container hidden when refreshed after the editor closed', () => {
  const stub = makeFullHotStub();
  const plugin = new FormulaBuilder(stub.hot as never);

  plugin.enablePlugin();

  const refreshDimensions = formulaEditorRefreshDimensions();
  const editor = {
    state: EDITOR_STATE.VIRGIN,
    input: document.createElement('div'),
    getEditedCell: () => document.createElement('td'),
    container: { style: { display: 'none' } },
    TD: document.createElement('td'),
  };

  refreshDimensions.call(editor);

  expect(editor.container.style.display).toBe('none');
});

it('hides the container when the wrap has no child element (empty-container guard)', () => {
  const stub = makeFullHotStub();
  const plugin = new FormulaBuilder(stub.hot as never);

  plugin.enablePlugin();

  const refreshDimensions = formulaEditorRefreshDimensions();
  const editor = {
    state: EDITOR_STATE.EDITING,
    input: document.createElement('div'),
    getEditedCell: () => document.createElement('td'),
    container: { style: { display: '' } },
    TD: document.createElement('td'),
  };

  refreshDimensions.call(editor);

  expect(editor.container.style.display).toBe('none');
});

it('restores grid focus after cancelling the inline edit', () => {
  const stub = makeFullHotStub();
  const finishEditing = jest.fn();

  stub.hot.getActiveEditor = () => ({ finishEditing });
  stub.hot.getSelectedLast = () => [2, 3, 2, 3];

  const plugin = new FormulaBuilder(stub.hot as never);

  plugin.enablePlugin();
  plugin.cancelInlineEdit();

  expect(finishEditing).toHaveBeenCalledWith(true);
  expect(stub.hot.selectCell).toHaveBeenCalledWith(2, 3);
});

/**
 * Builds a stub whose master overlay exposes a real scroll holder element and
 * whose active editor records `refreshDimensions` calls.
 *
 * @returns {object} The stub bundle, holder element, and `refreshDimensions` spy.
 */
function makeHotStubWithHolder() {
  const stub = makeFullHotStub();
  const holder = document.createElement('div');
  const refreshDimensions = jest.fn();

  stub.hot.view = { getOverlayByName: () => ({ holder, clone: null }), render: jest.fn() };
  stub.hot.getActiveEditor = () => ({ refreshDimensions });

  return { stub, holder, refreshDimensions };
}

it('re-anchors the inline editor synchronously on holder scroll while editing', () => {
  const { stub, holder, refreshDimensions } = makeHotStubWithHolder();
  const plugin = new FormulaBuilder(stub.hot as never);

  plugin.enablePlugin();
  plugin.handleInlineEditStart(document.createElement('div'), '=A1');
  refreshDimensions.mockClear();

  holder.dispatchEvent(new Event('scroll'));

  expect(refreshDimensions).toHaveBeenCalledWith(true);
});

it('stops re-anchoring on holder scroll once the inline editor closes', () => {
  const { stub, holder, refreshDimensions } = makeHotStubWithHolder();
  const plugin = new FormulaBuilder(stub.hot as never);

  plugin.enablePlugin();
  plugin.handleInlineEditStart(document.createElement('div'), '=A1');
  plugin.handleInlineEditClose();
  refreshDimensions.mockClear();

  holder.dispatchEvent(new Event('scroll'));

  expect(refreshDimensions).not.toHaveBeenCalled();
});

const fakeInlineEditor = {
  getValue: () => '=',
  isFormula: () => true,
  isRefSelectionActive: () => true,
  getRefPreviewColor: () => '#000',
} as never;

it('marks the edited cell only while the inline editor is visible', () => {
  const stub = makeFullHotStub();
  const hostEditor = { row: 2, col: 0, _hfeHidden: false };

  stub.hot.getActiveEditor = () => hostEditor;

  const plugin = new FormulaBuilder(stub.hot as never);

  plugin.enablePlugin();
  plugin.bindInlineEditor(fakeInlineEditor);

  const afterRenderer = findHook(stub, 'afterRenderer');
  const visibleCell = document.createElement('td');

  afterRenderer(visibleCell, 2, 0);

  expect(visibleCell.classList.contains(EDITING_CELL_CLASS)).toBe(true);

  hostEditor._hfeHidden = true;

  const hiddenCell = document.createElement('td');

  afterRenderer(hiddenCell, 2, 0);

  expect(hiddenCell.classList.contains(EDITING_CELL_CLASS)).toBe(false);
});

it('clears the edited-cell mark when the inline editor is hidden for the bar', () => {
  const stub = makeFullHotStub();
  const hostEditor = { _hfeHidden: false, refreshDimensions: jest.fn() };

  stub.hot.getActiveEditor = () => hostEditor;

  const plugin = new FormulaBuilder(stub.hot as never);

  plugin.enablePlugin();

  const marked = document.createElement('td');

  marked.classList.add(EDITING_CELL_CLASS);
  stub.hot.rootElement.appendChild(marked);

  plugin.setInlineEditorVisible(false);

  expect(hostEditor._hfeHidden).toBe(true);
  expect(marked.classList.contains(EDITING_CELL_CLASS)).toBe(false);
});

it('does not touch global HOT settings on enable', () => {
  const stub = makeFullHotStub();
  const plugin = new FormulaBuilder(stub.hot as never);

  plugin.enablePlugin();

  expect(stub.updateSettings).not.toHaveBeenCalled();
});

it('attaches hooks on enable and removes them on disable', () => {
  const stub = makeFullHotStub();
  const plugin = new FormulaBuilder(stub.hot as never);

  stub.hot.addHook.mockClear();
  plugin.enablePlugin();

  const addedHooks = stub.hot.addHook.mock.calls.map(call => call[0]);

  expect(addedHooks).toEqual(
    expect.arrayContaining([
      'afterRenderer',
      'afterSelectionEnd',
      'beforeOnCellMouseDown',
      'beforeOnCellMouseOver',
      'beforeColumnSort',
    ]),
  );

  plugin.disablePlugin();

  const removedHooks = stub.hot.removeHook.mock.calls.map(call => call[0]);

  expect(removedHooks).toEqual(expect.arrayContaining(addedHooks));
});

it('lets column sorting proceed while no header pick is active', () => {
  const stub = makeFullHotStub();
  const plugin = new FormulaBuilder(stub.hot as never);

  plugin.enablePlugin();

  expect(findHook(stub, 'beforeColumnSort')()).toBe(undefined);
});

/**
 * Builds a Handsontable selection range stub exposing the highlight cell.
 *
 * @param {object} active The active (highlight) cell coordinates.
 * @returns {object} The range stub.
 */
function makeCellRangeStub(active: { row: number; col: number }) {
  return { highlight: active };
}

describe('FormulaBuilder drag-to-scroll suspension', () => {
  /**
   * Builds a DragToScroll plugin stub.
   *
   * @param {boolean} enabled Whether the host enabled the plugin.
   * @returns {object} The stub.
   */
  function makeDragToScrollStub(enabled: boolean) {
    return { enabled, disablePlugin: jest.fn(), enablePlugin: jest.fn(), unlisten: jest.fn() };
  }

  /**
   * Enables the plugin, binds a ref-mode editor, and presses a body cell.
   *
   * @param {boolean} dragToScrollEnabled Whether the DragToScroll stub reports enabled.
   * @returns {object} The plugin and the DragToScroll stub.
   */
  function startPick(dragToScrollEnabled: boolean) {
    const stub = makeFullHotStub();
    const dragToScroll = makeDragToScrollStub(dragToScrollEnabled);
    const baseGetPlugin = stub.hot.getPlugin;

    stub.hot.getPlugin = pluginName =>
      (pluginName === 'dragToScroll' ? dragToScroll : baseGetPlugin(pluginName));

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();
    plugin.bindInlineEditor(fakeInlineEditor);

    const mouseDown = findHook(stub, 'beforeOnCellMouseDown');

    mouseDown({ preventDefault: jest.fn() }, { row: 1, col: 1 }, undefined, {
      row: false,
      column: false,
      cell: false,
    });

    return { plugin, dragToScroll };
  }

  it('disables an enabled dragToScroll plugin on pick start and re-enables it on mouseup', () => {
    const { dragToScroll } = startPick(true);

    expect(dragToScroll.disablePlugin).toHaveBeenCalledTimes(1);
    expect(dragToScroll.enablePlugin).not.toHaveBeenCalled();

    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(dragToScroll.enablePlugin).toHaveBeenCalledTimes(1);
  });

  it('clears stale dragToScroll listening state on suspend so resume cannot auto-scroll', () => {
    const { dragToScroll } = startPick(true);

    expect(dragToScroll.unlisten).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(dragToScroll.unlisten).toHaveBeenCalledTimes(1);
  });

  it('never touches a dragToScroll plugin the host has disabled', () => {
    const { dragToScroll } = startPick(false);

    expect(dragToScroll.disablePlugin).not.toHaveBeenCalled();

    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(dragToScroll.enablePlugin).not.toHaveBeenCalled();
  });
});

describe('FormulaBuilder eager adapter', () => {
  it('builds the adapter during enablePlugin so overlay hooks are ready before the first edit', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    stub.hot.addHook.mockClear();
    plugin.enablePlugin();

    const hooksAfterEnable = stub.hot.addHook.mock.calls.map(call => call[0]);

    expect(hooksAfterEnable).toContain('afterViewRender');
    expect(hooksAfterEnable).toContain('afterGetColHeader');
    expect(hooksAfterEnable).toContain('afterGetRowHeader');

    expect(plugin.adapter).toBeDefined();

    const hooksAfterAdapter = stub.hot.addHook.mock.calls.map(call => call[0]);

    expect(hooksAfterAdapter).toContain('afterViewRender');
  });
});

describe('FormulaBuilder formula bar host', () => {
  it('registers the bar host into the top layout slot on a root instance', () => {
    const stub = makeFullHotStub({ showFormulaBar: true });

    registerAsRootInstance(stub.hot);

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    expect(stub.layoutManager.register).toHaveBeenCalledTimes(1);

    const [slotKey, barHost, slotOptions] = stub.layoutManager.register.mock.calls[0];

    expect(slotKey).toBe('formulaBuilder');
    expect(barHost.classList.contains('ht-formula-builder__formula-bar')).toBe(true);
    expect(slotOptions).toEqual({ side: 'top', weight: 100 });
  });

  it('skips the bar host on a non-root instance', () => {
    const stub = makeFullHotStub({ showFormulaBar: true });
    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    expect(stub.layoutManager.register).not.toHaveBeenCalled();
  });
});

describe('FormulaBuilder formula-cell scoping', () => {
  it('marks errors only on formula cells', () => {
    const stub = makeFullHotStub();

    stub.engine.addSheet('Sheet1');
    stub.engine.setCellContents({ sheet: 0, row: 0, col: 0 }, [['=1/0']]);
    stub.engine.setCellContents({ sheet: 0, row: 0, col: 1 }, [['=1/0']]);
    stub.hot.getCellMetaTransient = (_row, col) => ({ editor: col === 0 ? 'formula' : 'numeric' });

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const renderCell = findHook(stub, 'afterRenderer');
    const formulaCell = document.createElement('td');
    const plainCell = document.createElement('td');

    renderCell(formulaCell, 0, 0);
    renderCell(plainCell, 0, 1);

    expect(formulaCell.dataset.hfeError).toBeDefined();
    expect(plainCell.dataset.hfeError).toBeUndefined();
  });

  it('does not ref-pick while a non-formula editor is open', () => {
    const stub = makeFullHotStub();

    stub.hot.getActiveEditor = () => ({ isOpened: () => true, row: 0 });

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const mouseDown = findHook(stub, 'beforeOnCellMouseDown');
    const eventController = { row: false, column: false, cell: false };

    mouseDown(undefined, { row: 1, col: 1 }, undefined, eventController);

    expect(eventController.cell).toBe(false);
  });

  it('lets the native editor commit on a cell click when editing a formula with an inactive caret', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();
    plugin.bindInlineEditor({
      isRefSelectionActive: () => false,
      getValue: () => '=SUM(A1:A10)',
      isFormula: () => true,
      closeUnbalancedParens: () => {},
    } as never);

    const mouseDown = findHook(stub, 'beforeOnCellMouseDown');
    const eventController = { row: false, column: false, cell: false };

    mouseDown(undefined, { row: 1, col: 1 }, undefined, eventController);

    expect(eventController.cell).toBe(false);
  });

  it('lets the editor commit on a grid click when editing a non-formula value', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();
    plugin.bindInlineEditor({
      isRefSelectionActive: () => false,
      getValue: () => '123',
      isFormula: () => false,
    } as never);

    const mouseDown = findHook(stub, 'beforeOnCellMouseDown');
    const eventController = { row: false, column: false, cell: false };

    mouseDown(undefined, { row: 1, col: 1 }, undefined, eventController);

    expect(eventController.cell).toBe(false);
  });

  it('ref-picks (replaces) while ref selection is active', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();
    plugin.bindInlineEditor({
      isRefSelectionActive: () => true,
      getValue: () => '=SUM(',
      isFormula: () => true,
      getRefPreviewColor: () => 'var(--hfe-ref-1)',
    } as never);

    const mouseDown = findHook(stub, 'beforeOnCellMouseDown');
    const eventController = { row: false, column: false, cell: false };

    mouseDown(undefined, { row: 1, col: 1 }, undefined, eventController);

    expect(eventController.cell).toBe(true);

    document.dispatchEvent(new MouseEvent('mouseup'));
  });

  it('tracks selection only on formula cells', () => {
    const stub = makeFullHotStub();

    stub.hot.getCellMetaTransient = (_row, col) => ({ editor: col === 0 ? 'formula' : 'numeric' });

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const seen: Array<{ row: number; col: number }> = [];

    plugin.onSelection(selection => seen.push(selection));

    const selectionEnd = findHook(stub, 'afterSelectionEnd');

    stub.hot.getSelectedRangeLast = () => makeCellRangeStub({ row: 0, col: 1 });
    selectionEnd(0, 1, 0, 1);
    stub.hot.getSelectedRangeLast = () => makeCellRangeStub({ row: 1, col: 0 });
    selectionEnd(1, 0, 1, 0);

    expect(seen).toEqual([{ row: 1, col: 0 }]);
  });

  it('emits null for a header selection (negative anchor)', () => {
    const stub = makeFullHotStub();

    stub.hot.getCellMetaTransient = () => ({ editor: 'formula' });

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    findHook(stub, 'afterSelectionEnd')(-1, 2, 5, 2);

    expect(received[0]).toBeNull();
  });

  it('emits active + full range from afterSelectionEnd', () => {
    const stub = makeFullHotStub();

    stub.hot.getCellMetaTransient = () => ({ editor: 'formula' });
    stub.hot.getSelectedRangeLast = () => makeCellRangeStub({ row: 4, col: 2 });

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    findHook(stub, 'afterSelectionEnd')(4, 2, 1, 3);

    expect(received[0]).toEqual({
      active: { row: 4, col: 2 },
      range: { startRow: 1, startCol: 2, endRow: 4, endCol: 3 },
    });
  });

  it('clears the bar selection on afterDeselect and re-emits the next selection', () => {
    const stub = makeFullHotStub();

    stub.hot.getCellMetaTransient = () => ({ editor: 'formula' });
    stub.hot.getSelectedRangeLast = () => makeCellRangeStub({ row: 2, col: 1 });

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const received: unknown[] = [];
    const selectionEnd = findHook(stub, 'afterSelectionEnd');

    plugin.onFormulaCellSelection(selection => received.push(selection));
    selectionEnd(2, 1, 2, 1);
    findHook(stub, 'afterDeselect')();

    expect(received).toHaveLength(2);
    expect(received[1]).toBeNull();
    expect(plugin.getActiveFormulaCell()).toBeNull();

    selectionEnd(2, 1, 2, 1);

    expect(received).toHaveLength(3);
    expect(received[2]).toEqual({
      active: { row: 2, col: 1 },
      range: { startRow: 2, startCol: 1, endRow: 2, endCol: 1 },
    });
  });
});

describe('FormulaBuilder inline-edit plumbing', () => {
  it('onInlineEditStart fires with mount and seed when handleInlineEditStart is called', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const events: Array<{ mount: HTMLElement; seed: string }> = [];

    plugin.onInlineEditStart(({ mount, seed }) => events.push({ mount, seed }));

    const mountEl = document.createElement('div');

    plugin.handleInlineEditStart(mountEl, '=SUM(');

    expect(events).toHaveLength(1);
    expect(events[0]?.mount).toBe(mountEl);
    expect(events[0]?.seed).toBe('=SUM(');
  });

  it('bindInlineEditor sets the active editor', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const fakeEditor = { getValue: () => '=A1' } as never;

    plugin.bindInlineEditor(fakeEditor);

    expect(plugin.getActiveEditor()).toBe(fakeEditor);
  });

  it('bindInlineEditor(null) clears the active editor', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();
    plugin.bindInlineEditor({ getValue: () => '' } as never);
    plugin.bindInlineEditor(null);

    expect(plugin.getActiveEditor()).toBeNull();
  });

  it('handleInlineEditClose clears the active editor and notifies close listeners', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();
    plugin.bindInlineEditor({ getValue: () => '=B2' } as never);

    let closed = false;

    plugin.onEditorClose(() => {
      closed = true;
    });
    plugin.handleInlineEditClose();

    expect(plugin.getActiveEditor()).toBeNull();
    expect(closed).toBe(true);
  });

  it('creates a local FormulaEditor into the mount when no bar controller is subscribed', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const mountEl = document.createElement('div');

    plugin.handleInlineEditStart(mountEl, '=SUM(A1)');

    expect(mountEl.querySelector('.hfe-editor')).not.toBeNull();
    expect(plugin.getActiveEditor()).not.toBeNull();
  });
});

describe('FormulaBuilder API surface', () => {
  it('returns null active editor when disabled', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    expect(plugin.getActiveEditor()).toBeNull();
  });

  it('returns default selection { row: 0, col: 0 } initially', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    expect(plugin.getSelected()).toEqual({ row: 0, col: 0 });
  });

  it('notifies selection listeners on setSelected', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const seen: Array<{ row: number; col: number }> = [];

    plugin.onSelection(selection => seen.push(selection));
    plugin.setSelected(2, 3);

    expect(seen).toEqual([{ row: 2, col: 3 }]);
  });

  it('getRawCellText returns formula when present, otherwise serialized value', () => {
    const stub = makeFullHotStub();

    stub.engine.addSheet('Sheet1');
    stub.engine.setCellContents({ sheet: 0, row: 0, col: 0 }, [[42, '=A1+1']]);

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    expect(plugin.getRawCellText(0, 0)).toBe('42');
    expect(plugin.getRawCellText(0, 1)).toBe('=A1+1');
  });

  it('selects the first formula cell anywhere in the grid, not only row 0', () => {
    const stub = makeFullHotStub();

    stub.hot.countRows = () => 3;
    stub.hot.countCols = () => 3;
    stub.hot.getCellMetaTransient = (row, col) => ({
      editor: row === 2 && col === 1 ? 'formula' : 'numeric',
    });

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();
    plugin.selectFirstFormulaCell();

    expect(stub.hot.selectCell).toHaveBeenCalledWith(2, 1);
  });

  it('destroy removes attached hooks and tears down resources even without explicit disable', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();
    plugin.destroy();

    const removedHooks = stub.hot.removeHook.mock.calls.map(call => call[0]);

    expect(removedHooks).toEqual(
      expect.arrayContaining([
        'afterRenderer',
        'afterSelectionEnd',
        'beforeOnCellMouseDown',
        'beforeOnCellMouseOver',
      ]),
    );
  });
});

describe('FormulaBuilder directional commit', () => {
  /**
   * Builds an enabled plugin around a host editor whose `finishEditing` invokes its callback.
   *
   * @param {number[] | undefined} selected The `getSelectedLast` result.
   * @returns {object} The stub bundle, plugin, and `selectCell` spy.
   */
  function makeCommitContext(selected: number[] | undefined) {
    const stub = makeFullHotStub();
    const finishEditing = jest.fn((_restore?: boolean, _ctrl?: boolean, callback?: () => void) =>
      callback?.(),
    );
    const setValue = jest.fn();

    stub.hot.getActiveEditor = () => ({ setValue, finishEditing });
    stub.hot.getSelectedLast = () => selected;
    stub.hot.countRows = () => 5;
    stub.hot.countCols = () => 5;

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    return { stub, plugin, selectCell: stub.hot.selectCell };
  }

  it('does not move the selection when the last selection was a header', () => {
    const { plugin, selectCell } = makeCommitContext([-1, 0, -1, 0]);

    plugin.commitInlineEdit('=A1', 'down');

    expect(selectCell).not.toHaveBeenCalled();
  });

  it('skips hidden rows when committing downward', () => {
    const { stub, plugin, selectCell } = makeCommitContext([1, 0, 1, 0]);

    stub.hot.rowIndexMapper = {
      getRenderableFromVisualIndex: visual => (visual < 2 ? visual : visual - 1),
      getVisualFromRenderableIndex: renderable => (renderable < 2 ? renderable : renderable + 1),
      getRenderableIndexesLength: () => 4,
    };
    stub.hot.columnIndexMapper = {
      getRenderableFromVisualIndex: visual => visual,
      getVisualFromRenderableIndex: renderable => renderable,
      getRenderableIndexesLength: () => 5,
    };

    plugin.commitInlineEdit('=A1', 'down');

    expect(selectCell).toHaveBeenCalledWith(3, 0);
  });

  it('clamps at the grid edge without a mapper', () => {
    const { stub, plugin, selectCell } = makeCommitContext([4, 0, 4, 0]);

    stub.hot.rowIndexMapper = undefined;
    stub.hot.columnIndexMapper = undefined;

    plugin.commitInlineEdit('=A1', 'down');

    expect(selectCell).toHaveBeenCalledWith(4, 0);
  });
});

describe('FormulaBuilder theme tracking', () => {
  /**
   * Counts how many times a hook name was registered on the stub.
   *
   * @param {object} stub The stub bundle returned by `makeFullHotStub`.
   * @param {string} hookName The hook name to count.
   * @returns {number} The registration count.
   */
  function countHookRegistrations(
    stub: ReturnType<typeof makeFullHotStub>,
    hookName: string,
  ): number {
    return stub.hot.addHook.mock.calls.filter(call => call[0] === hookName).length;
  }

  it('re-initialises when the theme class changes', () => {
    const stub = makeFullHotStub();
    let theme: string | undefined = 'ht-theme-main';

    stub.hot.themeManager = { getClassName: () => theme };

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const before = countHookRegistrations(stub, 'afterRenderer');

    theme = 'ht-theme-horizon';
    findHook(stub, 'afterSetTheme')();

    expect(countHookRegistrations(stub, 'afterRenderer')).toBe(before + 1);
  });

  it('does not re-initialise when the theme class is unchanged', () => {
    const stub = makeFullHotStub();

    stub.hot.themeManager = { getClassName: () => 'ht-theme-main' };

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const before = countHookRegistrations(stub, 'afterRenderer');

    findHook(stub, 'afterSetTheme')();

    expect(countHookRegistrations(stub, 'afterRenderer')).toBe(before);
  });

  it('falls back to the string theme name when no themeManager exists', () => {
    const stub = makeFullHotStub();

    stub.hot.getCurrentThemeName = () => 'ht-theme-main-dark';

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const portals = document.querySelectorAll('.hfe-popup-portal');
    const portal = portals[portals.length - 1];

    expect(portal.classList.contains('ht-theme-main-dark')).toBe(true);

    plugin.disablePlugin();
  });

  it('re-initialises when the string theme name changes without a themeManager', () => {
    const stub = makeFullHotStub();
    let theme: string | null = 'ht-theme-main';

    stub.hot.getCurrentThemeName = () => theme;

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const before = countHookRegistrations(stub, 'afterRenderer');

    theme = 'ht-theme-main-dark';
    findHook(stub, 'afterSetTheme')();

    expect(countHookRegistrations(stub, 'afterRenderer')).toBe(before + 1);
  });
});

describe('FormulaBuilder event-manager lifecycle', () => {
  it('disposes the event manager on disable', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    expect(plugin.events).not.toBe(null);

    plugin.disablePlugin();

    expect(plugin.events).toBe(null);
  });
});

describe('FormulaBuilder perf-sensitive paths', () => {
  it('scans the rendered viewport before the full grid in selectFirstFormulaCell', () => {
    const stub = makeFullHotStub();
    const formulaEditorClass = () => getEditor('formula');
    const getCellMetaTransient = jest.fn((row: number, col: number) =>
      ({ editor: row === 105 && col === 3 ? formulaEditorClass() : undefined }));

    stub.hot.countRows = () => 100000;
    stub.hot.countCols = () => 50;
    stub.hot.getFirstRenderedVisibleRow = () => 100;
    stub.hot.getLastRenderedVisibleRow = () => 110;
    stub.hot.getFirstRenderedVisibleColumn = () => 0;
    stub.hot.getLastRenderedVisibleColumn = () => 10;
    stub.hot.getCellMetaTransient = getCellMetaTransient as never;

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();
    plugin.selectFirstFormulaCell();

    expect(stub.hot.selectCell).toHaveBeenCalledWith(105, 3);
    expect(getCellMetaTransient.mock.calls.length).toBeLessThan(1000);
  });

  it('caps the full-grid fallback scan when no formula cell exists', () => {
    const stub = makeFullHotStub();
    const getCellMetaTransient = jest.fn(() => ({}));

    stub.hot.countRows = () => 2000;
    stub.hot.countCols = () => 50;
    stub.hot.getFirstRenderedVisibleRow = () => 0;
    stub.hot.getLastRenderedVisibleRow = () => 10;
    stub.hot.getFirstRenderedVisibleColumn = () => 0;
    stub.hot.getLastRenderedVisibleColumn = () => 10;
    stub.hot.getCellMetaTransient = getCellMetaTransient as never;

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();
    plugin.selectFirstFormulaCell();

    expect(stub.hot.selectCell).not.toHaveBeenCalled();
    expect(getCellMetaTransient.mock.calls.length).toBeLessThanOrEqual(11000);
  });

  it('resolves the formulas plugin once per enable cycle, not per index-mapping call', () => {
    const stub = makeFullHotStub();
    const basePlugin = stub.hot.getPlugin;
    const getPluginSpy = jest.fn(basePlugin);

    stub.hot.getPlugin = getPluginSpy as never;

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    const formulasLookups = () =>
      getPluginSpy.mock.calls.filter(call => call[0] === 'formulas').length;
    const lookupsAfterEnable = formulasLookups();

    for (let step = 0; step < 20; step++) {
      plugin.adapter.stepCell({ sheet: '', row: 1, col: 1 }, 'down');
    }

    expect(formulasLookups()).toBe(lookupsAfterEnable);
  });
});

describe('FormulaBuilder resize re-anchor', () => {
  it('re-anchors the inline editor on afterColumnResize / afterRowResize during a session', () => {
    const stub = makeFullHotStub();
    const refreshDimensions = jest.fn();

    stub.hot.getActiveEditor = () => ({ refreshDimensions });

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();
    plugin.bindInlineEditor({ getValue: () => '=A1' } as never);

    findHook(stub, 'afterColumnResize')();
    findHook(stub, 'afterRowResize')();

    expect(refreshDimensions).toHaveBeenCalledTimes(2);
    expect(refreshDimensions).toHaveBeenCalledWith(true);
  });

  it('does nothing on resize hooks when no session is open', () => {
    const stub = makeFullHotStub();
    const refreshDimensions = jest.fn();

    stub.hot.getActiveEditor = () => ({ refreshDimensions });

    const plugin = new FormulaBuilder(stub.hot as never);

    plugin.enablePlugin();

    findHook(stub, 'afterColumnResize')();

    expect(refreshDimensions).not.toHaveBeenCalled();
  });
});
