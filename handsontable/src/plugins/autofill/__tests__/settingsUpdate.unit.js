import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('Autofill settings on an update of `fillHandle`', () => {
  let hot;

  afterEach(() => {
    hot?.destroy();
    hot = null;
  });

  it('should read the new direction after `updateSettings({ fillHandle: \'vertical\' })`', () => {
    hot = new Handsontable(document.createElement('div'), {
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      fillHandle: true,
      licenseKey: LICENSE_KEY,
    });
    const plugin = hot.getPlugin('autofill');

    hot.updateSettings({ fillHandle: 'vertical' });

    expect(plugin.getSetting('direction')).toBe('vertical');
    expect(plugin.directions).toEqual(['vertical']);
  });
});
