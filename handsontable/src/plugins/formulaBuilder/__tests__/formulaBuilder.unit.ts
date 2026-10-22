import { HyperFormula } from 'hyperformula';
import { EDITOR_STATE } from '../../../editors/baseEditor';
import { getEditor, hasEditor } from '../../../editors/registry';
import { isImmediatePropagationStopped } from '../../../helpers/dom/event';
import { collection as staticRegisterCollection } from '../../../utils/staticRegister';
import { registerAsRootInstance } from '../../../utils/rootInstance';
import { FormulaBuilder } from '../formulaBuilder';
import { getFormulaBuilderAdapter } from '../handsontableAdapter';
import type { HandsontableAdapter } from '../handsontableAdapter';
import { REQUIRED_CORE_MEMBERS } from '../internalTypes';
type CoreModule = typeof import('hyperformula-ui');
import { findHook, makeIndexMapperStub, makePluginHotStub } from './helpers/pluginHotStub';

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('hyperformula-ui') as CoreModule;

const EDITING_CELL_CLASS = 'ht-formula-builder__editing-cell';

/**
 * Builds the shared plugin stub with a 101x101 rendered viewport.
 *
 * @param {object} pluginSettings Extra `formulaBuilder` settings merged over the `builder` key.
 * @returns {ReturnType<typeof makePluginHotStub>}
 */
function makeFullHotStub(pluginSettings: Record<string, unknown> = {}) {
  return makePluginHotStub(pluginSettings, {
    getLastRenderedVisibleRow: () => 100,
    getLastRenderedVisibleColumn: () => 100,
  });
}

/**
 * Returns the adapter of an enabled plugin.
 *
 * @param {FormulaBuilder} plugin The enabled plugin.
 * @returns {HandsontableAdapter}
 */
function adapterOf(plugin: FormulaBuilder): HandsontableAdapter {
  const adapter = getFormulaBuilderAdapter(plugin);

  if (!adapter) {
    throw new Error('the plugin has no adapter');
  }

  return adapter;
}

/**
 * Wraps the real `hyperformula-ui` module so every builder the plugin constructs and destroys is
 * recorded. The module is the plugin's injected collaborator, so spying on it does not mock
 * the unit under test.
 *
 * @returns {object} The module to inject, plus the constructed and destroyed builders.
 */
function makeSpiedCore() {
  const created: Array<{ options: Record<string, unknown>; instance: object }> = [];
  const destroyed: object[] = [];
  const RealFormulaBuilder = core.FormulaBuilder;

  class SpiedFormulaBuilder extends RealFormulaBuilder {
    constructor(options: ConstructorParameters<typeof RealFormulaBuilder>[0]) {
      super(options);
      created.push({ options: options as unknown as Record<string, unknown>, instance: this });
    }

    destroy(): void {
      destroyed.push(this);
      super.destroy();
    }
  }

  return { module: { ...core, FormulaBuilder: SpiedFormulaBuilder }, created, destroyed };
}

/**
 * Builds a host editor stub that records the calls the plugin makes on Handsontable's editor.
 *
 * @param {object} [overrides] Extra members.
 * @returns {object}
 */
function makeHostEditor(overrides: Record<string, unknown> = {}) {
  return {
    row: 0,
    col: 0,
    _hiddenByFormulaBar: false,
    refreshDimensions: jest.fn(),
    setValue: jest.fn(),
    finishEditing: jest.fn(),
    ...overrides,
  };
}

/**
 * Opens an inline edit session on an enabled plugin, mounting the formula editor into an
 * attached element with the given seed.
 *
 * @param {FormulaBuilder} plugin The enabled plugin.
 * @param {string} seed The editor content.
 * @returns {HTMLElement} The mount element.
 */
function openSession(plugin: FormulaBuilder, seed: string): HTMLElement {
  const mount = document.createElement('div');

  document.body.appendChild(mount);
  plugin.handleInlineEditStart(mount, seed);

  return mount;
}

afterEach(() => {
  document.body.replaceChildren();
});

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
    expect(FormulaBuilder.PLUGIN_PRIORITY).toBe(265);
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

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('`builder`'));
    expect(plugin.enabled).toBe(false);
  });

  it('warns once per grid while every settings update retries the enable', () => {
    const stub = makeFullHotStub();

    stub.settings.formulaBuilder = true;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    plugin.enablePlugin();
    plugin.enablePlugin();

    expect(warnSpy.mock.calls.filter(([message]) => String(message).includes('`builder`'))).toHaveLength(1);
  });

  it('warns and stays disabled when the formulas plugin is missing', () => {
    const stub = makeFullHotStub();

    stub.hot.getPlugin = () => undefined;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Formulas plugin'));
    expect(plugin.enabled).toBe(false);
  });

  it('warns and stays disabled when the formulas plugin has no engine', () => {
    const stub = makeFullHotStub();

    stub.formulas.engine = null;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Formulas plugin'));
    expect(plugin.enabled).toBe(false);
  });
});

it('registers the formula editor in the constructor, so it resolves even when enable fails', () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const stub = makeFullHotStub();

  // Undo the module-load registration, so only the constructor can restore the alias.
  staticRegisterCollection.get('editors')?.delete('formula');
  stub.settings.formulaBuilder = true;

  expect(hasEditor('formula')).toBe(false);

  const plugin = new FormulaBuilder(stub.instance);

  expect(hasEditor('formula')).toBe(true);

  plugin.enablePlugin();

  expect(plugin.enabled).toBe(false);
  expect(typeof getEditor('formula')).toBe('function');

  warnSpy.mockRestore();
});

