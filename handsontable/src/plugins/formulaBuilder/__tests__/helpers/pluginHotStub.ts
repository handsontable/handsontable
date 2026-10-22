import { HyperFormula } from 'hyperformula';
import type { HotInstance } from '../../../../core/types';
type CoreModule = typeof import('hyperformula-ui');
import { makeGridSelectionApiStub } from './stubs';
import type { GridSelectionApiStub } from './stubs';

/**
 * The index-mapper surface the plugin reads (directional commit, grid size).
 */
export interface PluginIndexMapperStub {
  getRenderableFromVisualIndex: (visualIndex: number) => number | null;
  getVisualFromRenderableIndex: (renderableIndex: number) => number | null;
  getRenderableIndexesLength: () => number;
  getNumberOfIndexes: () => number;
}

/**
 * An axis syncer of the Formulas plugin fake.
 */
export interface AxisSyncerStub {
  getHfIndexFromVisualIndex: (visualIndex: number) => number;
  getVisualIndexFromHfIndex: (hfIndex: number) => number;
}

/**
 * The Formulas plugin fake the plugin borrows the engine, the sheet, and the syncers from.
 * Every member is writable, so a test can disable it, drop the engine, or rebind the sheet.
 */
export interface FormulasStub {
  enabled: boolean;
  engine: HyperFormula | null;
  sheetId: number | null;
  rowAxisSyncer: AxisSyncerStub;
  columnAxisSyncer: AxisSyncerStub;
}

/**
 * The Handsontable members the plugin reads while enabling and while serving the
 * formula bar, the popups, and the raw-cell API.
 */
export interface PluginHotStubShape {
  rootElement: HTMLElement;
  rootDocument: Document;
  rootWindow: Window & typeof globalThis;
  isDestroyed: boolean;
  getSettings: () => Record<string, unknown>;
  getPlugin: (pluginName: string) => unknown;
  updateSettings: jest.Mock;
  addHook: jest.Mock;
  removeHook: jest.Mock;
  _registerTimeout: jest.Mock;
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
  getCellMetaTransient: jest.Mock<Record<string, unknown>, [number, number]>;
  selectCell: jest.Mock;
  selectCells: jest.Mock;
  getLayoutManager: () => { register: jest.Mock; unregister: jest.Mock };
  getCurrentThemeName: () => string | null;
  isRtl: () => boolean;
  themeManager?: { getClassName: () => string | undefined } | null;
  rowIndexMapper: PluginIndexMapperStub;
  columnIndexMapper: PluginIndexMapperStub;
  view: GridSelectionApiStub['view'];
  selection: GridSelectionApiStub['selection'];
  guid: GridSelectionApiStub['guid'];
  _createCellCoords: GridSelectionApiStub['_createCellCoords'];
  _createCellRange: GridSelectionApiStub['_createCellRange'];
}

/**
 * The bundle `makePluginHotStub` returns: the engine and the Formulas fake that exposes it, the
 * mutable settings bag, the layout manager mock, and the Handsontable stub.
 */
export interface PluginHotStubBundle {
  engine: HyperFormula;
  formulas: FormulasStub;
  settings: Record<string, unknown>;
  layoutManager: { register: jest.Mock; unregister: jest.Mock };
  hot: PluginHotStubShape;
  /**
   * The stub cast to the type the plugin constructor takes.
   */
  instance: HotInstance;
}

/**
 * Builds an identity visual/HyperFormula axis syncer.
 *
 * @returns {AxisSyncerStub}
 */
export function makeIdentitySyncer(): AxisSyncerStub {
  return {
    getHfIndexFromVisualIndex: (visualIndex: number) => visualIndex,
    getVisualIndexFromHfIndex: (hfIndex: number) => hfIndex,
  };
}

/**
 * Builds an identity index mapper over an axis of `length` indexes, none hidden.
 *
 * @param {number} length The index count.
 * @returns {PluginIndexMapperStub}
 */
export function makeIndexMapperStub(length = 0): PluginIndexMapperStub {
  return {
    getRenderableFromVisualIndex: visualIndex => visualIndex,
    getVisualFromRenderableIndex: renderableIndex => renderableIndex,
    getRenderableIndexesLength: () => length,
    getNumberOfIndexes: () => length,
  };
}

/**
 * Builds a Handsontable stub wired to a real HyperFormula engine through a fake,
 * enabled Formulas plugin with identity axis syncers, carrying the given
 * `formulaBuilder` settings on top of the injected `hyperformula-ui` module.
 *
 * @param {Record<string, unknown>} [pluginSettings] Extra `formulaBuilder` settings.
 * @param {Partial<PluginHotStubShape>} [overrides] Handsontable stub member overrides.
 * @returns {PluginHotStubBundle}
 */
