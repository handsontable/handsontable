import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('CopyPaste settings on an update of `fragmentSelection` only', () => {
  let hot;

  afterEach(() => {
    hot?.destroy();
    hot = null;
  });

  it('should keep `pasteMode` and `copyColumnHeaders` after `updateSettings({ fragmentSelection: true })`', () => {
    hot = new Handsontable(document.createElement('div'), {
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      copyPaste: { pasteMode: 'shift_down', copyColumnHeaders: true },
      licenseKey: LICENSE_KEY,
    });
    const plugin = hot.getPlugin('copyPaste');

    hot.updateSettings({ fragmentSelection: true });

    const menuOptions = { items: [] };

    hot.runHooks('afterContextMenuDefaultOptions', menuOptions);

    expect(plugin.pasteMode).toBe('shift_down');
    expect(plugin.getSetting('copyColumnHeaders')).toBe(true);
    expect(menuOptions.items.map(item => item.key)).toContain('copy_with_column_headers');
  });
});