it('parks the editor invisibly but focusable when its cell scrolls out of view', () => {
  const stub = makeFullHotStub();
  const plugin = new FormulaBuilder(stub.instance);

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
  const plugin = new FormulaBuilder(stub.instance);

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
  const plugin = new FormulaBuilder(stub.instance);

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

/**
 * Builds a stub whose master overlay exposes a real scroll holder element and whose active
 * editor records `refreshDimensions` calls, with `requestAnimationFrame` queued for the test.
 *
 * @returns {object} The stub bundle, holder element, `refreshDimensions` spy, and frame queue.
 */
function makeHotStubWithHolder() {
  const stub = makeFullHotStub();
  const holder = document.createElement('div');
  const hostEditor = makeHostEditor();
  const frames: FrameRequestCallback[] = [];

  stub.hot.view = {
    ...stub.hot.view,
    getOverlayByName: () => ({ holder, clone: null }),
    render: jest.fn(),
    _wt: { wtOverlays: { topOverlay: { mainTableScrollableElement: holder } } },
  } as typeof stub.hot.view;
  stub.hot.getActiveEditor = () => hostEditor;
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(callback);

    return frames.length;
  });

  const flushFrames = () => frames.splice(0).forEach(callback => callback(0));

  return { stub, holder, refreshDimensions: hostEditor.refreshDimensions, flushFrames, frames };
}

describe('FormulaBuilder inline scroll re-anchor', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('re-anchors the inline editor once per animation frame on holder scroll', () => {
    const { stub, holder, refreshDimensions, flushFrames, frames } = makeHotStubWithHolder();
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    openSession(plugin, '=A1');
    refreshDimensions.mockClear();
    // Drop the frames the formula editor itself queued while mounting.
    frames.splice(0);

    holder.dispatchEvent(new Event('scroll'));
    holder.dispatchEvent(new Event('scroll'));
    holder.dispatchEvent(new Event('scroll'));

    expect(refreshDimensions).not.toHaveBeenCalled();
    expect(frames).toHaveLength(1);

    flushFrames();

    expect(refreshDimensions.mock.calls).toEqual([[true]]);

    // A scroll in the next frame queues a new re-anchor.
    holder.dispatchEvent(new Event('scroll'));
    flushFrames();

    expect(refreshDimensions).toHaveBeenCalledTimes(2);
  });

  it('skips a queued re-anchor when the session closed before the frame', () => {
    const { stub, holder, refreshDimensions, flushFrames } = makeHotStubWithHolder();
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    openSession(plugin, '=A1');
    holder.dispatchEvent(new Event('scroll'));
    plugin.handleInlineEditClose();
    refreshDimensions.mockClear();
    flushFrames();

    expect(refreshDimensions).not.toHaveBeenCalled();
  });

  it('skips a queued re-anchor when the grid was destroyed before the frame', () => {
    const { stub, holder, refreshDimensions, flushFrames } = makeHotStubWithHolder();
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    openSession(plugin, '=A1');
    holder.dispatchEvent(new Event('scroll'));
    stub.hot.isDestroyed = true;
    refreshDimensions.mockClear();
    flushFrames();

    expect(refreshDimensions).not.toHaveBeenCalled();
  });

  it('stops listening to holder scroll once the inline editor closes', () => {
    const { stub, holder, refreshDimensions, frames } = makeHotStubWithHolder();
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    openSession(plugin, '=A1');
    plugin.handleInlineEditClose();
    refreshDimensions.mockClear();
    frames.splice(0);

    holder.dispatchEvent(new Event('scroll'));

    expect(frames).toHaveLength(0);
    expect(refreshDimensions).not.toHaveBeenCalled();
  });
});

describe('FormulaBuilder edited-cell mark', () => {
  it('marks the edited cell only while the inline editor is visible', () => {
    const stub = makeFullHotStub();
    const hostEditor = makeHostEditor({ row: 2, col: 0 });

    stub.hot.getActiveEditor = () => hostEditor;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    openSession(plugin, '=A1');

    const afterRenderer = findHook(stub.hot, 'afterRenderer');
    const visibleCell = document.createElement('td');

    afterRenderer(visibleCell, 2, 0, 0, null, {});

    expect(visibleCell.classList.contains(EDITING_CELL_CLASS)).toBe(true);

    hostEditor._hiddenByFormulaBar = true;

    const hiddenCell = document.createElement('td');

    afterRenderer(hiddenCell, 2, 0, 0, null, {});

    expect(hiddenCell.classList.contains(EDITING_CELL_CLASS)).toBe(false);
  });

  it.each([
    ['another row', 3, 0],
    ['another column', 2, 1],
  ])('does not mark a cell in %s', (_label, row, col) => {
    const stub = makeFullHotStub();
    const hostEditor = makeHostEditor({ row: 2, col: 0 });

    stub.hot.getActiveEditor = () => hostEditor;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    openSession(plugin, '=A1');

    const cell = document.createElement('td');

    findHook(stub.hot, 'afterRenderer')(cell, row, col, col, null, {});

    expect(cell.classList.contains(EDITING_CELL_CLASS)).toBe(false);
  });

  it('does not mark the host editor cell while no session is open', () => {
    const stub = makeFullHotStub();
    const hostEditor = makeHostEditor({ row: 2, col: 0 });

    stub.hot.getActiveEditor = () => hostEditor;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const cell = document.createElement('td');

    findHook(stub.hot, 'afterRenderer')(cell, 2, 0, 0, null, {});

    expect(cell.classList.contains(EDITING_CELL_CLASS)).toBe(false);
  });

  it('clears the edited-cell mark when the inline editor is hidden for the bar', () => {
    const stub = makeFullHotStub();
    const hostEditor = makeHostEditor();

    stub.hot.getActiveEditor = () => hostEditor;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const marked = document.createElement('td');

    marked.classList.add(EDITING_CELL_CLASS);
    stub.hot.rootElement.appendChild(marked);

    plugin.setInlineEditorVisible(false);

    expect(hostEditor._hiddenByFormulaBar).toBe(true);
    expect(hostEditor.refreshDimensions).toHaveBeenCalled();
    expect(marked.classList.contains(EDITING_CELL_CLASS)).toBe(false);
  });
});

