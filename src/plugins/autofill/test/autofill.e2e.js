describe('AutoFill', () => {
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

  it('should appear when fillHandle equals true', () => {
    handsontable({
      fillHandle: true
    });

    selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should appear when fillHandle is enabled as `string` value', () => {
    handsontable({
      fillHandle: 'horizontal'
    });

    selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should render selection borders with set proper z-indexes', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    hot.selectCell(1, 1, 2, 2);

    expect(Handsontable.dom.getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .current')).zIndex).toBe('10');
    expect(Handsontable.dom.getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .area')).zIndex).toBe('8');
    expect(Handsontable.dom.getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .fill')).zIndex).toBe('6');
  });

  it('should not change cell value (drag vertically when fillHandle option is set to `horizontal`)', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: 'horizontal'
    });

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(1, 0)).toEqual(7);
  });

  it('should not change cell value (drag horizontally when fillHandle option is set to `vertical`)', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: 'vertical'
    });

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 1)).toEqual(2);
  });

  it('should work properly when fillHandle option is set to object with property `direction` set to `vertical`)', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'vertical'
      }
    });

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 1)).toEqual(2);

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(1, 0)).toEqual(1);
  });

  it('should work properly when fillHandle option is set to object with property `direction` set to `horizontal`)', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'horizontal'
      }
    });

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 1)).toEqual(1);

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(1, 0)).toEqual(7);
  });

  it('should not change cell value (drag when fillHandle is set to `false`)', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: false
    });

    // checking drag vertically - should not change cell value

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 1)).toEqual(2);

    // checking drag horizontally - should not change cell value

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 1)).toEqual(2);
  });

  it('should work properly when using updateSettings', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: 'horizontal'
    });

    updateSettings({ fillHandle: 'vertical' });

    // checking drag vertically - should change cell value

    selectCell(0, 0);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 1)).toEqual(2);

    updateSettings({ fillHandle: false });

    // checking drag vertically - should not change cell value

    selectCell(0, 1);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) td:eq(1)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(1, 1)).toEqual(8);

    // checking drag horizontally - should not change cell value

    selectCell(0, 1);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(2)').simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 2)).toEqual(3);
  });

  it('should appear when fillHandle is enabled as `object` value', () => {
    handsontable({
      fillHandle: {
        allowInsertRow: true
      }
    });

    selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should not appear when fillHandle equals false', () => {
    handsontable({
      fillHandle: false
    });
    selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should disappear when beginediting is triggered', () => {
    handsontable({
      fillHandle: true
    });
    selectCell(2, 2);

    keyDown('enter');

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should appear when finishediting is triggered', () => {
    handsontable({
      fillHandle: true
    });
    selectCell(2, 2);

    keyDown('enter');
    keyDown('enter');

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should not appear when fillHandle equals false and finishediting is triggered', () => {
    handsontable({
      fillHandle: false
    });
    selectCell(2, 2);

    keyDown('enter');
    keyDown('enter');

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should appear when editor is discarded using the ESC key', () => {
    handsontable({
      fillHandle: true
    });
    selectCell(2, 2);

    keyDown('enter');
    keyDown('esc');

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should add custom value after autofill', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill(start, end, data) {
        data[0][0] = 'test';
      }
    });
    selectCell(0, 0);

    spec().$container.find('.wtBorder.corner').simulate('mousedown');
    spec().$container.find('tr:eq(1) td:eq(0)').simulate('mouseover');
    spec().$container.find('tr:eq(2) td:eq(0)').simulate('mouseover');
    spec().$container.find('.wtBorder.corner').simulate('mouseup');

    expect(getSelected()).toEqual([[0, 0, 2, 0]]);
    expect(getDataAtCell(1, 0)).toEqual('test');
  });

  it('should use correct cell coordinates also when Handsontable is used inside a TABLE (#355)', () => {
    const $table = $('<table><tr><td></td></tr></table>').appendTo('body');
    spec().$container.appendTo($table.find('td'));

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill(start, end, data) {
        data[0][0] = 'test';
      }
    });
    selectCell(1, 1);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:eq(1) td:eq(0)').simulate('mouseover');
    spec().$container.find('tr:eq(2) td:eq(0)').simulate('mouseover');
    spec().$container.find('tr:eq(2) td:eq(0)').simulate('mouseup');

    expect(getSelected()).toEqual([[1, 1, 2, 1]]);
    expect(getDataAtCell(2, 1)).toEqual('test');

    document.body.removeChild($table[0]);
  });

  it('should fill cells below until the end of content in the neighbouring column with current cell\'s data', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, null, null, null, null],
        [1, 2, null, null, null, null]
      ]
    });

    selectCell(1, 3);
    const fillHandle = spec().$container.find('.wtBorder.current.corner')[0];
    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 3)).toEqual(null);
    expect(getDataAtCell(3, 3)).toEqual(null);

    selectCell(1, 2);
    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 2)).toEqual(3);
    expect(getDataAtCell(3, 2)).toEqual(3);
  });

  it('should fill cells below until the end of content in the neighbouring column with the currently selected area\'s data', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, null, null, null, null],
        [1, 2, null, null, null, null]
      ]
    });

    selectCell(1, 3, 1, 4);
    const fillHandle = spec().$container.find('.wtBorder.area.corner')[0];
    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 3)).toEqual(null);
    expect(getDataAtCell(3, 3)).toEqual(null);
    expect(getDataAtCell(2, 4)).toEqual(null);
    expect(getDataAtCell(3, 4)).toEqual(null);

    selectCell(1, 2, 1, 3);
    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 2)).toEqual(3);
    expect(getDataAtCell(3, 2)).toEqual(3);
    expect(getDataAtCell(2, 3)).toEqual(4);
    expect(getDataAtCell(3, 3)).toEqual(4);
  });

  it('shouldn\'t fill cells left #5023', () => {
    handsontable({
      data: [
        ['1', '2', '', '3', '4'],
        ['1', '', '', '', ''],
        ['1', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', '']
      ]
    });

    selectCell(0, 3);
    const fillHandle = spec().$container.find('.wtBorder.current.corner')[0];
    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(0, 3)).toEqual('3');
    expect(getDataAtCell(0, 2)).toEqual('');
    expect(getDataAtCell(0, 1)).toEqual('2');
    expect(getDataAtCell(0, 0)).toEqual('1');
  });

  it('should add new row after dragging the handle to the last table row', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: true
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    expect(hot.countRows()).toBe(4);

    await sleep(300);
    expect(hot.countRows()).toBe(5);

    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    await sleep(300);
    expect(hot.countRows()).toBe(6);
  });

  it('should add new row after dragging the handle to the last table row (autoInsertRow as true)', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        autoInsertRow: true,
      }
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    expect(hot.countRows()).toBe(4);

    await sleep(300);
    expect(hot.countRows()).toBe(5);

    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    await sleep(300);
    expect(hot.countRows()).toBe(6);
  });

  it('should add new row after dragging the handle to the last table row (autoInsertRow as true, vertical)', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'vertical',
        autoInsertRow: true,
      }
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    expect(hot.countRows()).toBe(4);

    await sleep(300);
    expect(hot.countRows()).toBe(5);

    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    await sleep(300);
    expect(hot.countRows()).toBe(6);
  });

  it('should not add new row after dragging the handle to the last table row (autoInsertRow as true, horizontal)', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'horizontal',
        autoInsertRow: true,
      }
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    expect(hot.countRows()).toBe(4);

    await sleep(300);

    expect(hot.countRows()).toBe(4);

    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    await sleep(300);

    expect(hot.countRows()).toBe(4);
  });

  it('should not add new row after dragging the handle below the viewport when `autoInsertRow` is disabled', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        autoInsertRow: false
      }
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    const ev = {};
    const $lastRow = spec().$container.find('tr:last-child td:eq(2)');

    expect(hot.countRows()).toBe(4);

    ev.clientX = $lastRow.offset().left / 2;
    ev.clientY = $lastRow.offset().top + 50;

    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(4);

    ev.clientY = $lastRow.offset().top + 150;
    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(4);
  });

  it('should not add new rows if the current number of rows reaches the maxRows setting', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        autoInsertRow: true
      },
      maxRows: 5
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    expect(hot.countRows()).toBe(4);

    await sleep(200);

    expect(hot.countRows()).toBe(5);

    spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    await sleep(200);

    expect(hot.countRows()).toBe(5);
  });

  it('should add new row after dragging the handle below the viewport', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        autoInsertRow: true
      },
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    const ev = {};
    const $lastRow = spec().$container.find('tr:last-child td:eq(2)');

    expect(hot.countRows()).toBe(4);

    ev.clientX = $lastRow.offset().left / 2;
    ev.clientY = $lastRow.offset().top + 50;

    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(5);

    ev.clientY = $lastRow.offset().top + 150;
    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(6);
  });

  it('should fill cells when dragging the handle to the headers', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 7, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      colHeaders: true,
      rowHeaders: true
    });

    // col headers:

    selectCell(2, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');

    let errors = 0;

    try {
      spec().$container.find('thead tr:first-child th:eq(2)').simulate('mouseover').simulate('mouseup');
    } catch (err) {
      errors += 1;
    }

    expect(errors).toEqual(0);
    expect(getDataAtCell(1, 2)).toEqual(7);
    expect(getDataAtCell(0, 2)).toEqual(7);

    expect($('.fill').filter(function() { return $(this).css('display') !== 'none'; }).length).toEqual(0); // check if fill selection is refreshed

    // row headers:
    selectCell(2, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');

    errors = 0;

    try {
      spec().$container.find('tbody tr:nth(2) th:first-child').simulate('mouseover').simulate('mouseup');
    } catch (err) {
      errors += 1;
    }

    expect(errors).toEqual(0);
    expect(getDataAtCell(2, 1)).toEqual(7);
    expect(getDataAtCell(2, 0)).toEqual(7);
    expect($('.fill').filter(function() { return $(this).css('display') !== 'none'; }).length).toEqual(0); // check if fill selection is refreshed
  });

  it('should not add a new row if dragging from the last row upwards or sideways', async() => {
    const mouseOverSpy = jasmine.createSpy('mouseOverSpy');
    const hot = handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      afterOnCellMouseOver: mouseOverSpy
    });

    selectCell(3, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:nth-child(3) td:eq(2)').simulate('mouseover');

    await sleep(300);
    expect(hot.countRows()).toBe(4);

    selectCell(3, 2);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:nth-child(4) td:eq(3)').simulate('mouseover');

    await sleep(200);

    expect(hot.countRows()).toBe(4);

    selectCell(3, 2);
    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    spec().$container.find('tr:nth-child(4) td:eq(1)').simulate('mouseover');

    await sleep(200);

    expect(hot.countRows()).toBe(4);
  });

  it('should add new row after dragging the handle below the viewport', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        autoInsertRow: true
      },
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    const ev = {};
    const $lastRow = spec().$container.find('tr:last-child td:eq(2)');

    expect(hot.countRows()).toBe(4);

    ev.clientX = $lastRow.offset().left / 2;
    ev.clientY = $lastRow.offset().top + 50;

    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(5);

    ev.clientY = $lastRow.offset().top + 150;
    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(6);
  });

  it('should not add new row after dragging the handle below the viewport (direction is set to horizontal)', async() => {
    const hot = handsontable({
      data: [
        [1, 2, 'test', 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: {
        direction: 'horizontal',
        autoInsertRow: true
      }
    });

    selectCell(0, 2);

    spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
    const ev = {};
    const $lastRow = spec().$container.find('tr:last-child td:eq(2)');

    expect(hot.countRows()).toBe(4);

    ev.clientX = $lastRow.offset().left / 2;
    ev.clientY = $lastRow.offset().top + 50;

    $(document.documentElement).simulate('mousemove', ev);

    await sleep(300);

    expect(hot.countRows()).toBe(4);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle upwards', () => {
    handsontable({
      data: [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, 2, 3, null],
        [null, 1, 4, null],
        [null, 0, 5, null],
        [null, null, null, null],
      ]
    });

    expect(JSON.stringify(getData(0, 1, 3, 2))).toEqual(JSON.stringify([[null, null], [null, null], [null, null], [null, null]]));

    selectCell(4, 1, 6, 2);
    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(0, 2, true)).simulate('mouseover').simulate('mouseup');

    expect(JSON.stringify(getData(0, 1, 3, 2))).toEqual(JSON.stringify([[0, 5], [2, 3], [1, 4], [0, 5]]));
  });

  it('should populate the filled data in the correct order, when dragging the fill handle towards left', () => {
    handsontable({
      data: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, 0, 1, 2],
        [null, null, null, null, null, 3, 4, 5],
        [null, null, null, null, null, null, null, null],
      ]
    });

    expect(JSON.stringify(getData(1, 1, 2, 4))).toEqual(JSON.stringify([[null, null, null, null], [null, null, null, null]]));

    selectCell(1, 5, 2, 7);
    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(2, 1, true)).simulate('mouseover').simulate('mouseup');

    expect(JSON.stringify(getData(1, 1, 2, 4))).toEqual(JSON.stringify([[2, 0, 1, 2], [5, 3, 4, 5]]));
  });

  it('should omitting data from hidden cells', () => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, null, null, null, null],
        [1, 2, null, null, null, null]
      ],
      hiddenColumns: {
        copyPasteEnabled: false,
        indicators: true,
        columns: [1]
      },
      hiddenRows: {
        copyPasteEnabled: false,
        rows: [1],
        indicators: true
      },
    });

    selectCell(0, 0, 0, 2);

    spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
    $(getCell(2, 2, true)).simulate('mouseover').simulate('mouseup');

    expect(getDataAtCell(0, 0)).toEqual(1);
    expect(getDataAtCell(0, 2)).toEqual(3);
    expect(getDataAtCell(2, 0)).toEqual(1);
    expect(getDataAtCell(2, 2)).toEqual(3);
  });

  describe('should works properly when two or more instances of Handsontable was initialized with other settings (#3257)', () => {
    let getData;
    let $container1;
    let $container2;

    beforeAll(() => {
      getData = () => [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ];

      $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable({
        data: getData(),
        fillHandle: true
      });

      $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable({
        data: getData(),
        fillHandle: 'horizontal'
      });
    });

    it('checking drag vertically on 1. instance of Handsontable - should change cell value', () => {
      $container1.handsontable('selectCell', 0, 0);
      $container1.find('.wtBorder.current.corner').simulate('mousedown');
      $container1.find('tbody tr:eq(1) td:eq(0)').simulate('mouseover').simulate('mouseup');

      expect($container1.handsontable('getDataAtCell', 1, 0)).toEqual(1);
    });

    describe('-> updating settings on 2. instance of Handsontable', () => {
      beforeAll(() => {
        $container2.handsontable('updateSettings', { fillHandle: 'vertical' });
      });

      it('checking drag vertically on 2. instance of Handsontable - should change cell value', () => {
        $container2.handsontable('selectCell', 0, 2);
        $container2.find('.wtBorder.current.corner').simulate('mousedown');
        $container2.find('tbody tr:eq(1) td:eq(2)').simulate('mouseover').simulate('mouseup');

        expect($container2.handsontable('getDataAtCell', 1, 2)).toEqual(3);
      });
    });

    afterAll(() => {
      // destroing containers

      $container1.handsontable('destroy');
      $container1.remove();

      $container2.handsontable('destroy');
      $container2.remove();
    });
  });
});
