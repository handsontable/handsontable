import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const LICENSE_KEY = TEST_LICENSE_KEY;

describe('SheetsBar: the Dialog plugin a `loading` sheet turns on', () => {
  let container;
  let hot;

  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
  });

  afterAll(() => {
    delete Element.prototype.scrollIntoView;
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
   * Builds a workbook whose sheet A turns `loading` on and whose sheet B carries the given settings.
   *
   * @param {object} [plainSettings] Sheet B's settings, left out when not given.
   * @returns {object} The SheetsBar plugin.
   */
  function buildWorkbook(plainSettings) {
    const plain = plainSettings ? { name: 'B', settings: plainSettings } : { name: 'B' };

    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'A', data: [['a']], settings: { loading: true } },
          { data: [['b']], ...plain },
        ],
      },
      licenseKey: LICENSE_KEY,
    });

    return hot.getPlugin('sheetsBar');
  }

  /**
   * Counts the dialog elements in the document.
   *
   * @returns {number}
   */
  function countDialogElements() {
    return document.querySelectorAll('.ht-dialog').length;
  }

  it.each([
    ['declares no settings', undefined],
    ['declares `dialog: false`', { dialog: false }],
  ])('turns Dialog off on a sheet that %s and on again on the `loading` sheet', (_, plainSettings) => {
    const plugin = buildWorkbook(plainSettings);

    expect(hot.getPlugin('dialog').enabled).toBe(true);

    plugin.setActiveSheet('B');

    expect(hot.getPlugin('loading').enabled).toBe(false);
    expect(hot.getPlugin('dialog').enabled).toBe(false);
    expect(hot.getSettings().dialog).toBe(false);
    expect(countDialogElements()).toBe(0);

    plugin.setActiveSheet('A');

    const loading = hot.getPlugin('loading');

    loading.show();

    expect(hot.getPlugin('dialog').enabled).toBe(true);
    expect(loading.isVisible()).toBe(true);
  });
});