it('does not touch global HOT settings on enable', () => {
  const stub = makeFullHotStub();
  const plugin = new FormulaBuilder(stub.instance);

  plugin.enablePlugin();

  expect(stub.hot.updateSettings).not.toHaveBeenCalled();
});

it('attaches hooks on enable and removes them on disable', () => {
  const stub = makeFullHotStub();
  const plugin = new FormulaBuilder(stub.instance);

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

it('registers the three cell mouse listeners at order index -1, both mouseover hooks with one listener', () => {
  const stub = makeFullHotStub();
  const plugin = new FormulaBuilder(stub.instance);

  plugin.enablePlugin();

  const callOf = (name: string) => stub.hot.addHook.mock.calls.find(call => call[0] === name);
  const mouseDown = callOf('beforeOnCellMouseDown');
  const mouseOver = callOf('beforeOnCellMouseOver');
  const mouseOverOutside = callOf('beforeOnCellMouseOverOutside');

  expect(mouseDown?.[2]).toBe(-1);
  expect(mouseOver?.[2]).toBe(-1);
  expect(mouseOverOutside?.[2]).toBe(-1);
  expect(mouseOverOutside?.[1]).toBe(mouseOver?.[1]);
});

it('lets column sorting proceed while no header pick is active', () => {
  const stub = makeFullHotStub();
  const plugin = new FormulaBuilder(stub.instance);

  plugin.enablePlugin();

  expect(findHook(stub.hot, 'beforeColumnSort')()).toBe(undefined);
});

it('blocks the column sort a header pick mousedown would cause, until the pick ends', () => {
  const stub = makeFullHotStub();

  stub.engine.addSheet('Sheet1');
  const plugin = new FormulaBuilder(stub.instance);

  plugin.enablePlugin();
  openSession(plugin, '=SUM(');

  const editor = plugin.getActiveEditor() as unknown as { isRefSelectionActive(): boolean };

  expect(editor.isRefSelectionActive()).toBe(true);

  const event = new MouseEvent('mousedown', { cancelable: true });

  findHook(stub.hot, 'beforeOnCellMouseDown')(event, { row: -1, col: 1 }, undefined, {
    row: false,
    column: false,
    cell: false,
  });

  expect(isImmediatePropagationStopped(event)).toBe(true);
  expect(findHook(stub.hot, 'beforeColumnSort')()).toBe(false);

  document.dispatchEvent(new MouseEvent('mouseup'));

  expect(findHook(stub.hot, 'beforeColumnSort')()).toBe(undefined);
});

/**
 * Builds the active selection layer the plugin reads through `getSelectedRangeActive()`.
 *
 * @param {{ row: number, col: number }} active The highlighted cell.
 * @param {{ row: number, col: number }} [from] The range start, the highlight by default.
 * @param {{ row: number, col: number }} [to] The range end, the highlight by default.
 * @returns {object}
 */
function makeCellRangeStub(
  active: { row: number; col: number },
  from: { row: number; col: number } = active,
  to: { row: number; col: number } = active,
) {
  return { from, to, highlight: active };
}

describe('FormulaBuilder eager adapter', () => {
  it('builds the adapter during enablePlugin so overlay hooks are ready before the first edit', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.instance);

    stub.hot.addHook.mockClear();
    plugin.enablePlugin();

    const hooksAfterEnable = stub.hot.addHook.mock.calls.map(call => call[0]);

    expect(hooksAfterEnable).toContain('afterViewRender');
    expect(hooksAfterEnable).toContain('afterGetColHeader');
    expect(hooksAfterEnable).toContain('afterGetRowHeader');

    expect(getFormulaBuilderAdapter(plugin)).not.toBeNull();

    plugin.disablePlugin();

    expect(getFormulaBuilderAdapter(plugin)).toBeNull();
  });
});

