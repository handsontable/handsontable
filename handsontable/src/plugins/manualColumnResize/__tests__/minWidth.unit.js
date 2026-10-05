import Handsontable from 'handsontable';

/**
 * The narrowest width a column can be resized to is the room its header needs for the menu button:
 * the icon size plus the cell's horizontal padding on both sides (DEV-158).
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
   * Creates a grid and makes the theme tokens read as the given values.
   *
   * @param {object} tokens The `--ht-*` values by name, without the prefix.
   * @returns {ManualColumnResize}
   */
  function createPlugin(tokens = {}) {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    jest.spyOn(hot.stylesHandler, 'getCSSVariableValue').mockImplementation(name => tokens[name]);

    return hot.getPlugin('manualColumnResize');
  }

  it('should be the icon size plus the horizontal padding on both sides', () => {
    const plugin = createPlugin({ 'icon-size': 16, 'cell-horizontal-padding': 8 });

    expect(plugin.setManualSize(0, 5)).toBe(32);
    expect(plugin.getManualSize(0)).toBe(32);
  });

  it('should follow the theme tokens', () => {
    const plugin = createPlugin({ 'icon-size': 16, 'cell-horizontal-padding': 12 });

    expect(plugin.setManualSize(0, 5)).toBe(40);
  });

  it('should not be applied to a width that is already wide enough', () => {
    const plugin = createPlugin({ 'icon-size': 16, 'cell-horizontal-padding': 8 });

    expect(plugin.setManualSize(0, 32)).toBe(32);
    expect(plugin.setManualSize(1, 120)).toBe(120);
  });

  it('should also apply to the widths written with `setManualSizes()`', () => {
    const plugin = createPlugin({ 'icon-size': 16, 'cell-horizontal-padding': 8 });

    plugin.setManualSizes([[0, 10], [1, 100]]);

    expect(plugin.getManualSize(0)).toBe(32);
    expect(plugin.getManualSize(1)).toBe(100);
  });

  it('should fall back to 20px when the theme declares no tokens', () => {
    const plugin = createPlugin({});

    expect(plugin.setManualSize(0, 5)).toBe(20);
  });

  it('should fall back to 20px when a token is not a plain length', () => {
    // A custom theme may declare a token as `calc()`, which `StylesHandler` hands back as a string.
    const plugin = createPlugin({ 'icon-size': 'calc(1rem + 2px)', 'cell-horizontal-padding': 8 });

    expect(plugin.setManualSize(0, 5)).toBe(20);
  });

  it('should never be less than 20px', () => {
    // `getCSSVariableValue()` reads a token in `rem` as a bare number: `1.25rem` and `0.5rem` come back as 2 and 1.
    const plugin = createPlugin({ 'icon-size': 2, 'cell-horizontal-padding': 1 });

    expect(plugin.setManualSize(0, 5)).toBe(20);
  });

  it('should fall back to 20px when the icon size is not positive', () => {
    const plugin = createPlugin({ 'icon-size': 0, 'cell-horizontal-padding': 8 });

    expect(plugin.setManualSize(0, 5)).toBe(20);
  });

  it('should be read again after a theme change', () => {
    const plugin = createPlugin({ 'icon-size': 16, 'cell-horizontal-padding': 8 });

    expect(plugin.setManualSize(0, 5)).toBe(32);

    hot.stylesHandler.getCSSVariableValue.mockImplementation(name => (
      { 'icon-size': 12, 'cell-horizontal-padding': 6 }[name]
    ));

    expect(plugin.setManualSize(0, 5)).toBe(24);
  });
});
