import * as hfeCore from '@hfe/core';
import { HyperFormula } from 'hyperformula';
import type { HotInstance } from '../../../core/types';
import { registerAsRootInstance } from '../../../utils/rootInstance';
import { FormulaBuilder } from '../formulaBuilder';

/**
 * Builds an identity visual/HyperFormula axis syncer for the Formulas plugin fake.
 *
 * @returns {{ getHfIndexFromVisualIndex: Function, getVisualIndexFromHfIndex: Function }}
 */
function makeAxisSyncer() {
  return {
    getHfIndexFromVisualIndex: (visualIndex: number) => visualIndex,
    getVisualIndexFromHfIndex: (hfIndex: number) => hfIndex,
  };
}

/**
 * Builds a root-instance Handsontable stub with a mocked layout manager and the
 * given `formulaBuilder` setting.
 *
 * @param {unknown} formulaBuilderSetting The `formulaBuilder` settings value.
 * @returns {{ layoutManager: { register: jest.Mock, unregister: jest.Mock }, settings: Record<string, unknown>, hot: Record<string, unknown> }}
 */
function makeSlotHotStub(formulaBuilderSetting: unknown) {
  const engine = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
  const settings: Record<string, unknown> = { formulaBuilder: formulaBuilderSetting };
  const layoutManager = { register: jest.fn(), unregister: jest.fn() };
  const formulas = {
    enabled: true,
    engine,
    sheetId: 0,
    rowAxisSyncer: makeAxisSyncer(),
    columnAxisSyncer: makeAxisSyncer(),
  };
  const hot = {
    rootElement: document.createElement('div'),
    rootDocument: document,
    rootWindow: window,
    getSettings: () => settings,
    getPlugin: (name: string) => (name === 'formulas' ? formulas : undefined),
    getLayoutManager: () => layoutManager,
    updateSettings: jest.fn(),
    addHook: jest.fn(),
    removeHook: jest.fn(),
    getActiveEditor: jest.fn(),
    getCell: () => document.createElement('td'),
    getCoords: () => null,
    countRows: () => 0,
    countCols: () => 0,
    render: jest.fn(),
    getFirstRenderedVisibleRow: () => 0,
    getLastRenderedVisibleRow: () => 100,
    getFirstRenderedVisibleColumn: () => 0,
    getLastRenderedVisibleColumn: () => 100,
    setDataAtCell: jest.fn(),
    getCurrentThemeName: () => null,
    isRtl: () => false,
  };

  registerAsRootInstance(hot);

  return { layoutManager, settings, hot };
}

describe('FormulaBuilder plugin formula bar layout slot', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers a bar host in the top layout slot when showFormulaBar is true', () => {
    const stub = makeSlotHotStub({ builder: hfeCore, showFormulaBar: true });
    const plugin = new FormulaBuilder(stub.hot as unknown as HotInstance);

    plugin.enablePlugin();

    expect(stub.layoutManager.register).toHaveBeenCalledTimes(1);
    const call = stub.layoutManager.register.mock.calls[0];

    if (!call) {
      throw new Error('expected a register call');
    }

    const [key, element, options] = call;

    expect(key).toBe('formulaBuilder');
    expect(element).toBeInstanceOf(HTMLElement);
    expect(options).toEqual({ side: 'top', weight: 100 });
  });

  it('renders the core fx affordance inside the bar host', () => {
    const stub = makeSlotHotStub({ builder: hfeCore, showFormulaBar: true });
    const plugin = new FormulaBuilder(stub.hot as unknown as HotInstance);

    plugin.enablePlugin();

    const call = stub.layoutManager.register.mock.calls[0];

    if (!call) {
      throw new Error('expected a register call');
    }

    const host = call[1] as HTMLElement;
    const fxIcon = host.querySelector('.hfe-formula-bar__fx-icon');

    if (!fxIcon) {
      throw new Error('expected the core fx icon in the bar host');
    }

    expect(fxIcon.tagName.toLowerCase()).toBe('svg');
  });

  it('does not register a slot when showFormulaBar is false', () => {
    const stub = makeSlotHotStub({ builder: hfeCore, showFormulaBar: false });
    const plugin = new FormulaBuilder(stub.hot as unknown as HotInstance);

    plugin.enablePlugin();

    expect(stub.layoutManager.register).not.toHaveBeenCalled();
  });

  it('does not register a slot for the boolean shorthand setting', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const stub = makeSlotHotStub(true);
    const plugin = new FormulaBuilder(stub.hot as unknown as HotInstance);

    plugin.enablePlugin();

    expect(stub.layoutManager.register).not.toHaveBeenCalled();
  });

  it('unregisters the bar host on disable', () => {
    const stub = makeSlotHotStub({ builder: hfeCore, showFormulaBar: true });
    const plugin = new FormulaBuilder(stub.hot as unknown as HotInstance);

    plugin.enablePlugin();
    plugin.disablePlugin();

    expect(stub.layoutManager.unregister).toHaveBeenCalledWith('formulaBuilder', 'top');
  });

  it('does not unregister on disable when the bar was never shown', () => {
    const stub = makeSlotHotStub({ builder: hfeCore, showFormulaBar: false });
    const plugin = new FormulaBuilder(stub.hot as unknown as HotInstance);

    plugin.enablePlugin();
    plugin.disablePlugin();

    expect(stub.layoutManager.unregister).not.toHaveBeenCalled();
  });

  it('unregisters the bar host when enable fails after slot registration', () => {
    const stub = makeSlotHotStub({ builder: hfeCore, showFormulaBar: true });

    stub.hot.addHook = jest.fn((name: string) => {
      if (name === 'afterRenderer') {
        throw new Error('hook failure');
      }
    });
    const plugin = new FormulaBuilder(stub.hot as unknown as HotInstance);

    expect(() => plugin.enablePlugin()).toThrow('hook failure');
    expect(stub.layoutManager.unregister).toHaveBeenCalledWith('formulaBuilder', 'top');
  });

  it('does not reuse a stale bar host when re-enabled with showFormulaBar false', () => {
    const stub = makeSlotHotStub({ builder: hfeCore, showFormulaBar: true });
    const workingAddHook = stub.hot.addHook;

    stub.hot.addHook = jest.fn((name: string) => {
      if (name === 'afterRenderer') {
        throw new Error('hook failure');
      }
    });
    const plugin = new FormulaBuilder(stub.hot as unknown as HotInstance);

    expect(() => plugin.enablePlugin()).toThrow('hook failure');

    stub.hot.addHook = workingAddHook;
    stub.settings.formulaBuilder = { builder: hfeCore, showFormulaBar: false };
    plugin.enablePlugin();

    expect(stub.layoutManager.register).toHaveBeenCalledTimes(1);
    expect(stub.layoutManager.unregister).toHaveBeenCalledWith('formulaBuilder', 'top');
  });
});
