import Core from 'handsontable/core';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';
import Xlsx from '../types/xlsx';
import DataProvider from '../dataProvider';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import * as consoleHelpers from '../../../helpers/console';
import { resetTierKeys, tierKeyWithout } from '../../../utils/entitlementLicenseKey/__tests__/tierKeys';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

/**
 * `xlsxLicenseGates.unit.js` counts a column width toward `xlsx:layout` on a mocked data provider. This
 * suite runs the real one on a real grid, so the width reaches the export the way a measured one does:
 * AutoColumnSize hands its widths to the grid through the `modifyColWidth` hook, and jsdom measures
 * nothing, so the hook is added here with the width a measurement would give.
 */
describe('Xlsx export license gate for a width the grid computed', () => {
  const MEASURED_WIDTH = 73;
  const LAYOUT_WARNING = 'The xlsx export skipped features your license does not unlock: xlsx:layout.';
  let container;
  let hot;
  let warnSpy;
  let writeSpy;

  /**
   * Exports a plain grid under `licenseKey` and returns the first sheet the engine was handed.
   *
   * @param {string} licenseKey The license key.
   * @param {boolean} measured Whether the grid reports a measured column width.
   * @returns {Promise<object>}
   */
  async function exportSheet(licenseKey, measured) {
    hot = new Core(container, {
      licenseKey,
      // A raw `Core` is not a root instance, so no default theme is picked for it; name one.
      themeName: 'ht-theme-main',
      data: [['a', 'b'], ['c', 'd']],
      autoColumnSize: false,
    });
    hot.init();

    if (measured) {
      hot.addHook('modifyColWidth', () => MEASURED_WIDTH);
    }

    await new Xlsx(new DataProvider(hot), { conditionalFormatting: [], exportFormulas: false, headerStyle: null })
      .export();

    return writeSpy.mock.calls[0][0].sheets[0];
  }

  const exportWarnings = () => warnSpy.mock.calls.map(call => call[0])
    .filter(message => String(message).startsWith('The xlsx export skipped'));

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
    writeSpy = jest.spyOn(nativeAdapter, 'write');
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    warnSpy.mockRestore();
    writeSpy.mockRestore();
    resetTierKeys();
  });

  it('should write a measured width for a key that unlocks xlsx:layout, and warn about nothing', async() => {
    const sheet = await exportSheet(tierKeyWithout([]), true);

    expect(sheet.colWidths.every(width => width !== null)).toBe(true);
    expect(exportWarnings()).toEqual([]);
  });

  it('should leave a measured width out and name xlsx:layout for a key without it', async() => {
    const sheet = await exportSheet(tierKeyWithout(['xlsx:layout']), true);

    expect(sheet.colWidths.every(width => width === null)).toBe(true);
    expect(exportWarnings()).toEqual([LAYOUT_WARNING]);
  });

  it('should warn about nothing for a key without xlsx:layout when every width is the default', async() => {
    const sheet = await exportSheet(tierKeyWithout(['xlsx:layout']), false);

    expect(sheet.colWidths.every(width => width === null)).toBe(true);
    expect(exportWarnings()).toEqual([]);
  });
});
