import * as hfeCore from 'hyperformula-ui';
import { registerAsRootInstance } from '../../../utils/rootInstance';
import { FormulaBuilder } from '../formulaBuilder';
import { makePluginHotStub } from './helpers/pluginHotStub';

/**
 * Builds a root-instance Handsontable stub with a mocked layout manager and the
 * given `formulaBuilder` setting.
 *
 * @param {unknown} formulaBuilderSetting The `formulaBuilder` settings value.
 * @returns {ReturnType<typeof makePluginHotStub>}
 */
function makeSlotHotStub(formulaBuilderSetting: unknown) {
  const stub = makePluginHotStub();

  stub.settings.formulaBuilder = formulaBuilderSetting;
  registerAsRootInstance(stub.hot);

  return stub;
}

describe('FormulaBuilder plugin formula bar layout slot', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers a bar host in the top layout slot when showFormulaBar is true', () => {
    const stub = makeSlotHotStub({ builder: hfeCore, showFormulaBar: true });
    const plugin = new FormulaBuilder(stub.instance);

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
    const plugin = new FormulaBuilder(stub.instance);

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
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(stub.layoutManager.register).not.toHaveBeenCalled();
  });

  it('does not register a slot for the boolean shorthand setting', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const stub = makeSlotHotStub(true);
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    expect(stub.layoutManager.register).not.toHaveBeenCalled();
  });

  it('unregisters the bar host on disable', () => {
    const stub = makeSlotHotStub({ builder: hfeCore, showFormulaBar: true });
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    plugin.disablePlugin();

    expect(stub.layoutManager.unregister).toHaveBeenCalledWith('formulaBuilder', 'top');
  });

  it('does not unregister on disable when the bar was never shown', () => {
    const stub = makeSlotHotStub({ builder: hfeCore, showFormulaBar: false });
    const plugin = new FormulaBuilder(stub.instance);

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
    const plugin = new FormulaBuilder(stub.instance);

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
    const plugin = new FormulaBuilder(stub.instance);

    expect(() => plugin.enablePlugin()).toThrow('hook failure');

    stub.hot.addHook = workingAddHook;
    stub.settings.formulaBuilder = { builder: hfeCore, showFormulaBar: false };
    plugin.enablePlugin();

    expect(stub.layoutManager.register).toHaveBeenCalledTimes(1);
    expect(stub.layoutManager.unregister).toHaveBeenCalledWith('formulaBuilder', 'top');
  });
});