describe('FormulaBuilder formula bar host', () => {
  it('registers the bar host into the top layout slot on a root instance', () => {
    const stub = makeFullHotStub({ showFormulaBar: true });

    registerAsRootInstance(stub.hot);

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(stub.layoutManager.register).toHaveBeenCalledTimes(1);

    const [slotKey, barHost, slotOptions] = stub.layoutManager.register.mock.calls[0];

    expect(slotKey).toBe('formulaBuilder');
    expect(barHost.classList.contains('ht-formula-builder__formula-bar')).toBe(true);
    expect(slotOptions).toEqual({ side: 'top', weight: 100 });
  });

  it('skips the bar host on a non-root instance', () => {
    const stub = makeFullHotStub({ showFormulaBar: true });
    const plugin = new FormulaBuilder(stub.instance);

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

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const renderCell = findHook(stub.hot, 'afterRenderer');
    const formulaCell = document.createElement('td');
    const plainCell = document.createElement('td');

    renderCell(formulaCell, 0, 0, 0, null, { editor: 'formula' });
    renderCell(plainCell, 0, 1, 1, null, { editor: 'numeric' });

    expect(formulaCell.dataset.hfeError).toBe('#DIV/0!');
    expect(plainCell.dataset.hfeError).toBeUndefined();
  });

  it('does not ref-pick while a non-formula editor is open', () => {
    const stub = makeFullHotStub();

    stub.hot.getActiveEditor = () => ({ isOpened: () => true, row: 0 });

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const mouseDown = findHook(stub.hot, 'beforeOnCellMouseDown');
    const eventController = { row: false, column: false, cell: false };

    mouseDown(undefined, { row: 1, col: 1 }, undefined, eventController);

    expect(eventController.cell).toBe(false);
  });

  it('lets the native editor commit on a cell click when editing a formula with an inactive caret', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    openSession(plugin, '=SUM(A1:A10)');

    const editor = plugin.getActiveEditor() as unknown as {
      isFormula(): boolean;
      isRefSelectionActive(): boolean;
    };

    expect(editor.isFormula()).toBe(true);
    expect(editor.isRefSelectionActive()).toBe(false);

    const event = new MouseEvent('mousedown', { cancelable: true });
    const eventController = { row: false, column: false, cell: false };

    findHook(stub.hot, 'beforeOnCellMouseDown')(event, { row: 1, col: 1 }, undefined, eventController);

    expect(eventController.cell).toBe(false);
    expect(isImmediatePropagationStopped(event)).toBe(false);
  });

  it('lets the editor commit on a grid click when editing a non-formula value', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    openSession(plugin, '123');

    const event = new MouseEvent('mousedown', { cancelable: true });
    const eventController = { row: false, column: false, cell: false };

    findHook(stub.hot, 'beforeOnCellMouseDown')(event, { row: 1, col: 1 }, undefined, eventController);

    expect(eventController.cell).toBe(false);
    expect(isImmediatePropagationStopped(event)).toBe(false);
  });

  it('ref-picks (replaces) while ref selection is active and claims the mousedown', () => {
    const stub = makeFullHotStub();

    stub.engine.addSheet('Sheet1');
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    openSession(plugin, '=SUM(');

    const event = new MouseEvent('mousedown', { cancelable: true });
    const eventController = { row: false, column: false, cell: false };

    findHook(stub.hot, 'beforeOnCellMouseDown')(event, { row: 1, col: 1 }, undefined, eventController);

    expect(eventController).toEqual({ row: true, column: true, cell: true });
    expect(event.defaultPrevented).toBe(true);
    expect(isImmediatePropagationStopped(event)).toBe(true);

    document.dispatchEvent(new MouseEvent('mouseup'));
  });

  it('tracks the bar selection only on formula cells', () => {
    const stub = makeFullHotStub();

    stub.hot.getCellMetaTransient.mockImplementation((_row, col) => ({ editor: col === 0 ? 'formula' : 'numeric' }));

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const selectionEnd = findHook(stub.hot, 'afterSelectionEnd');

    stub.hot.getSelectedRangeActive = () => makeCellRangeStub({ row: 0, col: 1 });
    selectionEnd(0, 1, 0, 1);

    expect(plugin.getActiveFormulaCell()).toBeNull();

    stub.hot.getSelectedRangeActive = () => makeCellRangeStub({ row: 1, col: 0 });
    selectionEnd(1, 0, 1, 0);

    expect(plugin.getActiveFormulaCell()).toEqual({ row: 1, col: 0 });
  });

  it('shows the highlighted formula cell of a header selection, with the range clamped to cells', () => {
    const stub = makeFullHotStub();

    stub.hot.getCellMetaTransient.mockImplementation(() => ({ editor: 'formula' }));
    stub.hot.getSelectedRangeActive = () =>
      makeCellRangeStub({ row: 0, col: 2 }, { row: -1, col: 2 }, { row: 5, col: 2 });

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    findHook(stub.hot, 'afterSelectionEnd')(-1, 2, 5, 2);

    expect(received[0]).toEqual({
      active: { row: 0, col: 2 },
      range: { startRow: 0, startCol: 2, endRow: 5, endCol: 2 },
    });
  });

  it('emits null when the highlight is on a header', () => {
    const stub = makeFullHotStub();

    stub.hot.getCellMetaTransient.mockImplementation(() => ({ editor: 'formula' }));
    stub.hot.getSelectedRangeActive = () => makeCellRangeStub({ row: -1, col: 2 });

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    findHook(stub.hot, 'afterSelectionEnd')(-1, 2, -1, 2);

    expect(received).toEqual([null]);
    expect(plugin.getActiveFormulaCell()).toBeNull();
  });

  it('emits active + full range from afterSelectionEnd', () => {
    const stub = makeFullHotStub();

    stub.hot.getCellMetaTransient.mockImplementation(() => ({ editor: 'formula' }));
    stub.hot.getSelectedRangeActive = () =>
      makeCellRangeStub({ row: 4, col: 2 }, { row: 4, col: 2 }, { row: 1, col: 3 });

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    findHook(stub.hot, 'afterSelectionEnd')(4, 2, 1, 3);

    expect(received[0]).toEqual({
      active: { row: 4, col: 2 },
      range: { startRow: 1, startCol: 2, endRow: 4, endCol: 3 },
    });
  });

  it('clears the bar selection on afterDeselect and re-emits the next selection', () => {
    const stub = makeFullHotStub();

    stub.hot.getCellMetaTransient.mockImplementation(() => ({ editor: 'formula' }));
    stub.hot.getSelectedRangeActive = () => makeCellRangeStub({ row: 2, col: 1 });

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const received: unknown[] = [];
    const selectionEnd = findHook(stub.hot, 'afterSelectionEnd');

    plugin.onFormulaCellSelection(selection => received.push(selection));
    selectionEnd(2, 1, 2, 1);
    findHook(stub.hot, 'afterDeselect')();

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
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const events: Array<{ mount: HTMLElement; seed: string }> = [];

    plugin.onInlineEditStart(({ mount, seed }) => events.push({ mount, seed }));

    const mountEl = document.createElement('div');

    plugin.handleInlineEditStart(mountEl, '=SUM(');

    expect(events).toHaveLength(1);
    expect(events[0]?.mount).toBe(mountEl);
    expect(events[0]?.seed).toBe('=SUM(');
  });

  it('handleInlineEditClose clears the active editor and notifies close listeners', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    openSession(plugin, '=B2');

    expect(plugin.getActiveEditor()).not.toBeNull();

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
    const plugin = new FormulaBuilder(stub.instance);

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
    const plugin = new FormulaBuilder(stub.instance);

    expect(plugin.getActiveEditor()).toBeNull();
  });

  it('getRawCellText returns formula when present, otherwise serialized value', () => {
    const stub = makeFullHotStub();

    stub.engine.addSheet('Sheet1');
    stub.engine.setCellContents({ sheet: 0, row: 0, col: 0 }, [[42, '=A1+1']]);

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(plugin.getRawCellText(0, 0)).toBe('42');
    expect(plugin.getRawCellText(0, 1)).toBe('=A1+1');
  });

  it('selects the first formula cell anywhere in the grid, not only row 0', () => {
    const stub = makeFullHotStub();

    stub.hot.countRows = () => 3;
    stub.hot.countCols = () => 3;
    stub.hot.getCellMetaTransient.mockImplementation((row, col) => ({
      editor: row === 2 && col === 1 ? 'formula' : 'numeric',
    }));

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    plugin.selectFirstFormulaCell();

    expect(stub.hot.selectCell).toHaveBeenCalledWith(2, 1);
  });

  it('destroy removes attached hooks and tears down resources even without explicit disable', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.instance);

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

