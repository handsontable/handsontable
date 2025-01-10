describe('ColHeader', () => {
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

  it('should not show col headers by default', () => {
    handsontable();

    expect(spec().$container.find('thead th').length).toEqual(0);
  });

  it('should show col headers if true', () => {
    handsontable({
      colHeaders: true
    });

    expect(spec().$container.find('thead th').length).toBeGreaterThan(0);
  });

  it('should show col headers if height is set to "auto"', () => {
    handsontable({
      colHeaders: true,
      height: 'auto',
    });

    expect(spec().$container.find('.handsontable.ht_clone_top').height())
      .forThemes(({ classic, main }) => {
        classic.toEqual(26); // THs are 25px height and have 1px border on top
        main.toEqual(29);
      });
  });

  it('should properly calculate colHeaders\' overlay width', () => {
    handsontable({
      colHeaders: true,
      startCols: 5,
      startRows: 1,
      width: 250,
      height: 100,
      colWidths: 50,
    });

    const cloneTop = spec().$container.find('.ht_clone_top');
    const masterHolder = spec().$container.find('.ht_master .wtHolder');

    expect(cloneTop.width()).toBe(masterHolder.width());

    alter('insert_row_below', null, 10);

    expect(cloneTop.width()).toBeLessThan(masterHolder.width());
  });

  it('should show default columns headers labelled A-(Z * n)', () => {
    const startCols = 5;

    handsontable({
      startCols,
      colHeaders: true
    });

    const ths = getHtCore().find('thead th');

    expect(ths.length).toEqual(startCols);
    expect($.trim(ths.eq(0).text())).toEqual('A');
    expect($.trim(ths.eq(1).text())).toEqual('B');
    expect($.trim(ths.eq(2).text())).toEqual('C');
    expect($.trim(ths.eq(3).text())).toEqual('D');
    expect($.trim(ths.eq(4).text())).toEqual('E');
  });

  it('should show default columns headers labelled A-(Z * n) when columns as an array is present', () => {
    const startCols = 5;

    handsontable({
      startCols,
      colHeaders: true,
      columns: [{}, {}, {}, {}, {}]
    });

    const ths = getHtCore().find('thead th');

    expect(ths.length).toEqual(startCols);
    expect($.trim(ths.eq(0).text())).toEqual('A');
    expect($.trim(ths.eq(1).text())).toEqual('B');
    expect($.trim(ths.eq(2).text())).toEqual('C');
    expect($.trim(ths.eq(3).text())).toEqual('D');
    expect($.trim(ths.eq(4).text())).toEqual('E');
  });

  it('should show default columns headers labelled A-(Z * n) when columns as a function is present', () => {
    const startCols = 5;

    handsontable({
      startCols,
      colHeaders: true,
      columns() {
        return {};
      }
    });

    const ths = getHtCore().find('thead th');

    expect(ths.length).toEqual(startCols);
    expect($.trim(ths.eq(0).text())).toEqual('A');
    expect($.trim(ths.eq(1).text())).toEqual('B');
    expect($.trim(ths.eq(2).text())).toEqual('C');
    expect($.trim(ths.eq(3).text())).toEqual('D');
    expect($.trim(ths.eq(4).text())).toEqual('E');
  });

  it('should show col headers with custom label', () => {
    const startCols = 5;

    handsontable({
      startCols,
      colHeaders: ['First', 'Second', 'Third']
    });

    const ths = getHtCore().find('thead th');

    expect(ths.length).toEqual(startCols);
    expect($.trim(ths.eq(0).text())).toEqual('First');
    expect($.trim(ths.eq(1).text())).toEqual('Second');
    expect($.trim(ths.eq(2).text())).toEqual('Third');
    expect($.trim(ths.eq(3).text())).toEqual('D');
    expect($.trim(ths.eq(4).text())).toEqual('E');
  });

  it('should not show col headers if false', () => {
    handsontable({
      colHeaders: false
    });

    expect(spec().$container.find('th.htColHeader').length).toEqual(0);
  });

  it('should hide columns headers after updateSettings', () => {
    const hot = handsontable({
      startCols: 100,
      startRows: 100,
      width: 250,
      height: 200,
      colHeaders: true
    });
    let headers = getHtCore().find('thead th').length;

    expect(headers).toBeGreaterThan(0);
    expect(getTopClone().find('thead th').length).toBe(headers);

    hot.updateSettings({
      colHeaders: false
    });

    headers = getHtCore().find('thead th').length;

    expect(headers).toBe(0);
    expect(getTopClone().width()).toBe(0);
  });

  it('should show/hide columns headers after updateSettings', () => {
    const hot = handsontable({
      startCols: 5,
      colHeaders: true
    });

    expect(getHtCore().find('thead th').length).toEqual(5);
    expect(getTopClone().find('thead th').length).toEqual(5);

    hot.updateSettings({
      colHeaders: false
    });

    expect(getHtCore().find('thead th').length).toEqual(0);
    expect(getTopClone().width()).toEqual(0);

    hot.updateSettings({
      colHeaders: true
    });

    expect(getHtCore().find('thead th').length).toEqual(5);
    expect(getTopClone().width()).toBeGreaterThan(0);

    hot.updateSettings({
      colHeaders: false
    });

    expect(getHtCore().find('thead th').length).toEqual(0);
    expect(getTopClone().width()).toEqual(0);
  });

  it('should show columns headers after updateSettings', () => {
    const hot = handsontable({
      startCols: 5,
      colHeaders: false
    });

    expect(getHtCore().find('thead th').length).toEqual(0);
    expect(getTopClone().find('thead th').length).toEqual(0);

    hot.updateSettings({
      colHeaders: true
    });

    expect(getHtCore().find('thead th').length).toEqual(5);
    expect(getTopClone().find('thead th').length).toEqual(5);
  });

  it('should show new columns headers after updateSettings', () => {
    const hot = handsontable({
      startCols: 3,
      colHeaders: ['A', 'B', 'C']
    });

    const htCore = getHtCore();

    expect(htCore.find('thead th:eq(0)').text()).toEqual('A');
    expect(htCore.find('thead th:eq(1)').text()).toEqual('B');
    expect(htCore.find('thead th:eq(2)').text()).toEqual('C');

    hot.updateSettings({
      colHeaders: ['X', 'Y', 'Z']
    });

    expect(htCore.find('thead th:eq(0)').text()).toEqual('X');
    expect(htCore.find('thead th:eq(1)').text()).toEqual('Y');
    expect(htCore.find('thead th:eq(2)').text()).toEqual('Z');

  });

  it('should remove the column-headers-related css class from the Handsontable container after disabling the' +
    ' `colHeaders` option using the updateSettings method and add the same css class after re-enabling the option in' +
    ' the same way', () => {
    handsontable({
      startCols: 2,
      startRows: 2,
      colHeaders: true
    });

    expect(hot().rootElement.className).toContain('htColumnHeaders');

    hot().updateSettings({
      colHeaders: false
    });

    expect(hot().rootElement.className).not.toContain('htColumnHeaders');

    hot().updateSettings({
      colHeaders: true
    });

    expect(hot().rootElement.className).toContain('htColumnHeaders');
  });

  it('should be possible to define colHeaders with a function', () => {
    handsontable({
      startCols: 2,
      colHeaders(col) {
        switch (col) {
          case 0:
            return 'One';
          case 1:
            return 'Two';
          default:
            break;
        }
      }
    });

    const htCore = getHtCore();

    expect(htCore.find('thead th:eq(0)').text()).toEqual('One');
    expect(htCore.find('thead th:eq(1)').text()).toEqual('Two');
  });

  it('should be possible to set HTML in colHeaders', () => {
    handsontable({
      startCols: 2,
      colHeaders: ['One <input type="checkbox">', 'Two <input type="checkbox">']
    });

    const htCore = getHtCore();

    expect(htCore.find('thead th:eq(0) input[type=checkbox]').length).toEqual(1);
    expect(htCore.find('thead th:eq(1) input[type=checkbox]').length).toEqual(1);
  });

  it('should be possible to set colHeaders when columns array is present', () => {
    handsontable({
      startCols: 2,
      colHeaders: ['One', 'Two'],
      columns: [
        { type: 'text' },
        { type: 'text' }
      ]
    });

    const htCore = getHtCore();

    expect(htCore.find('thead th:eq(0)').text()).toEqual('One');
    expect(htCore.find('thead th:eq(1)').text()).toEqual('Two');
  });

  it('should be possible to set colHeaders when columns function is present', () => {
    handsontable({
      startCols: 2,
      colHeaders: ['One', 'Two'],
      columns(column) {
        let colMeta = { type: 'text' };

        if ([0, 1].indexOf(column) < 0) {
          colMeta = null;
        }

        return colMeta;
      }
    });

    const htCore = getHtCore();

    expect(htCore.find('thead th:eq(0)').text()).toEqual('One');
    expect(htCore.find('thead th:eq(1)').text()).toEqual('Two');
  });

  it('should be possible to set colHeaders using columns title property', () => {
    handsontable({
      startCols: 2,
      colHeaders: ['One', 'Two'],
      columns: [
        { type: 'text', title: 'Special title' },
        { type: 'text' }
      ]
    });

    const htCore = getHtCore();

    expect(htCore.find('thead th:eq(0)').text()).toEqual('Special title');
    expect(htCore.find('thead th:eq(1)').text()).toEqual('Two');
  });

  it('should be possible to set colHeaders using columns title property when columns is a function', () => {
    handsontable({
      startCols: 2,
      colHeaders: ['One', 'Two'],
      columns(column) {
        let colMeta = { type: 'text' };

        if (column === 0) {
          colMeta.title = 'Special title';
        }
        if ([0, 1].indexOf(column) < 0) {
          colMeta = null;
        }

        return colMeta;
      }
    });

    const htCore = getHtCore();

    expect(htCore.find('thead th:eq(0)').text()).toEqual('Special title');
    expect(htCore.find('thead th:eq(1)').text()).toEqual('Two');
  });

  it('should resize all the column headers in the overlays, according to the other overlays\' height', () => {
    handsontable({
      startCols: 5,
      colHeaders: ['a', 'a', 'a', 'a<BR>a', 'a'],
      fixedColumnsStart: 2
    });

    const topHeaderExample = $('.ht_clone_top').find('thead tr:first-child th:nth-child(1)');
    const masterHeaderExample = $('.ht_master').find('thead tr:first-child th:nth-child(3)');

    expect(topHeaderExample.height()).toEqual(masterHeaderExample.height());
  });

  it('should allow defining custom column header height using the columnHeaderHeight config option', () => {
    const hot = handsontable({
      startCols: 3,
      colHeaders: true,
      columnHeaderHeight: 40
    });

    hot.render();

    expect(spec().$container.find('th').eq(0).height()).forThemes(({ classic, main }) => {
      classic.toEqual(40);
      main.toEqual(39);
    });
  });

  it('should allow defining custom column header heights using the columnHeaderHeight config option, when multiple column header levels are defined', () => {
    const hot = handsontable({
      startCols: 3,
      colHeaders: true,
      columnHeaderHeight: [45, 65],
      afterGetColumnHeaderRenderers(array) {
        array.push((index, TH) => {
          TH.innerHTML = '';

          const div = document.createElement('div');
          const span = document.createElement('span');

          div.className = 'relative';
          span.className = 'colHeader';

          span.innerText = index;

          div.appendChild(span);
          TH.appendChild(div);
        });

        return array;
      }
    });

    hot.render();

    expect(spec().$container.find('.handsontable.ht_clone_top tr:nth-child(1) th:nth-child(1)').height())
      .forThemes(({ classic, main }) => {
        classic.toEqual(45);
        main.toEqual(43);
      });

    expect(spec().$container.find('.handsontable.ht_clone_top tr:nth-child(2) th:nth-child(1)').height()).toEqual(65);
  });

  it('should display auto-generated headers (the `colHeaders` is set to `true`) in the original order even when columns have been moved', () => {
    const hot = handsontable({
      rowHeaders: true,
      colHeaders: true,
      startCols: 3,
      startRows: 1
    });
    const htCore = getHtCore();

    hot.columnIndexMapper.setIndexesSequence([2, 1, 0]);
    hot.render();

    expect(htCore.find('thead th:eq(0)').text()).toEqual(' '); // Row header
    expect(htCore.find('thead th:eq(1)').text()).toEqual('A');
    expect(htCore.find('thead th:eq(2)').text()).toEqual('B');
    expect(htCore.find('thead th:eq(3)').text()).toEqual('C');
  });

  it('should move the defined headers with columns when the `colHeaders` option is set to a custom value and columns have been moved', () => {
    const hot = handsontable({
      rowHeaders: true,
      colHeaders: ['0', '1', '2'],
      startCols: 3,
      startRows: 1,
    });
    const htCore = getHtCore();

    hot.columnIndexMapper.setIndexesSequence([2, 1, 0]);
    hot.render();

    expect(htCore.find('thead th:eq(0)').text()).toEqual(' '); // Row header
    expect(htCore.find('thead th:eq(1)').text()).toEqual('2');
    expect(htCore.find('thead th:eq(2)').text()).toEqual('1');
    expect(htCore.find('thead th:eq(3)').text()).toEqual('0');
  });
});
