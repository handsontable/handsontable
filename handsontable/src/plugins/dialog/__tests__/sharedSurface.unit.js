import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Dialog } from '../dialog';
import { Loading } from '../../loading/loading';

const LICENSE_KEY = 'non-commercial-and-evaluation';

/**
 * Builds a data set of the given size.
 *
 * @param {number} rows The number of rows.
 * @param {number} columns The number of columns.
 * @returns {Array[]}
 */
function createData(rows, columns) {
  return Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (__, col) => `${row}:${col}`));
}

/**
 * Presses Escape the way a keyboard does, on the grid's document.
 *
 * @param {Core} hot The grid instance.
 */
function pressEscape(hot) {
  hot.rootDocument.documentElement.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
  }));
}

describe('Dialog as a surface shared by several callers', () => {
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

  describe('each show describes one complete dialog', () => {
    it('shows the loading screen after a confirm dialog was shown and hidden', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        loading: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');
      const loading = hot.getPlugin('loading');

      dialog.showConfirm('Delete?');
      dialog.hide();

      expect(() => loading.show()).not.toThrow();
      expect(loading.isVisible()).toBe(true);
      expect(hot.rootWrapperElement.querySelector('.ht-loading__title')).not.toBeNull();
    });

    it('shows alert, confirm and plain dialogs after the loading screen was shown and hidden', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        loading: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');
      const loading = hot.getPlugin('loading');

      loading.show();
      loading.hide();

      expect(() => dialog.showAlert('Saved')).not.toThrow();
      expect(dialog.isVisible()).toBe(true);
      dialog.hide();

      expect(() => dialog.showConfirm('Delete?')).not.toThrow();
      expect(dialog.isVisible()).toBe(true);
      dialog.hide();

      expect(() => dialog.show({ content: 'Plain' })).not.toThrow();
      expect(dialog.isVisible()).toBe(true);
      expect(dialog.getSetting('customClassName')).toBe('');
      expect(dialog.getSetting('a11y').role).toBe('dialog');
    });

    it('does not let Escape hide the loading screen because an earlier dialog was closable', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        loading: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');
      const loading = hot.getPlugin('loading');

      hot.selectCell(0, 0);
      dialog.show({ content: 'Closable', closable: true });
      pressEscape(hot);

      expect(dialog.isVisible()).toBe(false);

      loading.show();
      pressEscape(hot);

      expect(loading.isVisible()).toBe(true);
    });

    it('applies the configured `dialog` options to every plain show', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: { customClassName: 'configured', closable: true },
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      dialog.show({ content: 'First', customClassName: 'first' });
      dialog.hide();
      dialog.show({ content: 'Second' });

      expect(dialog.getSetting('customClassName')).toBe('configured');
      expect(dialog.getSetting('closable')).toBe(true);
      expect(dialog.getSetting('content')).toBe('Second');
    });

    it('keeps the configured `dialog` options merged across settings updates', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: { customClassName: 'configured' },
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      hot.updateSettings({ dialog: { closable: true } });
      dialog.show({ content: 'Shown' });

      expect(dialog.getSetting('customClassName')).toBe('configured');
      expect(dialog.getSetting('closable')).toBe(true);
    });

    it('keeps the options an update gave a visible dialog until it hides', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      dialog.show({ content: 'Shown', closable: true });
      dialog.update({ content: 'Updated' });

      expect(dialog.getSetting('content')).toBe('Updated');
      expect(dialog.getSetting('closable')).toBe(true);

      dialog.hide();
      dialog.show();

      expect(dialog.getSetting('content')).toBe('');
      expect(dialog.getSetting('closable')).toBe(false);
    });

    it('shows the options an update gave a hidden dialog on the next show', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      dialog.update({ content: 'Prepared' });
      dialog.show();

      expect(dialog.getSetting('content')).toBe('Prepared');
    });
  });

  describe('a configured option that the call replaces', () => {
    const CONFIGURED_TEMPLATE = { type: 'confirm', title: 'Configured' };

    it('shows the loading screen when the `dialog` setting configures a `template`', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: { template: CONFIGURED_TEMPLATE },
        loading: true,
        licenseKey: LICENSE_KEY,
      });
      const loading = hot.getPlugin('loading');

      expect(() => loading.show()).not.toThrow();
      expect(loading.isVisible()).toBe(true);
      expect(hot.rootWrapperElement.querySelector('.ht-loading__title')).not.toBeNull();
    });

    it('shows the call\'s `content` over a configured `template`, and the template again on the next plain show', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: { template: CONFIGURED_TEMPLATE },
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      expect(() => dialog.show({ content: 'Mine' })).not.toThrow();
      expect(dialog.getSetting('template')).toBeNull();
      expect(dialog.getSetting('content')).toBe('Mine');

      dialog.hide();
      dialog.show();

      expect(dialog.getSetting('template')).toEqual(CONFIGURED_TEMPLATE);
      expect(dialog.getSetting('content')).toBe('');
    });

    it('shows the call\'s `template` over a configured `content`', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: { content: 'Configured' },
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      expect(() => dialog.showConfirm('Delete?')).not.toThrow();
      expect(dialog.getSetting('content')).toBe('');
    });

    it('still throws when one call passes both `template` and `content`', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      expect(() => dialog.show({ template: CONFIGURED_TEMPLATE, content: 'Mine' }))
        .toThrowError('The `template` option cannot be used together with the `content` option.');
      expect(dialog.isVisible()).toBe(false);
    });

    it('still throws when the `dialog` setting configures both `template` and `content`', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: { template: CONFIGURED_TEMPLATE, content: 'Configured' },
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      expect(() => dialog.show())
        .toThrowError('The `template` option cannot be used together with the `content` option.');
    });

    it('keeps nothing of a show the dialog rejected for an unknown template type', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        loading: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');
      const loading = hot.getPlugin('loading');

      expect(() => dialog.show({ template: { type: 'alert', title: 'Alert' } }))
        .toThrowError(/Invalid template: alert/);
      expect(dialog.isVisible()).toBe(false);

      expect(() => dialog.show({ content: 'Mine' })).not.toThrow();
      dialog.hide();

      expect(() => loading.show()).not.toThrow();
      expect(loading.isVisible()).toBe(true);
    });
  });

  describe('a settings update while the dialog is shown', () => {
    it('keeps a shown dialog shown and applies the new `dialog` options to it', () => {
      const hidden = jest.fn();

      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: true,
        afterDialogHide: hidden,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      dialog.show({ content: 'Shown' });
      hot.updateSettings({ dialog: { customClassName: 'updated' } });

      expect(dialog.isVisible()).toBe(true);
      expect(hidden).not.toHaveBeenCalled();
      expect(dialog.getSetting('content')).toBe('Shown');
      expect(hot.rootOverlaysElement.querySelector('.ht-dialog').classList.contains('updated')).toBe(true);
    });

    it('keeps the loading screen shown when the settings carry `dialog` and `loading` again', () => {
      const hidden = jest.fn();

      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: true,
        loading: true,
        afterLoadingHide: hidden,
        licenseKey: LICENSE_KEY,
      });
      const loading = hot.getPlugin('loading');

      loading.show();
      hot.updateSettings({ dialog: true, loading: true });

      expect(loading.isVisible()).toBe(true);
      expect(hidden).not.toHaveBeenCalled();
      expect(hot.rootWrapperElement.querySelector('.ht-loading__title')).not.toBeNull();
    });

    it('closes a closable dialog with Escape once however many times the settings were updated', () => {
      const hidden = jest.fn();

      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: { closable: true },
        afterDialogHide: hidden,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      hot.updateSettings({ dialog: { closable: true } });
      hot.updateSettings({ dialog: { closable: true } });
      hot.selectCell(0, 0);
      dialog.show({ content: 'Shown' });
      pressEscape(hot);

      expect(dialog.isVisible()).toBe(false);
      expect(hidden).toHaveBeenCalledTimes(1);
    });

    it('still hides a shown dialog when the plugin is turned off', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      dialog.show({ content: 'Shown' });
      hot.updateSettings({ dialog: false });

      expect(dialog.isVisible()).toBe(false);
    });
  });

  describe('the selection restored on hide', () => {
    it('restores the selection the dialog stashed when the data did not change', () => {
      hot = new Handsontable(container, {
        data: createData(10, 10),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      hot.selectCell(8, 8);
      dialog.show({ content: 'Shown' });
      dialog.hide();

      expect(hot.getSelected()).toEqual([[8, 8, 8, 8]]);
    });

    it('leaves the selection alone when `loadData()` replaced the data under the dialog', () => {
      hot = new Handsontable(container, {
        data: createData(10, 10),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      hot.selectCell(8, 8);
      dialog.show({ content: 'Shown' });
      hot.loadData(createData(2, 2));
      dialog.hide();

      expect(hot.getSelected()).toBeUndefined();
    });

    it('restores the selection across a `loadData()` on a grid with an external data source', () => {
      hot = new Handsontable(container, {
        data: createData(10, 10),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      hot.addHook('hasExternalDataSource', () => true);
      hot.selectCell(1, 1);
      dialog.show({ content: 'Shown' });
      hot.loadData(createData(10, 10));
      dialog.hide();

      expect(hot.getSelected()).toEqual([[1, 1, 1, 1]]);
    });

    it('restores the selection across `updateData()`', () => {
      hot = new Handsontable(container, {
        data: createData(10, 10),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      hot.selectCell(1, 1);
      dialog.show({ content: 'Shown' });
      hot.updateData(createData(10, 10));
      dialog.hide();

      expect(hot.getSelected()).toEqual([[1, 1, 1, 1]]);
    });
  });
});
