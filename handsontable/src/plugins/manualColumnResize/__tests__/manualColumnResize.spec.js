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
    // Disable autoColumnSize so columns use the deterministic 50px default width,
    // making the post-drag pixel assertions (34px) stable across themes.
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      autoColumnSize: false,
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

    await waitForNextAnimationFrames(63);

    const $columnHeaders = spec().$container.find('.ht_clone_top thead tr:eq(0) th');

    expect($columnHeaders.eq(1).width()).toBe(34);
    expect($columnHeaders.eq(2).width()).toBe(34);
    expect($columnHeaders.eq(3).width()).toBe(34);
  });

  it('should show resizer for fixed columns', async() => {
    // Disable autoColumnSize so columns use the deterministic 50px default width,
    // making the exact resizer position assertions (left: 194, left: 94) stable across themes.
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      rowHeaders: true,
      fixedColumnsStart: 2,
      autoColumnSize: false,
      manualColumnResize: true
    });

    getTopClone()
      .find('thead tr:eq(0) th:eq(3)')
      .simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');

    expect($resizer.position()).toEqual({ top: 0, left: 194 });

    // after hovering over fixed column, resizer should be moved to the fixed column
    getTopInlineStartClone()
      .find('thead tr:eq(0) th:eq(1)')
      .simulate('mouseover');

    expect($resizer.position()).toEqual({ top: 0, left: 94 });
  });

  it('should resize (expanding) selected columns', async() => {
    // Disable autoColumnSize so columns use the deterministic 50px default width,
    // making the post-drag pixel assertions (155px) stable across themes.
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      autoColumnSize: false,
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

    await waitForNextAnimationFrames(63);

    const $columnHeaders = spec().$container.find('.ht_clone_top thead tr:eq(0) th');

    expect($columnHeaders.eq(1).width()).toBe(155);
    expect($columnHeaders.eq(2).width()).toBe(155);
    expect($columnHeaders.eq(3).width()).toBe(155);
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

    // After manual resize, column 1 is narrower; the others stretch to fill the container
    const manualWidth = $columnHeaders.eq(1).width();

    expect(manualWidth).toBeAroundValue(63, 2);

    const $th = getTopClone().find('thead tr:eq(1) th:eq(1)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });

    await waitForNextAnimationFrames(63);

    // After double-click auto-resize, column 1 gets its natural (font-dependent) width
    const autoWidth = $columnHeaders.eq(1).width();

    expect(autoWidth).toBeLessThan(manualWidth);

    // The remaining 4 columns should share the leftover space roughly equally
    const totalWidth = $columnHeaders.eq(0).width() + autoWidth
      + $columnHeaders.eq(2).width() + $columnHeaders.eq(3).width()
      + $columnHeaders.eq(4).width();

    // Sum of the 5 column widths must equal the container's content width (910px) minus
    // the 6px the HOT wrapper reserves for its outer border + scrollbar-gutter column
    // (row-header column's displayed width even when rowHeaders is off -- see Walkontable
    // settings.defaultColumnWidth). Exactly 904 on every theme; no tolerance.
    expect(totalWidth).toBe(904);

    // Each non-auto-sized column should be equal to the stretched average within integer
    // rounding (one column may take the rounding remainder, so tolerance is 2).
    const stretchedAvg = ($columnHeaders.eq(0).width() + $columnHeaders.eq(2).width()
      + $columnHeaders.eq(3).width() + $columnHeaders.eq(4).width()) / 4;

    expect($columnHeaders.eq(0).width()).toBeAroundValue(stretchedAvg, 2);
    expect($columnHeaders.eq(2).width()).toBeAroundValue(stretchedAvg, 2);
    expect($columnHeaders.eq(3).width()).toBeAroundValue(stretchedAvg, 2);
    expect($columnHeaders.eq(4).width()).toBeAroundValue(stretchedAvg, 2);
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

    const widthBeforeCol0 = $columnHeaders.eq(0).width();
    const widthCol1 = $columnHeaders.eq(1).width();
    const widthCol2 = $columnHeaders.eq(2).width();
    const widthCol3 = $columnHeaders.eq(3).width();
    const widthLastBefore = $columnHeaders.eq(4).width();

    expect(widthBeforeCol0).toBeAroundValue(64, 2);

    // The last column stretches to fill the remaining space
    expect(widthLastBefore).toBeGreaterThan(widthBeforeCol0);

    const $th = getTopClone().find('thead tr:eq(1) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });
    await waitForNextAnimationFrames(63);

    // After double-click, column 0 gets its auto-sized (natural) width
    const autoWidth = $columnHeaders.eq(0).width();

    expect(autoWidth).toBeLessThan(widthBeforeCol0);

    // Middle columns are unchanged
    expect($columnHeaders.eq(1).width()).toBe(widthCol1);
    expect($columnHeaders.eq(2).width()).toBe(widthCol2);
    expect($columnHeaders.eq(3).width()).toBe(widthCol3);

    // The last column absorbs the freed space
    const widthLastAfter = $columnHeaders.eq(4).width();

    expect(widthLastAfter).toBeGreaterThan(widthLastBefore);
  });

  it('should resize appropriate columns to calculated autoColumnSize width after double click on column handler after ' +
     'updateSettings usage with new `colWidths` values', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      colHeaders: true,
      manualColumnResize: true,
    });

    await setDataAtCell(0, 1, 'Longer text');
    await waitForNextAnimationFrames(4);
    await updateSettings({
      colWidths: [45, 120, 160, 60, 80],
    });

    let autoWidth0;

    {
      const $th = getTopClone().find('thead tr:eq(0) th:eq(0)'); // resize the first column.

      $th.simulate('mouseover');

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();

      await mouseDoubleClick($resizer, { clientX: resizerPosition.left });
      await waitForNextAnimationFrames(63);

      // Column 0 auto-sized to its content width, which is less than the configured 45
      autoWidth0 = colWidth(spec().$container, 0);

      expect(autoWidth0).toBeLessThan(45);

      // Other columns remain at their configured widths
      expect(colWidth(spec().$container, 1)).toBeAroundValue(120, 3);
      expect(colWidth(spec().$container, 2)).toBeAroundValue(160, 3);
      expect(colWidth(spec().$container, 3)).toBeAroundValue(60, 3);
      expect(colWidth(spec().$container, 4)).toBeAroundValue(80, 3);
    }
    {
      const $th = getTopClone().find('thead tr:eq(0) th:eq(1)'); // resize the second column.

      $th.simulate('mouseover');

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();

      await mouseDoubleClick($resizer, { clientX: resizerPosition.left });

      await waitForNextAnimationFrames(63);

      // Column 1 auto-sized to fit "Longer text" -- narrower than the configured 120
      const autoWidth1 = colWidth(spec().$container, 1);

      expect(autoWidth1).toBeLessThan(120);

      // Column 0 unchanged from prior auto-resize
      expect(colWidth(spec().$container, 0)).toBeAroundValue(autoWidth0, 1);

      // Other columns remain at their configured widths
      expect(colWidth(spec().$container, 2)).toBeAroundValue(160, 3);
      expect(colWidth(spec().$container, 3)).toBeAroundValue(60, 3);
      expect(colWidth(spec().$container, 4)).toBeAroundValue(80, 3);
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

  it('should apply the return value of beforeColumnResize hook when drag resizing', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      beforeColumnResize: () => 150
    });

    expect(colWidth(spec().$container, 0)).toEqual(50);

    await resizeColumn(0, 100);

    expect(colWidth(spec().$container, 0)).toEqual(150);
  });

  it('should cancel column drag resize and revert to the original size when beforeColumnResize returns false', async() => {
    const afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      beforeColumnResize: () => false,
      afterColumnResize: afterColumnResizeCallback,
    });

    expect(colWidth(spec().$container, 0)).toEqual(50);

    await resizeColumn(0, 100);

    expect(colWidth(spec().$container, 0)).toEqual(50);
    expect(afterColumnResizeCallback).not.toHaveBeenCalled();
  });

  it('should cancel column double-click resize when beforeColumnResize returns false', async() => {
    const afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      afterColumnResize: afterColumnResizeCallback,
    });

    addHook('beforeColumnResize', () => false);

    const $th = getTopClone().find('thead tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });

    await waitForNextAnimationFrames(44);

    expect(colWidth(spec().$container, 0)).toEqual(50);
    expect(afterColumnResizeCallback).not.toHaveBeenCalled();
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

    await waitForNextAnimationFrames(44);

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

    await waitForNextAnimationFrames(63);

    const actualWidth = colWidth(spec().$container, 0);

    expect(afterColumnResizeCallback).toHaveBeenCalledTimes(1);
    expect(afterColumnResizeCallback).toHaveBeenCalledWith(
      actualWidth,
      0,
      true
    );
    expect(actualWidth).not.toBe(50);
    expect(actualWidth).toBe(hot().getColWidth(0));
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

    await waitForNextAnimationFrames(63);

    const widthAfter = colWidth(spec().$container, 2);

    // Auto-sized to content -- smaller than the default 50 and the manually set 300
    expect(widthAfter).toBeLessThan(50);
    expect(widthAfter).toBe(hot().getColWidth(2));
  });

  it('should reposition the resize handle after double click auto-size', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
    });

    await resizeColumn(0, 150);

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });
    await waitForNextAnimationFrames(63);

    const $columnHeader = getTopClone().find('thead tr:eq(0) th:eq(0)');
    const handleLeft = $resizer.offset().left;
    const headerRight = $columnHeader.offset().left + $columnHeader.width();

    expect(colWidth(spec().$container, 0)).toBeLessThan(150);
    expect(Math.abs(headerRight - 5 - handleLeft)).toBeLessThanOrEqual(1);
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

    await waitForNextAnimationFrames(63);

    const widthAfter = colWidth(spec().$container, 2);

    // Auto-sized to content -- smaller than the configured 100
    expect(widthAfter).toBeLessThan(100);
    expect(widthAfter).toBe(hot().getColWidth(2));
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

    await waitForNextAnimationFrames(38);
    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });
    await waitForNextAnimationFrames(38);

    // All three selected columns auto-sized to their content widths
    const autoWidth1 = colWidth(spec().$container, 1);
    const autoWidth2 = colWidth(spec().$container, 2);
    const autoWidth3 = colWidth(spec().$container, 3);

    expect(autoWidth1).toBeLessThan(50);
    expect(autoWidth2).toBeLessThan(50);
    expect(autoWidth3).toBeLessThan(50);

    // Each column matches its internal state
    expect(autoWidth1).toBe(hot().getColWidth(1));
    expect(autoWidth2).toBe(hot().getColWidth(2));
    expect(autoWidth3).toBe(hot().getColWidth(3));
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

    await waitForNextAnimationFrames(38);
    await mouseDoubleClick($resizer, { clientX: resizerPosition.left });
    getTopClone().find('tr:eq(0) th:eq(2)').simulate('mouseover');
    await waitForNextAnimationFrames(38);

    const autoWidth = colWidth(spec().$container, 1);

    // Auto-sized to content -- smaller than the default 50
    expect(autoWidth).toBeLessThan(50);
    expect(autoWidth).toBe(hot().getColWidth(1));
  });

  it('should adjust resize handles position after table size changed', async() => {
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
        width: 400,
        viewportColumnRenderingOffset: 10,
        viewportRowRenderingOffset: 10,
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
        autoColumnSize: false,
        manualColumnResize: true,
        width: 400,
        height: 200,
        viewportRowRenderingOffset: 10,
        viewportColumnRenderingOffset: 10,
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

      expect(getTopClone().find('thead tr:eq(0) th:eq(5)').width()).toBe(
        79,
      );
      expect(getTopClone().find('thead tr:eq(0) th:eq(6)').width()).toBe(
        79,
      );
      expect(getTopClone().find('thead tr:eq(0) th:eq(7)').width()).toBe(
        79,
      );
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

    it('should display the handle and resize by unscaled width when parent is scaled', async() => {
      spec().$container.css({
        transform: 'scale(0.5)',
        transformOrigin: 'top left',
      });

      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnResize: true,
      });

      const $colHeader = getTopClone().find('thead tr:eq(0) th:eq(1)');

      $colHeader.simulate('mouseover');

      const $resizer = spec().$container.find('.manualColumnResizer');
      const handleBox = $resizer[0].getBoundingClientRect();
      const thBox = $colHeader[0].getBoundingClientRect();

      expect(handleBox.left).toBeCloseTo(thBox.left + thBox.width - (handleBox.width / 2) - 1, 0);

      $resizer.simulate('mousedown', { clientX: handleBox.left });
      const guide = spec().$container.find('.manualColumnResizerGuide')[0];
      const guideBoxBeforeMove = guide.getBoundingClientRect();

      $resizer.simulate('mousemove', { clientX: handleBox.left + 25 });
      const guideBoxAfterMove = guide.getBoundingClientRect();

      $resizer.simulate('mouseup');

      expect(guideBoxAfterMove.left - guideBoxBeforeMove.left).toBeCloseTo(25, 0);
      expect(colWidth(spec().$container, 1)).toBeGreaterThan(90);
    });
  });

  describe('contiguous/non-contiguous selected columns resizing in a table', () => {
    it('should resize (expanding) width of selected contiguous columns', async() => {
      handsontable({
        data: createSpreadsheetData(10, 50),
        colHeaders: true,
        rowHeaders: true,
        autoColumnSize: false,
        manualColumnResize: true
      });

      await selectColumns(3, 5);
      getTopClone().find('thead tr:eq(0) th:eq(4)').simulate('mouseover'); // Select 3rd Column

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientX: resizerPosition.left });
      $resizer.simulate('mousemove', { clientX: resizerPosition.left + 30 });
      $resizer.simulate('mouseup');

      expect(colWidth(spec().$container, 2)).toBe(50);
      expect(colWidth(spec().$container, 3)).toBe(80);
      expect(colWidth(spec().$container, 4)).toBe(80);
      expect(colWidth(spec().$container, 5)).toBe(80);
      expect(colWidth(spec().$container, 6)).toBe(50);
    });

    it('should resize (expanding) width of selected non-contiguous columns', async() => {
      handsontable({
        data: createSpreadsheetData(10, 50),
        colHeaders: true,
        rowHeaders: true,
        autoColumnSize: false,
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

      expect(colWidth(spec().$container, 2)).toBe(50);
      expect(colWidth(spec().$container, 3)).toBe(80);
      expect(colWidth(spec().$container, 4)).toBe(50);
      expect(colWidth(spec().$container, 5)).toBe(50);
      expect(colWidth(spec().$container, 6)).toBe(50);
      expect(colWidth(spec().$container, 7)).toBe(80);
      expect(colWidth(spec().$container, 8)).toBe(50);
      expect(colWidth(spec().$container, 9)).toBe(50);
      expect(colWidth(spec().$container, 10)).toBe(80);
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

      it(`should display the resize handle in the proper position and with
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

    it('should remove resize handler when user clicks RMB', async() => {
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

      await waitForNextAnimationFrames(0);

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

      await waitForNextAnimationFrames(7);

      await updateSettings({
        manualColumnResize: [50, 50, 50],
      });

      expect(getTopClone().find('table').width()).toBe(getMaster().find('table').width());
    });
  });

  describe('with `preventOverflow: \'horizontal\'`', () => {
    it('should position the resize handle at the visible column header right edge after horizontal scroll (#10403)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 20),
        colHeaders: true,
        manualColumnResize: true,
        preventOverflow: 'horizontal',
        width: 400,
        height: 200,
      });

      await scrollViewportHorizontally(300);
      await waitForNextAnimationFrames(2);

      const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(8)');

      $headerTH.simulate('mouseover');

      const $handle = $('.manualColumnResizer');

      expect($handle.offset().left)
        .toEqual($headerTH.offset().left + $headerTH.outerWidth() - ($handle.outerWidth() / 2) - 1);
    });

    it('should resize a column by dragging the handle after horizontal scroll (#10403)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 20),
        colHeaders: true,
        manualColumnResize: true,
        preventOverflow: 'horizontal',
        width: 400,
        height: 200,
      });

      await scrollViewportHorizontally(300);
      await waitForNextAnimationFrames(2);

      const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(8)');
      const initialWidth = $headerTH.outerWidth();

      $headerTH.simulate('mouseover');

      const $handle = $('.manualColumnResizer');
      const handleOffset = $handle.offset();

      $handle.simulate('mousedown', { clientX: handleOffset.left });
      $handle.simulate('mousemove', { clientX: handleOffset.left + 30 });
      $handle.simulate('mouseup');

      expect(colWidth(spec().$container, 8)).toBe(initialWidth + 30);
    });
  });
});
