describe('stretchH option', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').css({ overflow: 'hidden' });
    this.$wrapper.width(500).height(201);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 4);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should stretch all visible columns when stretchH equals \'all\'', () => {
    createDataArray(20, 2);

    spec().$wrapper.width(500).height(400);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      stretchH: 'all',
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    expect(spec().$table.outerWidth()).toBeAroundValue(wt.wtTable.holder.clientWidth);
    // fix differences between Mac and Linux PhantomJS
    expect(spec().$table.find('col:eq(2)').width() - spec().$table.find('col:eq(1)').width()).toBeInArray([-1, 0, 1]);
  });

  it('should stretch all visible columns when stretchH equals \'all\' and window is resized', async() => {
    createDataArray(20, 2);

    spec().$wrapper.width(500).height(400);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      stretchH: 'all',
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    const initialTableWidth = spec().$table.outerWidth();
    expect(initialTableWidth).toBeAroundValue(spec().$table[0].clientWidth);

    spec().$wrapper.width(600).height(500);

    const evt = document.createEvent('CustomEvent'); // MUST be 'CustomEvent'

    evt.initCustomEvent('resize', false, false, null);
    window.dispatchEvent(evt);
    wt.draw();

    await sleep(300);

    const currentTableWidth = spec().$table.outerWidth();
    expect(currentTableWidth).toBeAroundValue(spec().$table[0].clientWidth);
    expect(currentTableWidth).toBeGreaterThan(initialTableWidth);
  });

  it('should stretch all visible columns when stretchH equals \'all\' (when rows are of variable height)', function() {
    createDataArray(20, 2);

    for (let i = 0, ilen = this.data.length; i < ilen; i++) {
      if (i % 2) {
        this.data[i][0] += ' this is a cell that contains a lot of text, which will make it multi-line';
      }
    }

    spec().$wrapper.width(300);
    spec().$wrapper.css({
      overflow: 'hidden'
    });

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      stretchH: 'all'
    });
    wt.draw();

    let expectedColWidth = ((300 - getScrollbarWidth()) / 2);
    expectedColWidth = Math.floor(expectedColWidth);

    const wtHider = spec().$table.parents('.wtHider');
    expect(wtHider.find('col:eq(0)').width()).toBeAroundValue(expectedColWidth);
    expect(wtHider.find('col:eq(1)').width() - expectedColWidth).toBeInArray([0, 1]); // fix differences between Mac and Linux PhantomJS
  });

  it('should stretch last visible column when stretchH equals \'last\' (vertical scroll)', () => {
    createDataArray(20, 2);

    spec().$wrapper.width(300).height(201);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      stretchH: 'last',
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    const wtHider = spec().$table.parents('.wtHider');
    expect(wtHider.outerWidth()).toBe(getTableWidth(spec().$table));
    expect(wtHider.find('col:eq(1)').width()).toBeLessThan(wtHider.find('col:eq(2)').width());
  });

  it('should stretch last column when stretchH equals \'last\' (horizontal scroll)', () => {
    createDataArray(5, 20);

    spec().$wrapper.width(400).height(201);
    spec().data[0][19] = 'longer text';

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      stretchH: 'last',
      columnHeaders: [function(index, TH) {
        TH.innerHTML = index + 1;
      }],
      columnWidth(index) {
        return index === 19 ? 100 : 50;
      }
    });

    wt.draw();
    wt.scrollViewportHorizontally(19);
    wt.draw();

    const wtHider = spec().$table.parents('.wtHider');

    expect(wtHider.find('col:eq(6)').width()).toBe(100);
  });

  it('should stretch last visible column when stretchH equals \'last\' (no scrolls)', () => {
    createDataArray(2, 2);

    spec().$wrapper.width(300).height(201);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      stretchH: 'last',
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    const wtHider = spec().$table.parents('.wtHider');
    expect(wtHider.outerWidth()).toBe(getTableWidth(spec().$table));
    expect(wtHider.find('col:eq(1)').width()).toBeLessThan(wtHider.find('col:eq(2)').width());
  });

  it('should not stretch when stretchH equals \'none\'', () => {
    createDataArray(20, 2);
    spec().$wrapper.width(300).height(201);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      stretchH: 'none',
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    expect(spec().$table.width()).toBeLessThan(spec().$wrapper.width());
    expect(spec().$table.find('col:eq(1)').width()).toBe(spec().$table.find('col:eq(2)').width());
  });

});
