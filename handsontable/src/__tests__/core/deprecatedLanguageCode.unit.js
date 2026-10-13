import Handsontable from 'handsontable';
import srLatnRS from 'handsontable/i18n/languages/sr-Latn-RS';
import srSP from 'handsontable/i18n/languages/sr-SP';
import { _resetDeprecationWarnings } from 'handsontable/helpers/console';

/**
 * The deprecated `sr-SP` language code keeps working and warns once, whether it is passed on
 * construction or switched to with `updateSettings()`.
 */
describe('Core deprecated language code', () => {
  let container;
  let hot;
  let warn;

  beforeAll(() => {
    Handsontable.languages.registerLanguageDictionary(srLatnRS);
    Handsontable.languages.registerLanguageDictionary(srSP);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    _resetDeprecationWarnings();
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
    warn.mockRestore();
  });

  const deprecationWarnings = () => warn.mock.calls.filter(([message]) => String(message).includes('sr-SP'));

  it('should not warn for `sr-Latn-RS`', () => {
    hot = new Handsontable(container, { language: 'sr-Latn-RS', licenseKey: 'non-commercial-and-evaluation' });
    hot.updateSettings({ language: 'sr-Latn-RS' });

    expect(deprecationWarnings()).toHaveLength(0);
  });

  it('should warn once when `sr-SP` is passed on construction', () => {
    hot = new Handsontable(container, { language: 'sr-SP', licenseKey: 'non-commercial-and-evaluation' });

    expect(hot.getSettings().language).toBe('sr-SP');
    expect(deprecationWarnings()).toHaveLength(1);
  });

  it('should warn once when the grid is switched to `sr-SP` with `updateSettings()`', () => {
    hot = new Handsontable(container, { language: 'sr-Latn-RS', licenseKey: 'non-commercial-and-evaluation' });
    hot.updateSettings({ language: 'sr-SP' });
    hot.updateSettings({ language: 'sr-SP' });

    expect(hot.getSettings().language).toBe('sr-SP');
    expect(deprecationWarnings()).toHaveLength(1);
    expect(deprecationWarnings()[0][0]).toMatch(/^Deprecated: .*sr-Latn-RS/);
  });
});
