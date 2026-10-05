import Handsontable from 'handsontable';

/**
 * The narrowest width a column can be resized to is the room its header needs for the menu button:
 * the icon size plus the cell's horizontal padding on both sides (DEV-158). A grid whose headers render
 * no menu button has no button to protect and keeps the old 20px floor.
 *
 * jsdom has no layout, so the browser measurement behind the floor is stubbed here
 * (`StylesHandler#getResolvedLength()`, which has its own tests). What these tests pin is what the
 * plugin does with the answer: when it asks, what it falls back to, and where the clamp applies.
 */
describe('ManualColumnResize minimum column width', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
  });

  /**
   * Creates a grid whose theme tokens resolve to the given width.
   *
   * @param {number|null} resolvedWidth What the browser measurement answers, in pixels.
   * @param {object} settings Settings that replace the defaults.
   * @returns {ManualColumnResize}
   */
  function createPlugin(resolvedWidth, settings = {}) {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      dropdownMenu: true,
      manualColumnResize: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    jest.spyOn(hot.stylesHandler, 'getResolvedLength').mockReturnValue(resolvedWidth);

    return hot.getPlugin('manualColumnResize');
  }

  it('should be the icon size plus the horizontal padding on both sides, as measured by the browser', () => {
    const plugin = createPlugin(32);

    expect(plugin.setManualSize(0, 5)).toBe(32);
    expect(plugin.getManualSize(0)).toBe(32);

    // The expression names both tokens, so a `rem`, `em` or `calc()` token resolves the same way.
    expect(hot.stylesHandler.getResolvedLength).toHaveBeenCalledWith(
      'calc(var(--ht-icon-size) + 2 * var(--ht-cell-horizontal-padding))'
    );
  });

  it('should follow the theme', () => {
    const plugin = createPlugin(40);

    expect(plugin.setManualSize(0, 5)).toBe(40);
  });

  it('should not be applied to a width that is already wide enough', () => {
    const plugin = createPlugin(32);

    expect(plugin.setManualSize(0, 32)).toBe(32);
    expect(plugin.setManualSize(1, 120)).toBe(120);
  });

  it('should also apply to the widths written with `setManualSizes()`, measuring only once', () => {
    const plugin = createPlugin(32);

    plugin.setManualSizes([[0, 10], [1, 100], [2, 5]]);

    expect(plugin.getManualSize(0)).toBe(32);
    expect(plugin.getManualSize(1)).toBe(100);
    expect(plugin.getManualSize(2)).toBe(32);
    // A restore can carry thousands of widths, and the floor cannot change inside the loop.
    expect(hot.stylesHandler.getResolvedLength).toHaveBeenCalledTimes(1);
  });

  it('should be 20px, and not ask the browser, when the grid has no menu button', () => {
    const plugin = createPlugin(32, { dropdownMenu: false });

    expect(plugin.setManualSize(0, 5)).toBe(20);
    expect(plugin.setManualSize(1, 24)).toBe(24);
    expect(hot.stylesHandler.getResolvedLength).not.toHaveBeenCalled();
  });

  it('should be 20px when the grid has no column headers', () => {
    const plugin = createPlugin(32, { colHeaders: false });

    expect(plugin.setManualSize(0, 5)).toBe(20);
    expect(hot.stylesHandler.getResolvedLength).not.toHaveBeenCalled();
  });

  it('should apply from the moment the menu is enabled', () => {
    const plugin = createPlugin(32, { dropdownMenu: false });

    expect(plugin.setManualSize(0, 5)).toBe(20);

    hot.updateSettings({ dropdownMenu: true });

    expect(plugin.setManualSize(0, 5)).toBe(32);
  });

  it('should fall back to 20px when the browser can not measure the tokens', () => {
    // No theme, a theme that does not declare them, or a grid that is not rendered yet.
    const plugin = createPlugin(null);

    expect(plugin.setManualSize(0, 5)).toBe(20);
  });

  it('should never be less than 20px', () => {
    const plugin = createPlugin(12);

    expect(plugin.setManualSize(0, 5)).toBe(20);
  });

  it('should be read again after a theme change', () => {
    const plugin = createPlugin(32);

    expect(plugin.setManualSize(0, 5)).toBe(32);

    hot.stylesHandler.getResolvedLength.mockReturnValue(24);

    expect(plugin.setManualSize(0, 5)).toBe(24);
  });
});
