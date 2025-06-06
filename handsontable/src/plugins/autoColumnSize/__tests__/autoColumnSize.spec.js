import { HyperFormula } from 'hyperformula';

describe('AutoColumnSize', () => {
  const id = 'testContainer';

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

  it('should apply auto size by default', async() => {
    handsontable({
      data: arrayOfObjects()
    });

    const width0 = colWidth(spec().$container, 0);
    const width1 = colWidth(spec().$container, 1);
    const width2 = colWidth(spec().$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);
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

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(52);
      horizon.toBe(60);
    });
    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(92);
      main.toBe(115);
      horizon.toBe(123);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(173);
      main.toBe(210);
      horizon.toBe(218);
    });

    await setDataAtRowProp(0, 'id', 'foo bar foo bar foo bar');
    await setDataAtRowProp(0, 'name', 'foo');
    await sleep(50);

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(129);
      main.toBe(157);
      horizon.toBe(165);
    });
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(173);
      main.toBe(210);
      horizon.toBe(218);
    });
  });

  it('should correctly detect column widths with colHeaders', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: ['Identifier Longer text'],
      columns: [
        { data: 'id' },
        { data: 'name' },
      ]
    });

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(122);
      main.toBe(146);
      horizon.toBe(154);
    });
  });

  it('should correctly detect column widths after update colHeaders when headers were passed as an array', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
      ]
    });

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(52);
      horizon.toBe(60);
    });

    await updateSettings({ colHeaders: ['Identifier Longer text', 'Identifier Longer and longer text'] });

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(122);
      main.toBe(146);
      horizon.toBe(154);
    });
    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(180);
      main.toBeAroundValue(216);
      horizon.toBeAroundValue(224);
    });
  });

  it('should correctly detect column widths after update colHeaders when headers were passed as a string', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
      ]
    });

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(52);
      horizon.toBe(60);
    });

    await updateSettings({ colHeaders: 'Identifier Longer text' });

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(122);
      main.toBe(146);
      horizon.toBe(154);
    });
    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(122);
      main.toBe(146);
      horizon.toBe(154);
    });
  });

  it('should correctly detect column widths after update colHeaders when headers were passed as a function', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
      ]
    });

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(52);
      horizon.toBe(60);
    });

    await updateSettings({
      colHeaders(index) {
        return index === 0 ? 'Identifier Longer text' : 'Identifier Longer and longer text';
      },
    });

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(122);
      main.toBe(146);
      horizon.toBe(154);
    });
    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(180);
      main.toBeAroundValue(216);
      horizon.toBeAroundValue(224);
    });
  });

  it('should correctly detect column width with colHeaders and the useHeaders option set to false (not taking the header widths into calculation)', async() => {
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

    expect(colWidth(spec().$container, 0)).toBe(50);
  });

  it('should correctly detect column width with columns.title', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        { data: 'id', title: 'Identifier' }
      ]
    });

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(58);
      main.toBeAroundValue(72);
      horizon.toBeAroundValue(80);
    });
  });

  it('should correctly detect column widths after update columns.title', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        { data: 'id', title: 'Identifier' }
      ]
    });

    await updateSettings({
      columns: [
        { data: 'id', title: 'Identifier with longer text' },
      ],
    });

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(144);
      main.toBe(170);
      horizon.toBe(178);
    });
  });

  it('should correctly detect column width when table is hidden on init (display: none) #2684', async() => {
    spec().$container.css('display', 'none');

    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: ['Identifier', 'First Name']
    });

    await sleep(200);

    spec().$container.css('display', 'block');
    await render();

    await sleep(50);

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(58);
      main.toBeAroundValue(72);
      horizon.toBeAroundValue(80);
    });
  });

  it('should not change the column width after toggling the state of the checkbox cell type', async() => {
    handsontable({
      data: [
        {
          car: 'Mercedes A 160',
          available: true,
        },
        {
          car: 'Citroen C4 Coupe',
          available: false,
        },
      ],
      autoColumnSize: true,
      columns: [
        {
          data: 'available',
          type: 'checkbox',
          label: {
            position: 'after',
            property: 'car',
          },
        },
      ]
    });

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(123);
      main.toBe(151);
      horizon.toBe(161);
    });

    await setDataAtCell(0, 0, false);

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(123);
      main.toBe(151);
      horizon.toBe(161);
    });
  });

  it('should not wrap the cell values when the whole column has values with the same length', async() => {
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

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(77);
      main.toBe(91);
      horizon.toBe(99);
    });
    expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(24);
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(rowHeight(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(23);
      main.toBe(29);
      horizon.toBe(37);
    });
    expect(rowHeight(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(23);
      main.toBe(29);
      horizon.toBe(37);
    });
    expect(rowHeight(spec().$container, 3)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(23);
      main.toBe(29);
      horizon.toBe(37);
    });
    expect(rowHeight(spec().$container, 4)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(23);
      main.toBe(29);
      horizon.toBe(37);
    });
  });

  it('should be possible to disable plugin using updateSettings', async() => {
    handsontable({
      data: arrayOfObjects()
    });

    let width0 = colWidth(spec().$container, 0);
    let width1 = colWidth(spec().$container, 1);
    let width2 = colWidth(spec().$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);

    await updateSettings({
      autoColumnSize: false
    });

    width0 = colWidth(spec().$container, 0);
    width1 = colWidth(spec().$container, 1);
    width2 = colWidth(spec().$container, 2);

    expect(width0).toEqual(width1);
    expect(width0).toEqual(width2);
    expect(width1).toEqual(width2);
  });

  it('should apply disabling/enabling plugin using updateSettings, only to a particular HOT instance', async() => {
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

    await updateSettings({
      autoColumnSize: false
    });

    widths[1][0] = colWidth(spec().$container, 0);
    widths[1][1] = colWidth(spec().$container, 1);
    widths[1][2] = colWidth(spec().$container, 2);

    widths[2][0] = colWidth(spec().$container2, 0);
    widths[2][1] = colWidth(spec().$container2, 1);
    widths[2][2] = colWidth(spec().$container2, 2);

    expect(widths[1][0]).toEqual(widths[1][1]);
    expect(widths[1][0]).toEqual(widths[1][2]);
    expect(widths[1][1]).toEqual(widths[1][2]);

    expect(widths[2][0]).toBeLessThan(widths[2][1]);
    expect(widths[2][1]).toBeLessThan(widths[2][2]);

    spec().$container2.handsontable('destroy');
    spec().$container2.remove();
  });

  it('should be possible to enable plugin using updateSettings', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: false
    });

    let width0 = colWidth(spec().$container, 0);
    let width1 = colWidth(spec().$container, 1);
    let width2 = colWidth(spec().$container, 2);

    expect(width0).toEqual(width1);
    expect(width0).toEqual(width2);
    expect(width1).toEqual(width2);

    await updateSettings({
      autoColumnSize: true
    });

    width0 = colWidth(spec().$container, 0);
    width1 = colWidth(spec().$container, 1);
    width2 = colWidth(spec().$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);
  });

  it(`should keep proper topOverlay size after render() -> adjustElementSize() -> updateSettings
      with a different set of colHeaders`, async() => {
    const getHeaders = () => [
      'A_longer',
      'B_longer',
      'C_longer',
      'D_longer',
      'E_longer',
    ];

    handsontable({
      data: createSpreadsheetData(5, 5),
      colHeaders: getHeaders(),
      rowHeaders: true,
    });

    const topOverlay = spec().$container.find('.ht_clone_top .wtHider');
    const topOverlayWidthBefore = topOverlay.width();

    // Simulates a sequence of methods used in contextMenu commands for plugins like Hidden*, Freeze*
    // or internal plugins' methods like Filters, Manual*Move, Manual*Resize.
    await render();

    tableView().adjustElementsSize();

    await updateSettings({
      colHeaders: getHeaders().reverse(),
    });

    expect(topOverlayWidthBefore).toEqual(topOverlay.width());
  });

  it('should consider CSS style of each instance separately', async() => {
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

  it('should consider CSS class of the <table> element (e.g. when used with Bootstrap)', async() => {
    const $style = $('<style>.htCore.big-table td {font-size: 32px}</style>').appendTo('head');

    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true
    });

    const width = colWidth(spec().$container, 0);

    spec().$container.find('table').addClass('big-table');

    await render();

    expect(colWidth(spec().$container, 0)).toBeGreaterThan(width);

    $style.remove();
  });

  it('should destroy temporary element', async() => {
    handsontable({
      autoColumnSize: true
    });

    expect(document.querySelector('.htAutoSize')).toBe(null);
  });

  it('should not trigger autoColumnSize when column width is defined (through colWidths)', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colWidths: [70, 70, 70],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    await setDataAtCell(0, 0, 'LongLongLongLong');
    await sleep(50);

    expect(colWidth(spec().$container, 0)).toBe(70);
  });

  it('should not trigger autoColumnSize when column width is defined (through columns.width)', async() => {
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

    await setDataAtCell(0, 0, 'LongLongLongLong');
    await sleep(50);

    expect(colWidth(spec().$container, 0)).toBe(70);
  });

  it('should consider renderer that uses conditional formatting for specific row & column index', async() => {
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

  it('should\'t serialize value if it is array (nested data sources)', async() => {
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

    expect(cloneTopHider.width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(118);
      main.toBe(138);
      horizon.toBe(146);
    });

    await selectCell(0, 0);
    await sleep(300);

    expect(cloneTopHider.width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(118);
      main.toBe(138);
      horizon.toBe(146);
    });
  });

  it('should not calculate any column widths, if there are no columns in the dataset', async() => {
    handsontable({
      data: [[1, 2]],
      colHeaders: true,
    });

    spyOn(getPlugin('autoColumnSize'), 'calculateColumnsWidth').and.callThrough();
    const calculateColumnsWidth = getPlugin('autoColumnSize').calculateColumnsWidth;

    await loadData([[]]);

    expect(calculateColumnsWidth).not.toHaveBeenCalled();
  });

  it('should ignore calculate row heights for samples from hidden columns', async() => {
    const data = createSpreadsheetData(5, 3);

    data[2][0] = 'Very long text that causes the column to be wide';

    handsontable({
      data,
      rowHeaders: true,
      autoColumnSize: true,
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(2, true);

    await render();

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
  });

  it('should keep proper column widths after inserting column', async() => {
    handsontable({
      autoColumnSize: true,
      colHeaders: ['Short', 'Longer', 'The longest header']
    });

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(52);
      horizon.toBe(60);
    });
    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(62);
      horizon.toBe(70);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(109);
      main.toBe(139);
      horizon.toBe(147);
    });

    await alter('insert_col_start', 0);

    expect(colWidth(spec().$container, 0)).toBe(50); // Added new column here.
    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(52);
      horizon.toBe(60);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(62);
      horizon.toBe(70);
    });
    expect(colWidth(spec().$container, 3)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(109);
      main.toBe(139);
      horizon.toBe(147);
    });
    expect(colWidth(spec().$container, 4)).toBe(50);

    await alter('insert_col_start', 3);

    expect(colWidth(spec().$container, 0)).toBe(50);
    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(52);
      horizon.toBe(60);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(62);
      horizon.toBe(70);
    });
    expect(colWidth(spec().$container, 3)).toBe(50); // Added new column here.
    expect(colWidth(spec().$container, 4)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(109);
      main.toBe(139);
      horizon.toBe(147);
    });
    expect(colWidth(spec().$container, 5)).toBe(50);

    await alter('insert_col_start', 5);

    expect(colWidth(spec().$container, 0)).toBe(50);
    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(52);
      horizon.toBe(60);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(62);
      horizon.toBe(70);
    });
    expect(colWidth(spec().$container, 3)).toBe(50);
    expect(colWidth(spec().$container, 4)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(109);
      main.toBe(139);
      horizon.toBe(147);
    });
    expect(colWidth(spec().$container, 5)).toBe(50); // Added new column here.
    expect(colWidth(spec().$container, 6)).toBe(50);
  });

  it('should keep proper column widths after removing column', async() => {
    handsontable({
      autoColumnSize: true,
      colHeaders: ['Short', 'Longer', 'The longest header']
    });

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(52);
      horizon.toBe(60);
    });
    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(62);
      horizon.toBe(70);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(109);
      main.toBe(139);
      horizon.toBe(147);
    });
    expect(colWidth(spec().$container, 3)).toBe(50);

    await alter('remove_col', 0);

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(62);
      horizon.toBe(70);
    });
    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(109);
      main.toBe(139);
      horizon.toBe(147);
    });
    expect(colWidth(spec().$container, 2)).toBe(50);
  });

  it('should keep appropriate column size when columns order is changed', async() => {
    handsontable({
      autoColumnSize: true,
      colHeaders: ['Short', 'Longer', 'The longest header']
    });

    columnIndexMapper().moveIndexes(2, 1);
    await render();

    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(109);
      main.toBe(139);
      horizon.toBe(147);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(62);
      horizon.toBe(70);
    });

    columnIndexMapper().moveIndexes(1, 2);
    await render();

    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(62);
      horizon.toBe(70);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(109);
      main.toBe(139);
      horizon.toBe(147);
    });
  });

  it('should keep appropriate column size when columns order is changed and some column is cleared', async() => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      autoColumnSize: true,
      colHeaders: ['Short', 'Longer', 'The longest header']
    });

    columnIndexMapper().moveIndexes(2, 1);
    await render();

    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(109);
      main.toBe(139);
      horizon.toBe(147);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(62);
      horizon.toBe(70);
    });

    await populateFromArray(0, 1, [[null], [null], [null], [null], [null]]); // Empty values on the second visual column.

    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(109);
      main.toBe(139);
      horizon.toBe(147);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(62);
      horizon.toBe(70);
    });
  });

  it('should keep the viewport position unchanged after resetting all columns widths (#dev-1888)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 50),
      width: 400,
      height: 400,
      autoColumnSize: true,
      colHeaders: ['Longer header name'],
      rowHeaders: true,
    });

    await scrollViewportTo(0, 49);

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(2217);
      main.toBe(2322);
      horizon.toBe(2575);
    });

    await listen();
    await selectRows(2, 2);
    await keyDownUp('delete');

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(2217);
      main.toBe(2322);
      horizon.toBe(2575);
    });
  });

  describe('should cooperate with the `UndoRedo` plugin properly', () => {
    it('when removing single column', async() => {
      handsontable({
        data: [['Short', 'Somewhat long', 'The very very very longest one']],
        autoColumnSize: true,
      });

      await alter('remove_col', 0);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      await alter('remove_col', 1);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      getPlugin('undoRedo').undo();

      await alter('remove_col', 2);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
    });

    it('when inserting single column', async() => {
      handsontable({
        data: [['Short', 'Somewhat long', 'The very very very longest one']],
        autoColumnSize: true,
      });

      await alter('insert_col_start', 0);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).toBe(50);
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 3)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      await alter('insert_col_start', 1);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).toBe(50);
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 3)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      await alter('insert_col_start', 2);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).toBe(50);
      expect(colWidth(spec().$container, 3)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      await alter('insert_col_start', 3);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(52);
        horizon.toBe(60);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });
      expect(colWidth(spec().$container, 3)).toBe(50);
    });

    it('when removing all rows', async() => {
      handsontable({
        data: arrayOfObjects(),
        autoColumnSize: true,
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ]
      });

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBeAroundValue(58);
        main.toBeAroundValue(72);
        horizon.toBeAroundValue(80);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });

      await alter('remove_row', 0);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBeAroundValue(58);
        main.toBeAroundValue(72);
        horizon.toBeAroundValue(80);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(92);
        main.toBe(115);
        horizon.toBe(123);
      });
      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(173);
        main.toBe(210);
        horizon.toBe(218);
      });
    });
  });

  describe('should cooperate with the HiddenColumns plugin properly', () => {
    it('should display proper sizes for columns', async() => {
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

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(65);
        main.toBe(67);
        horizon.toBe(75);
      });
      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(188);
        main.toBe(225);
        horizon.toBe(233);
      });
    });
  });

  describe('samplingRatio', () => {
    it('should samplingRatio overwrites default samples count', async() => {
      handsontable({
        data: [
          ['iiiii'],
          ['aaaaa'],
          ['zzzzz'],
          ['WWWWW'],
        ],
        autoColumnSize: {
          samplingRatio: 4,
        },
      });

      expect(colWidth(spec().$container, 0)).toBeGreaterThan(60);
    });
  });

  describe('allowSampleDuplicates', () => {
    it('should add duplicated values', async() => {
      handsontable({
        data: [
          ['1'],
          ['1'],
        ],
        autoColumnSize: {
          allowSampleDuplicates: true,
        },
        renderer(hotInstance, td, row, column, prop, value) {
          const cellValue = row === 1 ? `${value}_WWWWW` : `${value}`;

          td.innerHTML = cellValue;
        }
      });

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBeAroundValue(95, 10);
        main.toBeAroundValue(95, 10);

        horizon.toBeAroundValue(100, 10); // Not sure if this result is by design or a result of a Horizon-only bug.
      });
    });
  });

  describe('modifyAutoColumnSizeSeed', () => {
    it('should overwrite native seed generation', async() => {
      handsontable({
        columns: [
          { data: 'lang' },
        ],
        data: [
          { lang: { code: 'en-bz', name: 'English (Belize)' } },
          { lang: { code: 'en-ie', name: 'English (Ireland)' } },
          { lang: { code: 'en-jm', name: 'English (Jamaica)' } },
          { lang: { code: 'en-gb', name: 'English (United Kingdom)' } },
        ],
        autoColumnSize: true,
        modifyAutoColumnSizeSeed(seed, cellMeta, cellValue) {
          return `${cellValue.code}`;
        },
        renderer(hotInstance, td, row, column, prop, value) {
          td.innerHTML = value.name;
        }
      });

      expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(150);
        main.toBe(177);
        horizon.toBe(185);
      });
    });
  });

  describe('should work together with formulas plugin', () => {
    it('should calculate widths only once during the initialization of Handsontable with formulas plugin enabled', async() => {
      const beforeInit = function() {
        spyOn(this.getPlugin('autoColumnSize').ghostTable, 'addColumn').and.callThrough();
      };

      Handsontable.hooks.add('beforeInit', beforeInit);

      handsontable({
        data: [[42], ['=A1']],
        formulas: {
          engine: HyperFormula
        },
      });

      expect(getPlugin('autoColumnSize').ghostTable.addColumn).toHaveBeenCalledTimes(1);
      Handsontable.hooks.remove('beforeInit', beforeInit);
    });

    it('should increase width if result become to be longer', async() => {
      handsontable({
        data: [
          [9, '=A1*500'],
          [8, '=A2*500'],
          [6, '=A3*500'],
        ],
        type: 'numeric',
        formulas: {
          engine: HyperFormula
        }
      });

      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(50);
        horizon.toBe(58);
      });

      await setDataAtCell(0, 0, 999999999999);
      await sleep(200);

      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(108);
        main.toBe(135);
        horizon.toBe(143);
      });
    });

    it('should decrease width if result become to be shorter', async() => {
      handsontable({
        data: [
          [999, '=A1*500'],
          [8, '=A2*500'],
          [6, '=A3*500'],
        ],
        type: 'numeric',
        formulas: {
          engine: HyperFormula
        }
      });

      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(65);
        horizon.toBe(73);
      });

      await setDataAtCell(0, 0, 9);
      await sleep(50);

      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(50);
        horizon.toBe(58);
      });
    });

    it('should change width if result become to be an error', async() => {
      handsontable({
        data: [
          [9, '=A1*500'],
          [8, '=A2*500'],
          [6, '=A3*500'],
        ],
        type: 'numeric',
        formulas: {
          engine: HyperFormula
        }
      });

      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(50);
        horizon.toBe(58);
      });

      await setDataAtCell(0, 0, 'not a number');
      await sleep(50);

      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(64);
        main.toBe(75);
        horizon.toBe(83);
      });
    });
  });
});
