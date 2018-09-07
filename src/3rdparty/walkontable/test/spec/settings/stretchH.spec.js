describe('stretchH option', () => {
  let $table;
  let $container;
  let $wrapper;
  const debug = false;

  beforeEach(() => {
    $wrapper = $('<div></div>').css({ overflow: 'hidden', position: 'relative' });
    $wrapper.width(500).height(201);
    $container = $('<div></div>');
    $table = $('<table></table>'); // create a table that is not attached to document
    $wrapper.append($container);
    $container.append($table);
    $wrapper.appendTo('body');
    createDataArray();
  });

  afterEach(() => {
    if (!debug) {
      $('.wtHolder').remove();
    }
    $wrapper.remove();
  });

  it('should stretch all visible columns when stretchH equals \'all\'', () => {
    createDataArray(20, 2);

    $wrapper.width(500).height(400);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      stretchH: 'all',
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    expect($table.outerWidth()).toBeAroundValue(wt.wtTable.holder.clientWidth);
    // fix differences between Mac and Linux PhantomJS
    expect($table.find('col:eq(2)').width() - $table.find('col:eq(1)').width()).toBeInArray([-1, 0, 1]);
  });

  it('should stretch all visible columns when stretchH equals \'all\' and window is resized', (done) => {
    createDataArray(20, 2);

    $wrapper.width(500).height(400);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      stretchH: 'all',
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    const initialTableWidth = $table.outerWidth();
    expect(initialTableWidth).toBeAroundValue($table[0].clientWidth);

    $wrapper.width(600).height(500);

    const evt = document.createEvent('CustomEvent'); // MUST be 'CustomEvent'
    evt.initCustomEvent('resize', false, false, null);
    window.dispatchEvent(evt);

    setTimeout(() => {
      const currentTableWidth = $table.outerWidth();
      expect(currentTableWidth).toBeAroundValue($table[0].clientWidth);
      expect(currentTableWidth).toBeGreaterThan(initialTableWidth);
      done();
    }, 10);
  });

  it('should stretch all visible columns when stretchH equals \'all\' (when rows are of variable height)', function() {
    createDataArray(20, 2);

    for (let i = 0, ilen = this.data.length; i < ilen; i++) {
      if (i % 2) {
        this.data[i][0] += ' this is a cell that contains a lot of text, which will make it multi-line';
      }
    }

    $wrapper.width(300);
    $wrapper.css({
      overflow: 'hidden'
    });

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      stretchH: 'all'
    });
    wt.draw();

    let expectedColWidth = ((300 - getScrollbarWidth()) / 2);
    expectedColWidth = Math.floor(expectedColWidth);

    const wtHider = $table.parents('.wtHider');
    expect(wtHider.find('col:eq(0)').width()).toBeAroundValue(expectedColWidth);
    expect(wtHider.find('col:eq(1)').width() - expectedColWidth).toBeInArray([0, 1]); // fix differences between Mac and Linux PhantomJS
  });

  it('should stretch last visible column when stretchH equals \'last\' (vertical scroll)', () => {
    createDataArray(20, 2);

    $wrapper.width(300).height(201);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      stretchH: 'last',
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    const wtHider = $table.parents('.wtHider');
    expect(wtHider.outerWidth()).toBe(getTableWidth($table));
    expect(wtHider.find('col:eq(1)').width()).toBeLessThan(wtHider.find('col:eq(2)').width());
  });

  it('should stretch last column when stretchH equals \'last\' (horizontal scroll)', () => {
    createDataArray(5, 20);

    $wrapper.width(400).height(201);
    spec().data[0][19] = 'longer text';

    const wt = new Walkontable.Core({
      table: $table[0],
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

    const wtHider = $table.parents('.wtHider');

    expect(wtHider.find('col:eq(6)').width()).toBe(100);
  });

  it('should stretch last visible column when stretchH equals \'last\' (no scrolls)', () => {
    createDataArray(2, 2);

    $wrapper.width(300).height(201);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      stretchH: 'last',
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    const wtHider = $table.parents('.wtHider');
    expect(wtHider.outerWidth()).toBe(getTableWidth($table));
    expect(wtHider.find('col:eq(1)').width()).toBeLessThan(wtHider.find('col:eq(2)').width());
  });

  it('should not stretch when stretchH equals \'none\'', () => {
    createDataArray(20, 2);
    $wrapper.width(300).height(201);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      stretchH: 'none',
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    expect($table.width()).toBeLessThan($wrapper.width());
    expect($table.find('col:eq(1)').width()).toBe($table.find('col:eq(2)').width());
  });

});
