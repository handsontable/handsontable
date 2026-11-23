import { registerAllModules } from 'handsontable/registry';
import { renderHotTableWithProps } from './_helpers';
import { TEST_LICENSE_KEY } from './licenseKey';

registerAllModules();

// The core reads the key once, while the grid is built, so a wrapper that passed it any later (in an
// `updateSettings()` after the constructor) would leave every grid behind the license lock. These tests
// build the grid through the component and read what the core decided.
describe('The license key through HotTable', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    // The core prints its license message once per page, so only the first grid of a file would show it:
    // these tests read the lock, which every grid draws on its own, and the spy keeps the output quiet.
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('should build a grid without a key behind the license lock', async() => {
    const hotTableRef = renderHotTableWithProps({
      data: [['A1', 'B1']],
      autoRowSize: false,
      autoColumnSize: false,
    });
    const hot = hotTableRef.current!.hotInstance!;

    expect(hot.rootElement.closest('.ht-root-wrapper')!.querySelector('.ht-license-lock')).not.toBeNull();
  });

  it('should build a grid with the test key unlocked and without a license message', async() => {
    const hotTableRef = renderHotTableWithProps({
      data: [['A1', 'B1']],
      licenseKey: TEST_LICENSE_KEY,
      autoRowSize: false,
      autoColumnSize: false,
    });
    const hot = hotTableRef.current!.hotInstance!;

    expect(hot.getSettings().licenseKey).toBe(TEST_LICENSE_KEY);
    expect(hot.rootElement.closest('.ht-root-wrapper')!.querySelector('.ht-license-lock')).toBeNull();
    expect(hot.rootElement.closest('.ht-root-wrapper')!.querySelector('.hot-display-license-info')).toBeNull();
  });

  it('should keep the key on the grid when another prop changes', async() => {
    const props = {
      data: [['A1', 'B1']],
      licenseKey: TEST_LICENSE_KEY,
      autoRowSize: false,
      autoColumnSize: false,
    };
    const hotTableRef = renderHotTableWithProps(props);

    renderHotTableWithProps({ ...props, colHeaders: ['First', 'Second'] }, true, hotTableRef);

    const hot = hotTableRef.current!.hotInstance!;

    expect(hot.getColHeader(0)).toBe('First');
    expect(hot.getSettings().licenseKey).toBe(TEST_LICENSE_KEY);
    expect(hot.rootElement.closest('.ht-root-wrapper')!.querySelector('.ht-license-lock')).toBeNull();
  });
});

