describe('AutoColumnSize', () => {
  const id = 'testContainer';
  const gridlineWidth = 1;

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  const arrayOfObjects = function() {
    return [
      { id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one', nestedData: [{ id: 1000 }] }
    ];
  };

  it('should apply auto size by default', () => {
    handsontable({
      data: arrayOfObjects()
    });

    const width0 = colWidth(spec().$container, 0);
    const width1 = colWidth(spec().$container, 1);
    const width2 = colWidth(spec().$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);
  });

  it('should accurately render the imposed column widths', () => {
    handsontable({
      data: arrayOfObjects()
    });

    expect(colWidth(spec().$container, 0)).toEqual(imposedColWidth(spec().$container, 0));
    expect(colWidth(spec().$container, 1)).toEqual(imposedColWidth(spec().$container, 1));
    expect(colWidth(spec().$container, 2)).toEqual(imposedColWidth(spec().$container, 2));
  });

  it('should update column width after update value in cell (array of objects)', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
        { data: 'lastName' },
      ]
    });

    expect(colWidth(spec().$container, 0)).toEqual(51);
    expect(colWidth(spec().$container, 1)).toEqual(121);
    expect(colWidth(spec().$container, 2)).toEqual(229);

    setDataAtRowProp(0, 'id', 'foo bar foo bar foo bar');
    setDataAtRowProp(0, 'name', 'foo');

    await sleep(50);

    expect(colWidth(spec().$container, 0)).toEqual(170);
    expect(colWidth(spec().$container, 1)).toEqual(50);
    expect(colWidth(spec().$container, 2)).toEqual(229);
  });

  it('should correctly detect column widths with colHeaders', () => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: ['Identifier Longer text'],
      columns: [
        { data: 'id' },
        { data: 'name' },
      ]
    });

    expect(colWidth(spec().$container, 0)).toEqual(157);
  });

  it('should correctly detect column widths after update colHeaders when headers were passed as an array', () => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
      ]
    });

    expect(colWidth(spec().$container, 0)).toEqual(51);

    updateSettings({ colHeaders: ['Identifier Longer text', 'Identifier Longer and longer text'] });

    expect(colWidth(spec().$container, 0)).toEqual(157);
    expect(colWidth(spec().$container, 1)).toEqual(236);
  });

  it('should correctly detect column widths after update colHeaders when headers were passed as a string', () => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
      ]
    });

    expect(colWidth(spec().$container, 0)).toEqual(51);

    updateSettings({ colHeaders: 'Identifier Longer text' });

    expect(colWidth(spec().$container, 0)).toEqual(157);
    expect(colWidth(spec().$container, 1)).toEqual(156);
  });

  it('should correctly detect column widths after update colHeaders when headers were passed as a function', () => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
      ]
    });

    expect(colWidth(spec().$container, 0)).toEqual(51);

    updateSettings({
      colHeaders(index) {
        return index === 0 ? 'Identifier Longer text' : 'Identifier Longer and longer text';
      },
    });

    expect(colWidth(spec().$container, 0)).toEqual(157);
    expect(colWidth(spec().$container, 1)).toEqual(236);
  });

  it('should correctly detect column width with colHeaders and the useHeaders option set to false (not taking the header widths into calculation)', () => {
    handsontable({
      data: [
        { id: 'ab' }
      ],
      autoColumnSize: {
        useHeaders: false
      },
      colHeaders: ['Identifier'],
      columns: [
        { data: 'id' }
      ]
    });

    expect(colWidth(spec().$container, 0)).toEqual(51);
  });

  it('should correctly detect column width with columns.title', () => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        { data: 'id', title: 'Identifier' }
      ]
    });

    expect(colWidth(spec().$container, 0)).toEqual(73);
  });

  it('should correctly detect column widths after update columns.title', () => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        { data: 'id', title: 'Identifier' }
      ]
    });

    updateSettings({
      columns: [
        { data: 'id', title: 'Identifier with longer text' },
      ],
    });

    expect(colWidth(spec().$container, 0)).toEqual(185);
  });

  // https://github.com/handsontable/handsontable/issues/2684
  it('should correctly detect column width when table is hidden on init (display: none)', async() => {
    spec().$container.css('display', 'none');
    const hot = handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: ['Identifier', 'First Name']
    });

    await sleep(200);

    spec().$container.css('display', 'block');
    hot.render();

    expect(colWidth(spec().$container, 0)).toEqual(73);
  });

  it('should not wrap the cell values when the whole column has values with the same length', () => {
    handsontable({
      data: [
        {
          units: 'EUR / USD'
        },
        {
          units: 'JPY / USD'
        },
        {
          units: 'GBP / USD'
        },
        {
          units: 'MXN / USD'
        },
        {
          units: 'ARS / USD'
        }
      ],
      autoColumnSize: {
        samplingRatio: 5,
      },
      columns: [
        { data: 'units' },
      ]
    });

    expect(colWidth(spec().$container, 0)).toEqual(94);
    expect(rowHeight(spec().$container, 0)).toBe(24);
    expect(rowHeight(spec().$container, 1)).toBe(23);
    expect(rowHeight(spec().$container, 2)).toBe(23);
    expect(rowHeight(spec().$container, 3)).toBe(23);
    expect(rowHeight(spec().$container, 4)).toBe(23);
  });

  it('should be possible to disable plugin using updateSettings', () => {
    handsontable({
      data: arrayOfObjects()
    });

    let width0 = colWidth(spec().$container, 0);
    let width1 = colWidth(spec().$container, 1);
    let width2 = colWidth(spec().$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);

    updateSettings({
      autoColumnSize: false
    });

    width0 = colWidth(spec().$container, 0);
    width1 = colWidth(spec().$container, 1);
    width2 = colWidth(spec().$container, 2);

    expect(width0 - gridlineWidth).toEqual(width1);
    expect(width0 - gridlineWidth).toEqual(width2);
    expect(width1).toEqual(width2);
  });

  it('should apply disabling/enabling plugin using updateSettings, only to a particular HOT instance', () => {
    spec().$container2 = $(`<div id="${id}-2"></div>`).appendTo('body');

    handsontable({
      data: arrayOfObjects()
    });

    spec().$container2.handsontable({
      data: arrayOfObjects()
    });

    const widths = {
      1: [],
      2: []
    };

    widths[1][0] = colWidth(spec().$container, 0);
    widths[1][1] = colWidth(spec().$container, 1);
    widths[1][2] = colWidth(spec().$container, 2);

    widths[2][0] = colWidth(spec().$container2, 0);
    widths[2][1] = colWidth(spec().$container2, 1);
    widths[2][2] = colWidth(spec().$container2, 2);

    expect(widths[1][0]).toBeLessThan(widths[1][1]);
    expect(widths[1][1]).toBeLessThan(widths[1][2]);

    expect(widths[2][0]).toBeLessThan(widths[2][1]);
    expect(widths[2][1]).toBeLessThan(widths[2][2]);

    updateSettings({
      autoColumnSize: false
    });

    widths[1][0] = colWidth(spec().$container, 0);
    widths[1][1] = colWidth(spec().$container, 1);
    widths[1][2] = colWidth(spec().$container, 2);

    widths[2][0] = colWidth(spec().$container2, 0);
    widths[2][1] = colWidth(spec().$container2, 1);
    widths[2][2] = colWidth(spec().$container2, 2);

    expect(widths[1][0] - gridlineWidth).toEqual(widths[1][1]);
    expect(widths[1][0] - gridlineWidth).toEqual(widths[1][2]);
    expect(widths[1][1]).toEqual(widths[1][2]);

    expect(widths[2][0]).toBeLessThan(widths[2][1]);
    expect(widths[2][1]).toBeLessThan(widths[2][2]);

    spec().$container2.handsontable('destroy');
    spec().$container2.remove();
  });

  it('should be possible to enable plugin using updateSettings', () => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: false
    });

    let width0 = colWidth(spec().$container, 0);
    let width1 = colWidth(spec().$container, 1);
    let width2 = colWidth(spec().$container, 2);

    expect(width0 - gridlineWidth).toEqual(width1);
    expect(width0 - gridlineWidth).toEqual(width2);
    expect(width1).toEqual(width2);

    updateSettings({
      autoColumnSize: true
    });

    width0 = colWidth(spec().$container, 0);
    width1 = colWidth(spec().$container, 1);
    width2 = colWidth(spec().$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);
  });

  it('should consider CSS style of each instance separately', () => {
    const $style = $('<style>.big .htCore td {font-size: 40px; line-height: 1.1;}</style>').appendTo('head');
    const $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable({
      data: arrayOfObjects()
    });
    const $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable({
      data: arrayOfObjects()
    });
    const hot1 = $container1.handsontable('getInstance');
    const hot2 = $container2.handsontable('getInstance');

    expect(colWidth($container1, 0)).toEqual(colWidth($container2, 0));

    $container1.addClass('big');
    hot1.render();
    hot2.render();
    expect(colWidth($container1, 0)).toBeGreaterThan(colWidth($container2, 0));

    $container1.removeClass('big').handsontable('render');
    $container2.addClass('big').handsontable('render');
    expect(colWidth($container1, 0)).toBeLessThan(colWidth($container2, 0));

    $style.remove();
    $container1.handsontable('destroy');
    $container1.remove();
    $container2.handsontable('destroy');
    $container2.remove();
  });

  it('should consider CSS class of the <table> element (e.g. when used with Bootstrap)', () => {
    const $style = $('<style>.htCore.big-table td {font-size: 32px}</style>').appendTo('head');

    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true
    });

    const width = colWidth(spec().$container, 0);

    spec().$container.find('table').addClass('big-table');
    render();
    expect(colWidth(spec().$container, 0)).toBeGreaterThan(width);

    $style.remove();
  });

  it('should destroy temporary element', () => {
    handsontable({
      autoColumnSize: true
    });

    expect(document.querySelector('.htAutoSize')).toBe(null);
  });

  it('should not trigger autoColumnSize when column width is defined (through colWidths)', () => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colWidths: [70, 70, 70],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    setDataAtCell(0, 0, 'LongLongLongLong');

    expect(colWidth(spec().$container, 0)).toBe(70);
  });

  it('should not trigger autoColumnSize when column width is defined (through columns.width)', () => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colWidth: 77,
      columns: [
        { width: 70 },
        { width: 70 },
        { width: 70 }
      ],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    setDataAtCell(0, 0, 'LongLongLongLong');

    expect(colWidth(spec().$container, 0)).toBe(70);
  });

  it('should consider renderer that uses conditional formatting for specific row & column index', () => {
    const data = arrayOfObjects();
    data.push({ id: '2', name: 'Rocket Man', lastName: 'In a tin can' });
    handsontable({
      data,
      columns: [
        { data: 'id' },
        { data: 'name' }
      ],
      autoColumnSize: true,
      renderer(instance, td, row, col, ...args) {
        // taken from demo/renderers.html
        Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, col, ...args]);
        if (row === 1 && col === 0) {
          td.style.padding = '100px';
        }
      }
    });

    expect(colWidth(spec().$container, 0)).toBeGreaterThan(colWidth(spec().$container, 1));
  });

  it('should\'t serialize value if it is array (nested data sources)', () => {
    const spy = jasmine.createSpy('renderer');

    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        { data: 'nestedData' }
      ],
      renderer: spy
    });

    expect(spy.calls.mostRecent().args[5]).toEqual([{ id: 1000 }]);
  });

  it('should not change width after select/click cell', async() => {
    handsontable({
      data: [
        ['Canceled'],
        ['Processing'],
        ['Processing'],
        ['Created'],
        ['Processing'],
        ['Completed']
      ],
      colHeaders: true,
      rowHeaders: true,
    });

    await sleep(300);

    const cloneTopHider = spec().$container.find('.ht_clone_top .wtHider');

    expect(cloneTopHider.width()).toEqual(140);

    selectCell(0, 0);

    await sleep(300);

    expect(cloneTopHider.width()).toEqual(140);
  });

  it('should not calculate any column widths, if there are no columns in the dataset', () => {
    handsontable({
      data: [[1, 2]],
      colHeaders: true,
    });

    spyOn(getPlugin('autoColumnSize'), 'calculateColumnsWidth').and.callThrough();
    const calculateColumnsWidth = getPlugin('autoColumnSize').calculateColumnsWidth;

    loadData([[]]);

    expect(calculateColumnsWidth).not.toHaveBeenCalled();
  });

  it('should keep proper column widths after inserting column', () => {
    handsontable({
      autoColumnSize: true,
      colHeaders: ['Short', 'Longer', 'The longest header']
    });

    expect(colWidth(spec().$container, 0)).toBe(51);
    expect(colWidth(spec().$container, 1)).toBe(60);
    expect(colWidth(spec().$container, 2)).toBe(148);

    alter('insert_col', 0);

    expect(colWidth(spec().$container, 0)).toBe(51); // Added new row here.
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(60);
    expect(colWidth(spec().$container, 3)).toBe(148);
    expect(colWidth(spec().$container, 4)).toBe(50);

    alter('insert_col', 3);

    expect(colWidth(spec().$container, 0)).toBe(51);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(60);
    expect(colWidth(spec().$container, 3)).toBe(50); // Added new row here.
    expect(colWidth(spec().$container, 4)).toBe(148);
    expect(colWidth(spec().$container, 5)).toBe(50);

    alter('insert_col', 5);

    expect(colWidth(spec().$container, 0)).toBe(51);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(60);
    expect(colWidth(spec().$container, 3)).toBe(50);
    expect(colWidth(spec().$container, 4)).toBe(148);
    expect(colWidth(spec().$container, 5)).toBe(50); // Added new row here.
    expect(colWidth(spec().$container, 6)).toBe(50);
  });

  it('should keep proper column widths after removing column', () => {
    handsontable({
      autoColumnSize: true,
      colHeaders: ['Short', 'Longer', 'The longest header']
    });

    expect(colWidth(spec().$container, 0)).toBe(51);
    expect(colWidth(spec().$container, 1)).toBe(60);
    expect(colWidth(spec().$container, 2)).toBe(148);
    expect(colWidth(spec().$container, 3)).toBe(50);

    alter('remove_col', 0);

    expect(colWidth(spec().$container, 0)).toBe(61);
    expect(colWidth(spec().$container, 1)).toBe(148);
    expect(colWidth(spec().$container, 2)).toBe(50);
  });

  it('should keep appropriate column size when columns order is changed', () => {
    const hot = handsontable({
      autoColumnSize: true,
      colHeaders: ['Short', 'Longer', 'The longest header']
    });

    hot.columnIndexMapper.moveIndexes(2, 1);
    render();

    expect(colWidth(spec().$container, 1)).toBe(148);
    expect(colWidth(spec().$container, 2)).toBe(60);

    hot.columnIndexMapper.moveIndexes(1, 2);
    render();

    expect(colWidth(spec().$container, 1)).toBe(60);
    expect(colWidth(spec().$container, 2)).toBe(148);
  });

  it('should keep appropriate column size when columns order is changed and some column is cleared', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 3),
      autoColumnSize: true,
      colHeaders: ['Short', 'Longer', 'The longest header']
    });

    hot.columnIndexMapper.moveIndexes(2, 1);
    render();

    expect(colWidth(spec().$container, 1)).toBe(148);
    expect(colWidth(spec().$container, 2)).toBe(60);

    hot.populateFromArray(0, 1, [[null], [null], [null], [null], [null]]); // Empty values on the second visual column.

    expect(colWidth(spec().$container, 1)).toBe(148);
    expect(colWidth(spec().$container, 2)).toBe(60);
  });

  describe('should cooperate with the `UndoRedo` plugin properly ', () => {
    it('when removing single column', () => {
      const hot = handsontable({
        data: [['Short', 'Somewhat long', 'The very very very longest one']],
        autoColumnSize: true,
      });

      alter('remove_col', 0);

      hot.undo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);

      hot.redo();

      expect(colWidth(spec().$container, 0)).toEqual(122);
      expect(colWidth(spec().$container, 1)).toEqual(229);

      hot.undo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);

      alter('remove_col', 1);

      hot.undo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);

      hot.redo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(229);

      hot.undo();

      alter('remove_col', 2);

      hot.undo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);

      hot.redo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
    });

    it('when inserting single column', () => {
      const hot = handsontable({
        data: [['Short', 'Somewhat long', 'The very very very longest one']],
        autoColumnSize: true,
      });

      alter('insert_col', 0);

      hot.undo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);

      hot.redo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(50);
      expect(colWidth(spec().$container, 2)).toEqual(121);
      expect(colWidth(spec().$container, 3)).toEqual(229);

      hot.undo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);

      alter('insert_col', 1);

      hot.undo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);

      hot.redo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(50);
      expect(colWidth(spec().$container, 2)).toEqual(121);
      expect(colWidth(spec().$container, 3)).toEqual(229);

      hot.undo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);

      alter('insert_col', 2);

      hot.undo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);

      hot.redo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(50);
      expect(colWidth(spec().$container, 3)).toEqual(229);

      hot.undo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);

      alter('insert_col', 3);

      hot.undo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);

      hot.redo();

      expect(colWidth(spec().$container, 0)).toEqual(51);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);
      expect(colWidth(spec().$container, 3)).toEqual(50);
    });

    it('when removing all rows', async() => {
      const hot = handsontable({
        data: arrayOfObjects(),
        autoColumnSize: true,
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ]
      });

      expect(colWidth(spec().$container, 0)).toEqual(73);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);

      hot.alter('remove_row', 0);

      hot.undo();

      expect(colWidth(spec().$container, 0)).toEqual(73);
      expect(colWidth(spec().$container, 1)).toEqual(121);
      expect(colWidth(spec().$container, 2)).toEqual(229);
    });
  });

  describe('should cooperate with the HiddenColumns plugin properly', () => {
    it('should display proper sizes for columns', () => {
      handsontable({
        data: arrayOfObjects(),
        autoColumnSize: true,
        columns: [
          { data: 'id' },
          { data: 'name' },
          { data: 'lastName' },
        ],
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
          indicators: true
        }
      });

      expect(colWidth(spec().$container, 0)).toBeAroundValue(50 + 15, 3);
      expect([216 + 15, 229 + 15, 247 + 15, 260 + 15, 261 + 15])
        .toEqual(jasmine.arrayContaining([colWidth(spec().$container, 1)])); // Renderable index 1 for helper.
    });
  });
});
