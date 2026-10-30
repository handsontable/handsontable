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

    it('shows the last dialog again on a `show()` without options', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      dialog.show({ content: 'Shown', closable: true });
      dialog.update({ content: 'Updated' });
      dialog.hide();

      expect(dialog.getSetting('content')).toBe('Updated');
      expect(dialog.getSetting('closable')).toBe(true);

      dialog.show();

      expect(dialog.getSetting('content')).toBe('Updated');
      expect(dialog.getSetting('closable')).toBe(true);
      expect(hot.rootOverlaysElement.querySelector('.ht-dialog__content').textContent).toBe('Updated');
    });

    it('does not carry the last dialog\'s options into a show that brings its own content', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      dialog.show({ content: 'First', closable: true, customClassName: 'first', background: 'semi-transparent' });
      dialog.hide();
      dialog.show({ content: 'Second' });

      expect(dialog.getSetting('closable')).toBe(false);
      expect(dialog.getSetting('customClassName')).toBe('');
      expect(dialog.getSetting('background')).toBe('solid');
    });

    it('does not let options prepared for another dialog reach the loading screen', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        loading: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');
      const loading = hot.getPlugin('loading');

      hot.selectCell(0, 0);
      dialog.update({ closable: true, content: 'Prepared' });
      loading.show();
      pressEscape(hot);

      expect(loading.isVisible()).toBe(true);
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

    it('shows the call\'s `content` over a configured `template`, also when shown again without options', () => {
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

      expect(() => dialog.show()).not.toThrow();
      expect(dialog.getSetting('template')).toBeNull();
      expect(dialog.getSetting('content')).toBe('Mine');
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
    it('keeps the buttons of a shown dialog when the options it shows did not change', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      hot.selectCell(0, 0);
      dialog.showConfirm('Delete?');

      const buttons = Array.from(hot.rootOverlaysElement.querySelectorAll('.ht-dialog button'));

      expect(hot.rootDocument.activeElement).toBe(buttons[0]);

      hot.updateSettings({ dialog: { closable: true } });

      expect(Array.from(hot.rootOverlaysElement.querySelectorAll('.ht-dialog button'))).toEqual(buttons);
      expect(hot.rootDocument.activeElement).toBe(buttons[0]);
    });

    it('keeps the focus on the same button when new `dialog` options re-render a shown dialog', () => {
      hot = new Handsontable(container, {
        data: createData(3, 3),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      hot.selectCell(0, 0);
      dialog.show({
        template: {
          type: 'confirm',
          title: 'Choose',
          buttons: [
            { text: 'First', type: 'secondary' },
            { text: 'Second', type: 'primary' },
          ],
        },
        closable: true,
      });
      hot.rootOverlaysElement.querySelectorAll('.ht-dialog button')[1].focus();

      hot.updateSettings({ dialog: { customClassName: 'updated' } });

      expect(hot.rootOverlaysElement.querySelector('.ht-dialog').classList.contains('updated')).toBe(true);
      expect(hot.rootDocument.activeElement.textContent).toBe('Second');

      pressEscape(hot);

      expect(dialog.isVisible()).toBe(false);
    });

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
    it('restores a selection the data loaded under the loading screen still holds', () => {
      hot = new Handsontable(container, {
        data: createData(10, 10),
        loading: true,
        licenseKey: LICENSE_KEY,
      });
      const loading = hot.getPlugin('loading');

      hot.selectCell(1, 1);
      loading.show();
      hot.loadData(createData(5, 5));
      loading.hide();

      expect(hot.getSelected()).toEqual([[1, 1, 1, 1]]);
    });

    it('leaves the selection alone when `updateData()` left it past the end of the data', () => {
      hot = new Handsontable(container, {
        data: createData(10, 10),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      hot.selectCell(2, 2);
      dialog.show({ content: 'Shown' });
      hot.updateData(createData(2, 2));
      dialog.hide();

      expect(hot.getSelected()).toBeUndefined();
    });

    it('leaves the selection alone when `updateSettings({ data })` left it past the end of the data', () => {
      hot = new Handsontable(container, {
        data: createData(10, 10),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      hot.selectCell(2, 2);
      dialog.show({ content: 'Shown' });
      hot.updateSettings({ data: createData(2, 2) });
      dialog.hide();

      expect(hot.getSelected()).toBeUndefined();
    });

    it('restores only the selection layers the new data still holds', () => {
      hot = new Handsontable(container, {
        data: createData(10, 10),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      hot.selectCells([[0, 0], [8, 8], [1, 1]]);
      dialog.show({ content: 'Shown' });
      hot.loadData(createData(2, 2));
      dialog.hide();

      expect(hot.getSelected()).toEqual([[0, 0, 0, 0], [1, 1, 1, 1]]);
      expect(hot.getSelectedRangeActive().highlight.row).toBe(1);
    });

    it('restores a whole column as the whole column of the new data', () => {
      hot = new Handsontable(container, {
        data: createData(10, 10),
        dialog: true,
        licenseKey: LICENSE_KEY,
      });
      const dialog = hot.getPlugin('dialog');

      hot.selectColumns(1);
      dialog.show({ content: 'Shown' });
      hot.loadData(createData(3, 3));
      dialog.hide();

      const restored = hot.getSelected();

      hot.selectColumns(1);

      expect(restored).toEqual(hot.getSelected());
    });

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