describe('FormulaBuilder document and popup parent', () => {
  it('builds the editor in the grid\'s document, with the popups in the document body', () => {
    const spied = makeSpiedCore();
    const stub = makeFullHotStub({ builder: spied.module });
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(spied.created[0]?.options.rootDocument).toBe(stub.hot.rootDocument);
    expect(spied.created[0]?.options.portalParent).toBeUndefined();
  });

  it('keeps the popups in the grid\'s shadow root', () => {
    const spied = makeSpiedCore();
    const stub = makeFullHotStub({ builder: spied.module });
    const shadowHost = document.createElement('div');
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    document.body.appendChild(shadowHost);
    shadowRoot.appendChild(stub.hot.rootElement);

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(spied.created[0]?.options.portalParent).toBe(shadowRoot);
    expect(shadowRoot.querySelector('.hfe-popup-portal')).not.toBeNull();
  });
});

describe('FormulaBuilder theme tracking', () => {
  it('rebuilds the builder (not the plugin) when the theme class changes', () => {
    const spied = makeSpiedCore();
    const stub = makeFullHotStub({ builder: spied.module });
    let theme: string | undefined = 'ht-theme-main';

    stub.hot.themeManager = { getClassName: () => theme };

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const hookRegistrations = stub.hot.addHook.mock.calls.length;

    theme = 'ht-theme-horizon';
    findHook(stub.hot, 'afterSetTheme')();

    expect(spied.created.map(entry => entry.options.className))
      .toEqual(['ht-theme-main', 'ht-theme-horizon']);
    expect(spied.destroyed).toEqual([spied.created[0].instance]);
    expect(stub.hot.addHook.mock.calls).toHaveLength(hookRegistrations);
    expect(plugin.enabled).toBe(true);
  });

  it('keeps the builder when the theme class is unchanged', () => {
    const spied = makeSpiedCore();
    const stub = makeFullHotStub({ builder: spied.module });

    stub.hot.themeManager = { getClassName: () => 'ht-theme-main' };

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    findHook(stub.hot, 'afterSetTheme')();

    expect(spied.created).toHaveLength(1);
    expect(spied.destroyed).toHaveLength(0);
  });

  it('falls back to the string theme name when no themeManager exists', () => {
    const stub = makeFullHotStub();

    stub.hot.getCurrentThemeName = () => 'ht-theme-main-dark';

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const portals = document.querySelectorAll('.hfe-popup-portal');
    const portal = portals[portals.length - 1];

    expect(portal.classList.contains('ht-theme-main-dark')).toBe(true);

    plugin.disablePlugin();
  });

  it('rebuilds the builder when the string theme name changes without a themeManager', () => {
    const spied = makeSpiedCore();
    const stub = makeFullHotStub({ builder: spied.module });
    let theme: string | null = 'ht-theme-main';

    stub.hot.getCurrentThemeName = () => theme;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    theme = 'ht-theme-main-dark';
    findHook(stub.hot, 'afterSetTheme')();

    expect(spied.created.map(entry => entry.options.className))
      .toEqual(['ht-theme-main', 'ht-theme-main-dark']);
  });

  it('cancels an open edit before destroying the old builder', () => {
    const spied = makeSpiedCore();
    const stub = makeFullHotStub({ builder: spied.module });
    const order: string[] = [];
    const hostEditor = makeHostEditor({
      finishEditing: jest.fn((restore?: boolean) => order.push(`finishEditing(${restore})`)),
    });
    let theme = 'ht-theme-main';

    stub.hot.getActiveEditor = () => hostEditor;
    stub.hot.getCurrentThemeName = () => theme;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    openSession(plugin, '=A1');

    const firstBuilder = spied.created[0].instance as { destroy(): void };
    const realDestroy = firstBuilder.destroy.bind(firstBuilder);

    firstBuilder.destroy = () => {
      order.push('destroy');
      realDestroy();
    };
    theme = 'ht-theme-horizon';
    findHook(stub.hot, 'afterSetTheme')();

    expect(order).toEqual(['finishEditing(true)', 'destroy']);
  });
});

