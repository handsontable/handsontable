import HyperFormula from 'hyperformula';
import Handsontable from '../../base';
import { Hooks } from '../../core/hooks';
import { registerPlugin } from '../registry';
import { Comments } from '../comments/comments';
import { Dialog } from '../dialog/dialog';
import { Formulas } from '../formulas/formulas';
import { Loading } from '../loading/loading';
import { SheetsBar } from '../sheetsBar/sheetsBar';

describe('Plugin hooks released on disable', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(Comments);
    registerPlugin(Dialog);
    registerPlugin(Formulas);
    registerPlugin(Loading);
    registerPlugin(SheetsBar);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Counts the callbacks registered on the instance for the given hook.
   *
   * @param {string} hookName The hook to count.
   * @returns {number} The number of callbacks.
   */
  function hookCount(hookName) {
    return Hooks.getSingleton().getBucket(hot).getHooks(hookName).length;
  }

  it.each([
    ['formulas', { formulas: { engine: HyperFormula } }, 'afterRowMove'],
    ['comments', { comments: true }, 'afterSetTheme'],
    ['loading', { loading: true }, 'afterDialogFocus'],
  ])('releases the hooks the %s plugin owns on disable and registers them again', (pluginKey, settings, hookName) => {
    hot = new Handsontable(container, {
      data: [['1', '2']],
      licenseKey: 'non-commercial-and-evaluation',
    });

    const before = hookCount(hookName);

    hot.updateSettings(settings);

    expect(hookCount(hookName)).toBeGreaterThan(before);

    hot.updateSettings({ [pluginKey]: false });

    expect(hookCount(hookName)).toBe(before);

    hot.updateSettings(settings);

    expect(hookCount(hookName)).toBeGreaterThan(before);
  });

  /**
   * Counts every callback registered on the instance and in the global bucket, across all registered hooks.
   *
   * @returns {number} The number of callbacks.
   */
  function totalHookCount() {
    const hooks = Hooks.getSingleton();
    const buckets = [hooks.getBucket(hot), hooks.getBucket()];

    return hooks.getRegistered().reduce((total, name) => {
      return total + buckets.reduce((sum, bucket) => sum + bucket.getHooks(name).length, 0);
    }, 0);
  }

  it.each([
    ['formulas', { formulas: { engine: HyperFormula } }, {}],
    ['comments', { comments: true }, {}],
    ['loading', { loading: true }, { dialog: true }],
    ['dialog', { dialog: true }, {}],
    ['sheetsBar', { sheetsBar: true }, {}],
  ])('releases every hook the %s plugin registered on disable', (pluginKey, settings, initialSettings) => {
    hot = new Handsontable(container, {
      ...initialSettings,
      data: [['1', '2']],
      licenseKey: 'non-commercial-and-evaluation',
    });

    const before = totalHookCount();

    hot.updateSettings(settings);

    const enabled = totalHookCount();

    expect(enabled).toBeGreaterThan(before);

    hot.updateSettings({ [pluginKey]: false });

    expect(totalHookCount()).toBe(before);

    hot.updateSettings(settings);

    expect(totalHookCount()).toBe(enabled);
  });
});
