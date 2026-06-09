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

  it('should appear when fillHandle equals true', async() => {
    handsontable({
      fillHandle: true
    });

    await selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should appear when fillHandle is enabled as `string` value', async() => {
    handsontable({
      fillHandle: 'horizontal'
    });

    await selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should render selection borders with set proper z-indexes', async() => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    await selectCell(1, 1, 2, 2);

    expect(getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .current')).zIndex)
      .toBe('10');
    expect(getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .area')).zIndex)
      .toBe('8');
    expect(getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .fill')).zIndex)
      .toBe('6');
  });

  it('should fill the cells when dragging the handle triggered by row header selection', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: true,
    });

    await selectRows(1);

    const targetCell = spec().$container.find('tbody tr:eq(3) td:eq(5)');
    const corners = spec().$container.find('.wtBorder.current.corner').toArray();
    const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
    const fillHandle = [...corners, ...areaCorners]
      .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
    const handleRect = fillHandle.getBoundingClientRect();
    const targetRect = targetCell[0].getBoundingClientRect();

    $(fillHandle).simulate('mousedown', {
      clientX: handleRect.left + (handleRect.width / 2),
      clientY: handleRect.top + (handleRect.height / 2),
    });
    $(targetCell).simulate('mouseover').simulate('mousemove', {
      clientX: targetRect.left + (targetRect.width / 2),
      clientY: targetRect.top + (targetRect.height / 2),
    });
    $(document.body).simulate('mouseup');

    expect(getData()).toEqual([
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3],
    ]);
    expect(getSelected()).toEqual([[1, 0, 3, 5]]);
  });

  it('should fill the cells when dragging the handle triggered by column header selection', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: true,
    });

    await selectColumns(1);

    const targetCell = spec().$container.find('tbody tr:eq(3) td:eq(5)');
    const corners = spec().$container.find('.wtBorder.current.corner').toArray();
    const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
    const fillHandle = [...corners, ...areaCorners]
      .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
    const handleRect = fillHandle.getBoundingClientRect();
    const targetRect = targetCell[0].getBoundingClientRect();

    $(fillHandle).simulate('mousedown', {
      clientX: handleRect.left + (handleRect.width / 2),
      clientY: handleRect.top + (handleRect.height / 2),
    });
    $(targetCell).simulate('mouseover').simulate('mousemove', {
      clientX: targetRect.left + (targetRect.width / 2),
      clientY: targetRect.top + (targetRect.height / 2),
    });
    $(document.body).simulate('mouseup');

    expect(getData()).toEqual([
      [1, 2, 2, 2, 2, 2],
      [7, 8, 8, 8, 8, 8],
      [4, 5, 5, 5, 5, 5],
      [1, 2, 2, 2, 2, 2]
    ]);
    expect(getSelected()).toEqual([[0, 1, 3, 5]]);
  });

  it('should not change cell value (drag when fillHandle is set to `false`)', async() => {
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

    await selectCell(0, 0);
    simulateFillHandleDrag(spec().$container.find('tbody tr:eq(0) td:eq(1)'));

    expect(getDataAtCell(0, 1)).toEqual(2);

    // checking drag horizontally - should not change cell value

    await selectCell(0, 0);
    simulateFillHandleDrag(spec().$container.find('tbody tr:eq(0) td:eq(1)'));

    expect(getDataAtCell(0, 1)).toEqual(2);
  });

  it('should work properly when using updateSettings', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      fillHandle: 'horizontal'
    });

    await updateSettings({ fillHandle: 'vertical' });

    // checking drag vertically - should change cell value

    await selectCell(0, 0);
    simulateFillHandleDrag(spec().$container.find('tbody tr:eq(0) td:eq(1)'));

    expect(getDataAtCell(0, 1)).toEqual(2);

    await updateSettings({ fillHandle: false });

    // checking drag vertically - should not change cell value

    await selectCell(0, 1);
    simulateFillHandleDrag(spec().$container.find('tbody tr:eq(1) td:eq(1)'));

    expect(getDataAtCell(1, 1)).toEqual(8);

    // checking drag horizontally - should not change cell value

    await selectCell(0, 1);
    simulateFillHandleDrag(spec().$container.find('tbody tr:eq(0) td:eq(2)'));

    expect(getDataAtCell(0, 2)).toEqual(3);
  });

  it('should appear when fillHandle is enabled as `object` value', async() => {
    handsontable({
      fillHandle: {
        allowInsertRow: true
      }
    });

    await selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should not appear when fillHandle equals false', async() => {
    handsontable({
      fillHandle: false
    });
    await selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should disappear when beginediting is triggered', async() => {
    handsontable({
      fillHandle: true
    });

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should appear when finishediting is triggered', async() => {
    handsontable({
      fillHandle: true
    });

    await selectCell(2, 2);
    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should not appear when fillHandle equals false and finishediting is triggered', async() => {
    handsontable({
      fillHandle: false
    });

    await selectCell(2, 2);
    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should appear when editor is discarded using the ESC key', async() => {
    handsontable({
      fillHandle: true
    });

    await selectCell(2, 2);
    await keyDownUp('enter');
    await keyDownUp('escape');

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should use correct cell coordinates also when Handsontable is used inside a TABLE (#355)', async() => {
    const $table = $('<table><tr><td></td></tr></table>').appendTo('body');

    spec().$container.appendTo($table.find('td'));

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill(selectionData) {
        selectionData[0][0] = 'test';
      }
    });
    await selectCell(1, 1);

    simulateFillHandleDrag($(getCell(2, 1, true)));

    expect(getSelected()).toEqual([[1, 1, 2, 1]]);
    expect(getDataAtCell(2, 1)).toEqual('test');

    document.body.removeChild($table[0]);
  });

  it('should fill empty cells below until the end of content in the neighbouring column with current cell\'s data', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, null, null, null, null],
        [1, 2, null, null, null, null]
      ]
    });

    await selectCell(1, 3);

    const fillHandle = spec().$container.find('.wtBorder.current.corner')[0];

    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 3)).toEqual(null);
    expect(getDataAtCell(3, 3)).toEqual(null);

    await selectCell(1, 2);
    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 2)).toEqual(3);
    expect(getDataAtCell(3, 2)).toEqual(3);
  });

  // https://github.com/handsontable/dev-handsontable/issues/1757
  it('should fill empty cells below until the end of content in the neighbouring column with current cell\'s data' +
    'and NOT treat cells filled with 0s as empty', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 0, 4, 5, 6],
        [1, 2, 0, null, null, null],
        [1, 2, 0, null, null, null],
        [1, 2, null, null, null, null]
      ]
    });

    await selectCell(0, 2);

    const fillHandle = spec().$container.find('.wtBorder.current.corner')[0];

    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(1, 2)).toEqual(0);
    expect(getDataAtCell(2, 2)).toEqual(0);
    expect(getDataAtCell(3, 2)).toEqual(0);
    expect(getDataAtCell(4, 2)).toEqual(null);

    await selectCell(1, 3);
    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 3)).toEqual(4);
    expect(getDataAtCell(3, 3)).toEqual(4);
    expect(getDataAtCell(4, 3)).toEqual(null);
  });

  it('should fill cells below until the end of content in the neighbouring column with the currently selected area\'s data', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, null, null, null, null],
        [1, 2, null, null, null, null]
      ]
    });

    await selectCell(1, 3, 1, 4);

    const fillHandle = spec().$container.find('.wtBorder.area.corner')[0];

    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 3)).toEqual(null);
    expect(getDataAtCell(3, 3)).toEqual(null);
    expect(getDataAtCell(2, 4)).toEqual(null);
    expect(getDataAtCell(3, 4)).toEqual(null);

    await selectCell(1, 2, 1, 3);
    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2, 2)).toEqual(3);
    expect(getDataAtCell(3, 2)).toEqual(3);
    expect(getDataAtCell(2, 3)).toEqual(4);
    expect(getDataAtCell(3, 3)).toEqual(4);
  });

  it('shouldn\'t fill cells left #5023', async() => {
    handsontable({
      data: [
        ['1', '2', '', '3', '4'],
        ['1', '', '', '', ''],
        ['1', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', '']
      ]
    });

    await selectCell(0, 3);
    const fillHandle = spec().$container.find('.wtBorder.current.corner')[0];

    await mouseDoubleClick(fillHandle);

    expect(getDataAtCell(0, 3)).toEqual('3');
    expect(getDataAtCell(0, 2)).toEqual('');
    expect(getDataAtCell(0, 1)).toEqual('2');
    expect(getDataAtCell(0, 0)).toEqual('1');
  });

  it('should fill cells when dragging the handle to the headers', async() => {
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

    await selectCell(2, 2);

    {
      // With rowHeaders: true, th:eq(0) is the top-left corner cell, so the
      // column-2 header is at th:eq(3), not th:eq(2).
      const targetCell = $(getCell(-1, 2, true));
      let errors = 0;

      simulateFillHandleDragStart(targetCell);

      try {
        simulateFillHandleDragMove(targetCell);
        simulateFillHandleDragFinish(targetCell);
      } catch (err) {
        errors += 1;
      }

      expect(errors).toEqual(0);
    }

    expect(getDataAtCell(1, 2)).toEqual(7);
    expect(getDataAtCell(0, 2)).toEqual(7);

    expect($('.fill').filter(function() { return $(this).css('display') !== 'none'; }).length).toEqual(0); // check if fill selection is refreshed

    // row headers:
    await selectCell(2, 2);

    {
      const targetCell = $(getCell(2, -1, true));
      let errors = 0;

      simulateFillHandleDragStart(targetCell);

      try {
        simulateFillHandleDragMove(targetCell);
        simulateFillHandleDragFinish(targetCell);
      } catch (err) {
        errors += 1;
      }

      expect(errors).toEqual(0);
    }

    expect(getDataAtCell(2, 1)).toEqual(7);
    expect(getDataAtCell(2, 0)).toEqual(7);
    expect($('.fill').filter(function() { return $(this).css('display') !== 'none'; }).length).toEqual(0); // check if fill selection is refreshed
  });

  it('should populate the filled data in the correct order, when dragging the fill handle upwards (selection from left to right)', async() => {
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

    await selectCell(4, 1, 6, 2);

    {
      const targetCell = $(getCell(0, 2));
      const corners = spec().$container.find('.wtBorder.current.corner').toArray();
      const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
      const fillHandle = [...corners, ...areaCorners]
        .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
      const handleRect = fillHandle.getBoundingClientRect();
      const targetRect = targetCell[0].getBoundingClientRect();

      $(fillHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });
      $(targetCell).simulate('mouseover').simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
      $(document.body).simulate('mouseup');
    }

    expect(getData()).toEqual([
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle upwards (selection from right to left)', async() => {
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

    await selectCell(6, 2, 4, 1);

    {
      const targetCell = $(getCell(0, 2));
      const corners = spec().$container.find('.wtBorder.current.corner').toArray();
      const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
      const fillHandle = [...corners, ...areaCorners]
        .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
      const handleRect = fillHandle.getBoundingClientRect();
      const targetRect = targetCell[0].getBoundingClientRect();

      $(fillHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });
      $(targetCell).simulate('mouseover').simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
      $(document.body).simulate('mouseup');
    }

    expect(getData()).toEqual([
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle downward (selection from left to right)', async() => {
    handsontable({
      data: [
        [null, null, null, null],
        [null, 2, 3, null],
        [null, 1, 4, null],
        [null, 0, 5, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]
    });

    await selectCell(1, 1, 3, 2);

    simulateFillHandleDrag($(getCell(7, 2, true)));

    expect(getData()).toEqual([
      [null, null, null, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle downward (selection from right to left)', async() => {
    handsontable({
      data: [
        [null, null, null, null],
        [null, 2, 3, null],
        [null, 1, 4, null],
        [null, 0, 5, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]
    });

    await selectCell(3, 2, 1, 1);

    {
      const targetCell = $(getCell(7, 2));
      const corners = spec().$container.find('.wtBorder.current.corner').toArray();
      const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
      const fillHandle = [...corners, ...areaCorners]
        .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
      const handleRect = fillHandle.getBoundingClientRect();
      const targetRect = targetCell[0].getBoundingClientRect();

      $(fillHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });
      $(targetCell).simulate('mouseover').simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
      $(document.body).simulate('mouseup');
    }

    expect(getData()).toEqual([
      [null, null, null, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
      [null, 1, 4, null],
      [null, 0, 5, null],
      [null, 2, 3, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle towards left (selection from left to right)', async() => {
    handsontable({
      data: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, 0, 1, 2, null],
        [null, null, null, null, 3, 4, 5, null],
        [null, null, null, null, null, null, null, null],
      ]
    });

    await selectCell(1, 4, 2, 6);

    {
      const targetCell = $(getCell(2, 0));
      const corners = spec().$container.find('.wtBorder.current.corner').toArray();
      const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
      const fillHandle = [...corners, ...areaCorners]
        .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
      const handleRect = fillHandle.getBoundingClientRect();
      const targetRect = targetCell[0].getBoundingClientRect();

      $(fillHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });
      $(targetCell).simulate('mouseover').simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
      $(document.body).simulate('mouseup');
    }

    expect(getData()).toEqual([
      [null, null, null, null, null, null, null, null],
      [2, 0, 1, 2, 0, 1, 2, null],
      [5, 3, 4, 5, 3, 4, 5, null],
      [null, null, null, null, null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle towards left (selection from right to left)', async() => {
    handsontable({
      data: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, 0, 1, 2, null],
        [null, null, null, null, 3, 4, 5, null],
        [null, null, null, null, null, null, null, null],
      ]
    });

    await selectCell(2, 6, 1, 4);

    {
      const targetCell = $(getCell(2, 0));
      const corners = spec().$container.find('.wtBorder.current.corner').toArray();
      const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
      const fillHandle = [...corners, ...areaCorners]
        .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
      const handleRect = fillHandle.getBoundingClientRect();
      const targetRect = targetCell[0].getBoundingClientRect();

      $(fillHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });
      $(targetCell).simulate('mouseover').simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
      $(document.body).simulate('mouseup');
    }

    expect(getData()).toEqual([
      [null, null, null, null, null, null, null, null],
      [2, 0, 1, 2, 0, 1, 2, null],
      [5, 3, 4, 5, 3, 4, 5, null],
      [null, null, null, null, null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle towards right (selection from left to right)', async() => {
    handsontable({
      data: [
        [null, null, null, null, null, null, null, null],
        [null, 0, 1, 2, null, null, null, null],
        [null, 3, 4, 5, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ]
    });

    await selectCell(1, 1, 2, 3);

    {
      const targetCell = $(getCell(2, 7));
      const corners = spec().$container.find('.wtBorder.current.corner').toArray();
      const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
      const fillHandle = [...corners, ...areaCorners]
        .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
      const handleRect = fillHandle.getBoundingClientRect();
      const targetRect = targetCell[0].getBoundingClientRect();

      $(fillHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });
      $(targetCell).simulate('mouseover').simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
      $(document.body).simulate('mouseup');
    }

    expect(getData()).toEqual([
      [null, null, null, null, null, null, null, null],
      [null, 0, 1, 2, 0, 1, 2, 0],
      [null, 3, 4, 5, 3, 4, 5, 3],
      [null, null, null, null, null, null, null, null],
    ]);
  });

  it('should populate the filled data in the correct order, when dragging the fill handle towards right (selection from right to left)', async() => {
    handsontable({
      data: [
        [null, null, null, null, null, null, null, null],
        [null, 0, 1, 2, null, null, null, null],
        [null, 3, 4, 5, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ]
    });

    await selectCell(2, 3, 1, 1);

    {
      const targetCell = $(getCell(2, 7));
      const corners = spec().$container.find('.wtBorder.current.corner').toArray();
      const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
      const fillHandle = [...corners, ...areaCorners]
        .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
      const handleRect = fillHandle.getBoundingClientRect();
      const targetRect = targetCell[0].getBoundingClientRect();

      $(fillHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });
      $(targetCell).simulate('mouseover').simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
      $(document.body).simulate('mouseup');
    }

    expect(getData()).toEqual([
      [null, null, null, null, null, null, null, null],
      [null, 0, 1, 2, 0, 1, 2, 0],
      [null, 3, 4, 5, 3, 4, 5, 3],
      [null, null, null, null, null, null, null, null],
    ]);
  });

  it('should omit data propagation for hidden cells - fill vertically (option `copyPasteEnabled` set to `false` for the both plugins)', async() => {
    handsontable({
      data: [
        [0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [2, 2, null, null, null, null],
        [3, 3, null, null, null, null]
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

    await selectCell(0, 0, 0, 2);

    {
      const targetCell = $(getCell(2, 2, true));
      const corners = spec().$container.find('.wtBorder.current.corner').toArray();
      const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
      const fillHandle = [...corners, ...areaCorners]
        .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
      const handleRect = fillHandle.getBoundingClientRect();
      const targetRect = targetCell[0].getBoundingClientRect();

      $(fillHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });
      $(targetCell).simulate('mouseover').simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
      $(document.body).simulate('mouseup');
    }

    expect(getDataAtCell(0, 0)).toEqual(0);
    expect(getDataAtCell(0, 1)).toEqual(0);
    expect(getDataAtCell(0, 2)).toEqual(0);

    expect(getDataAtCell(1, 0)).toEqual(1); // Hidden row, no real change.
    expect(getDataAtCell(1, 1)).toEqual(1); // Hidden column and row, no real change.
    expect(getDataAtCell(1, 2)).toEqual(1); // Hidden row, no real change.

    expect(getDataAtCell(2, 0)).toEqual(0);
    expect(getDataAtCell(2, 1)).toEqual(2); // Hidden column, no real change.
    expect(getDataAtCell(2, 2)).toEqual(0);

    expect(getData()).toEqual([
      [0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1],
      [0, 2, 0, null, null, null],
      [3, 3, null, null, null, null]
    ]); // Extra test for checking wrong data propagation.
  });

  it('should propagate data for hidden cells - fill vertically (option `copyPasteEnabled` set to `true` for the both plugins)', async() => {
    handsontable({
      data: [
        [0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [2, 2, null, null, null, null],
        [3, 3, null, null, null, null]
      ],
      hiddenColumns: {
        copyPasteEnabled: true,
        indicators: true,
        columns: [1]
      },
      hiddenRows: {
        copyPasteEnabled: true,
        rows: [1],
        indicators: true
      },
    });

    await selectCell(0, 0, 0, 2);

    {
      const targetCell = $(getCell(2, 2, true));
      const corners = spec().$container.find('.wtBorder.current.corner').toArray();
      const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
      const fillHandle = [...corners, ...areaCorners]
        .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
      const handleRect = fillHandle.getBoundingClientRect();
      const targetRect = targetCell[0].getBoundingClientRect();

      $(fillHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });
      $(targetCell).simulate('mouseover').simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
      $(document.body).simulate('mouseup');
    }

    expect(getDataAtCell(0, 0)).toEqual(0);
    expect(getDataAtCell(0, 1)).toEqual(0);
    expect(getDataAtCell(0, 2)).toEqual(0);

    expect(getDataAtCell(1, 0)).toEqual(0); // Hidden row, there was change.
    expect(getDataAtCell(1, 1)).toEqual(0); // Hidden column and row, there was change.
    expect(getDataAtCell(1, 2)).toEqual(0); // Hidden row, there was change.

    expect(getDataAtCell(2, 0)).toEqual(0);
    expect(getDataAtCell(2, 1)).toEqual(0); // Hidden column, there was change.
    expect(getDataAtCell(2, 2)).toEqual(0);

    expect(getData()).toEqual([
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1],
      [0, 0, 0, null, null, null],
      [3, 3, null, null, null, null]
    ]); // Extra test for checking wrong data propagation.
  });

  it('should omit data propagation for hidden cells - fill horizontally (option `copyPasteEnabled` set to `false` for the both plugins)', async() => {
    handsontable({
      data: [
        [0, 1, 2, 3, 4, 5],
        [0, 1, 2, 3, 4, 5],
        [0, 1, null, null, null, null],
        [0, 1, null, null, null, null]
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

    await selectCell(0, 0, 2, 0);

    {
      const targetCell = $(getCell(2, 2, true));
      const corners = spec().$container.find('.wtBorder.current.corner').toArray();
      const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
      const fillHandle = [...corners, ...areaCorners]
        .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
      const handleRect = fillHandle.getBoundingClientRect();
      const targetRect = targetCell[0].getBoundingClientRect();

      $(fillHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });
      $(targetCell).simulate('mouseover').simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
      $(document.body).simulate('mouseup');
    }

    expect(getDataAtCell(0, 0)).toEqual(0);
    expect(getDataAtCell(1, 0)).toEqual(0);
    expect(getDataAtCell(2, 0)).toEqual(0);

    expect(getDataAtCell(0, 1)).toEqual(1); // Hidden column, no real change.
    expect(getDataAtCell(1, 1)).toEqual(1); // Hidden column and row, no real change.
    expect(getDataAtCell(2, 1)).toEqual(1); // Hidden column, no real change.

    expect(getDataAtCell(0, 2)).toEqual(0);
    expect(getDataAtCell(1, 2)).toEqual(2); // Hidden row, no real change.
    expect(getDataAtCell(2, 2)).toEqual(0);

    expect(getData()).toEqual([
      [0, 1, 0, 3, 4, 5],
      [0, 1, 2, 3, 4, 5],
      [0, 1, 0, null, null, null],
      [0, 1, null, null, null, null]
    ]); // Extra test for checking wrong data propagation.
  });

  it('should propagate data for hidden cells - fill horizontally (option `copyPasteEnabled` set to `true` for the both plugins)', async() => {
    handsontable({
      data: [
        [0, 1, 2, 3, 4, 5],
        [0, 1, 2, 3, 4, 5],
        [0, 1, null, null, null, null],
        [0, 1, null, null, null, null]
      ],
      hiddenColumns: {
        copyPasteEnabled: true,
        indicators: true,
        columns: [1]
      },
      hiddenRows: {
        copyPasteEnabled: true,
        rows: [1],
        indicators: true
      },
    });

    await selectCell(0, 0, 2, 0);

    {
      const targetCell = $(getCell(2, 2, true));
      const corners = spec().$container.find('.wtBorder.current.corner').toArray();
      const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
      const fillHandle = [...corners, ...areaCorners]
        .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
      const handleRect = fillHandle.getBoundingClientRect();
      const targetRect = targetCell[0].getBoundingClientRect();

      $(fillHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });
      $(targetCell).simulate('mouseover').simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
      $(document.body).simulate('mouseup');
    }

    expect(getDataAtCell(0, 0)).toEqual(0);
    expect(getDataAtCell(1, 0)).toEqual(0);
    expect(getDataAtCell(2, 0)).toEqual(0);

    expect(getDataAtCell(0, 1)).toEqual(0); // Hidden column, there was change.
    expect(getDataAtCell(1, 1)).toEqual(0); // Hidden column and row, there was change.
    expect(getDataAtCell(2, 1)).toEqual(0); // Hidden column, there was change.

    expect(getDataAtCell(0, 2)).toEqual(0);
    expect(getDataAtCell(1, 2)).toEqual(0); // Hidden row, there was change.
    expect(getDataAtCell(2, 2)).toEqual(0);

    expect(getData()).toEqual([
      [0, 0, 0, 3, 4, 5],
      [0, 0, 0, 3, 4, 5],
      [0, 0, 0, null, null, null],
      [0, 1, null, null, null, null]
    ]); // Extra test for checking wrong data propagation.
  });

  it('should not overwrite extra visible columns when dragging across hidden columns without Formulas', async() => {
    handsontable({
      data: [
        ['A', null, null, null, null, null],
      ],
      hiddenColumns: {
        copyPasteEnabled: false,
        columns: [1, 2],
      },
    });

    await selectCell(0, 0);

    simulateFillHandleDrag($(getCell(0, 3, true)));

    expect(getDataAtCell(0, 3)).toEqual('A');
    expect(getDataAtCell(0, 4)).toBe(null);
    expect(getDataAtCell(0, 5)).toBe(null);
  });

  it('should not overwrite extra visible rows when dragging across hidden rows without Formulas', async() => {
    handsontable({
      data: [
        ['A'],
        [null],
        [null],
        [null],
        [null],
      ],
      hiddenRows: {
        copyPasteEnabled: false,
        rows: [1, 2],
      },
    });

    await selectCell(0, 0);

    simulateFillHandleDrag($(getCell(3, 0, true)));

    expect(getDataAtCell(3, 0)).toEqual('A');
    expect(getDataAtCell(4, 0)).toBe(null);
  });

  describe('should works properly when two or more instances of Handsontable was initialized with ' +
           'other settings (#3257)', () => {
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
        fillHandle: true,
        themeName: `ht-theme-${getLoadedTheme()}`
      });

      $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable({
        data: getData(),
        fillHandle: 'horizontal',
        themeName: `ht-theme-${getLoadedTheme()}`
      });
    });

    it('checking drag vertically on 1. instance of Handsontable - should change cell value', async() => {
      $container1.handsontable('selectCell', 0, 0);

      const targetCell = $container1.find('tbody tr:eq(1) td:eq(0)');
      const fillHandle = $container1.find('.ht_master .wtBorder.current.corner')[0];
      const handleRect = fillHandle.getBoundingClientRect();
      const targetRect = targetCell[0].getBoundingClientRect();

      $(fillHandle).simulate('mousedown', {
        clientX: handleRect.left + (handleRect.width / 2),
        clientY: handleRect.top + (handleRect.height / 2),
      });
      $(targetCell).simulate('mouseover').simulate('mousemove', {
        clientX: targetRect.left + (targetRect.width / 2),
        clientY: targetRect.top + (targetRect.height / 2),
      });
      $(document.body).simulate('mouseup');

      expect($container1.handsontable('getDataAtCell', 1, 0)).toEqual(1);
    });

    describe('-> updating settings on 2. instance of Handsontable', () => {
      beforeAll(() => {
        $container2.handsontable('updateSettings', {
          fillHandle: 'vertical', themeName: `ht-theme-${getLoadedTheme()}`
        });
      });

      it('checking drag vertically on 2. instance of Handsontable - should change cell value', async() => {
        $container2.handsontable('selectCell', 0, 2);

        const targetCell = $container2.find('tbody tr:eq(1) td:eq(2)');
        const fillHandle = $container2.find('.ht_master .wtBorder.current.corner')[0];
        const handleRect = fillHandle.getBoundingClientRect();
        const targetRect = targetCell[0].getBoundingClientRect();

        $(fillHandle).simulate('mousedown', {
          clientX: handleRect.left + (handleRect.width / 2),
          clientY: handleRect.top + (handleRect.height / 2),
        });
        $(targetCell).simulate('mouseover').simulate('mousemove', {
          clientX: targetRect.left + (targetRect.width / 2),
          clientY: targetRect.top + (targetRect.height / 2),
        });
        $(document.body).simulate('mouseup');

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

  it('should autofill the appropriate cells, when performing the action over date-typed cells', async() => {
    const errorSpy = jasmine.createSpyObj('error', ['test']);
    const prevError = window.onerror;

    handsontable({
      data: [
        ['', '03/05/2020'],
        ['', '27/03/2020'],
        ['', '29/08/2020']
      ],
      columns: [
        {},
        { type: 'date' }
      ]
    });

    window.onerror = errorSpy.test;

    await selectCell(0, 1);

    simulateFillHandleDrag($(spec().$container.find(
      '.ht_master tbody tr:nth-child(3) td:nth-of-type(2)'
    )[0]));

    await waitForNextAnimationFrames(19);

    expect(errorSpy.test).not.toHaveBeenCalled();

    expect(getDataAtCell(1, 1)).toEqual('03/05/2020');
    expect(getDataAtCell(2, 1)).toEqual('03/05/2020');

    window.onerror = prevError;
  });

  describe('Using object-based cell content', () => {
    using('configuration object', [
      { coords: [[0, 1], [4, 1]] }, // Autofill downward
      { coords: [[4, 1], [0, 1]] }, // Autofill upward
    ], ({ coords }) => {

      it('should utilize the source data when filling object-based cells with object-based content (if the schema matches)', async() => {
        handsontable({
          data: [
            ['A1', { id: 1, value: 'A1' }, 'test'],
            ['A2', { id: 2, value: 'A2' }, 'test2'],
            ['A3', { id: 3, value: 'A3' }, 'test3'],
            ['A4', { id: 4, value: 'A4' }, 'test4'],
            ['A5', { id: 5, value: 'A5' }, 'test5'],
          ],
          columns: [
            {},
            {
              valueGetter: value => value?.value,
            },
            {},
          ],
        });

        const baseCellSource = getSourceDataAtCell(...coords[0]);
        const baseCellData = getDataAtCell(...coords[0]);

        await selectCell(...coords[0]);

        simulateFillHandleDrag($(getCell(...coords[1], true)));

        expect(getSourceDataAtCell(1, 1)).toEqual(baseCellSource);
        expect(getSourceDataAtCell(2, 1)).toEqual(baseCellSource);
        expect(getSourceDataAtCell(3, 1)).toEqual(baseCellSource);
        expect(getSourceDataAtCell(4, 1)).toEqual(baseCellSource);

        expect(getDataAtCell(1, 1)).toEqual(baseCellData);
        expect(getDataAtCell(2, 1)).toEqual(baseCellData);
        expect(getDataAtCell(3, 1)).toEqual(baseCellData);
        expect(getDataAtCell(4, 1)).toEqual(baseCellData);
      });

      it('should utilize the non-source data when filling text-based cells with object-based content', async() => {
        handsontable({
          data: [
            ['A1', 'xyz', 'test'],
            ['A2', 'xyz', 'test2'],
            ['A3', 'xyz', 'test3'],
            ['A4', 'xyz', 'test4'],
            ['A5', 'xyz', 'test5'],
          ],
        });

        await setSourceDataAtCell(coords[0][0], coords[0][1], { id: 1, value: 'A1' });
        await setCellMeta(coords[0][0], coords[0][1], 'valueGetter', value => value?.value);

        await render();

        await selectCell(...coords[0]);

        simulateFillHandleDrag($(getCell(...coords[1], true)));

        expect(getSourceDataAtCell(...coords[0])).toEqual({ id: 1, value: 'A1' });
        expect(getSourceDataAtCell(1, 1)).toEqual('A1');
        expect(getSourceDataAtCell(2, 1)).toEqual('A1');
        expect(getSourceDataAtCell(3, 1)).toEqual('A1');
        expect(getSourceDataAtCell(...coords[1])).toEqual('A1');

        expect(getDataAtCell(...coords[0])).toEqual('A1');
        expect(getDataAtCell(1, 1)).toEqual('A1');
        expect(getDataAtCell(2, 1)).toEqual('A1');
        expect(getDataAtCell(3, 1)).toEqual('A1');
        expect(getDataAtCell(...coords[1])).toEqual('A1');
      });

      it('should not perform autofill when filling object-based cells with object-based content (if the schema does not match)', async() => {
        handsontable({
          data: [
            ['A1', { a: 1, b: 2 }, 'test'],
            ['A2', { a: 2, b: 3 }, 'test2'],
            ['A3', { a: 3, b: 4 }, 'test3'],
            ['A4', { a: 4, b: 5 }, 'test4'],
            ['A5', { a: 5, b: 6 }, 'test5'],
          ],
          valueGetter: value => value?.a,
        });

        const sourceDataAtTarget = getSourceDataAtCell(...coords[1]);
        const dataAtTarget = getDataAtCell(...coords[1]);

        await setSourceDataAtCell(coords[0][0], coords[0][1], { id: 1, value: 'A1' });
        await setCellMeta(coords[0][0], coords[0][1], 'valueGetter', value => value?.value);

        await render();

        await selectCell(...coords[0]);

        simulateFillHandleDrag($(getCell(...coords[1], true)));

        expect(getSourceDataAtCell(...coords[0])).toEqual({ id: 1, value: 'A1' });
        expect(getSourceDataAtCell(1, 1)).toEqual({ a: 2, b: 3 });
        expect(getSourceDataAtCell(2, 1)).toEqual({ a: 3, b: 4 });
        expect(getSourceDataAtCell(3, 1)).toEqual({ a: 4, b: 5 });
        expect(getSourceDataAtCell(...coords[1])).toEqual(sourceDataAtTarget);

        expect(getDataAtCell(...coords[0])).toEqual('A1');
        expect(getDataAtCell(1, 1)).toEqual(2);
        expect(getDataAtCell(2, 1)).toEqual(3);
        expect(getDataAtCell(3, 1)).toEqual(4);
        expect(getDataAtCell(...coords[1])).toEqual(dataAtTarget);
      });

      it('should utilize the source data when filling mixed-typed cells with mixed-typed content (schema of the object-based content matches the schema of the target cell)', async() => {
        handsontable({
          data: [
            ['A1', { id: 1, value: 'A1' }, 'test'],
            ['A2', { id: 2, value: 'A2' }, 'test2'],
            ['A3', { id: 3, value: 'A3' }, 'test3'],
            ['A4', { id: 4, value: 'A4' }, 'test4'],
            ['A5', { id: 5, value: 'A5' }, 'test5'],
          ],
          columns: [
            {},
            {
              valueGetter: value => value?.value,
            },
            {},
          ],
        });

        const sourceDataAtBaseRow = getSourceDataAtRow(coords[0][0]);
        const dataAtBaseRow = getDataAtRow(coords[0][0]);

        await selectCells([[coords[0][0], 0, coords[0][0], 2]]);

        {
          const targetCell = $(getCell(coords[1][0], 2, true));
          const corners = spec().$container.find('.wtBorder.current.corner').toArray();
          const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
          const fillHandle = [...corners, ...areaCorners]
            .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
          const handleRect = fillHandle.getBoundingClientRect();
          const targetRect = targetCell[0].getBoundingClientRect();

          $(fillHandle).simulate('mousedown', {
            clientX: handleRect.left + (handleRect.width / 2),
            clientY: handleRect.top + (handleRect.height / 2),
          });
          $(targetCell).simulate('mouseover').simulate('mousemove', {
            clientX: targetRect.left + (targetRect.width / 2),
            clientY: targetRect.top + (targetRect.height / 2),
          });
          $(document.body).simulate('mouseup');
        }

        expect(getSourceDataAtRow(0)).toEqual(sourceDataAtBaseRow);
        expect(getSourceDataAtRow(1)).toEqual(sourceDataAtBaseRow);
        expect(getSourceDataAtRow(2)).toEqual(sourceDataAtBaseRow);
        expect(getSourceDataAtRow(3)).toEqual(sourceDataAtBaseRow);
        expect(getSourceDataAtRow(4)).toEqual(sourceDataAtBaseRow);

        expect(getDataAtRow(0)).toEqual(dataAtBaseRow);
        expect(getDataAtRow(1)).toEqual(dataAtBaseRow);
        expect(getDataAtRow(2)).toEqual(dataAtBaseRow);
        expect(getDataAtRow(3)).toEqual(dataAtBaseRow);
        expect(getDataAtRow(4)).toEqual(dataAtBaseRow);
      });
    });

    using('configuration object', [
      { coords: [[1, 0], [1, 2]] }, // Autofill right
      { coords: [[1, 2], [1, 0]] }, // Autofill left
    ], ({ coords }) => {
      it('should utilize the source data when filling object-based cells with object-based content (if the schema matches)', async() => {
        handsontable({
          data: [
            ['A1', 'B1', 'test'],
            [{ id: 1, value: 'A2' }, { id: 2, value: 'B2' }, { id: 3, value: 'C3' }],
            ['A3', 'B3', 'test3'],
          ],
          valueGetter: value => value?.value ?? value,
        });

        const baseCellSource = getSourceDataAtCell(...coords[0]);
        const baseCellData = getDataAtCell(...coords[0]);

        await selectCell(...coords[0]);

        simulateFillHandleDrag($(getCell(...coords[1], true)));

        expect(getSourceDataAtCell(1, 0)).toEqual(baseCellSource);
        expect(getSourceDataAtCell(1, 1)).toEqual(baseCellSource);
        expect(getSourceDataAtCell(1, 2)).toEqual(baseCellSource);

        expect(getDataAtCell(1, 0)).toEqual(baseCellData);
        expect(getDataAtCell(1, 1)).toEqual(baseCellData);
        expect(getDataAtCell(1, 2)).toEqual(baseCellData);
      });

      it('should utilize the non-source data when filling text-based cells with object-based content', async() => {
        handsontable({
          data: [
            ['A1', 'xyz', 'test'],
            ['A2', 'xyz', 'test2'],
            ['A3', 'xyz', 'test3'],
          ],
        });

        await setSourceDataAtCell(coords[0][0], coords[0][1], { id: 1, value: 'A1' });
        await setCellMeta(coords[0][0], coords[0][1], 'valueGetter', value => value?.value);

        await render();

        await selectCell(...coords[0]);

        simulateFillHandleDrag($(getCell(...coords[1], true)));

        expect(getSourceDataAtCell(...coords[0])).toEqual({ id: 1, value: 'A1' });
        expect(getSourceDataAtCell(1, 1)).toEqual('A1');
        expect(getSourceDataAtCell(...coords[1])).toEqual('A1');

        expect(getDataAtCell(...coords[0])).toEqual('A1');
        expect(getDataAtCell(1, 1)).toEqual('A1');
        expect(getDataAtCell(...coords[1])).toEqual('A1');
      });

      it('should not perform autofill when filling object-based cells with object-based content (if the schema does not match)', async() => {
        handsontable({
          data: [
            ['A1', 'B1', 'test'],
            [{ a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 4 }],
            ['A3', 'B3', 'test3'],
          ],
          valueGetter: value => value?.a ?? value,
        });

        const sourceDataAtTarget = getSourceDataAtCell(...coords[1]);
        const dataAtTarget = getDataAtCell(...coords[1]);

        await setSourceDataAtCell(coords[0][0], coords[0][1], { id: 1, value: 'A1' });
        await setCellMeta(coords[0][0], coords[0][1], 'valueGetter', value => value?.value);

        await render();

        await selectCell(...coords[0]);

        simulateFillHandleDrag($(getCell(...coords[1], true)));

        expect(getSourceDataAtCell(...coords[0])).toEqual({ id: 1, value: 'A1' });
        expect(getSourceDataAtCell(1, 1)).toEqual({ a: 2, b: 3 });
        expect(getSourceDataAtCell(...coords[1])).toEqual(sourceDataAtTarget);

        expect(getDataAtCell(...coords[0])).toEqual('A1');
        expect(getDataAtCell(1, 1)).toEqual(2);
        expect(getDataAtCell(...coords[1])).toEqual(dataAtTarget);
      });

      it('should utilize the source data when filling mixed-typed cells with mixed-typed content (schema of the object-based content matches the schema of the target cell)', async() => {
        handsontable({
          data: [
            ['A1', 'B1', 'test'],
            [{ id: 1, value: 'A2' }, { id: 2, value: 'B2' }, { id: 3, value: 'C3' }],
            ['A3', 'B3', 'test3'],
          ],
          valueGetter: value => value?.value ?? value,
        });

        const sourceDataAtBaseCol = getSourceDataAtCol(coords[0][1]);
        const dataAtBaseCol = getDataAtCol(coords[0][1]);

        await selectCells([[0, coords[0][1], 2, coords[0][1]]]);

        {
          const targetCell = $(getCell(2, coords[1][1], true));
          const corners = spec().$container.find('.wtBorder.current.corner').toArray();
          const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
          const fillHandle = [...corners, ...areaCorners]
            .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
          const handleRect = fillHandle.getBoundingClientRect();
          const targetRect = targetCell[0].getBoundingClientRect();

          $(fillHandle).simulate('mousedown', {
            clientX: handleRect.left + (handleRect.width / 2),
            clientY: handleRect.top + (handleRect.height / 2),
          });
          $(targetCell).simulate('mouseover').simulate('mousemove', {
            clientX: targetRect.left + (targetRect.width / 2),
            clientY: targetRect.top + (targetRect.height / 2),
          });
          $(document.body).simulate('mouseup');
        }

        expect(getSourceDataAtCol(0)).toEqual(sourceDataAtBaseCol);
        expect(getSourceDataAtCol(1)).toEqual(sourceDataAtBaseCol);
        expect(getSourceDataAtCol(2)).toEqual(sourceDataAtBaseCol);

        expect(getDataAtCol(0)).toEqual(dataAtBaseCol);
        expect(getDataAtCol(1)).toEqual(dataAtBaseCol);
        expect(getDataAtCol(2)).toEqual(dataAtBaseCol);
      });
    });

    it('should allow autofill from a previously autofilled cell when the source object has undefined-valued properties', async() => {
      // Regression test for https://github.com/handsontable/handsontable/issues/3744.
      // deepClone used JSON round-trip which dropped undefined-valued properties.
      // The clone then had a different duckSchema than the original, blocking the second autofill.
      handsontable({
        data: [
          [{ id: 1, label: undefined }, { id: 2, label: 'B' }, { id: 3, label: 'C' }],
        ],
      });

      // First autofill: drag from (0,0) to (0,1) — fills B1 with a clone of A1
      await selectCell(0, 0);
      simulateFillHandleDrag($(getCell(0, 1, true)));

      expect(getSourceDataAtCell(0, 1)).toEqual({ id: 1, label: undefined });

      // Second autofill: drag from (0,1) to (0,2) — previously blocked because
      // the clone at (0,1) was missing the `label` key after the JSON round-trip.
      await selectCell(0, 1);
      simulateFillHandleDrag($(getCell(0, 2, true)));

      expect(getSourceDataAtCell(0, 2)).toEqual({ id: 1, label: undefined });
    });

    it('should allow chained autofill when object cells have different key insertion order due to undefined properties', async() => {
      // Regression test for https://github.com/handsontable/handsontable/issues/3744.
      // After deepClone + afterChange re-adds missing properties in different order,
      // isObjectEqual via JSON.stringify returned false due to key-order sensitivity.
      handsontable({
        data: [
          [{ a: 1, b: undefined, c: 3 }, { a: 2, b: 4, c: 5 }, { a: 6, b: 7, c: 8 }],
        ],
        afterChange(changes) {
          if (!changes) {
            return;
          }

          changes.forEach(([row, col,, newVal]) => {
            if (newVal && typeof newVal === 'object' && !Object.prototype.hasOwnProperty.call(newVal, 'b')) {
              // Simulate re-adding the missing undefined property in a different key order
              const restored = { b: undefined, a: newVal.a, c: newVal.c };

              this.setSourceDataAtCell(row, col, restored);
            }
          });
        },
      });

      // First autofill: (0,0) → (0,1): clone loses `b`, afterChange adds it back in different order
      await selectCell(0, 0);
      simulateFillHandleDrag($(getCell(0, 1, true)));

      // Second autofill: (0,1) → (0,2): previously blocked — key order mismatch in schema comparison
      await selectCell(0, 1);
      simulateFillHandleDrag($(getCell(0, 2, true)));

      const result = getSourceDataAtCell(0, 2);

      expect(result).toEqual({ a: 1, b: undefined, c: 3 });
    });
  });

  describe('fill border position', () => {
    it('display the fill border in the correct position', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        fillHandle: true
      });

      await selectCell(3, 3, 5, 5);

      const moveOverCell = (rowIdx, colIdx) => {
        const cell = spec().$container.find('.ht_master tbody tr').eq(rowIdx).find('td').eq(colIdx);
        const rect = cell[0].getBoundingClientRect();
        const clientX = rect.left + (rect.width / 2);
        const clientY = rect.top + (rect.height / 2);

        // Autofill listens for mousemove on document.documentElement, so we fire it there
        // (not on the cell) so the autofill plugin can compute the target cell from clientX/clientY.
        $(document.documentElement).simulate('mousemove', {
          clientX,
          clientY,
        });
        cell.simulate('mouseenter').simulate('mouseover', {
          clientX,
          clientY,
        });
      };

      {
        const corners = spec().$container.find('.wtBorder.current.corner').toArray();
        const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();
        const fillHandle = [...corners, ...areaCorners]
          .find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
        const handleRect = fillHandle.getBoundingClientRect();

        $(fillHandle).simulate('mousedown', {
          clientX: handleRect.left + (handleRect.width / 2),
          clientY: handleRect.top + (handleRect.height / 2),
        });
      }

      moveOverCell(2, 3);

      expect(Handsontable.dom.hasClass(getCell(2, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 5), 'fill')).toBe(true);

      moveOverCell(2, 4);

      expect(Handsontable.dom.hasClass(getCell(2, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 5), 'fill')).toBe(true);

      moveOverCell(2, 5);

      expect(Handsontable.dom.hasClass(getCell(2, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(2, 5), 'fill')).toBe(true);

      moveOverCell(3, 2);

      expect(Handsontable.dom.hasClass(getCell(3, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 2), 'fill')).toBe(true);

      moveOverCell(4, 2);

      expect(Handsontable.dom.hasClass(getCell(3, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 2), 'fill')).toBe(true);

      moveOverCell(5, 2);

      expect(Handsontable.dom.hasClass(getCell(3, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 2), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 2), 'fill')).toBe(true);

      moveOverCell(6, 3);

      expect(Handsontable.dom.hasClass(getCell(6, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 5), 'fill')).toBe(true);

      moveOverCell(6, 4);

      expect(Handsontable.dom.hasClass(getCell(5, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 5), 'fill')).toBe(true);

      moveOverCell(6, 5);

      expect(Handsontable.dom.hasClass(getCell(5, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(6, 5), 'fill')).toBe(true);

      moveOverCell(3, 6);

      expect(Handsontable.dom.hasClass(getCell(3, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 6), 'fill')).toBe(true);

      moveOverCell(4, 6);

      expect(Handsontable.dom.hasClass(getCell(3, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 6), 'fill')).toBe(true);

      moveOverCell(5, 6);

      expect(Handsontable.dom.hasClass(getCell(3, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 6), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 6), 'fill')).toBe(true);

      // Inside of the selection
      moveOverCell(5, 4);

      expect(Handsontable.dom.hasClass(getCell(3, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(3, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(4, 4), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 3), 'fill')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(5, 4), 'fill')).toBe(true);

      $(document.documentElement).simulate('mouseup');
    });
  });

  using('autofill handler size', [
    2, 4, 6, 8, 10, 12, 14, 16,
  ], (autofillHandlerSize) => {
    beforeEach(() => {
      const style = document.createElement('style');
      const styleText = `
        .handsontable {
          --ht-cell-autofill-size: ${autofillHandlerSize}px;
        }`;

      style.id = 'autofill-handler-size-style';
      style.textContent = styleText;
      document.head.appendChild(style);
    });

    afterEach(() => {
      document.getElementById('autofill-handler-size-style').remove();
    });

    it('should render corner hit area with a proper size', async() => {
      const hot = handsontable({
        width: 200,
        height: 200,
        startRows: 10,
        startCols: 10,
      });

      await selectCell(1, 1);

      const corner = hot.rootElement.querySelector('.ht_master .htBorders .corner');
      const hitAreaStyle = getComputedStyle(corner, '::after');
      const expectedHitAreaSize = Math.max(autofillHandlerSize, 12);

      expect(hitAreaStyle.width).toBe(`${expectedHitAreaSize}px`);
      expect(hitAreaStyle.height).toBe(`${expectedHitAreaSize}px`);
    });

    it('should cut the hit area at the bottom of the table when the last row is selected', async() => {
      const hot = handsontable({
        width: 200,
        height: 200,
        startRows: 10,
        startCols: 10,
      });

      await selectCell(9, 1);

      const corner = hot.rootElement.querySelector('.ht_master .htBorders .corner');
      const hitAreaStyle = getComputedStyle(corner, '::after');

      expect(hitAreaStyle.insetBlockEnd).toBe('0px');
    });

    it('should cut the hit area at the right side of the table when the last column is selected', async() => {
      const hot = handsontable({
        width: 200,
        height: 200,
        startRows: 10,
        startCols: 10,
      });

      await selectCell(1, 9);

      const corner = hot.rootElement.querySelector('.ht_master .htBorders .corner');
      const hitAreaStyle = getComputedStyle(corner, '::after');

      expect(hitAreaStyle.insetInlineEnd).toBe('0px');
    });
  });

  it('should be possible to change the hit area size', async() => {
    const style = document.createElement('style');
    const styleText = `
      .handsontable {
        --ht-cell-autofill-hit-area-size: 10px;
      }`;

    style.id = 'autofill-handler-size-style';
    style.textContent = styleText;
    document.head.appendChild(style);

    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 10,
      startCols: 10,
    });

    await selectCell(1, 1);

    const corner = hot.rootElement.querySelector('.ht_master .htBorders .corner');
    const hitAreaStyle = getComputedStyle(corner, '::after');

    expect(hitAreaStyle.width).toBe('10px');
    expect(hitAreaStyle.height).toBe('10px');

    style.remove();
  });

  describe('selection direction after autofill (#10771)', () => {
    it('should keep the active cell at the original position when dragging the fill handle down', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        fillHandle: true,
      });

      await selectCell(1, 1);

      simulateFillHandleDrag($(getCell(3, 1, true)));

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,1']);
    });

    it('should keep the active cell at the original position when dragging the fill handle up', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        fillHandle: true,
      });

      await selectCell(3, 1);

      simulateFillHandleDrag($(getCell(1, 1, true)));

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,1 from: 3,1 to: 1,1']);
    });

    it('should keep the active cell at the original position when dragging the fill handle right', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        fillHandle: true,
      });

      await selectCell(1, 1);

      simulateFillHandleDrag($(getCell(1, 3, true)));

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,3']);
    });

    it('should keep the active cell at the original position when dragging the fill handle left', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        fillHandle: true,
      });

      await selectCell(1, 3);

      simulateFillHandleDrag($(getCell(1, 1, true)));

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,1']);
    });

    it('should preserve the multi-cell selection direction when extending downward', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
        fillHandle: true,
      });

      await selectCell(1, 1, 2, 2);

      simulateFillHandleDrag($(getCell(4, 2, true)));

      expect(getSelected()).toEqual([[1, 1, 4, 2]]);
    });

    it('should still allow double-click fill after a reversed (upward) autofill drag', async() => {
      handsontable({
        data: [
          [null, 'a'],
          ['X', 'b'],
          [null, 'c'],
          [null, 'd'],
          [null, 'e'],
        ],
        fillHandle: true,
      });

      await selectCell(1, 0);

      simulateFillHandleDrag($(getCell(0, 0, true)));

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 0,0']);
      expect(getDataAtCell(0, 0)).toBe('X');

      const fillHandle = spec().$container.find('.wtBorder.current.corner')[0];

      await mouseDoubleClick(fillHandle);

      expect(getDataAtCell(2, 0)).toBe('X');
      expect(getDataAtCell(3, 0)).toBe('X');
      expect(getDataAtCell(4, 0)).toBe('X');
    });
  });
});
