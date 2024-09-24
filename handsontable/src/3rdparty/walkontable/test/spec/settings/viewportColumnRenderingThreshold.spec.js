describe('viewportColumnRenderingThreshold option', () => {
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

  it('should trigger rendering offset after the first column is fully displayed in the viewport (default setting)', () => {
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

  it('should trigger rendering offset after the last column is fully displayed in the viewport (default setting)', () => {
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

  it('should trigger rendering offset after the 3rd column from the start is fully displayed in the viewport', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      viewportColumnRenderingThreshold: 3,
      viewportColumnCalculatorOverride(calc) {
        calc.startColumn -= 8;
      }
    });

    wt.draw();

    [1500, 1450, 1400, 1350, 1300].forEach((scrollLeft) => {
      setScrollLeft(scrollLeft);
      wt.draw(true);

      expect(getTableMaster().find('tr:first td:first').text()).toBe('b1');
    });

    setScrollLeft(1250);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('q');

    [1200, 1150, 1100, 1050, 1010].forEach((scrollLeft) => {
      setScrollLeft(scrollLeft);
      wt.draw(true);

      expect(getTableMaster().find('tr:first td:first').text()).toBe('q');
    });

    setScrollLeft(1000);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('l');

    [950, 900, 850, 800, 760].forEach((scrollLeft) => {
      setScrollLeft(scrollLeft);
      wt.draw(true);

      expect(getTableMaster().find('tr:first td:first').text()).toBe('l');
    });

    setScrollLeft(750);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('g');
  });

  it('should trigger rendering offset after the 3rd column from the end is fully displayed in the viewport', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      viewportColumnRenderingThreshold: 3,
      viewportColumnCalculatorOverride(calc) {
        calc.endColumn += 8;
      }
    });

    wt.draw();

    [100, 200, 260].forEach((scrollLeft) => {
      setScrollLeft(scrollLeft);
      wt.draw(true);

      expect(getTableMaster().find('tr:first td:last').text()).toBe('k');
    });

    setScrollLeft(270);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('q');

    [300, 350, 400, 450, 500, 550].forEach((scrollLeft) => {
      setScrollLeft(scrollLeft);
      wt.draw(true);

      expect(getTableMaster().find('tr:first td:last').text()).toBe('q');
    });

    setScrollLeft(570);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('c1');

    [600, 650, 700, 750, 800, 860].forEach((scrollLeft) => {
      setScrollLeft(scrollLeft);
      wt.draw(true);

      expect(getTableMaster().find('tr:first td:last').text()).toBe('c1');
    });

    setScrollLeft(870);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('i1');
  });

  it('should trigger rendering offset after the middle column in the offset from the start is fully displayed in the viewport', () => {
    const calcOverride = { offset: 8 };
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      viewportColumnRenderingThreshold: 'auto',
      viewportColumnCalculatorOverride(calc) {
        calc.startColumn -= calcOverride.offset;
      }
    });

    wt.draw();
    setScrollLeft(1250);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('q');

    setScrollLeft(1080);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('q');

    setScrollLeft(1050);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('m');

    calcOverride.offset = 4;
    wt.draw();

    expect(getTableMaster().find('tr:first td:first').text()).toBe('q');

    setScrollLeft(960);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('q');

    setScrollLeft(940);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('n');
  });

  it('should trigger rendering offset after the middle column in the offset from the end is fully displayed in the viewport', () => {
    const calcOverride = { offset: 8 };
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      viewportColumnRenderingThreshold: 'auto',
      viewportColumnCalculatorOverride(calc) {
        calc.endColumn += calcOverride.offset;
      }
    });

    wt.draw();

    expect(getTableMaster().find('tr:first td:last').text()).toBe('k');

    setScrollLeft(200);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('k');

    setScrollLeft(220);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('p');

    calcOverride.offset = 4;
    wt.draw();

    expect(getTableMaster().find('tr:first td:last').text()).toBe('l');

    setScrollLeft(350);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('l');

    setScrollLeft(370);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('o');
  });
});
