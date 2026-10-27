import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Dialog } from '../../dialog/dialog';
import { Loading } from '../loading';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('Loading settings update', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(Dialog);
    registerPlugin(Loading);
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

  it('keeps a shown loading screen shown when the same `loading` value is sent again', () => {
    const hidden = jest.fn();

    hot = new Handsontable(container, {
      data: [['a']],
      loading: true,
      licenseKey: LICENSE_KEY,
    });
    const plugin = hot.getPlugin('loading');

    plugin.show();
    hot.addHook('afterLoadingHide', hidden);

    hot.updateSettings({ loading: true });

    expect(plugin.isVisible()).toBe(true);
    expect(hidden).not.toHaveBeenCalled();
  });

  it('applies changed `loading` options to a shown loading screen without hiding it', () => {
    const hidden = jest.fn();

    hot = new Handsontable(container, {
      data: [['a']],
      loading: true,
      licenseKey: LICENSE_KEY,
    });
    const plugin = hot.getPlugin('loading');

    plugin.show();
    hot.addHook('afterLoadingHide', hidden);

    hot.updateSettings({ loading: { title: 'Wait' } });

    expect(plugin.isVisible()).toBe(true);
    expect(hidden).not.toHaveBeenCalled();
    expect(hot.rootWrapperElement.querySelector('.ht-loading__title').textContent).toBe('Wait');
  });

  it('keeps a hidden loading screen hidden across a settings update', () => {
    hot = new Handsontable(container, {
      data: [['a']],
      loading: true,
      licenseKey: LICENSE_KEY,
    });
    const plugin = hot.getPlugin('loading');

    hot.updateSettings({ loading: { title: 'Wait' } });

    expect(plugin.isVisible()).toBe(false);
  });

  it('still hides a shown loading screen when the plugin is turned off', () => {
    const hidden = jest.fn();

    hot = new Handsontable(container, {
      data: [['a']],
      loading: true,
      afterLoadingHide: hidden,
      licenseKey: LICENSE_KEY,
    });
    const plugin = hot.getPlugin('loading');

    plugin.show();
    hot.updateSettings({ loading: false });

    expect(plugin.isVisible()).toBe(false);
    expect(hidden).toHaveBeenCalledTimes(1);
  });

  it('answers a dialog focus once however many times the settings were updated', () => {
    hot = new Handsontable(container, {
      data: [['a']],
      loading: true,
      licenseKey: LICENSE_KEY,
    });
    const focus = jest.spyOn(hot.getPlugin('dialog'), 'focus');

    hot.updateSettings({ loading: true });
    hot.updateSettings({ loading: { title: 'Wait' } });
    hot.updateSettings({ loading: true });
    focus.mockClear();

    hot.runHooks('afterDialogFocus');

    expect(focus).toHaveBeenCalledTimes(1);
  });
});