describe('FormulaBuilder engine sheet binding', () => {
  /**
   * Builds an enabled plugin over an engine with two sheets, bound to sheet 0.
   *
   * @returns {object} The stub bundle and the spied module records.
   */
  function makeTwoSheetPlugin() {
    const spied = makeSpiedCore();
    const stub = makeFullHotStub({ builder: spied.module });

    stub.engine.addSheet('First');
    stub.engine.addSheet('Second');

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    return { stub, spied };
  }

  it.each(['afterLoadData', 'afterUpdateData'])(
    'rebuilds the builder with the new sheet id when %s binds another sheet',
    (hookName) => {
      const { stub, spied } = makeTwoSheetPlugin();

      stub.formulas.sheetId = 1;
      findHook(stub.hot, hookName)();

      expect(spied.created.map(entry => entry.options.sheetId)).toEqual([0, 1]);
      expect(spied.destroyed).toEqual([spied.created[0].instance]);
    },
  );

  it.each(['afterLoadData', 'afterUpdateData'])(
    'keeps the builder when %s leaves the grid on the same sheet',
    (hookName) => {
      const { stub, spied } = makeTwoSheetPlugin();

      findHook(stub.hot, hookName)();

      expect(spied.created).toHaveLength(1);
      expect(spied.destroyed).toHaveLength(0);
    },
  );

  it('builds against sheet 0 before Formulas binds a sheet and keeps it when the load binds 0', () => {
    const spied = makeSpiedCore();
    const stub = makeFullHotStub({ builder: spied.module });

    stub.formulas.sheetId = null;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    stub.formulas.sheetId = 0;
    findHook(stub.hot, 'afterLoadData')();

    expect(spied.created.map(entry => entry.options.sheetId)).toEqual([0]);
  });
});

describe('FormulaBuilder.updatePlugin', () => {
  /**
   * Builds an enabled plugin with an open edit session over the spied module.
   *
   * @param {object} pluginSettings The initial `formulaBuilder` settings (without `builder`).
   * @returns {object} The stub bundle, spied module, plugin, and host editor.
   */
  function makeEditingPlugin(pluginSettings: Record<string, unknown> = {}) {
    const spied = makeSpiedCore();
    const stub = makeFullHotStub({ builder: spied.module, ...pluginSettings });
    const hostEditor = makeHostEditor();

    stub.hot.getActiveEditor = () => hostEditor;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    openSession(plugin, '=A1');

    return { stub, spied, plugin, hostEditor };
  }

  /**
   * Replaces the `formulaBuilder` settings with a fresh object and runs `updatePlugin()`.
   *
   * @param {object} bundle The `makeEditingPlugin` result.
   * @param {object} next The next settings (the current `builder` unless given).
   */
  function update(bundle: ReturnType<typeof makeEditingPlugin>, next: Record<string, unknown>): void {
    bundle.stub.settings.formulaBuilder = { builder: bundle.spied.module, ...next };
    bundle.plugin.updatePlugin();
  }

  it('keeps the builder and the open edit when a re-render re-sends equal settings', () => {
    const container = document.createElement('div');
    const popups = () => ({ showClose: true, suggestions: { container, showKeyboardHelp: false } });
    const bundle = makeEditingPlugin({ showFormulaBar: false, direction: 'ltr', popups: popups() });
    const activeEditor = bundle.plugin.getActiveEditor();

    update(bundle, { showFormulaBar: false, direction: 'ltr', popups: popups() });

    expect(bundle.spied.created).toHaveLength(1);
    expect(bundle.spied.destroyed).toHaveLength(0);
    expect(bundle.hostEditor.finishEditing).not.toHaveBeenCalled();
    expect(bundle.plugin.getActiveEditor()).toBe(activeEditor);
    expect(bundle.plugin.enabled).toBe(true);
  });

  it.each([
    ['the builder module', () => ({ builder: makeSpiedCore().module })],
    ['showFormulaBar', () => ({ showFormulaBar: true })],
    ['direction', () => ({ direction: 'rtl' })],
    ['a popups value', () => ({ popups: { showClose: false } })],
    ['the popups key set', () => ({ popups: { showClose: true, fnHelp: {} } })],
    ['the popup container element', () => ({
      popups: { showClose: true, suggestions: { container: document.createElement('div') } },
    })],
  ])('rebuilds when %s changes, cancelling the open edit first', (_label, makeChange) => {
    const container = document.createElement('div');
    const bundle = makeEditingPlugin({ popups: { showClose: true, suggestions: { container } } });

    update(bundle, { popups: { showClose: true, suggestions: { container } }, ...makeChange() });

    expect(bundle.hostEditor.finishEditing).toHaveBeenCalledWith(true);
    expect(bundle.spied.destroyed).toContain(bundle.spied.created[0].instance);
    expect(bundle.plugin.enabled).toBe(true);
  });

  it('rebuilds when the Formulas plugin hands over another engine', () => {
    const bundle = makeEditingPlugin();
    const nextEngine = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    bundle.stub.formulas.engine = nextEngine;
    update(bundle, {});

    expect(bundle.spied.created).toHaveLength(2);
    expect(bundle.spied.created[1].options.hyperformula).toBe(nextEngine);
  });
});

