describe('manualColumnResize', () => {
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

  it('should change column widths at init', async() => {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(colWidth(spec().$container, 0)).toBe(100);
    expect(colWidth(spec().$container, 1)).toBe(150);
    expect(colWidth(spec().$container, 2)).toBe(180);
  });

  it('should show only single resize handler and not throw an error while performing a mouse down on HOT in HOT header', async() => {
    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: true,
            data: createSpreadsheetData(5, 5),
            manualColumnResize: true,
          }
        },
      ],
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const $hotInHot = $('.handsontableEditor');

    expect(() => {
      // A "mouseover" event over a header of the main HOT has shown two resizers in some cases.
      getTopClone().find('thead tr:eq(0) th:eq(1)').simulate('mouseover');

      const $endOfFirstHeader = $hotInHot.find('.ht_clone_top thead tr:eq(0) th:eq(1)');

      $endOfFirstHeader.simulate('mouseover');
      $hotInHot.find('.manualColumnResizer').simulate('mouseover');

      expect($hotInHot.find('.manualColumnResizer').size()).toBe(1);

      $hotInHot.find('.manualColumnResizer').simulate('mousedown');
      $hotInHot.find('.ht_clone_top thead tr:eq(0) th:eq(2)').simulate('mouseover');
      $hotInHot.find('.ht_clone_top thead tr:eq(0) th:eq(2)').simulate('mousemove');
    }).not.toThrow();
  });

  it('should be enabled after specifying it in updateSettings config', async() => {
    handsontable({
      data: [
        { id: 1, name: 'Ted', lastName: 'Right' },
        { id: 2, name: 'Frank', lastName: 'Honest' },
        { id: 3, name: 'Joan', lastName: 'Well' },
        { id: 4, name: 'Sid', lastName: 'Strong' },
        { id: 5, name: 'Jane', lastName: 'Neat' }
      ],
      colHeaders: true
    });

    await updateSettings({ manualColumnResize: true });

    getTopClone().find('thead tr:eq(0) th:eq(0)').simulate('mouseover');

    expect($('.manualColumnResizer').size()).toBeGreaterThan(0);
  });

  it('should change the default column widths with updateSettings', async() => {
    handsontable({
      manualColumnResize: true
    });

    expect(colWidth(spec().$container, 0)).toBe(50);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(50);

    await updateSettings({
      manualColumnResize: [60, 50, 80]
    });

    expect(colWidth(spec().$container, 0)).toBe(60);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(80);
  });

  it('should change column widths with updateSettings', async() => {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(colWidth(spec().$container, 0)).toBe(100);
    expect(colWidth(spec().$container, 1)).toBe(150);
    expect(colWidth(spec().$container, 2)).toBe(180);

    await updateSettings({
      manualColumnResize: [60, 50, 80]
    });

    expect(colWidth(spec().$container, 0)).toBe(60);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(80);
  });

  it('should reset column widths when undefined is passed', async() => {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(colWidth(spec().$container, 0)).toBe(100);
    expect(colWidth(spec().$container, 1)).toBe(150);
    expect(colWidth(spec().$container, 2)).toBe(180);

    await updateSettings({
      manualColumnResize: undefined
    });

    expect(colWidth(spec().$container, 0)).toBe(50);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(50);
  });

  it('should not reset column widths when `true` is passed', async() => {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(colWidth(spec().$container, 0)).toBe(100);
    expect(colWidth(spec().$container, 1)).toBe(150);
    expect(colWidth(spec().$container, 2)).toBe(180);

    await updateSettings({
      manualColumnResize: true
    });

    expect(colWidth(spec().$container, 0)).toBe(100);
    expect(colWidth(spec().$container, 1)).toBe(150);
    expect(colWidth(spec().$container, 2)).toBe(180);
  });

  it('should keep proper column widths after inserting column', async() => {
    handsontable({
      manualColumnResize: [undefined, undefined, 120]
    });

    expect(colWidth(spec().$container, 0)).toBe(50);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(120);
    expect(colWidth(spec().$container, 3)).toBe(50);
    expect(colWidth(spec().$container, 4)).toBe(50);

    await alter('insert_col_start', 0);

    expect(colWidth(spec().$container, 0)).toBe(50); // Added new row here.
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(50);
    expect(colWidth(spec().$container, 3)).toBe(120);
    expect(colWidth(spec().$container, 4)).toBe(50);
    expect(colWidth(spec().$container, 5)).toBe(50);

    await alter('insert_col_start', 3);

    expect(colWidth(spec().$container, 0)).toBe(50);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(50);
    expect(colWidth(spec().$container, 3)).toBe(50); // Added new row here.
    expect(colWidth(spec().$container, 4)).toBe(120);
    expect(colWidth(spec().$container, 5)).toBe(50);
    expect(colWidth(spec().$container, 6)).toBe(50);

    await alter('insert_col_start', 5);

    expect(colWidth(spec().$container, 0)).toBe(50);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(50);
    expect(colWidth(spec().$container, 3)).toBe(50);
    expect(colWidth(spec().$container, 4)).toBe(120);
    expect(colWidth(spec().$container, 5)).toBe(50); // Added new row here.
    expect(colWidth(spec().$container, 6)).toBe(50);
    expect(colWidth(spec().$container, 7)).toBe(50);
  });

  it('should keep proper column widths after removing column', async() => {
    handsontable({
      manualColumnResize: [undefined, undefined, 120]
    });

    expect(colWidth(spec().$container, 0)).toBe(50);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(120);
    expect(colWidth(spec().$container, 3)).toBe(50);

    await alter('remove_col', 0);

    expect(colWidth(spec().$container, 0)).toBe(50);
    expect(colWidth(spec().$container, 1)).toBe(120);
    expect(colWidth(spec().$container, 2)).toBe(50);
    expect(colWidth(spec().$container, 3)).toBe(50);
  });

  it('should resize (narrowing) appropriate columns, even when stretchH `all` is enabled', async() => {
    spec().$container.css('width', '910px');
    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all'
    });

    await resizeColumn(1, 65);

    const $columnHeaders = spec().$container.find('thead tr:eq(1) th');

    expect($columnHeaders.eq(0).width()).toBe(210);
    expect($columnHeaders.eq(1).width()).toBe(63);
    expect($columnHeaders.eq(2).width()).toBe(211);
    expect($columnHeaders.eq(3).width()).toBe(211);
    expect($columnHeaders.eq(4).width()).toBe(209);
  });

  it('should resize (extending) appropriate columns, even when stretchH `all` is enabled', async() => {
    spec().$container.css('width', '910px');
    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all'
    });

    await resizeColumn(1, 400);

    const $columnHeaders = spec().$container.find('thead tr:eq(1) th');

    expect($columnHeaders.eq(0).width()).toBe(126);
    expect($columnHeaders.eq(1).width()).toBe(398);
    expect($columnHeaders.eq(2).width()).toBe(127);
    expect($columnHeaders.eq(3).width()).toBe(127);
    expect($columnHeaders.eq(4).width()).toBe(126);
  });

  it('should resize (narrowing) selected columns', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnResize: true
    });

    const $colHeader = getTopClone().find('thead tr:eq(0) th:eq(1)');

    $colHeader.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    getTopClone().find('tr:eq(0) th:eq(1)').simulate('mousedown');
    getTopClone().find('tr:eq(0) th:eq(2)').simulate('mouseover');
    getTopClone().find('tr:eq(0) th:eq(3)').simulate('mouseover');
    getTopClone().find('tr:eq(0) th:eq(3)').simulate('mousemove');
    getTopClone().find('tr:eq(0) th:eq(3)').simulate('mouseup');

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mousemove', { clientX: spec().$container.find('tr:eq(0) th:eq(1)').position().left + 29 });
    $resizer.simulate('mouseup');

    await sleep(1000);

    const $columnHeaders = spec().$container.find('.ht_clone_top thead tr:eq(0) th');

    expect($columnHeaders.eq(1).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(34);
      main.toBe(34);
      horizon.toBe(35);
    });
    expect($columnHeaders.eq(2).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(34);
      main.toBe(34);
      horizon.toBe(35);
    });
    expect($columnHeaders.eq(3).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(34);
      main.toBe(34);
      horizon.toBe(35);
    });
  });

  it('should show resizer for fixed columns', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      rowHeaders: true,
      fixedColumnsStart: 2,
      manualColumnResize: true
    });

    getTopClone()
      .find('thead tr:eq(0) th:eq(3)')
      .simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');

    expect($resizer.position()).forThemes(({ classic, main, horizon }) => {
      classic.toEqual({
        top: 0,
        left: 194,
      });
      main.toEqual({
        top: 0,
        left: 194,
      });
      horizon.toEqual({
        top: 0,
        left: 198,
      });
    });

    // after hovering over fixed column, resizer should be moved to the fixed column
    getTopInlineStartClone()
      .find('thead tr:eq(0) th:eq(1)')
      .simulate('mouseover');

    expect($resizer.position()).forThemes(({ classic, main, horizon }) => {
      classic.toEqual({
        top: 0,
        left: 94,
      });
      main.toEqual({
        top: 0,
        left: 94,
      });
      horizon.toEqual({
        top: 0,
        left: 95,
      });
    });
  });

  it('should resize (expanding) selected columns', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnResize: true
    });

    const $colHeader = getTopClone().find('thead tr:eq(0) th:eq(1)');

    $colHeader.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    getTopClone().find('tr:eq(0) th:eq(1)').simulate('mousedown');
    getTopClone().find('tr:eq(0) th:eq(2)').simulate('mouseover');
    getTopClone().find('tr:eq(0) th:eq(3)').simulate('mouseover');
    getTopClone().find('tr:eq(0) th:eq(3)').simulate('mousemove');
    getTopClone().find('tr:eq(0) th:eq(3)').simulate('mouseup');

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mousemove', { clientX: spec().$container.find('tr:eq(0) th:eq(1)').position().left + 150 });
    $resizer.simulate('mouseup');

    await sleep(1000);

    const $columnHeaders = spec().$container.find('.ht_clone_top thead tr:eq(0) th');

    expect($columnHeaders.eq(1).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(155);
      main.toBe(155);
      horizon.toBe(156);
    });
    expect($columnHeaders.eq(2).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(155);
      main.toBe(155);
      horizon.toBe(156);
    });
    expect($columnHeaders.eq(3).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(155);
      main.toBe(155);
      horizon.toBe(156);
    });
  });

  it('should resize appropriate columns to calculated stretch width after double click on column handler when stretchH is set as `all`', async() => {
    spec().$container.css('width', '910px');
    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all',
    });

    await resizeColumn(1, 65);

    const $columnHeaders = spec().$container.find('thead tr:eq(1) th');

    expect($columnHeaders.eq(0).width()).toBe(210);
    expect($columnHeaders.eq(1).width()).toBe(63);
    expect($columnHeaders.eq(2).width()).toBe(211);
    expect($columnHeaders.eq(3).width()).toBe(211);
    expect($columnHeaders.eq(4).width()).toBe(209);

    const $th = getTopClone().find('thead tr:eq(1) th:eq(1)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });

    await sleep(1000);

    expect($columnHeaders.eq(0).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(221);
      main.toBe(219);
      horizon.toBe(217);
    });
    expect($columnHeaders.eq(1).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(19);
      main.toBe(27);
      horizon.toBe(35);
    });
    expect($columnHeaders.eq(2).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(222);
      main.toBe(220);
      horizon.toBe(218);
    });
    expect($columnHeaders.eq(3).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(222);
      main.toBe(220);
      horizon.toBe(218);
    });
    expect($columnHeaders.eq(4).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(220);
      main.toBe(218);
      horizon.toBe(216);
    });
  });

  it('should resize appropriate columns to calculated autoColumnSize width after double click on column handler when stretchH is set as `last`', async() => {
    spec().$container.css('width', '910px');
    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'last',
    });

    await resizeColumn(0, 65);

    const $columnHeaders = spec().$container.find('thead tr:eq(0) th');

    expect($columnHeaders.eq(0).width()).toBe(64);
    expect($columnHeaders.eq(1).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(49);
      main.toBe(48);
      horizon.toBe(48); // TODO: seems to be an issue with how .width() reads the width value.
    });
    expect($columnHeaders.eq(2).width()).toBe(49);
    expect($columnHeaders.eq(3).width()).toBe(49);
    expect($columnHeaders.eq(4).width()).toBe(694);

    const $th = getTopClone().find('thead tr:eq(1) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });
    await sleep(1000);

    expect($columnHeaders.eq(0).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(19);
      main.toBeAroundValue(27);
      horizon.toBeAroundValue(35);
    });
    expect($columnHeaders.eq(1).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(49);
      main.toBe(48);
      horizon.toBe(48);
    });
    expect($columnHeaders.eq(2).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(49);
      main.toBe(49);
      horizon.toBe(49);
    });
    expect($columnHeaders.eq(3).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(49);
      main.toBe(49);
      horizon.toBe(49);
    });
    expect($columnHeaders.eq(4).width()).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(738);
      main.toBeAroundValue(730);
      horizon.toBeAroundValue(723);
    });
  });

  it('should resize appropriate columns to calculated autoColumnSize width after double click on column handler after ' +
     'updateSettings usage with new `colWidths` values', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      colHeaders: true,
      manualColumnResize: true,
    });

    await setDataAtCell(0, 1, 'Longer text');
    await sleep(50);
    await updateSettings({
      colWidths: [45, 120, 160, 60, 80],
    });

    const $columnHeaders = spec().$container.find('thead tr:eq(0) th');

    {
      const $th = getTopClone().find('thead tr:eq(0) th:eq(0)'); // resize the first column.

      $th.simulate('mouseover');

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();

      await mouseDoubleClick($resizer, { clientX: resizerPosition.left });
      await sleep(1000);

      expect($columnHeaders.eq(0).width()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(25);
        main.toBe(35);
        horizon.toBe(43);
      });
      expect($columnHeaders.eq(1).width()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(119);
        main.toBe(118);
        horizon.toBe(118);
      });
      expect($columnHeaders.eq(2).width()).toBe(159);
      expect($columnHeaders.eq(3).width()).toBe(59);
      expect($columnHeaders.eq(4).width()).toBe(79);
    }
    {
      const $th = getTopClone().find('thead tr:eq(0) th:eq(1)'); // resize the second column.

      $th.simulate('mouseover');

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();

      await mouseDoubleClick($resizer, { clientX: resizerPosition.left });

      await sleep(1000);

      expect($columnHeaders.eq(0).width()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(25);
        main.toBe(35);
        horizon.toBe(43);
      });
      expect($columnHeaders.eq(1).width()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(70);
        main.toBe(87);
        horizon.toBe(95);
      });
      expect($columnHeaders.eq(2).width()).toBe(159);
      expect($columnHeaders.eq(3).width()).toBe(59);
      expect($columnHeaders.eq(4).width()).toBe(79);
    }
  });

  it('should resize appropriate columns, even if the column order was changed with manualColumnMove plugin', async() => {
    handsontable({
      colHeaders: ['First', 'Second', 'Third'],
      manualColumnMove: [2, 1, 0, 3],
      manualColumnResize: true
    });

    const $columnHeaders = spec().$container.find('thead tr:eq(0) th');
    const initialColumnWidths = [];

    $columnHeaders.each(function() {
      initialColumnWidths.push($(this).width());
    });

    resizeColumn.call(this, 0, 100);

    const $resizedTh = getTopClone().find('thead tr:eq(0) th:eq(0)');

    expect($resizedTh.text()).toEqual('Third');
    expect($resizedTh.outerWidth()).toEqual(100);

    // Sizes of remaining columns should stay the same
    for (let i = 1; i < $columnHeaders.length; i++) {
      expect($columnHeaders.eq(i).width()).toEqual(initialColumnWidths[i]);
    }
  });

  it('should trigger an beforeColumnResize event after column size changes', async() => {
    const beforeColumnResizeCallback = jasmine.createSpy('beforeColumnResizeCallback');

    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      beforeColumnResize: beforeColumnResizeCallback
    });

    expect(colWidth(spec().$container, 0)).toEqual(50);

    await resizeColumn(0, 100);

    expect(beforeColumnResizeCallback).toHaveBeenCalledWith(100, 0, false);
    expect(colWidth(spec().$container, 0)).toEqual(100);
  });

  it('should appropriate resize colWidth after beforeColumnResize call a few times', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true
    });

    expect(colWidth(spec().$container, 0)).toEqual(50);

    addHook('beforeColumnResize', () => 100);
    addHook('beforeColumnResize', () => 200);

    addHook('beforeColumnResize', () => undefined);

    const $th = getTopClone().find('thead tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });

    await sleep(700);

    expect(colWidth(spec().$container, 0)).toEqual(200);
  });

  it('should trigger an afterColumnResize event after column size changes', async() => {
    const afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      afterColumnResize: afterColumnResizeCallback
    });

    expect(colWidth(spec().$container, 0)).toEqual(50);

    await resizeColumn(0, 100);

    expect(afterColumnResizeCallback).toHaveBeenCalledWith(100, 0, false);
    expect(colWidth(spec().$container, 0)).toEqual(100);
  });

  it('should not trigger an afterColumnResize event if column size does not change (mouseMove event width delta = 0)', async() => {
    const afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      afterColumnResize: afterColumnResizeCallback
    });

    expect(colWidth(spec().$container, 0)).toEqual(50);

    await resizeColumn(0, 50);

    expect(afterColumnResizeCallback).not.toHaveBeenCalled();
    expect(colWidth(spec().$container, 0)).toEqual(50);
  });

  it('should not trigger an afterColumnResize event if column size does not change (no mouseMove event)', async() => {
    const afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      afterColumnResize: afterColumnResizeCallback
    });

    expect(colWidth(spec().$container, 0)).toEqual(50);

    const $th = getTopClone().find('thead tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await simulateClick($resizer, { clientX: resizerPosition.left });

    expect(afterColumnResizeCallback).not.toHaveBeenCalled();
    expect(colWidth(spec().$container, 0)).toEqual(50);
  });

  it('should trigger an afterColumnResize after column size changes, after double click', async() => {
    const afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      afterColumnResize: afterColumnResizeCallback
    });

    expect(colWidth(spec().$container, 0)).toEqual(50);

    const $th = getTopClone().find('thead tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });

    await sleep(1000);

    expect(afterColumnResizeCallback).toHaveBeenCalledTimes(1);
    expect(afterColumnResizeCallback).forThemes(({ classic, main, horizon }) => {
      classic.toHaveBeenCalledWith(26, 0, true);
      main.toHaveBeenCalledWith(36, 0, true);
      horizon.toHaveBeenCalledWith(44, 0, true);
    });
    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(26);
      main.toBe(36);
      horizon.toBe(44);
    });
  });

  it('should autosize column after double click (when initial width is not defined)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      columns: [{ width: 100 }, { width: 200 }, {}]
    });

    expect(colWidth(spec().$container, 0)).toEqual(100);
    expect(colWidth(spec().$container, 1)).toEqual(200);
    expect(colWidth(spec().$container, 2)).toEqual(50);

    await resizeColumn(2, 300);

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });

    await sleep(1000);

    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(29, 3);
      main.toBeAroundValue(35, 3);
      horizon.toBeAroundValue(44, 3);
    });
  });

  it('should autosize column after double click (when initial width is defined by the `colWidths` option)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      colWidths: 100
    });

    expect(colWidth(spec().$container, 0)).toEqual(100);
    expect(colWidth(spec().$container, 1)).toEqual(100);
    expect(colWidth(spec().$container, 2)).toEqual(100);

    await resizeColumn(2, 300);

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });

    await sleep(1000);

    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(29, 3);
      main.toBeAroundValue(35, 3);
      horizon.toBeAroundValue(44, 3);
    });
  });

  it('should autosize selected columns after double click on handler', async() => {
    handsontable({
      data: createSpreadsheetData(9, 9),
      colHeaders: true,
      manualColumnResize: true,
    });

    await resizeColumn(2, 300);

    getTopClone().find('thead tr:eq(0) th:eq(1)').simulate('mousedown');
    getTopClone().find('thead tr:eq(0) th:eq(2)').simulate('mouseover');
    getTopClone().find('thead tr:eq(0) th:eq(3)').simulate('mouseover');
    getTopClone().find('thead tr:eq(0) th:eq(3)').simulate('mousemove');
    getTopClone().find('thead tr:eq(0) th:eq(3)').simulate('mouseup');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await sleep(600);
    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });
    await sleep(600);

    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(26);
      main.toBe(36);
      horizon.toBe(44);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(26);
      main.toBe(36);
      horizon.toBe(44);
    });
    expect(colWidth(spec().$container, 3)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(26);
      main.toBe(36);
      horizon.toBe(44);
    });
  });

  it('should autosize selected columns after double click on handler and move mouse to the next column', async() => {
    handsontable({
      data: createSpreadsheetData(9, 9),
      colHeaders: true,
      manualColumnResize: true,
    });

    getTopClone().find('thead tr:eq(0) th:eq(1)').simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await sleep(600);
    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });
    getTopClone().find('tr:eq(0) th:eq(2)').simulate('mouseover');
    await sleep(600);

    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(26);
      main.toBe(36);
      horizon.toBe(44);
    });
  });

  it.forTheme('classic')('should adjust resize handles position after table size changed', async() => {
    let maxed = false;

    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all',
      width() {
        return maxed ? 614 : 200;
      }
    });

    getTopClone().find('thead th:eq(0)').simulate('mouseover');

    const handle = spec().$container.find('.manualColumnResizer');
    const th0 = getTopClone().find('thead th:eq(0)');
    let handleBox = handle[0].getBoundingClientRect();
    let thBox = th0[0].getBoundingClientRect();

    expect(handleBox.left + handleBox.width).toEqual(thBox.left + thBox.width - 1);

    maxed = true;

    await render();
    getTopClone().find('thead th:eq(0)').simulate('mouseover');

    handleBox = handle[0].getBoundingClientRect();
    thBox = th0[0].getBoundingClientRect();

    expect(handleBox.left + handleBox.width).toEqual(thBox.left + thBox.width - 1);
  });

  it.forTheme('main')('should adjust resize handles position after table size changed', async() => {
    let maxed = false;

    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all',
      width() {
        return maxed ? 614 : 200;
      }
    });

    getTopClone().find('thead th:eq(0)').simulate('mouseover');

    const handle = spec().$container.find('.manualColumnResizer');
    const th0 = getTopClone().find('thead th:eq(0)');
    let handleBox = handle[0].getBoundingClientRect();
    let thBox = th0[0].getBoundingClientRect();

    expect(handleBox.left).toEqual(thBox.left + thBox.width - (handleBox.width / 2) - 1);

    maxed = true;

    await render();

    getTopClone().find('thead th:eq(0)').simulate('mouseover');

    handleBox = handle[0].getBoundingClientRect();
    thBox = th0[0].getBoundingClientRect();

    expect(handleBox.left).toEqual(thBox.left + thBox.width - (handleBox.width / 2) - 1);
  });

  it.forTheme('horizon')('should adjust resize handles position after table size changed', async() => {
    let maxed = false;

    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all',
      width() {
        return maxed ? 614 : 200;
      }
    });

    getTopClone().find('thead th:eq(0)').simulate('mouseover');

    const handle = spec().$container.find('.manualColumnResizer');
    const th0 = getTopClone().find('thead th:eq(0)');
    let handleBox = handle[0].getBoundingClientRect();
    let thBox = th0[0].getBoundingClientRect();

    expect(handleBox.left).toEqual(thBox.left + thBox.width - (handleBox.width / 2) - 1);

    maxed = true;

    await render();

    getTopClone().find('thead th:eq(0)').simulate('mouseover');

    handleBox = handle[0].getBoundingClientRect();
    thBox = th0[0].getBoundingClientRect();

    expect(handleBox.left).toEqual(thBox.left + thBox.width - (handleBox.width / 2) - 1);
  });

  it('should display the resize handle in the correct place after the table has been scrolled', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnResize: true,
      height: 100,
      width: 200
    });

    const $colHeader = getTopClone().find('thead tr:eq(0) th:eq(2)'); // Header "C"

    $colHeader.simulate('mouseover');

    const $handle = spec().$container.find('.manualColumnResizer');

    $handle[0].style.background = 'red';

    expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
    expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);

    await scrollViewportHorizontally(200);

    $colHeader.simulate('mouseover');

    expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
    expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);
  });

  it('should resize the correct column after resizing element adjacent to a selection', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      manualColumnResize: true
    });

    await selectColumns(2, 3);

    getTopClone().find('thead tr:eq(0) th:eq(2)').simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mousemove', { clientX: resizerPosition.left + 30 });
    $resizer.simulate('mouseup');

    expect(colWidth(spec().$container, 1)).toBe(80);
    expect(colWidth(spec().$container, 2)).toBe(50);
    expect(colWidth(spec().$container, 3)).toBe(50);
  });

  it('should resize all columns after resize action when selected all cells', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      rowHeaders: true,
      colHeaders: true,
      manualColumnResize: true
    });

    expect(colWidth(spec().$container, 0)).toBe(50);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(50);

    await selectAll();

    getTopClone().find('thead tr:eq(0) th:eq(2)').simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mousemove', { clientX: resizerPosition.left + 30 });
    $resizer.simulate('mouseup');

    expect(colWidth(spec().$container, 0)).toBe(80);
    expect(colWidth(spec().$container, 1)).toBe(80);
    expect(colWidth(spec().$container, 2)).toBe(80);
  });

  it('should not throw any errors, when selecting headers partially outside of viewport, when the header renderer' +
    ' is meant to remove all header children and re-render them from scratch', async() => {
    const nativeOnError = window.onerror;
    let errors = 0;

    window.onerror = function() {
      errors += 1;

      return true;
    };

    handsontable({
      data: createSpreadsheetData(200, 20),
      colHeaders: true,
      rowHeaders: true,
      manualColumnResize: true,
      height: 205,
      width: 590,
      afterGetColumnHeaderRenderers(rendererFactoryArray) {

        // custom header renderer -> removes all TH content and re-renders them again.
        rendererFactoryArray[0] = function(index, TH) {
          Handsontable.dom.empty(TH);
          TH.innerHTML = '<div style="width: 100%;"> test </div>';
        };
      },
    });

    const firstHeader = getTopClone().find('thead tr:eq(0) th:eq(10) div');

    firstHeader.simulate('mouseover');
    firstHeader.simulate('mousedown');

    const secondHeader = getTopClone().find('thead tr:eq(0) th:eq(11) div');

    secondHeader.simulate('mouseover');
    secondHeader.simulate('mouseup');

    expect(errors).withContext('Expected not to throw any errors, but errors were thrown.').toEqual(0);

    // Reassign the native onerror handler.
    window.onerror = nativeOnError;
  });

  it('should not throw any errors, when the cell renderers use HTML table to present the value (#dev-1298)', async() => {
    const onErrorSpy = spyOn(window, 'onerror').and.returnValue(true);

    handsontable({
      data: createSpreadsheetData(10, 10),
      colHeaders: true,
      manualColumnResize: true,
      renderer(hot, td, row, column, value) {
        td.innerHTML = `
          <table>
            <thead>
              <tr>
                <th>${value}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>${value}</th>
              </tr>
            </tbody>
          </table>`;
      }
    });

    const rendererTH = $(getCell(0, 0).querySelector('thead th'));

    rendererTH
      .simulate('mouseover')
      .simulate('mousedown')
      .simulate('click');

    expect(onErrorSpy).not.toHaveBeenCalled();
  });

  describe('handle position in a table positioned using CSS\'s `transform`', () => {
    it('should display the handles in the correct position, with holder as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: createSpreadsheetData(10, 20),
        colHeaders: true,
        rowHeaders: true,
        manualColumnResize: true,
        height: 100,
        width: 400
      });

      let $colHeader = getTopClone().find('thead tr:eq(0) th:eq(2)');

      $colHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualColumnResizer');

      expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
      expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);

      await scrollViewportHorizontally(200);

      $colHeader = getTopClone().find('thead tr:eq(0) th:eq(7)');
      $colHeader.simulate('mouseover');

      expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
      expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);
    });

    it('should display the handles in the correct position, with window as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: createSpreadsheetData(10, 80),
        colHeaders: true,
        rowHeaders: true,
        manualColumnResize: true
      });

      let $colHeader = getTopClone().find('thead tr:eq(0) th:eq(2)');

      $colHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualColumnResizer');

      expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
      expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);

      await scrollViewportHorizontally(600);

      $colHeader = getTopClone().find('thead tr:eq(0) th:eq(7)');
      $colHeader.simulate('mouseover');

      expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
      expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);
    });
  });

  describe('column resizing in a table positioned using CSS\'s `transform`', () => {
    it('should resize (expanding) selected columns, with holder as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: createSpreadsheetData(10, 20),
        colHeaders: true,
        manualColumnResize: true,
        width: 400,
        height: 200,
        viewportColumnRenderingOffset: 20
      });

      await scrollViewportHorizontally(200);

      getTopClone().find('thead tr:eq(0) th:eq(5)').simulate('mousedown');
      getTopClone().find('thead tr:eq(0) th:eq(6)').simulate('mouseover');
      getTopClone().find('thead tr:eq(0) th:eq(7)').simulate('mouseover');
      getTopClone().find('thead tr:eq(0) th:eq(7)').simulate('mouseup');

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientX: resizerPosition.left });
      $resizer.simulate('mousemove', { clientX: resizerPosition.left + 30 });
      $resizer.simulate('mouseup');

      expect(getTopClone().find('thead tr:eq(0) th:eq(5)').width()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(79);
        main.toBe(79);
        horizon.toBe(81);
      });
      expect(getTopClone().find('thead tr:eq(0) th:eq(6)').width()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(79);
        main.toBe(79);
        horizon.toBe(81);
      });
      expect(getTopClone().find('thead tr:eq(0) th:eq(7)').width()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(79);
        main.toBe(79);
        horizon.toBe(81);
      });
    });

    it('should resize (expanding) selected columns, with window as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: createSpreadsheetData(10, 50),
        colHeaders: true,
        manualColumnResize: true,
        viewportColumnRenderingOffset: 20
      });

      await scrollViewportHorizontally(400);

      getTopClone().find('thead tr:eq(0) th:eq(9)').simulate('mousedown');
      getTopClone().find('thead tr:eq(0) th:eq(10)').simulate('mouseover');
      getTopClone().find('thead tr:eq(0) th:eq(11)').simulate('mouseover');
      getTopClone().find('thead tr:eq(0) th:eq(11)').simulate('mouseup');

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientX: resizerPosition.left });
      $resizer.simulate('mousemove', { clientX: resizerPosition.left + 30 });
      $resizer.simulate('mouseup');

      expect(getTopClone().find('thead tr:eq(0) th:eq(9)').width()).toBe(79);
      expect(getTopClone().find('thead tr:eq(0) th:eq(10)').width()).toBe(79);
      expect(getTopClone().find('thead tr:eq(0) th:eq(11)').width()).toBe(79);
    });
  });

  describe('contiguous/non-contiguous selected columns resizing in a table', () => {
    it('should resize (expanding) width of selected contiguous columns', async() => {
      handsontable({
        data: createSpreadsheetData(10, 50),
        colHeaders: true,
        rowHeaders: true,
        manualColumnResize: true
      });

      await selectColumns(3, 5);
      getTopClone().find('thead tr:eq(0) th:eq(4)').simulate('mouseover'); // Select 3rd Column

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientX: resizerPosition.left });
      $resizer.simulate('mousemove', { clientX: resizerPosition.left + 30 });
      $resizer.simulate('mouseup');

      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(50);
        horizon.toBe(52);
      });
      expect(colWidth(spec().$container, 3)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(80);
        main.toBe(80);
        horizon.toBe(82);
      });
      expect(colWidth(spec().$container, 4)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(80);
        main.toBe(80);
        horizon.toBe(82);
      });
      expect(colWidth(spec().$container, 5)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(80);
        main.toBe(80);
        horizon.toBe(82);
      });
      expect(colWidth(spec().$container, 6)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(50);
        horizon.toBe(53);
      });
    });

    it('should resize (expanding) width of selected non-contiguous columns', async() => {
      handsontable({
        data: createSpreadsheetData(10, 50),
        colHeaders: true,
        rowHeaders: true,
        manualColumnResize: true
      });

      // After changes introduced in Handsontable 12.0.0 we handle shortcuts only by listening Handsontable.
      // Please keep in mind that selectColumns/selectRows doesn't set instance to listening (see #7290).
      await listen();
      await selectColumns(3);

      await keyDown('control/meta');

      await selectColumns(7);
      await selectColumns(10);

      await keyUp('control/meta');

      getTopClone().find('thead tr:eq(0) th:eq(11)').simulate('mouseover'); // Select 10th Column

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientX: resizerPosition.left });
      $resizer.simulate('mousemove', { clientX: resizerPosition.left + 30 });
      $resizer.simulate('mouseup');

      expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(50);
        horizon.toBe(52);
      });
      expect(colWidth(spec().$container, 3)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(80);
        main.toBe(80);
        horizon.toBe(81);
      });
      expect(colWidth(spec().$container, 4)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(50);
        horizon.toBe(51);
      });
      expect(colWidth(spec().$container, 5)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(50);
        horizon.toBe(51);
      });
      expect(colWidth(spec().$container, 6)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(50);
        main.toBe(50);
        horizon.toBe(53);
      });
      expect(colWidth(spec().$container, 7)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(80);
        main.toBe(80);
        horizon.toBe(81);
      });
      expect(colWidth(spec().$container, 8)).toBe(50);
      expect(colWidth(spec().$container, 9)).toBe(50);
      expect(colWidth(spec().$container, 10)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(80);
        main.toBe(80);
        horizon.toBe(81);
      });
      expect(colWidth(spec().$container, 11)).toBe(50);
    });

    it('should not resize few columns when selected just single cells before resize action', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        manualColumnResize: true
      });

      await selectCells([[1, 1, 2, 2]]);

      getTopClone().find('thead tr:eq(0) th:eq(2)').simulate('mouseover');

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientX: resizerPosition.left });
      $resizer.simulate('mousemove', { clientX: resizerPosition.left + 30 });
      $resizer.simulate('mouseup');

      expect(colWidth(spec().$container, 1)).toBe(50);
      expect(colWidth(spec().$container, 2)).toBe(80);
    });
  });

  describe('handle and guide', () => {
    using('configuration object', [
      { htmlDir: 'ltr', layoutDirection: 'inherit' },
      { htmlDir: 'rtl', layoutDirection: 'ltr' },
    ], ({ htmlDir, layoutDirection }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      it.forTheme('classic')(`should display the resize handle in the proper position and with
 a proper size`, async() => {
        handsontable({
          layoutDirection,
          data: [
            { id: 1, name: 'Ted', lastName: 'Right' },
            { id: 2, name: 'Frank', lastName: 'Honest' },
            { id: 3, name: 'Joan', lastName: 'Well' },
            { id: 4, name: 'Sid', lastName: 'Strong' },
            { id: 5, name: 'Jane', lastName: 'Neat' }
          ],
          colHeaders: true,
          manualColumnResize: true
        });

        const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(1)');

        $headerTH.simulate('mouseover');

        const $handle = $('.manualColumnResizer');

        expect($handle.offset().left)
          .toEqual($headerTH.offset().left + $headerTH.outerWidth() - $handle.outerWidth() - 1);
        expect($handle.height()).toEqual($headerTH.outerHeight());
      });

      it.forTheme('main')(`should display the resize handle in the proper position and with
 a proper size`, async() => {
        handsontable({
          layoutDirection,
          data: [
            { id: 1, name: 'Ted', lastName: 'Right' },
            { id: 2, name: 'Frank', lastName: 'Honest' },
            { id: 3, name: 'Joan', lastName: 'Well' },
            { id: 4, name: 'Sid', lastName: 'Strong' },
            { id: 5, name: 'Jane', lastName: 'Neat' }
          ],
          colHeaders: true,
          manualColumnResize: true
        });

        const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(1)');

        $headerTH.simulate('mouseover');

        const $handle = $('.manualColumnResizer');

        expect($handle.offset().left)
          .toEqual($headerTH.offset().left + $headerTH.outerWidth() - ($handle.outerWidth() / 2) - 1);
        expect($handle.height()).toEqual($headerTH.outerHeight());
      });

      it.forTheme('horizon')(`should display the resize handle in the proper position and with
 a proper size`, async() => {
        handsontable({
          layoutDirection,
          data: [
            { id: 1, name: 'Ted', lastName: 'Right' },
            { id: 2, name: 'Frank', lastName: 'Honest' },
            { id: 3, name: 'Joan', lastName: 'Well' },
            { id: 4, name: 'Sid', lastName: 'Strong' },
            { id: 5, name: 'Jane', lastName: 'Neat' }
          ],
          colHeaders: true,
          manualColumnResize: true
        });

        const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(1)');

        $headerTH.simulate('mouseover');

        const $handle = $('.manualColumnResizer');

        expect($handle.offset().left)
          .toEqual($headerTH.offset().left + $headerTH.outerWidth() - ($handle.outerWidth() / 2) - 1);
        expect($handle.height()).toEqual($headerTH.outerHeight());
      });

      it('should display the resize handle in the proper z-index and be greater than top overlay z-index', async() => {
        handsontable({
          layoutDirection,
          data: [
            { id: 1, name: 'Ted', lastName: 'Right' },
            { id: 2, name: 'Frank', lastName: 'Honest' },
            { id: 3, name: 'Joan', lastName: 'Well' },
            { id: 4, name: 'Sid', lastName: 'Strong' },
            { id: 5, name: 'Jane', lastName: 'Neat' }
          ],
          colHeaders: true,
          manualColumnResize: true
        });

        const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(1)');

        $headerTH.simulate('mouseover');

        const $handle = $('.manualColumnResizer');

        expect($handle.css('z-index')).toBeGreaterThan(getTopClone().css('z-index'));
      });

      it('should display the resize guide in the correct size', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnResize: true,
          height: 'auto',
          width: 200
        });
        const tableHeight = parseInt(tableView().getTableHeight(), 10);
        const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(1)');

        $headerTH.simulate('mouseover');

        const $resizer = spec().$container.find('.manualColumnResizer');
        const resizerPosition = $resizer.position();

        $resizer.simulate('mousedown', { clientY: resizerPosition.top });

        const $guide = spec().$container.find('.manualColumnResizerGuide');

        $resizer.simulate('mouseup');

        expect($guide.height()).toBeCloseTo(tableHeight - $resizer.height(), 0);
      });
    });

    it.forTheme('classic')('should remove resize handler when user clicks RMB', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        manualColumnResize: true
      });

      const $colHeader = getTopClone().find('thead tr:eq(0) th:eq(2)');

      $colHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $handle.position();

      $handle.simulate('mousedown', { clientX: resizerPosition.left });

      // To watch whether color has changed.
      expect(getComputedStyle($handle[0]).backgroundColor).toBe('rgb(52, 169, 219)');

      $handle.simulate('contextmenu');

      await sleep(0);

      expect(getComputedStyle($handle[0]).backgroundColor).not.toBe('rgb(52, 169, 219)');
    });

    it.forTheme('main')('should remove resize handler when user clicks RMB', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        manualColumnResize: true
      });

      const $colHeader = getTopClone().find('thead tr:eq(0) th:eq(2)');

      $colHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $handle.position();

      $handle.simulate('mousedown', { clientX: resizerPosition.left });

      expect(getComputedStyle($handle[0]).opacity).toBe('1');

      $handle.simulate('contextmenu');

      await sleep(0);

      expect(getComputedStyle($handle[0]).opacity).not.toBe('1');
    });

    it.forTheme('horizon')('should remove resize handler when user clicks RMB', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        manualColumnResize: true
      });

      const $colHeader = getTopClone().find('thead tr:eq(0) th:eq(2)');

      $colHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $handle.position();

      $handle.simulate('mousedown', { clientX: resizerPosition.left });

      expect(getComputedStyle($handle[0]).opacity).toBe('1');

      $handle.simulate('contextmenu');

      await sleep(0);

      expect(getComputedStyle($handle[0]).opacity).not.toBe('1');
    });
  });

  describe('with the AutoColumnSize plugin', () => {
    it('should not cause row misalignment when manualRowResize is enabled via `updateSettings` ' +
      'after autoRowSize initialization', async() => {
      const data = createSpreadsheetData(5, 3);

      data[4][0] = 'Loremipsumdolorsitametconsecteturadipiscing elit. Maecenas hendrerit elit sed quam porta ' +
        'tempus. Quisque eget vulputate metus. Cras pulvinar diam ipsum, eget rhoncus dolor lacinia a. ' +
        'Aliquam vitae eros varius, feugiat nibh id, auctor lorem. Phasellus vulputate odio diam, sed interdum ' +
        'elit consectetur ut. Fusce vulputate ligula tincidunt lectus tempor, ac elementum nulla tempus. Fusce ' +
        'rutrum lorem et eros euismod fermentum. Aenean varius dui vel nunc tristique, vel finibus tortor gravida. ' +
        'Ut molestie nisl a velit ultricies, gravida volutpat lectus pulvinar. Nulla sed purus sit amet justo ' +
        'ullamcorper vel non nisl. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia ' +
        'curae; Cras auctor, lacus non euismod venenatis, augue nulla auctor risus, placerat porta dui enim eu odio. ' +
        'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.';

      handsontable({
        data,
        fixedRowsTop: 1,
        rowHeaders: true,
        autoColumnSize: true,
        rowHeights: 100,
      });

      await sleep(100);

      await updateSettings({
        manualColumnResize: [50, 50, 50],
      });

      expect(getTopClone().find('table').width()).toBe(getMaster().find('table').width());
    });
  });
});
