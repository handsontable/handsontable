import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Dialog } from '../../dialog/dialog';
import { Loading } from '../loading';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const LICENSE_KEY = TEST_LICENSE_KEY;

describe('Loading requires the Dialog plugin without writing the `dialog` option', () => {
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

  /**
   * Creates a grid with the given settings.
   *
   * @param {object} settings The settings to create the grid with.
   * @returns {Handsontable} The grid.
   */
  function createGrid(settings) {
    hot = new Handsontable(container, {
      data: [['a']],
      licenseKey: LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  /**
   * Counts the dialog elements in the document.
   *
   * @returns {number}
   */
  function countDialogElements() {
    return document.querySelectorAll('.ht-dialog').length;
  }

  it('turns Dialog off when `loading` and then `dialog` are turned off', () => {
    createGrid({ loading: true });

    hot.updateSettings({ loading: false });
    hot.updateSettings({ dialog: false });

    expect(hot.getPlugin('dialog').enabled).toBe(false);
    expect(hot.getSettings().dialog).toBe(false);
    expect(countDialogElements()).toBe(0);
  });

  it('turns Dialog off when `loading` is turned off', () => {
    createGrid({ loading: true });

    hot.updateSettings({ loading: false });

    expect(hot.getPlugin('dialog').enabled).toBe(false);
    expect(countDialogElements()).toBe(0);
  });

  it('keeps Dialog on after `loading` is turned off when `dialog` is set', () => {
    createGrid({ dialog: true, loading: true });

    hot.updateSettings({ loading: false });

    expect(hot.getPlugin('dialog').enabled).toBe(true);
    expect(hot.getSettings().dialog).toBe(true);
  });

  it('keeps Dialog on when `dialog` is turned off while `loading` is on', () => {
    createGrid({ loading: true });

    hot.updateSettings({ dialog: false });

    const loading = hot.getPlugin('loading');

    loading.show();

    expect(hot.getPlugin('dialog').enabled).toBe(true);
    expect(hot.getSettings().dialog).toBe(false);
    expect(loading.isVisible()).toBe(true);
  });

  it('enables Dialog without writing the `dialog` option', () => {
    createGrid({ loading: true });

    expect(hot.getPlugin('dialog').enabled).toBe(true);
    expect(hot.getSettings().dialog).toBe(false);
  });

  it('keeps Dialog on after `loading` is turned off when `dialog` was turned on later', () => {
    createGrid({ loading: true });

    hot.updateSettings({ dialog: true });
    hot.updateSettings({ loading: false });

    expect(hot.getPlugin('dialog').enabled).toBe(true);
    expect(hot.getSettings().dialog).toBe(true);
  });

  it('enables Dialog for `loading: true` with `dialog: false` at construction', () => {
    createGrid({ loading: true, dialog: false });

    const loading = hot.getPlugin('loading');

    loading.show();

    expect(hot.getPlugin('dialog').enabled).toBe(true);
    expect(loading.isVisible()).toBe(true);
  });

  it('follows direct `enablePlugin()` and `disablePlugin()` calls outside a settings update', () => {
    createGrid({ loading: true });

    const loading = hot.getPlugin('loading');
    const dialog = hot.getPlugin('dialog');

    loading.disablePlugin();

    expect(loading.enabled).toBe(false);
    expect(dialog.enabled).toBe(false);
    expect(countDialogElements()).toBe(0);

    loading.enablePlugin();

    expect(loading.enabled).toBe(true);
    expect(dialog.enabled).toBe(true);

    hot.updateSettings({ rowHeaders: true });

    expect(loading.enabled).toBe(true);
    expect(dialog.enabled).toBe(true);
    expect(hot.getSettings().dialog).toBe(false);
  });

  it('keeps the states stable when the same `loading` value is sent twice', () => {
    createGrid({ loading: true });

    const loading = hot.getPlugin('loading');
    const dialog = hot.getPlugin('dialog');

    expect(() => {
      hot.updateSettings({ loading: false });
      hot.updateSettings({ loading: false });
    }).not.toThrow();

    expect(loading.enabled).toBe(false);
    expect(dialog.enabled).toBe(false);
    expect(countDialogElements()).toBe(0);

    expect(() => {
      hot.updateSettings({ loading: true });
      hot.updateSettings({ loading: true });
    }).not.toThrow();

    expect(loading.enabled).toBe(true);
    expect(dialog.enabled).toBe(true);
    expect(hot.getSettings().dialog).toBe(false);

    loading.show();

    expect(loading.isVisible()).toBe(true);
  });
});
