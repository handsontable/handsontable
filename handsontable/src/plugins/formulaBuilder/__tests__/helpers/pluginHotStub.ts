import { HyperFormula } from 'hyperformula';
import type { HotInstance } from '../../../../core/types';
import type { CoreModule } from '../../types';
import { makeGridSelectionApiStub } from './stubs';

/**
 * The Handsontable members the plugin reads while enabling and while serving the
 * formula bar, the popups, and the raw-cell API.
 */
export interface PluginHotStubShape {
  rootElement: HTMLElement;
  rootDocument: Document;
  rootWindow: Window & typeof globalThis;
  getSettings: () => Record<string, unknown>;
  getPlugin: (pluginName: string) => unknown;
  updateSettings: jest.Mock;
  addHook: jest.Mock;
  removeHook: jest.Mock;
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
}

/**
 * The bundle `makePluginHotStub` returns: the engine the fake Formulas plugin
 * exposes, the mutable settings bag, and the Handsontable stub.
 */
export interface PluginHotStubBundle {
  engine: HyperFormula;
  settings: Record<string, unknown>;
  hot: PluginHotStubShape;
  /**
   * The stub cast to the type the plugin constructor takes.
   */
  instance: HotInstance;
}

/**
 * Builds a Handsontable stub wired to a real HyperFormula engine through a fake,
 * enabled Formulas plugin with identity axis syncers, carrying the given
 * `formulaBuilder` settings on top of the injected `hyperformula-ui` module.
 *
 * @param {Record<string, unknown>} [pluginSettings] Extra `formulaBuilder` settings.
 * @returns {PluginHotStubBundle}
 */
export function makePluginHotStub(pluginSettings: Record<string, unknown> = {}): PluginHotStubBundle {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const core = require('hyperformula-ui') as CoreModule;
  const engine = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
  const identitySyncer = {
    getHfIndexFromVisualIndex: (visualIndex: number) => visualIndex,
    getVisualIndexFromHfIndex: (hfIndex: number) => hfIndex,
  };
  const formulas = {
    enabled: true,
    engine,
    sheetId: 0,
    rowAxisSyncer: identitySyncer,
    columnAxisSyncer: identitySyncer,
  };
  const settings: Record<string, unknown> = {
    formulaBuilder: { builder: core, ...pluginSettings },
  };
  const layoutManager = { register: jest.fn(), unregister: jest.fn() };
  const hot: PluginHotStubShape = {
    rootElement: document.createElement('div'),
    rootDocument: document,
    rootWindow: window,
    getSettings: () => settings,
    getPlugin: pluginName => (pluginName === 'formulas' ? formulas : undefined),
    updateSettings: jest.fn((next: Record<string, unknown>) => Object.assign(settings, next)),
    addHook: jest.fn(),
    removeHook: jest.fn(),
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
  };

  return { engine, settings, hot, instance: hot as unknown as HotInstance };
}
