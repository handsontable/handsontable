describe('manualRowResize', () => {
  const id = 'test';
  const defaultRowHeight = 22;

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should change row heights at init', async() => {
    handsontable({
      rowHeaders: true,
      manualRowResize: [50, 40, 100]
    });

    expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toEqual(51);
      main.toEqual(50);
      horizon.toEqual(50);
    });
    expect(rowHeight(spec().$container, 1)).toEqual(40);
    expect(rowHeight(spec().$container, 2)).toEqual(100);
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
      rowHeaders: true
    });

    await updateSettings({ manualRowResize: true });

    getInlineStartClone().find('tbody tr:eq(0) th:eq(0)').simulate('mouseover');

    expect($('.manualRowResizer').size()).toBeGreaterThan(0);
  });

  it.forTheme('classic')('should change the default row height with updateSettings', async() => {
    handsontable({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2); // + Double border
    expect(rowHeight(spec().$container, 1)).toEqual(defaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight + 1); // + Single border

    await updateSettings({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(61);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);
  });

  it.forTheme('main')('should change the default row height with updateSettings', async() => {
    const themeDefaultRowHeight = 29;

    handsontable({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 1)).toEqual(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(themeDefaultRowHeight);

    await updateSettings({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(60);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);
  });

  it.forTheme('horizon')('should change the default row height with updateSettings', async() => {
    const themeDefaultRowHeight = 37;

    handsontable({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1); // + Double border
    expect(rowHeight(spec().$container, 1)).toEqual(themeDefaultRowHeight); // + Single border
    expect(rowHeight(spec().$container, 2)).toEqual(themeDefaultRowHeight); // + Single border

    await updateSettings({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(60);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);
  });

  it('should change the row height with updateSettings', async() => {
    handsontable({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toEqual(61); // not sure if correct?
      main.toEqual(60);
      horizon.toEqual(60);
    });
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);

    await updateSettings({
      manualRowResize: [30, 80, 100]
    });

    expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toEqual(31);
      main.toEqual(30);
      horizon.toEqual(37);
    });
    expect(rowHeight(spec().$container, 1)).toEqual(80);
    expect(rowHeight(spec().$container, 2)).toEqual(100);
  });

  it('should not change the row height when `true` is passing', async() => {
    handsontable({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toEqual(61);
      main.toEqual(60);
      horizon.toEqual(60);
    });
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);

    await updateSettings({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toEqual(61);
      main.toEqual(60);
      horizon.toEqual(60);
    });
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);
  });

  it.forTheme('classic')('should change the row height to defaults when undefined is passed', async() => {
    handsontable({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(61);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);

    await updateSettings({
      manualRowResize: undefined
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2); // + Double border
    expect(rowHeight(spec().$container, 1)).toEqual(defaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight + 1); // + Single border
  });

  it.forTheme('main')('should change the row height to defaults when undefined is passed', async() => {
    const themeDefaultRowHeight = 29;

    handsontable({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(60);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);

    await updateSettings({
      manualRowResize: undefined
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 1)).toEqual(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(themeDefaultRowHeight);
  });

  it.forTheme('horizon')('should change the row height to defaults when undefined is passed', async() => {
    const themeDefaultRowHeight = 37;

    handsontable({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(60);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);

    await updateSettings({
      manualRowResize: undefined
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);
    expect(rowHeight(spec().$container, 1)).toEqual(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(themeDefaultRowHeight);
  });

  it.forTheme('classic')('should reset row height', async() => {
    handsontable({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);
    expect(rowHeight(spec().$container, 1)).toEqual(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight + 1);

    await updateSettings({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);
    expect(rowHeight(spec().$container, 1)).toEqual(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight + 1);
  });

  it.forTheme('main')('should reset row height', async() => {
    const themeDefaultRowHeight = 29;

    handsontable({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 1)).toEqual(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(themeDefaultRowHeight);

    await updateSettings({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 1)).toEqual(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(themeDefaultRowHeight);
  });

  it.forTheme('horizon')('should reset row height', async() => {
    const themeDefaultRowHeight = 37;

    handsontable({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);
    expect(rowHeight(spec().$container, 1)).toEqual(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(themeDefaultRowHeight);

    await updateSettings({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);
    expect(rowHeight(spec().$container, 1)).toEqual(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(themeDefaultRowHeight);
  });

  it.forTheme('classic')('should keep proper row heights after inserting row', async() => {
    handsontable({
      manualRowResize: [undefined, undefined, 120]
    });

    expect(rowHeight(spec().$container, 0)).toBe(defaultRowHeight + 2);
    expect(rowHeight(spec().$container, 1)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 2)).toBe(120);
    expect(rowHeight(spec().$container, 3)).toBe(defaultRowHeight + 1);

    await alter('insert_row_above', 0);

    expect(rowHeight(spec().$container, 0)).toBe(defaultRowHeight + 2);
    expect(rowHeight(spec().$container, 1)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 2)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 3)).toBe(120);
  });

  it.forTheme('main')('should keep proper row heights after inserting row', async() => {
    const themeDefaultRowHeight = 29;

    handsontable({
      manualRowResize: [undefined, undefined, 120]
    });

    expect(rowHeight(spec().$container, 0)).toBe(themeDefaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 1)).toBe(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toBe(120);
    expect(rowHeight(spec().$container, 3)).toBe(themeDefaultRowHeight);

    await alter('insert_row_above', 0);

    expect(rowHeight(spec().$container, 0)).toBe(themeDefaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 1)).toBe(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toBe(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 3)).toBe(120);
  });

  it.forTheme('horizon')('should keep proper row heights after inserting row', async() => {
    const themeDefaultRowHeight = 37;

    handsontable({
      manualRowResize: [undefined, undefined, 120]
    });

    expect(rowHeight(spec().$container, 0)).toBe(themeDefaultRowHeight + 1);
    expect(rowHeight(spec().$container, 1)).toBe(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toBe(120);
    expect(rowHeight(spec().$container, 3)).toBe(themeDefaultRowHeight);

    await alter('insert_row_above', 0);

    expect(rowHeight(spec().$container, 0)).toBe(themeDefaultRowHeight + 1);
    expect(rowHeight(spec().$container, 1)).toBe(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toBe(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 3)).toBe(120);
  });

  it.forTheme('classic')('should keep proper row heights after removing row', async() => {
    handsontable({
      manualRowResize: [undefined, undefined, 120]
    });

    expect(rowHeight(spec().$container, 0)).toBe(defaultRowHeight + 2);
    expect(rowHeight(spec().$container, 1)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 2)).toBe(120);
    expect(rowHeight(spec().$container, 3)).toBe(defaultRowHeight + 1);

    await alter('remove_row', 0);

    expect(rowHeight(spec().$container, 0)).toBe(defaultRowHeight + 2);
    expect(rowHeight(spec().$container, 1)).toBe(120);
    expect(rowHeight(spec().$container, 2)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 3)).toBe(defaultRowHeight + 1);
  });

  it.forTheme('main')('should keep proper row heights after removing row', async() => {
    const themeDefaultRowHeight = 29;

    handsontable({
      manualRowResize: [undefined, undefined, 120]
    });

    expect(rowHeight(spec().$container, 0)).toBe(themeDefaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 1)).toBe(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toBe(120);
    expect(rowHeight(spec().$container, 3)).toBe(themeDefaultRowHeight);

    await alter('remove_row', 0);

    expect(rowHeight(spec().$container, 0)).toBe(themeDefaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 1)).toBe(120);
    expect(rowHeight(spec().$container, 2)).toBe(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 3)).toBe(themeDefaultRowHeight);
  });

  it.forTheme('horizon')('should keep proper row heights after removing row', async() => {
    const themeDefaultRowHeight = 37;

    handsontable({
      manualRowResize: [undefined, undefined, 120]
    });

    expect(rowHeight(spec().$container, 0)).toBe(themeDefaultRowHeight + 1);
    expect(rowHeight(spec().$container, 1)).toBe(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toBe(120);
    expect(rowHeight(spec().$container, 3)).toBe(themeDefaultRowHeight);

    await alter('remove_row', 0);

    expect(rowHeight(spec().$container, 0)).toBe(themeDefaultRowHeight + 1);
    expect(rowHeight(spec().$container, 1)).toBe(120);
    expect(rowHeight(spec().$container, 2)).toBe(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 3)).toBe(themeDefaultRowHeight);
  });

  it.forTheme('classic')('should trigger beforeRowResize event after row height changes', async() => {
    const beforeRowResizeCallback = jasmine.createSpy('beforeRowResizeCallback');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      beforeRowResize: beforeRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);

    await resizeRow(0, 100);

    expect(beforeRowResizeCallback).toHaveBeenCalledWith(100, 0, false);
    expect(rowHeight(spec().$container, 0)).toEqual(101);
  });

  it.forTheme('main')('should trigger beforeRowResize event after row height changes', async() => {
    const beforeRowResizeCallback = jasmine.createSpy('beforeRowResizeCallback');
    const themeDefaultRowHeight = 29;

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      beforeRowResize: beforeRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);

    await resizeRow(0, 100);

    expect(beforeRowResizeCallback).toHaveBeenCalledWith(100, 0, false);
    expect(rowHeight(spec().$container, 0)).toEqual(100);
  });

  it.forTheme('horizon')('should trigger beforeRowResize event after row height changes', async() => {
    const beforeRowResizeCallback = jasmine.createSpy('beforeRowResizeCallback');
    const themeDefaultRowHeight = 37;

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      beforeRowResize: beforeRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);

    await resizeRow(0, 100);

    expect(beforeRowResizeCallback).toHaveBeenCalledWith(100, 0, false);
    expect(rowHeight(spec().$container, 0)).toEqual(100);
  });

  it('should appropriate resize rowHeight after beforeRowResize call a few times', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      rowHeaders: true,
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toEqual(24);
      main.toEqual(30);
      horizon.toEqual(38);
    });

    addHook('beforeRowResize', () => 100);
    addHook('beforeRowResize', () => 200);
    addHook('beforeRowResize', () => undefined);

    const $th = getInlineStartClone().find('tbody tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });

    await sleep(700);

    expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toEqual(201);
      main.toEqual(200);
      horizon.toEqual(200);
    });
  });

  it.forTheme('classic')('should trigger afterRowResize event after row height changes', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);

    await resizeRow(0, 100);
    expect(afterRowResizeCallback).toHaveBeenCalledWith(100, 0, false);
    expect(rowHeight(spec().$container, 0)).toEqual(101);
  });

  it.forTheme('main')('should trigger afterRowResize event after row height changes', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');
    const themeDefaultRowHeight = 29;

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);

    await resizeRow(0, 100);
    expect(afterRowResizeCallback).toHaveBeenCalledWith(100, 0, false);
    expect(rowHeight(spec().$container, 0)).toEqual(100);
  });

  it.forTheme('horizon')('should trigger afterRowResize event after row height changes', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');
    const themeDefaultRowHeight = 37;

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);

    await resizeRow(0, 100);
    expect(afterRowResizeCallback).toHaveBeenCalledWith(100, 0, false);
    expect(rowHeight(spec().$container, 0)).toEqual(100);
  });

  it.forTheme('classic')(`should not trigger afterRowResize event if row height
 does not change (delta = 0)`, async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);

    await resizeRow(0, defaultRowHeight + 2);
    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);
  });

  it.forTheme('main')(`should not trigger afterRowResize event if row height
 does not change (delta = 0)`, async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');
    const themeDefaultRowHeight = 29;

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);

    await resizeRow(0, themeDefaultRowHeight + 1);
    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);
  });

  it.forTheme('horizon')(`should not trigger afterRowResize event if row height does not change
 (delta = 0)`, async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');
    const themeDefaultRowHeight = 37;

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);

    await resizeRow(0, themeDefaultRowHeight + 1);
    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);
  });

  it.forTheme('classic')('should not trigger afterRowResize event after if row height does not change ' +
    '(no mousemove event)', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);

    const $th = getInlineStartClone().find('tbody tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await simulateClick($resizer, { clientY: resizerPosition.top });

    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);
  });

  it.forTheme('main')(`should not trigger afterRowResize event after if row height does not change
 (no mousemove event)`, async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');
    const themeDefaultRowHeight = 29;

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);

    const $th = getInlineStartClone().find('tbody tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await simulateClick($resizer, { clientY: resizerPosition.top });

    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);
  });

  it.forTheme('horizon')('should not trigger afterRowResize event after if row height does not change ' +
    '(no mousemove event)', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');
    const themeDefaultRowHeight = 37;

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);

    const $th = getInlineStartClone().find('tbody tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await simulateClick($resizer, { clientY: resizerPosition.top });

    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);
  });

  it.forTheme('classic')('should trigger an afterRowResize after row size changes, after double click', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      autoRowSize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);

    const $th = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
    await sleep(1000);

    expect(afterRowResizeCallback.calls.count()).toEqual(1);
    expect(afterRowResizeCallback.calls.argsFor(0)[1]).toEqual(2);
    expect(afterRowResizeCallback.calls.argsFor(0)[0]).toEqual(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight + 1);
  });

  it.forTheme('main')('should trigger an afterRowResize after row size changes, after double click', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');
    const themeDefaultRowHeight = 29;

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      autoRowSize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);

    const $th = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
    await sleep(1000);

    expect(afterRowResizeCallback.calls.count()).toEqual(1);
    expect(afterRowResizeCallback.calls.argsFor(0)[1]).toEqual(2);
    expect(afterRowResizeCallback.calls.argsFor(0)[0]).toEqual(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(themeDefaultRowHeight);
  });

  it.forTheme('horizon')('should trigger an afterRowResize after row size changes, after double click', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');
    const themeDefaultRowHeight = 37;

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      autoRowSize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);

    const $th = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
    await sleep(1000);

    expect(afterRowResizeCallback.calls.count()).toEqual(1);
    expect(afterRowResizeCallback.calls.argsFor(0)[1]).toEqual(2);
    expect(afterRowResizeCallback.calls.argsFor(0)[0]).toEqual(themeDefaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(themeDefaultRowHeight);
  });

  it('should resize appropriate rows to calculated autoRowSize height after double click on row handler after ' +
    'updateSettings usage with new `rowHeights` values', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
    });

    await setDataAtCell(1, 0, 'Longer\ntext');

    await sleep(50);

    await updateSettings({
      rowHeights: [45, 120, 160, 60, 80],
    });

    const $rowHeaders = getInlineStartClone().find('tbody tr th');

    {
      const $th = $rowHeaders.eq(0); // resize the first row.

      $th.simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
      await sleep(1000);

      expect($rowHeaders.eq(0).height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(22);
        main.toBe(28);
        horizon.toBe(36);
      });
      expect($rowHeaders.eq(1).height()).toBe(119);
      expect($rowHeaders.eq(2).height()).toBe(159);
      expect($rowHeaders.eq(3).height()).toBe(59);
      expect($rowHeaders.eq(4).height()).toBe(79);
    }
    {
      const $th = $rowHeaders.eq(1); // resize the second column.

      $th.simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
      await sleep(1000);

      expect($rowHeaders.eq(0).height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(22);
        main.toBe(28);
        horizon.toBe(36);
      });
      expect($rowHeaders.eq(1).height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(42);
        main.toBe(48);
        horizon.toBe(56);
      });
      expect($rowHeaders.eq(2).height()).toBe(159);
      expect($rowHeaders.eq(3).height()).toBe(59);
      expect($rowHeaders.eq(4).height()).toBe(79);
    }
  });

  it.forTheme('classic')('should not trigger afterRowResize event after if row height does not change ' +
    '(no dblclick event)', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);

    const $th = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await simulateClick($resizer, { clientY: resizerPosition.top });

    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);
  });

  it.forTheme('main')('should not trigger afterRowResize event after if row height does not change ' +
    '(no dblclick event)', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');
    const themeDefaultRowHeight = 29;

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);

    const $th = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await simulateClick($resizer, { clientY: resizerPosition.top });

    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);
  });

  it.forTheme('horizon')('should not trigger afterRowResize event after if row height does not change ' +
    '(no dblclick event)', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');
    const themeDefaultRowHeight = 37;

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);

    const $th = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await simulateClick($resizer, { clientY: resizerPosition.top });

    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(themeDefaultRowHeight + 1);
  });

  it('should autosize row after double click (when initial height is not defined)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      rowHeaders: true,
      manualRowResize: true
    });

    await resizeRow(2, 300);

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
    await sleep(1000);

    expect(rowHeight(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(23, 3);
      main.toBeAroundValue(29, 3);
      horizon.toBeAroundValue(37, 3);
    });
  });

  it('should autosize row after double click (when initial height is defined by the `rowHeights` option)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      rowHeaders: true,
      manualRowResize: true,
      rowHeights: 100
    });

    expect(rowHeight(spec().$container, 0)).toBeAroundValue(100, 1);
    expect(rowHeight(spec().$container, 1)).toBeAroundValue(100, 1);
    expect(rowHeight(spec().$container, 2)).toBeAroundValue(100, 1);

    await resizeRow(1, 300);

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
    await sleep(1000);

    expect(rowHeight(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(23, 1);
      main.toBeAroundValue(29, 1);
      horizon.toBeAroundValue(37, 1);
    });
  });

  it('should autosize selected rows after double click on handler', async() => {
    handsontable({
      data: createSpreadsheetData(9, 9),
      rowHeaders: true,
      manualRowResize: true,
    });

    await resizeRow(2, 300);

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');
    getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').simulate('mouseover');
    getInlineStartClone().find('tbody tr:eq(3) th:eq(0)').simulate('mouseover');
    getInlineStartClone().find('tbody tr:eq(3) th:eq(0)').simulate('mousemove');
    getInlineStartClone().find('tbody tr:eq(3) th:eq(0)').simulate('mouseup');

    await sleep(600);
    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
    await sleep(1000);

    expect(rowHeight(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(24);
      main.toBeAroundValue(29);
      horizon.toBeAroundValue(37);
    });
    expect(rowHeight(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(24);
      main.toBeAroundValue(29);
      horizon.toBeAroundValue(37);
    });
    expect(rowHeight(spec().$container, 3)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(24);
      main.toBeAroundValue(29);
      horizon.toBeAroundValue(37);
    });
  });

  it('should autosize selected rows after double click on handler and move mouse to the next row', async() => {
    handsontable({
      data: createSpreadsheetData(9, 9),
      rowHeaders: true,
      manualRowResize: true,
    });

    await resizeRow(1, 100);

    getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await sleep(600);
    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
    getInlineStartClone().find('tr:eq(2) th:eq(0)').simulate('mouseover');
    await sleep(600);

    expect(rowHeight(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(24);
      main.toBeAroundValue(29);
      horizon.toBeAroundValue(37);
    });
  });

  it('should resize (expanding and narrowing) selected rows', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      rowHeaders: true,
      manualRowResize: true
    });

    await resizeRow(2, 60);

    getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');

    const $rowsHeaders = getInlineStartClone().find('tr th');

    $rowsHeaders.eq(1).simulate('mousedown');
    $rowsHeaders.eq(2).simulate('mouseover');
    $rowsHeaders.eq(3).simulate('mouseover');
    $rowsHeaders.eq(3).simulate('mousemove');
    $rowsHeaders.eq(3).simulate('mouseup');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await sleep(600);

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mousemove', { clientY: resizerPosition.top - $rowsHeaders.eq(3).height() + 80 });
    $resizer.simulate('mouseup');

    expect($rowsHeaders.eq(1).height()).toEqual(80);
    expect($rowsHeaders.eq(2).height()).toEqual(80);
    expect($rowsHeaders.eq(3).height()).toEqual(80);

    await sleep(1200);

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mousemove', { clientY: resizerPosition.top - $rowsHeaders.eq(3).height() + 35 });
    $resizer.simulate('mouseup');

    expect($rowsHeaders.eq(1).height()).forThemes(({ classic, main, horizon }) => {
      classic.toEqual(35);
      main.toEqual(35);
      horizon.toEqual(36);
    });
    expect($rowsHeaders.eq(2).height()).forThemes(({ classic, main, horizon }) => {
      classic.toEqual(35);
      main.toEqual(35);
      horizon.toEqual(36);
    });
    expect($rowsHeaders.eq(3).height()).forThemes(({ classic, main, horizon }) => {
      classic.toEqual(35);
      main.toEqual(35);
      horizon.toEqual(36);
    });
  });

  it('should show resizer for fixed top rows', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      manualRowResize: true
    });

    getInlineStartClone()
      .find('tbody tr:eq(3) th:eq(0)')
      .simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');

    expect($resizer.position()).forThemes(({ classic, main, horizon }) => {
      classic.toEqual({
        top: 113,
        left: 0,
      });
      main.toEqual({
        top: 140,
        left: 0,
      });
      horizon.toEqual({
        top: 180,
        left: 0,
      });
    });

    // after hovering over fixed row, resizer should be moved to the fixed row
    getTopInlineStartClone()
      .find('tbody tr:eq(1) th:eq(0)')
      .simulate('mouseover');

    expect($resizer.position()).forThemes(({ classic, main, horizon }) => {
      classic.toEqual({
        top: 67,
        left: 0,
      });
      main.toEqual({
        top: 82,
        left: 0,
      });
      horizon.toEqual({
        top: 106,
        left: 0,
      });
    });
  });

  it('should show resizer for fixed bottom rows', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      rowHeaders: true,
      fixedRowsBottom: 2,
      manualRowResize: true
    });

    getInlineStartClone()
      .find('tbody tr:eq(3) th:eq(0)')
      .simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');

    expect($resizer.position()).forThemes(({ classic, main, horizon }) => {
      classic.toEqual({
        top: 113,
        left: 0,
      });
      main.toEqual({
        top: 140,
        left: 0,
      });
      horizon.toEqual({
        top: 180,
        left: 0,
      });
    });

    // after hovering over fixed row, resizer should be moved to the fixed row
    getBottomInlineStartClone()
      .find('tbody tr:eq(0) th:eq(0)')
      .simulate('mouseover');

    expect($resizer.position()).forThemes(({ classic, main, horizon }) => {
      classic.toEqual({
        top: 18,
        left: 0,
      });
      main.toEqual({
        top: 24,
        left: 0,
      });
      horizon.toEqual({
        top: 32,
        left: 0,
      });
    });
  });

  it('should resize proper row after resizing element adjacent to a selection', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      manualRowResize: true
    });

    await selectRows(2, 3);

    getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');
    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
    $resizer.simulate('mouseup');

    expect(getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(52);
      main.toBe(58);
      horizon.toBe(66);
    });
    expect(getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22);
      main.toBe(28);
      horizon.toBe(36);
    });
    expect(getInlineStartClone().find('tbody tr:eq(3) th:eq(0)').height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22);
      main.toBe(28);
      horizon.toBe(36);
    });
  });

  it('should resize all rows after resize action when selected all cells', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      rowHeaders: true,
      colHeaders: true,
      manualRowResize: true
    });

    expect(getInlineStartClone().find('tbody tr:eq(0) th:eq(0)').height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22);
      main.toBe(28);
      horizon.toBe(36);
    });
    expect(getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22);
      main.toBe(28);
      horizon.toBe(36);
    });
    expect(getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22);
      main.toBe(28);
      horizon.toBe(36);
    });

    await selectAll();

    getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
    $resizer.simulate('mouseup');

    expect(getInlineStartClone().find('tbody tr:eq(0) th:eq(0)').height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(52);
      main.toBe(57);
      horizon.toBe(65);
    });
    expect(getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(52);
      main.toBe(58);
      horizon.toBe(66);
    });
    expect(getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(52);
      main.toBe(58);
      horizon.toBe(66);
    });
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
      manualRowResize: true,
      height: 205,
      width: 590,
      viewportRowRenderingOffset: 0,
      afterGetRowHeaderRenderers(rendererFactoryArray) {

        // custom header renderer -> removes all TH content and re-renders them again.
        rendererFactoryArray[0] = function(index, TH) {
          Handsontable.dom.empty(TH);
          TH.innerHTML = '<div style="width: 100%;"> test </div>';
        };
      },
    });

    const firstHeader = getInlineStartClone().find('tbody tr:eq(6) th:eq(0) div');

    firstHeader.simulate('mouseover');
    firstHeader.simulate('mousedown');

    const secondHeader = getInlineStartClone().find('tbody tr:eq(8) th:eq(0) div');

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
      rowHeaders: true,
      manualRowResize: true,
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

    const rendererTH = $(getCell(0, 0).querySelector('tbody th'));

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
        data: createSpreadsheetData(20, 10),
        colHeaders: true,
        rowHeaders: true,
        manualRowResize: true,
        height: 400,
        width: 200
      });

      let $rowHeader = getInlineStartClone().find('tr:eq(2) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualRowResizer');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);

      await scrollViewportVertically(1); // we have to trigger innerBorderTop before we scroll to correct position
      await scrollViewportVertically(200);

      $rowHeader = getInlineStartClone().find('tr:eq(13) th:eq(0)');
      $rowHeader.simulate('mouseover');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
    });

    it('should display the handles in the correct position, with window as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: createSpreadsheetData(80, 10),
        colHeaders: true,
        rowHeaders: true,
        manualRowResize: true,
      });

      let $rowHeader = getInlineStartClone().find('tr:eq(2) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualRowResizer');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);

      await scrollViewportVertically(600);

      $rowHeader = getInlineStartClone().find('tr:eq(13) th:eq(0)');
      $rowHeader.simulate('mouseover');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
    });
  });

  describe('column resizing in a table positioned using CSS\'s `transform`', () => {
    it('should resize (expanding) selected columns, with holder as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: createSpreadsheetData(30, 10),
        rowHeaders: true,
        manualRowResize: true,
        width: 200,
        height: 400
      });

      await scrollViewportVertically(200);

      getInlineStartClone().find('tbody tr:eq(12) th:eq(0)').simulate('mousedown');
      getInlineStartClone().find('tbody tr:eq(13) th:eq(0)').simulate('mouseover');
      getInlineStartClone().find('tbody tr:eq(14) th:eq(0)').simulate('mouseover');
      getInlineStartClone().find('tbody tr:eq(14) th:eq(0)').simulate('mouseup');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getInlineStartClone().find('tbody tr:eq(12) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(52);
          main.toBe(58);
          horizon.toBe(66);
        });
      expect(getInlineStartClone().find('tbody tr:eq(13) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(52);
          main.toBe(58);
          horizon.toBe(66);
        });
      expect(getInlineStartClone().find('tbody tr:eq(14) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(52);
          main.toBe(58);
          horizon.toBe(66);
        });
    });

    it('should resize (expanding) selected columns, with window as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: createSpreadsheetData(50, 10),
        rowHeaders: true,
        manualRowResize: true
      });

      await scrollViewportVertically(200);

      getInlineStartClone().find('tbody tr:eq(12) th:eq(0)').simulate('mousedown');
      getInlineStartClone().find('tbody tr:eq(13) th:eq(0)').simulate('mouseover');
      getInlineStartClone().find('tbody tr:eq(14) th:eq(0)').simulate('mouseover');
      getInlineStartClone().find('tbody tr:eq(14) th:eq(0)').simulate('mouseup');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getInlineStartClone().find('tbody tr:eq(12) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(52);
          main.toBe(58);
          horizon.toBe(66);
        });
      expect(getInlineStartClone().find('tbody tr:eq(13) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(52);
          main.toBe(58);
          horizon.toBe(66);
        });
      expect(getInlineStartClone().find('tbody tr:eq(14) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(52);
          main.toBe(58);
          horizon.toBe(66);
        });
    });
  });

  describe('contiguous/non-contiguous selected rows resizing in a table', () => {
    it('should resize (expanding) height of selected contiguous rows', async() => {
      handsontable({
        data: createSpreadsheetData(50, 10),
        rowHeaders: true,
        manualRowResize: true
      });

      await selectRows(3, 5);
      getInlineStartClone().find('tbody tr:eq(5) th:eq(0)').simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(22);
          main.toBe(28);
          horizon.toBe(36);
        });
      expect(getInlineStartClone().find('tbody tr:eq(3) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(52);
          main.toBe(58);
          horizon.toBe(66);
        });
      expect(getInlineStartClone().find('tbody tr:eq(4) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(52);
          main.toBe(58);
          horizon.toBe(66);
        });
      expect(getInlineStartClone().find('tbody tr:eq(5) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(52);
          main.toBe(58);
          horizon.toBe(66);
        });
      expect(getInlineStartClone().find('tbody tr:eq(6) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(22);
          main.toBe(28);
          horizon.toBe(36);
        });
    });

    it('should resize (expanding) height of selected non-contiguous rows', async() => {
      handsontable({
        data: createSpreadsheetData(50, 10),
        rowHeaders: true,
        manualRowResize: true
      });

      // After changes introduced in Handsontable 12.0.0 we handle shortcuts only by listening Handsontable.
      // Please keep in mind that selectColumns/selectRows doesn't set instance to listening (see #7290).
      await listen();
      await selectRows(3);

      await keyDown('control/meta');

      await selectRows(7);
      await selectRows(10);

      await keyUp('control/meta');
      getInlineStartClone().find('tbody tr:eq(10) th:eq(0)').simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(22);
          main.toBe(28);
          horizon.toBe(36);
        });
      expect(getInlineStartClone().find('tbody tr:eq(3) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(52);
          main.toBe(58);
          horizon.toBe(66);
        });
      expect(getInlineStartClone().find('tbody tr:eq(4) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(22);
          main.toBe(28);
          horizon.toBe(36);
        });
      expect(getInlineStartClone().find('tbody tr:eq(5) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(22);
          main.toBe(28);
          horizon.toBe(36);
        });
      expect(getInlineStartClone().find('tbody tr:eq(6) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(22);
          main.toBe(28);
          horizon.toBe(36);
        });
      expect(getInlineStartClone().find('tbody tr:eq(7) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(52);
          main.toBe(58);
          horizon.toBe(66);
        });
      expect(getInlineStartClone().find('tbody tr:eq(8) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(22);
          main.toBe(28);
          horizon.toBe(36);
        });
      expect(getInlineStartClone().find('tbody tr:eq(9) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(22);
          main.toBe(28);
          horizon.toBe(36);
        });
      expect(getInlineStartClone().find('tbody tr:eq(10) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(52);
          main.toBe(58);
          horizon.toBe(66);
        });
      expect(getInlineStartClone().find('tbody tr:eq(11) th:eq(0)').height())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(22);
          main.toBe(28);
          horizon.toBe(36);
        });
    });

    it('should not resize few rows when selected just single cells before resize action', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        manualRowResize: true
      });

      await selectCells([[1, 1, 2, 2]]);

      getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(52);
        main.toBe(58);
        horizon.toBe(66);
      });
      expect(getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(22);
        main.toBe(28);
        horizon.toBe(36);
      });
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
          rowHeaders: true,
          manualRowResize: true
        });

        const $headerTH = getInlineStartClone().find('tbody tr:eq(1) th:eq(0)');

        $headerTH.simulate('mouseover');

        const $handle = $('.manualRowResizer');

        expect($handle.offset().top)
          .toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - $handle.outerHeight() - 1, 0);
        expect($handle.offset().left).toBeCloseTo($headerTH.offset().left, 0);
        expect($handle.width()).toBeCloseTo($headerTH.outerWidth(), 0);
      });

      it.forTheme('main')('should display the resize handle in the proper position and with a proper size', async() => {
        handsontable({
          layoutDirection,
          data: [
            { id: 1, name: 'Ted', lastName: 'Right' },
            { id: 2, name: 'Frank', lastName: 'Honest' },
            { id: 3, name: 'Joan', lastName: 'Well' },
            { id: 4, name: 'Sid', lastName: 'Strong' },
            { id: 5, name: 'Jane', lastName: 'Neat' }
          ],
          rowHeaders: true,
          manualRowResize: true
        });

        const $headerTH = getInlineStartClone().find('tbody tr:eq(1) th:eq(0)');

        $headerTH.simulate('mouseover');

        const $handle = $('.manualRowResizer');

        expect($handle.offset().top)
          .toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - ($handle.outerHeight() / 2) - 1, 0);
        expect($handle.offset().left).toBeCloseTo($headerTH.offset().left, 0);
        expect($handle.width()).toBeCloseTo($headerTH.outerWidth(), 0);
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
          rowHeaders: true,
          manualRowResize: true
        });

        const $headerTH = getInlineStartClone().find('tbody tr:eq(1) th:eq(0)');

        $headerTH.simulate('mouseover');

        const $handle = $('.manualRowResizer');

        expect($handle.offset().top)
          .toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - ($handle.outerHeight() / 2) - 1, 0);
        expect($handle.offset().left).toBeCloseTo($headerTH.offset().left, 0);
        expect($handle.width()).toBeCloseTo($headerTH.outerWidth(), 0);
      });

      it('should display the resize handle in the proper z-index and be greater than left overlay z-index', async() => {
        handsontable({
          layoutDirection,
          data: [
            { id: 1, name: 'Ted', lastName: 'Right' },
            { id: 2, name: 'Frank', lastName: 'Honest' },
            { id: 3, name: 'Joan', lastName: 'Well' },
            { id: 4, name: 'Sid', lastName: 'Strong' },
            { id: 5, name: 'Jane', lastName: 'Neat' }
          ],
          rowHeaders: true,
          manualRowResize: true
        });

        const $headerTH = getInlineStartClone().find('tbody tr:eq(1) th:eq(0)');

        $headerTH.simulate('mouseover');

        const $handle = $('.manualRowResizer');

        expect($handle.css('z-index')).toBeGreaterThan(getInlineStartClone().css('z-index'));
      });

      it('should call console.warn if the handler is not a part of proper overlay', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, 1),
          height: 280,
          fixedRowsBottom: 2,
          manualRowResize: true,
          rowHeaders: true,
        });

        spyOn(console, 'warn');

        const $masterRowHeader = getInlineStartClone().find('tbody tr:eq(3) th:eq(0)');

        $masterRowHeader.simulate('mouseover');

        const $handler = spec().$container.find('.manualRowResizer');

        $handler.simulate('mouseover');

        // eslint-disable-next-line no-console
        expect(console.warn.calls.mostRecent().args)
          .toEqual(['The provided element is not a child of the bottom_inline_start_corner overlay']);
      });

      it('should display the resize handle in the correct place after the table has been scrolled', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(20, 20),
          rowHeaders: true,
          manualRowResize: true,
          height: 100,
          width: 200
        });

        let $rowHeader = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

        $rowHeader.simulate('mouseover');

        const $handle = spec().$container.find('.manualRowResizer');

        $handle[0].style.background = 'red';

        expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
        expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);

        await scrollViewportVertically(200);

        $rowHeader = getInlineStartClone().find('tbody tr:eq(10) th:eq(0)');
        $rowHeader.simulate('mouseover');

        expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
        expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      });

      it('should display the resize guide in the correct size', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(20, 20),
          rowHeaders: true,
          manualRowResize: true,
          height: 100,
          width: 200
        });
        const tableWidth = parseInt(tableView().getTableWidth(), 10);
        const $rowHeader = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

        $rowHeader.simulate('mouseover');

        const $resizer = spec().$container.find('.manualRowResizer');
        const resizerPosition = $resizer.position();

        $resizer.simulate('mousedown', { clientY: resizerPosition.top });

        const $guide = spec().$container.find('.manualRowResizerGuide');

        $resizer.simulate('mouseup');

        expect($guide.width()).toBeCloseTo(tableWidth - $resizer.width(), 0);
      });
    });

    it.forTheme('classic')('should remove resize handler when user clicks RMB', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        manualRowResize: true
      });

      const $rowHeader = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualRowResizer');
      const resizerPosition = $handle.position();

      $handle.simulate('mousedown', { clientY: resizerPosition.top });

      // To watch whether color has changed.
      expect(getComputedStyle($handle[0]).backgroundColor).toBe('rgb(52, 169, 219)');

      $handle.simulate('contextmenu');

      await sleep(0);

      expect(getComputedStyle($handle[0]).backgroundColor).not.toBe('rgb(52, 169, 219)');
    });

    it.forTheme('main')('should remove resize handler when user clicks RMB', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        manualRowResize: true
      });

      const $rowHeader = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualRowResizer');
      const resizerPosition = $handle.position();

      $handle.simulate('mousedown', { clientY: resizerPosition.top });

      // To watch whether opacity has changed.
      expect(getComputedStyle($handle[0]).opacity).toBe('1');

      $handle.simulate('contextmenu');

      await sleep(0);

      expect(getComputedStyle($handle[0]).opacity).not.toBe('1');
    });

    it.forTheme('horizon')('should remove resize handler when user clicks RMB', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        manualRowResize: true
      });

      const $rowHeader = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualRowResizer');
      const resizerPosition = $handle.position();

      $handle.simulate('mousedown', { clientY: resizerPosition.top });

      // To watch whether opacity has changed.
      expect(getComputedStyle($handle[0]).opacity).toBe('1');

      $handle.simulate('contextmenu');

      await sleep(0);

      expect(getComputedStyle($handle[0]).opacity).not.toBe('1');
    });
  });

  describe('hooks', () => {
    it('should run the `beforeRowResize` and `afterRowResize` hooks with numeric values for both the row height and' +
      ' row index', async() => {
      const beforeRowResizeCallback = jasmine.createSpy('beforeRowResizeCallback');
      const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

      handsontable({
        data: createSpreadsheetData(5, 1),
        rowHeaders: true,
        manualRowResize: true,
        beforeRowResize: beforeRowResizeCallback,
        afterRowResize: afterRowResizeCallback
      });

      await resizeRow(2, 300);

      expect(beforeRowResizeCallback.calls.mostRecent().args).toEqual([300, 2, false]);
      expect(afterRowResizeCallback.calls.mostRecent().args).toEqual([300, 2, false]);

      await sleep(500);
      await resizeRow(2, -10);

      expect(beforeRowResizeCallback.calls.mostRecent().args).forThemes(({ classic, main, horizon }) => {
        classic.toEqual([23, 2, false]);
        main.toEqual([29, 2, false]);
        horizon.toEqual([37, 2, false]);
      });
      expect(afterRowResizeCallback.calls.mostRecent().args).forThemes(({ classic, main, horizon }) => {
        classic.toEqual([23, 2, false]);
        main.toEqual([29, 2, false]);
        horizon.toEqual([37, 2, false]);
      });

      await sleep(500);
      await resizeRow(2, 100);

      expect(beforeRowResizeCallback.calls.mostRecent().args).toEqual([100, 2, false]);
      expect(afterRowResizeCallback.calls.mostRecent().args).toEqual([100, 2, false]);

      await sleep(500);
      await resizeRow(2, 5);

      expect(beforeRowResizeCallback.calls.mostRecent().args).forThemes(({ classic, main, horizon }) => {
        classic.toEqual([23, 2, false]);
        main.toEqual([29, 2, false]);
        horizon.toEqual([37, 2, false]);
      });
      expect(afterRowResizeCallback.calls.mostRecent().args).forThemes(({ classic, main, horizon }) => {
        classic.toEqual([23, 2, false]);
        main.toEqual([29, 2, false]);
        horizon.toEqual([37, 2, false]);
      });
    });

    it.forTheme('classic')('should be able to get the last desired row height from the ' +
      '`getLastDesiredRowHeight` method in the `afterRowResize` hook callback', async() => {
      const desiredHeightsLog = [];

      handsontable({
        data: [['value \n value \n value \n value \n value']],
        rowHeaders: true,
        manualRowResize: true,
        // eslint-disable-next-line object-shorthand
        afterRowResize: function() {
          desiredHeightsLog.push(this.getPlugin('manualRowResize').getLastDesiredRowHeight());
        },
      });

      const $rowHeader = getInlineStartClone().find('tbody tr:eq(0) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      await sleep(100);

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + $resizer.height() - 50 });
      $resizer.simulate('mouseup');

      expect(desiredHeightsLog).toEqual([$rowHeader.height() + 1 - 50 + 6]);
    });

    it.forTheme('main')('should be able to get the last desired row height from the ' +
      '`getLastDesiredRowHeight` method in the `afterRowResize` hook callback', async() => {
      const desiredHeightsLog = [];

      handsontable({
        data: [['value \n value \n value \n value \n value']],
        rowHeaders: true,
        manualRowResize: true,
        // eslint-disable-next-line object-shorthand
        afterRowResize: function() {
          desiredHeightsLog.push(this.getPlugin('manualRowResize').getLastDesiredRowHeight());
        },
      });

      const $rowHeader = getInlineStartClone().find('tbody tr:eq(0) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      await sleep(100);

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + ($resizer.height() / 2) - 50 });
      $resizer.simulate('mouseup');

      expect(desiredHeightsLog).toEqual([$rowHeader.height() + 1 - 50 + 6]);
    });

    it.forTheme('horizon')('should be able to get the last desired row height from the ' +
      '`getLastDesiredRowHeight` method in the `afterRowResize` hook callback', async() => {
      const desiredHeightsLog = [];

      handsontable({
        data: [['value \n value \n value \n value \n value']],
        rowHeaders: true,
        manualRowResize: true,
        // eslint-disable-next-line object-shorthand
        afterRowResize: function() {
          desiredHeightsLog.push(this.getPlugin('manualRowResize').getLastDesiredRowHeight());
        },
      });

      const $rowHeader = getInlineStartClone().find('tbody tr:eq(0) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      await sleep(100);

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + ($resizer.height() / 2) - 50 });
      $resizer.simulate('mouseup');

      expect(desiredHeightsLog).toEqual([$rowHeader.height() + 1 - 50 + 6]);
    });
  });

  describe('with the AutoRowSize plugin', () => {
    it('should not cause row misalignment when manualRowResize is enabled via `updateSettings` ' +
      'after autoRowSize initialization', async() => {
      const data = createSpreadsheetData(3, 5);

      data[0][4] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas hendrerit elit sed quam porta ' +
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
        fixedColumnsStart: 1,
        rowHeaders: true,
        autoRowSize: true,
        colWidths: 100,
      });

      await sleep(100);

      await updateSettings({
        manualRowResize: [50, 50, 50],
      });

      expect(getInlineStartClone().find('table').height()).toBe(getMaster().find('table').height());
    });
  });
});
