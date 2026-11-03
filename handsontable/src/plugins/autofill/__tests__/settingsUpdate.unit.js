import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const LICENSE_KEY = TEST_LICENSE_KEY;

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
