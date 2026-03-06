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

  it('should trigger rendering offset after the first row is fully displayed in the viewport (default setting)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
    });

    wt.draw();
    await scrollViewportVertically(1000);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('43');

    await scrollViewportVertically(980);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('42');

    await scrollViewportVertically(960);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('41');
  });

  it('should trigger rendering offset after the last row is fully displayed in the viewport (default setting)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
    });

    wt.draw();

    expect(getTableMaster().find('tr:last td:first').text()).toBe('8');

    await scrollViewportVertically(40);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('9');

    await scrollViewportVertically(50);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('10');
  });

  it('should trigger rendering offset after the 3rd row from the top is fully displayed in the viewport', async() => {
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

    {
      const scrollTops = [1000, 950, 900, 880];

      for (const scrollTop of scrollTops) {
        await scrollViewportVertically(scrollTop);

        wt.draw(true);

        expect(getTableMaster().find('tr:first td:first').text()).toBe('35');
      }
    }

    await scrollViewportVertically(870);

    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('29');

    {
      const scrollTops = [850, 800, 740];

      for (const scrollTop of scrollTops) {
        await scrollViewportVertically(scrollTop);

        wt.draw(true);

        expect(getTableMaster().find('tr:first td:first').text()).toBe('29');
      }
    }

    await scrollViewportVertically(730);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('23');

    {
      const scrollTops = [700, 650, 600];

      for (const scrollTop of scrollTops) {
        await scrollViewportVertically(scrollTop);

        wt.draw(true);

        expect(getTableMaster().find('tr:first td:first').text()).toBe('23');
      }
    }

    await scrollViewportVertically(590);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('17');
  });

  it('should trigger rendering offset after the 3rd row from the bottom is fully displayed in the viewport', async() => {
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

    {
      const scrollTops = [50, 100, 130];

      for (const scrollTop of scrollTops) {
        await scrollViewportVertically(scrollTop);

        wt.draw(true);

        expect(getTableMaster().find('tr:last td:first').text()).toBe('16');
      }
    }

    await scrollViewportVertically(140);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('22');

    {
      const scrollTops = [150, 200, 250, 270];

      for (const scrollTop of scrollTops) {
        await scrollViewportVertically(scrollTop);

        wt.draw(true);

        expect(getTableMaster().find('tr:last td:first').text()).toBe('22');
      }
    }

    await scrollViewportVertically(280);

    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('28');

    {
      const scrollTops = [300, 350, 410];

      for (const scrollTop of scrollTops) {
        await scrollViewportVertically(scrollTop);

        wt.draw(true);

        expect(getTableMaster().find('tr:last td:first').text()).toBe('28');
      }
    }

    await scrollViewportVertically(415);

    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('34');
  });

  it('should trigger rendering offset after the middle row in the offset from the top is fully displayed in the viewport', async() => {
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
    await scrollViewportVertically(1000);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('35');

    await scrollViewportVertically(900);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('35');

    await scrollViewportVertically(895);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('30');

    calcOverride.offset = 4;
    wt.draw();

    expect(getTableMaster().find('tr:first td:first').text()).toBe('34');

    await scrollViewportVertically(830);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('34');

    await scrollViewportVertically(825);
    wt.draw(true);

    expect(getTableMaster().find('tr:first td:first').text()).toBe('31');
  });

  it('should trigger rendering offset after the middle row in the offset from the bottom is fully displayed in the viewport', async() => {
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

    await scrollViewportVertically(110);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('16');

    await scrollViewportVertically(115);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('21');

    calcOverride.offset = 4;
    wt.draw();

    expect(getTableMaster().find('tr:last td:first').text()).toBe('17');

    await scrollViewportVertically(180);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('17');

    await scrollViewportVertically(185);
    wt.draw(true);

    expect(getTableMaster().find('tr:last td:first').text()).toBe('20');
  });
});
