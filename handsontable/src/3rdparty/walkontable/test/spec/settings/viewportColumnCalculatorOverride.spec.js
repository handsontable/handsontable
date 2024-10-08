describe('viewportColumnCalculatorOverride option', () => {
  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(200).height(200);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(20, 50);
  });

  afterEach(function() {
    $('.wtHolder').remove();
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should render offset when the first column is fully displayed in the viewport (default setting)', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
    });

    wt.draw();
    setScrollLeft(200);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('d');

    setScrollLeft(180);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('c');

    setScrollLeft(140);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('b');
  });

  it('should render offset when the last column is fully displayed in the viewport (default setting)', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
    });

    wt.draw();

    expect(getTableMaster().find('tr:first td:last').text()).toBe('c');

    setScrollLeft(40);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('d');

    setScrollLeft(80);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('e');
  });

  it('should render offset when the first column is fully displayed in the viewport (custom offset)', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      viewportColumnCalculatorOverride(calc) {
        calc.startColumn -= 2;
      }
    });

    wt.draw();
    setScrollLeft(400);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('f');

    setScrollLeft(290);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('c');

    setScrollLeft(140);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('0');
  });

  it('should render offset when the last column is fully displayed in the viewport (custom offset)', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      viewportColumnCalculatorOverride(calc) {
        calc.endColumn += 3;
      }
    });

    wt.draw();

    expect(getTableMaster().find('tr:first td:last').text()).toBe('f');

    setScrollLeft(170);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('j');

    setScrollLeft(370);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('n');
  });
});