export function makePluginHotStub(
  pluginSettings: Record<string, unknown> = {},
  overrides: Partial<PluginHotStubShape> = {},
): PluginHotStubBundle {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const core = require('hyperformula-ui') as CoreModule;
  const engine = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
  const formulas: FormulasStub = {
    enabled: true,
    engine,
    sheetId: 0,
    rowAxisSyncer: makeIdentitySyncer(),
    columnAxisSyncer: makeIdentitySyncer(),
  };
  const settings: Record<string, unknown> = {
    formulaBuilder: { builder: core, ...pluginSettings },
  };
  const layoutManager = { register: jest.fn(), unregister: jest.fn() };
  const hot: PluginHotStubShape = {
    rootElement: document.createElement('div'),
    rootDocument: document,
    rootWindow: window,
    isDestroyed: false,
    getSettings: () => settings,
    getPlugin: pluginName => (pluginName === 'formulas' ? formulas : undefined),
    updateSettings: jest.fn((next: Record<string, unknown>) => Object.assign(settings, next)),
    addHook: jest.fn(),
    removeHook: jest.fn(),
    _registerTimeout: jest.fn((callback: () => void, delay?: number) => setTimeout(callback, delay)),
    getActiveEditor: () => undefined,
    getCell: () => document.createElement('td'),
    getCoords: () => null,
    countRows: () => 0,
    countCols: () => 0,
    render: jest.fn(),
    getFirstRenderedVisibleRow: () => 0,
    getLastRenderedVisibleRow: () => 0,
    getFirstRenderedVisibleColumn: () => 0,
    getLastRenderedVisibleColumn: () => 0,
    getFirstFullyVisibleRow: () => -1,
    getLastFullyVisibleRow: () => -1,
    getFirstFullyVisibleColumn: () => -1,
    getLastFullyVisibleColumn: () => -1,
    getDataAtCell: () => null,
    setDataAtCell: jest.fn(),
    scrollViewportTo: jest.fn(() => true),
    getSelectedRangeLast: () => undefined,
    getSelectedLast: () => undefined,
    getCellMetaTransient: jest.fn(() => ({})),
    selectCell: jest.fn(),
    selectCells: jest.fn(),
    ...makeGridSelectionApiStub(),
    getLayoutManager: () => layoutManager,
    getCurrentThemeName: () => null,
    isRtl: () => false,
    rowIndexMapper: makeIndexMapperStub(),
    columnIndexMapper: makeIndexMapperStub(),
    ...overrides,
  };

  return { engine, formulas, settings, layoutManager, hot, instance: hot as unknown as HotInstance };
}

/**
 * Returns the last listener registered under a hook name on a stub's `addHook` mock.
 *
 * @param {{ addHook: jest.Mock }} hot The Handsontable stub.
 * @param {string} hookName The hook name.
 * @returns {Function}
 */
export function findHook(
  hot: { addHook: jest.Mock },
  hookName: string,
): (...args: any[]) => any { // eslint-disable-line @typescript-eslint/no-explicit-any
  const calls = hot.addHook.mock.calls.filter(entry => entry[0] === hookName);
  const call = calls[calls.length - 1];

  if (!call) {
    throw new Error(`hook ${hookName} not registered`);
  }

  return call[1];
}

/**
 * The Handsontable members the `formula` editor shim reads while it opens and closes.
 */
export interface EditorHotStubShape {
  rootDocument: Document;
  rootElement: HTMLElement;
  rootWindow: Window & typeof globalThis;
  getPlugin: (pluginName: string) => unknown;
  addHook: jest.Mock;
  removeHook: jest.Mock;
  _registerTimeout: jest.Mock;
  getShortcutManager: () => {
    setActiveContextName: jest.Mock;
    getContext: () => { addShortcuts: jest.Mock; removeShortcutsByGroup: jest.Mock };
  };
}

/**
 * Builds the Handsontable stub an editor shim instance is constructed with. The root element is
 * attached to the document, so focus moves into the editor are observable.
 *
 * @param {unknown} plugin What `getPlugin('formulaBuilder')` returns (`undefined` when unregistered).
 * @returns {EditorHotStubShape}
 */
export function makeEditorHotStub(plugin: unknown): EditorHotStubShape {
  const rootElement = document.createElement('div');
  const shortcutContext = { addShortcuts: jest.fn(), removeShortcutsByGroup: jest.fn() };

  document.body.appendChild(rootElement);

  return {
    rootDocument: document,
    rootElement,
    rootWindow: window,
    getPlugin: pluginName => (pluginName === 'formulaBuilder' ? plugin : undefined),
    addHook: jest.fn(),
    removeHook: jest.fn(),
    // Mirrors `Core#_registerTimeout`: a plain timeout, the next task at the earliest.
    _registerTimeout: jest.fn((callback: () => void, delay?: number) => setTimeout(callback, delay)),
    getShortcutManager: () => ({
      setActiveContextName: jest.fn(),
      getContext: () => shortcutContext,
    }),
  };
}