describe('FormulaBuilder settings validation', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it.each(REQUIRED_CORE_MEMBERS.map(name => [name]))(
    'warns naming `%s` and stays disabled when the builder module lacks it',
    (missing) => {
      const { [missing]: _dropped, ...incomplete } = core as unknown as Record<string, unknown>;
      const stub = makeFullHotStub({ builder: incomplete });
      const plugin = new FormulaBuilder(stub.instance);

      plugin.enablePlugin();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain(`It is missing \`${missing}\`.`);
      expect(plugin.enabled).toBe(false);
      expect(getFormulaBuilderAdapter(plugin)).toBeNull();
    },
  );

  it('names every missing member in one warning', () => {
    const { formatRef: _formatRef, stepCell: _stepCell, ...incomplete } =
      core as unknown as Record<string, unknown>;
    const stub = makeFullHotStub({ builder: incomplete });
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(warnSpy.mock.calls[0][0]).toContain('It is missing `formatRef`, `stepCell`.');
  });

  it('treats a member that is not a function as missing', () => {
    const stub = makeFullHotStub({ builder: { ...core, normalizeRange: 'not a function' } });
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(warnSpy.mock.calls[0][0]).toContain('It is missing `normalizeRange`.');
    expect(plugin.enabled).toBe(false);
  });

  it('warns and does not show the bar for a non-boolean showFormulaBar', () => {
    const stub = makeFullHotStub({ showFormulaBar: 'yes' });

    registerAsRootInstance(stub.hot);

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('`showFormulaBar`'));
    expect(stub.layoutManager.register).not.toHaveBeenCalled();
    expect(plugin.enabled).toBe(true);
  });

  it.each([
    [false, 'ltr'],
    [true, 'rtl'],
  ])('warns for an invalid direction and falls back to the grid direction (isRtl: %p)', (isRtl, expected) => {
    const spied = makeSpiedCore();
    const stub = makeFullHotStub({ builder: spied.module, direction: 'up' });

    stub.hot.isRtl = () => isRtl;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('`direction`'));
    expect(spied.created[0].options.direction).toBe(expected);
  });

  it('passes a valid direction through without a warning', () => {
    const spied = makeSpiedCore();
    const stub = makeFullHotStub({ builder: spied.module, direction: 'rtl' });
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(warnSpy).not.toHaveBeenCalled();
    expect(spied.created[0].options.direction).toBe('rtl');
  });
});

describe('FormulaBuilder afterRenderer', () => {
  /**
   * Builds an enabled plugin over an engine whose A1 holds a `#DIV/0!` error and B1 a number.
   *
   * @returns {object} The stub bundle and the afterRenderer listener.
   */
  function makeRenderContext() {
    const stub = makeFullHotStub();

    stub.engine.addSheet('Sheet1');
    stub.engine.setCellContents({ sheet: 0, row: 0, col: 0 }, [['=1/0', 5]]);
    stub.settings.ariaTags = true;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    return { stub, afterRenderer: findHook(stub.hot, 'afterRenderer') };
  }

  /**
   * Builds a cell element carrying a stale error mark from a previous paint.
   *
   * @returns {HTMLTableCellElement}
   */
  function makeStaleErrorCell(): HTMLTableCellElement {
    const cell = document.createElement('td');

    cell.setAttribute('data-hfe-error', '#REF!');
    cell.setAttribute('aria-invalid', 'true');

    return cell;
  }

  it('reads the editor from the cellProperties argument, not from the cell meta', () => {
    const { stub, afterRenderer } = makeRenderContext();
    const cell = document.createElement('td');

    stub.hot.getCellMetaTransient.mockClear();
    stub.hot.getCellMetaTransient.mockImplementation(() => ({ editor: 'text' }));
    afterRenderer(cell, 0, 0, 0, null, { editor: 'formula' });

    expect(cell.getAttribute('data-hfe-error')).toBe('#DIV/0!');
    expect(stub.hot.getCellMetaTransient).not.toHaveBeenCalled();
  });

  it('accepts the registered formula editor class as well as the alias', () => {
    const { afterRenderer } = makeRenderContext();
    const cell = document.createElement('td');

    afterRenderer(cell, 0, 0, 0, null, { editor: getEditor('formula') });

    expect(cell.hasAttribute('data-hfe-error')).toBe(true);
  });

  it('clears a stale error mark from a recycled cell that is no longer a formula cell', () => {
    const { afterRenderer } = makeRenderContext();
    const cell = makeStaleErrorCell();

    afterRenderer(cell, 0, 1, 1, 5, { editor: 'numeric' });

    expect(cell.hasAttribute('data-hfe-error')).toBe(false);
    expect(cell.hasAttribute('aria-invalid')).toBe(false);
  });

  it('clears the mark of a formula cell whose value is no longer an error', () => {
    const { afterRenderer } = makeRenderContext();
    const cell = makeStaleErrorCell();

    afterRenderer(cell, 0, 1, 1, 5, { editor: 'formula' });

    expect(cell.hasAttribute('data-hfe-error')).toBe(false);
  });

  it.each([
    ['a column header row', -1, 0],
    ['a row header column', 0, -1],
  ])('neither reads the engine nor marks %s', (_label, row, col) => {
    const { stub, afterRenderer } = makeRenderContext();
    const getCellValue = jest.spyOn(stub.engine, 'getCellValue');
    const cell = document.createElement('td');

    afterRenderer(cell, row, col, col, null, { editor: 'formula' });

    expect(getCellValue).not.toHaveBeenCalled();
    expect(cell.hasAttribute('data-hfe-error')).toBe(false);
  });

  it('marks a formula cell at row 0 and column 0', () => {
    const { afterRenderer } = makeRenderContext();
    const cell = document.createElement('td');

    afterRenderer(cell, 0, 0, 0, null, { editor: 'formula' });

    expect(cell.hasAttribute('data-hfe-error')).toBe(true);
  });

  it.each(['row', 'column'])(
    'clears a stale mark without reading the engine when the %s has no HyperFormula index',
    (axis) => {
      const { stub, afterRenderer } = makeRenderContext();
      const unresolvable = { getHfIndexFromVisualIndex: () => -1, getVisualIndexFromHfIndex: () => -1 };

      if (axis === 'row') {
        stub.formulas.rowAxisSyncer = unresolvable;
      } else {
        stub.formulas.columnAxisSyncer = unresolvable;
      }

      const getCellValue = jest.spyOn(stub.engine, 'getCellValue');
      const cell = makeStaleErrorCell();

      afterRenderer(cell, 0, 0, 0, null, { editor: 'formula' });

      expect(getCellValue).not.toHaveBeenCalled();
      expect(cell.hasAttribute('data-hfe-error')).toBe(false);
    },
  );

  it('keeps aria-invalid on an error cell under ariaTags and removes it without', () => {
    const { stub, afterRenderer } = makeRenderContext();
    const withAria = document.createElement('td');

    afterRenderer(withAria, 0, 0, 0, null, { editor: 'formula' });

    expect(withAria.getAttribute('aria-invalid')).toBe('true');

    stub.settings.ariaTags = false;

    const withoutAria = document.createElement('td');

    afterRenderer(withoutAria, 0, 0, 0, null, { editor: 'formula' });

    expect(withoutAria.hasAttribute('data-hfe-error')).toBe(true);
    expect(withoutAria.hasAttribute('aria-invalid')).toBe(false);
  });

  it('describes an error cell with its message under ariaTags, and only then', () => {
    const { stub, afterRenderer } = makeRenderContext();
    const withAria = document.createElement('td');

    afterRenderer(withAria, 0, 0, 0, null, { editor: 'formula' });

    expect(withAria.getAttribute('aria-description')).toBe(withAria.getAttribute('data-hfe-error'));
    expect(withAria.getAttribute('aria-description')).toContain('#');

    stub.settings.ariaTags = false;

    const withoutAria = document.createElement('td');

    afterRenderer(withoutAria, 0, 0, 0, null, { editor: 'formula' });

    expect(withoutAria.hasAttribute('aria-description')).toBe(false);
  });

  it('removes its description from a recycled cell, and leaves an application\'s own alone', () => {
    const { afterRenderer } = makeRenderContext();
    const recycled = document.createElement('td');
    const appDescribed = document.createElement('td');

    afterRenderer(recycled, 0, 0, 0, null, { editor: 'formula' });
    afterRenderer(recycled, 0, 1, 1, null, { editor: 'text' });

    expect(recycled.hasAttribute('aria-description')).toBe(false);

    appDescribed.setAttribute('aria-description', 'Total of the quarter');
    afterRenderer(appDescribed, 0, 1, 1, null, { editor: 'text' });

    expect(appDescribed.getAttribute('aria-description')).toBe('Total of the quarter');
  });
});

