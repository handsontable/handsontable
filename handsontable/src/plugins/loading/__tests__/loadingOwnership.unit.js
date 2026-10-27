import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Dialog } from '../../dialog/dialog';
import { Loading } from '../loading';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('Loading and a dialog it did not open', () => {
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

  it('reports no loading screen while the dialog shows the application\'s own content', () => {
    hot = new Handsontable(container, {
      data: [['a']],
      loading: true,
      licenseKey: LICENSE_KEY,
    });
    const dialog = hot.getPlugin('dialog');
    const loading = hot.getPlugin('loading');

    dialog.show({ content: 'Mine' });

    expect(loading.isVisible()).toBe(false);
  });

  it('does not close or change the application\'s dialog on `hide()` and `update()`', () => {
    const loadingHidden = jest.fn();

    hot = new Handsontable(container, {
      data: [['a']],
      loading: true,
      afterLoadingHide: loadingHidden,
      licenseKey: LICENSE_KEY,
    });
    const dialog = hot.getPlugin('dialog');
    const loading = hot.getPlugin('loading');

    dialog.show({ content: 'Mine' });
    loading.update({ title: 'Wait' });
    loading.hide();

    expect(dialog.isVisible()).toBe(true);
    expect(dialog.getSetting('content')).toBe('Mine');
    expect(loadingHidden).not.toHaveBeenCalled();
  });

  it('replaces the application\'s dialog with the loading screen on `show()`', () => {
    hot = new Handsontable(container, {
      data: [['a']],
      loading: true,
      licenseKey: LICENSE_KEY,
    });
    const dialog = hot.getPlugin('dialog');
    const loading = hot.getPlugin('loading');

    dialog.showConfirm('Delete?');
    loading.show();

    expect(loading.isVisible()).toBe(true);
    expect(dialog.isVisible()).toBe(true);
    expect(hot.rootWrapperElement.querySelector('.ht-loading__title')).not.toBeNull();
  });

  it('fires `afterLoadingHide` once when the dialog it opened is hidden through the dialog', () => {
    const loadingHidden = jest.fn();

    hot = new Handsontable(container, {
      data: [['a']],
      loading: true,
      afterLoadingHide: loadingHidden,
      licenseKey: LICENSE_KEY,
    });
    const dialog = hot.getPlugin('dialog');
    const loading = hot.getPlugin('loading');

    loading.show();
    dialog.hide();

    expect(loading.isVisible()).toBe(false);
    expect(loadingHidden).toHaveBeenCalledTimes(1);

    dialog.show({ content: 'Mine' });

    expect(loading.isVisible()).toBe(false);
  });

  it('fires `afterLoadingHide` once when the loading screen hides itself', () => {
    const loadingHidden = jest.fn();
    const dialogHidden = jest.fn();

    hot = new Handsontable(container, {
      data: [['a']],
      loading: true,
      afterLoadingHide: loadingHidden,
      afterDialogHide: dialogHidden,
      licenseKey: LICENSE_KEY,
    });
    const loading = hot.getPlugin('loading');

    loading.show();
    loading.hide();

    expect(loadingHidden).toHaveBeenCalledTimes(1);
    expect(dialogHidden).toHaveBeenCalledTimes(1);
    expect(dialogHidden.mock.invocationCallOrder[0]).toBeLessThan(loadingHidden.mock.invocationCallOrder[0]);
  });

  it('leaves the focus on a confirm dialog\'s button rather than on the container', () => {
    hot = new Handsontable(container, {
      data: [['a']],
      loading: true,
      licenseKey: LICENSE_KEY,
    });
    const dialog = hot.getPlugin('dialog');
    const focus = jest.spyOn(dialog, 'focus');

    hot.selectCell(0, 0);
    dialog.showConfirm('Delete?');

    expect(focus).not.toHaveBeenCalled();
  });
});
