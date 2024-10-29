describe('StylesHandler', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');

    createDataArray(100, 4);

    walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
    });

    this.wotInstance.draw();

    this.rootElement = this.wotInstance.wtTable.wtRootElement.parentElement;
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('isClassicTheme', () => {
    it('should return true if no theme was previously enabled', () => {
      expect(spec().wotInstance.stylesHandler.isClassicTheme()).toBe(true);
    });

    it('should return false if `useTheme` was called with a theme name', () => {
      spec().wotInstance.destroy();
      walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      spec().wotInstance.stylesHandler.useTheme('ht-theme-sth');

      expect(spec().wotInstance.stylesHandler.isClassicTheme()).toBe(false);
    });
  });

  describe('getCSSVariableValue', () => {
    it('should return the correct CSS variable value', () => {
      spec().rootElement.style.setProperty('--ht-cell-vertical-padding', '10px');

      spec().wotInstance.destroy();
      walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      // `getCSSVariableValue` requires a non-classic theme to be enabled.
      spec().wotInstance.stylesHandler.useTheme('ht-theme-sth');

      expect(spec().wotInstance.stylesHandler.getCSSVariableValue('cell-vertical-padding')).toBe(10);
    });

    it('should return undefined for non-existent CSS variable', () => {
      // `getCSSVariableValue` requires a non-classic theme to be enabled.
      spec().wotInstance.stylesHandler.useTheme('ht-theme-sth');

      expect(spec().wotInstance.stylesHandler.getCSSVariableValue('non-existent-variable')).toBeUndefined();
    });
  });

  describe('getStyleForTD', () => {
    it('should return the correct style for a td element', () => {
      expect(spec().wotInstance.stylesHandler.getStyleForTD('box-sizing')).toBe('content-box');
    });

    it('should return undefined for non-existent td style', () => {
      expect(spec().wotInstance.stylesHandler.getStyleForTD('non-existent-style')).toBeUndefined();
    });
  });

  describe('getDefaultRowHeight', () => {
    it('should return the default row height of 23px for the classic theme', () => {
      expect(spec().wotInstance.stylesHandler.getDefaultRowHeight()).toBe(23);
    });

    it('should calculate the default row height for non-classic theme', () => {
      spec().rootElement.style.setProperty('--ht-row-height', '31px');

      spec().wotInstance.destroy();
      walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      spec().wotInstance.stylesHandler.useTheme('ht-theme-sth');

      expect(spec().wotInstance.stylesHandler.getDefaultRowHeight()).toBe(31);
    });
  });
});