describe('FormulaBuilder.disablePlugin', () => {
  it('disables the base plugin before tearing down an open edit', () => {
    const stub = makeFullHotStub();
    const plugin = new FormulaBuilder(stub.instance);
    const states: Array<{ enabled: boolean; rendererRemoved: boolean }> = [];
    const hostEditor = makeHostEditor({
      finishEditing: jest.fn(() => states.push({
        enabled: plugin.enabled,
        rendererRemoved: stub.hot.removeHook.mock.calls.some(call => call[0] === 'afterRenderer'),
      })),
    });

    stub.hot.getActiveEditor = () => hostEditor;
    plugin.enablePlugin();
    openSession(plugin, '=A1');
    plugin.disablePlugin();

    expect(states).toEqual([{ enabled: false, rendererRemoved: true }]);
    expect(hostEditor.finishEditing).toHaveBeenCalledWith(true);
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

    const plugin = new FormulaBuilder(stub.instance);

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

    const plugin = new FormulaBuilder(stub.instance);

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

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const formulasLookups = () =>
      getPluginSpy.mock.calls.filter(call => call[0] === 'formulas').length;
    const lookupsAfterEnable = formulasLookups();

    for (let step = 0; step < 20; step++) {
      adapterOf(plugin).stepCell({ sheet: '', row: 1, col: 1 }, 'down');
    }

    expect(formulasLookups()).toBe(lookupsAfterEnable);
  });
});

describe('FormulaBuilder resize re-anchor', () => {
  it('re-anchors the inline editor on afterColumnResize / afterRowResize during a session', () => {
    const stub = makeFullHotStub();
    const hostEditor = makeHostEditor();
    const { refreshDimensions } = hostEditor;

    stub.hot.getActiveEditor = () => hostEditor;

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    openSession(plugin, '=A1');
    refreshDimensions.mockClear();

    findHook(stub.hot, 'afterColumnResize')();
    findHook(stub.hot, 'afterRowResize')();

    expect(refreshDimensions).toHaveBeenCalledTimes(2);
    expect(refreshDimensions).toHaveBeenCalledWith(true);
  });

  it('does nothing on resize hooks when no session is open', () => {
    const stub = makeFullHotStub();
    const refreshDimensions = jest.fn();

    stub.hot.getActiveEditor = () => ({ refreshDimensions });

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    findHook(stub.hot, 'afterColumnResize')();

    expect(refreshDimensions).not.toHaveBeenCalled();
  });
});
