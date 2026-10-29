import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('Autofill settings on an unrelated update', () => {
  let hot;

  afterEach(() => {
    hot?.destroy();
    hot = null;
  });

  it('keeps `fillHandle: { autoInsertRow: false }` after `updateSettings({ readOnly: true })`', () => {
    hot = new Handsontable(document.createElement('div'), {
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      fillHandle: { autoInsertRow: false },
      licenseKey: LICENSE_KEY,
    });
    const plugin = hot.getPlugin('autofill');

    hot.updateSettings({ readOnly: true });

    expect(plugin.getSetting('autoInsertRow')).toBe(false);
    expect(plugin.autoInsertRow).toBe(false);
  });
});
