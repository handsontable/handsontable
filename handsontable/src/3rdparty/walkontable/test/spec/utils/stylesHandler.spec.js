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
      totalColumns: getTotalColumns
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

  it('should return true if the classic theme is present', () => {
    spec().rootElement.style.setProperty('--ht-line-height', '');

    expect(spec().wotInstance.stylesHandler.isClassicTheme()).toBe(true);
  });

  it('should return false if the moder theme is not present', () => {
    // TODO: naive method of simulating a modern theme
    spec().rootElement.style.setProperty('--ht-line-height', '1.5');

    spec().wotInstance.destroy();
    walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    expect(spec().wotInstance.stylesHandler.isClassicTheme()).toBe(false);
  });

  it('should return the correct CSS variable value', () => {
    spec().rootElement.style.setProperty('--ht-cell-vertical-padding', '10px');

    spec().wotInstance.destroy();
    walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    expect(spec().wotInstance.stylesHandler.getCSSVariableValue('cell-vertical-padding')).toBe(10);
  });

  it('should return undefined for non-existent CSS variable', () => {
    expect(spec().wotInstance.stylesHandler.getCSSVariableValue('non-existent-variable')).toBeUndefined();
  });

  it('should return the correct style for a td element', () => {
    expect(spec().wotInstance.stylesHandler.getStyleForTD('border-bottom-width')).toBe(1);
  });

  it('should return undefined for non-existent td style', () => {
    expect(spec().wotInstance.stylesHandler.getStyleForTD('non-existent-style')).toBeUndefined();
  });

  it('should calculate the default row height for classic theme', () => {
    expect(spec().wotInstance.stylesHandler.getDefaultRowHeight()).toBe(23);
  });

  it('should calculate the default row height for non-classic theme', () => {
    spec().rootElement.style.setProperty('--ht-line-height', '20px');
    spec().rootElement.style.setProperty('--ht-cell-vertical-padding', '5px');

    spec().wotInstance.destroy();
    walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    expect(spec().wotInstance.stylesHandler.getDefaultRowHeight()).toBe(31);
  });
});
