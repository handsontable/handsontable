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

  it('should trigger rendering offset after the first column is fully displayed in the viewport (default setting)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
    });

    wt.draw();
    await scrollViewportHorizontally(200);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('d');

    await scrollViewportHorizontally(180);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('c');

    await scrollViewportHorizontally(140);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('b');
  });

  it('should trigger rendering offset after the last column is fully displayed in the viewport (default setting)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
    });

    wt.draw();

    expect(getTableMaster().find('tr:first td:last').text()).toBe('c');

    await scrollViewportHorizontally(40);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('d');

    await scrollViewportHorizontally(80);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('e');
  });

  it('should trigger rendering offset after the 3rd column from the start is fully displayed in the viewport', async() => {
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

    {
      const scrollLeftValues = [1500, 1450, 1400, 1350, 1300];

      for (const scrollLeft of scrollLeftValues) {
        await scrollViewportHorizontally(scrollLeft);

        wt.draw(true);

        expect(getTableMaster().find('tr:first td:first').text()).toBe('b1');
      }
    }

    await scrollViewportHorizontally(1250);

    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('q');

    {
      const scrollLeftValues = [1200, 1150, 1100, 1050, 1010];

      for (const scrollLeft of scrollLeftValues) {
        await scrollViewportHorizontally(scrollLeft);

        wt.draw(true);

        expect(getTableMaster().find('tr:first td:first').text()).toBe('q');
      }
    }

    await scrollViewportHorizontally(1000);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('l');

    {
      const scrollLeftValues = [950, 900, 850, 800, 760];

      for (const scrollLeft of scrollLeftValues) {
        await scrollViewportHorizontally(scrollLeft);

        wt.draw(true);

        expect(getTableMaster().find('tr:first td:first').text()).toBe('l');
      }
    }

    await scrollViewportHorizontally(750);

    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('g');
  });

  it('should trigger rendering offset after the 3rd column from the end is fully displayed in the viewport', async() => {
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

    {
      const scrollLeftValues = [100, 200, 260];

      for (const scrollLeft of scrollLeftValues) {
        await scrollViewportHorizontally(scrollLeft);

        wt.draw(true);

        expect(getTableMaster().find('tr:first td:last').text()).toBe('k');
      }
    }

    await scrollViewportHorizontally(270);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('q');

    {
      const scrollLeftValues = [300, 350, 400, 450, 500, 550];

      for (const scrollLeft of scrollLeftValues) {
        await scrollViewportHorizontally(scrollLeft);

        wt.draw(true);

        expect(getTableMaster().find('tr:first td:last').text()).toBe('q');
      }
    }

    await scrollViewportHorizontally(570);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('c1');

    {
      const scrollLeftValues = [600, 650, 700, 750, 800, 860];

      for (const scrollLeft of scrollLeftValues) {
        await scrollViewportHorizontally(scrollLeft);

        wt.draw(true);

        expect(getTableMaster().find('tr:first td:last').text()).toBe('c1');
      }
    }

    await scrollViewportHorizontally(870);

    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('i1');
  });

  it('should trigger rendering offset after the middle column in the offset from the start is fully displayed in the viewport', async() => {
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
    await scrollViewportHorizontally(1250);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('q');

    await scrollViewportHorizontally(1080);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('q');

    await scrollViewportHorizontally(1050);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('m');

    calcOverride.offset = 4;
    wt.draw();

    expect(getTableMaster().find('tr:first td:first').text()).toBe('q');

    await scrollViewportHorizontally(960);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('q');

    await scrollViewportHorizontally(940);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('n');
  });

  it('should trigger rendering offset after the middle column in the offset from the end is fully displayed in the viewport', async() => {
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

    await scrollViewportHorizontally(200);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('k');

    await scrollViewportHorizontally(220);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('p');

    calcOverride.offset = 4;
    wt.draw();

    expect(getTableMaster().find('tr:first td:last').text()).toBe('l');

    await scrollViewportHorizontally(350);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('l');

    await scrollViewportHorizontally(370);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:last').text()).toBe('o');
  });
});
