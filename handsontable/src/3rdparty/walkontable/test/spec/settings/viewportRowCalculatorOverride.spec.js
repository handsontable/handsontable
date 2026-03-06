describe('viewportRowCalculatorOverride option', () => {
  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(200).height(200);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 20);
  });

  afterEach(function() {
    $('.wtHolder').remove();
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should render offset when the first row is fully displayed in the viewport (default setting)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
    });

    wt.draw();
    await scrollViewportVertically(500);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('21');

    await scrollViewportVertically(480);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('20');

    await scrollViewportVertically(459);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('19');
  });

  it('should render offset when the last row is fully displayed in the viewport (default setting)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
    });

    wt.draw();

    expect(getTableMaster().find('tr:last td:first').text()).toBe('8');

    await scrollViewportVertically(30);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('9');

    await scrollViewportVertically(60);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('10');
  });

  it('should render offset when the first row is fully displayed in the viewport (custom offset)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      viewportRowCalculatorOverride(calc) {
        calc.startRow -= 2;
      }
    });

    wt.draw();
    await scrollViewportVertically(500);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('19');

    await scrollViewportVertically(430);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('16');

    await scrollViewportVertically(360);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('13');
  });

  it('should render offset when the last row is fully displayed in the viewport (custom offset)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      viewportRowCalculatorOverride(calc) {
        calc.endRow += 3;
      }
    });

    wt.draw();

    expect(getTableMaster().find('tr:last td:first').text()).toBe('11');

    await scrollViewportVertically(100);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('15');

    await scrollViewportVertically(190);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('19');
  });
});
