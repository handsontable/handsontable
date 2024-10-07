describe('viewportRowRenderingThreshold option', () => {
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

  it('should trigger rendering offset after the first row is fully displayed in the viewport (default setting)', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
    });

    wt.draw();
    setScrollTop(1000);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('43');

    setScrollTop(980);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('42');

    setScrollTop(960);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('41');
  });

  it('should trigger rendering offset after the last row is fully displayed in the viewport (default setting)', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
    });

    wt.draw();

    expect(getTableMaster().find('tr:last td:first').text()).toBe('8');

    setScrollTop(40);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('9');

    setScrollTop(50);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('10');
  });

  it('should trigger rendering offset after the 3rd row from the top is fully displayed in the viewport', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      viewportRowRenderingThreshold: 3,
      viewportRowCalculatorOverride(calc) {
        calc.startRow -= 8;
      }
    });

    wt.draw();

    [1000, 950, 900, 880].forEach((scrollTop) => {
      setScrollTop(scrollTop);
      wt.draw(true);

      expect(getTableMaster().find('tr:first td:first').text()).toBe('35');
    });

    setScrollTop(870);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('29');

    [850, 800, 740].forEach((scrollTop) => {
      setScrollTop(scrollTop);
      wt.draw(true);

      expect(getTableMaster().find('tr:first td:first').text()).toBe('29');
    });

    setScrollTop(730);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('23');

    [700, 650, 600].forEach((scrollTop) => {
      setScrollTop(scrollTop);
      wt.draw(true);

      expect(getTableMaster().find('tr:first td:first').text()).toBe('23');
    });

    setScrollTop(590);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('17');
  });

  it('should trigger rendering offset after the 3rd row from the bottom is fully displayed in the viewport', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      viewportRowRenderingThreshold: 3,
      viewportRowCalculatorOverride(calc) {
        calc.endRow += 8;
      }
    });

    wt.draw();

    [50, 100, 130].forEach((scrollTop) => {
      setScrollTop(scrollTop);
      wt.draw(true);

      expect(getTableMaster().find('tr:last td:first').text()).toBe('16');
    });

    setScrollTop(140);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('22');

    [150, 200, 250, 270].forEach((scrollTop) => {
      setScrollTop(scrollTop);
      wt.draw(true);

      expect(getTableMaster().find('tr:last td:first').text()).toBe('22');
    });

    setScrollTop(280);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('28');

    [300, 350, 410].forEach((scrollTop) => {
      setScrollTop(scrollTop);
      wt.draw(true);

      expect(getTableMaster().find('tr:last td:first').text()).toBe('28');
    });

    setScrollTop(415);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('34');
  });

  it('should trigger rendering offset after the middle row in the offset from the top is fully displayed in the viewport', () => {
    const calcOverride = { offset: 8 };
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      viewportRowRenderingThreshold: 'auto',
      viewportRowCalculatorOverride(calc) {
        calc.startRow -= calcOverride.offset;
      }
    });

    wt.draw();
    setScrollTop(1000);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('35');

    setScrollTop(900);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('35');

    setScrollTop(895);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('30');

    calcOverride.offset = 4;
    wt.draw();

    expect(getTableMaster().find('tr:first td:first').text()).toBe('34');

    setScrollTop(830);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('34');

    setScrollTop(825);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('31');
  });

  it('should trigger rendering offset after the middle row in the offset from the bottom is fully displayed in the viewport', () => {
    const calcOverride = { offset: 8 };
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      viewportRowRenderingThreshold: 'auto',
      viewportRowCalculatorOverride(calc) {
        calc.endRow += calcOverride.offset;
      }
    });

    wt.draw();

    expect(getTableMaster().find('tr:last td:first').text()).toBe('16');

    setScrollTop(110);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('16');

    setScrollTop(115);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('21');

    calcOverride.offset = 4;
    wt.draw();

    expect(getTableMaster().find('tr:last td:first').text()).toBe('17');

    setScrollTop(180);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('17');

    setScrollTop(185);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('20');
  });
});
