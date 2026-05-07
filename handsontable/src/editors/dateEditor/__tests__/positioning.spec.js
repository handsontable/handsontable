describe('DateEditor', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  // all other E2E tests are moved to visual tests. See ./visual-tests/tests/js-only/editors/date/

  it('should move a datepicker together with the edited cell when the table is scrolled down', async() => {
    handsontable({
      data: createSpreadsheetData(50, 20),
      width: 230,
      height: 230,
      type: 'date',
      rowHeights: 40,
    });

    await selectCell(2, 2);
    await keyDownUp('enter');

    await scrollViewportVertically(30);

    const editorElement = $(getActiveEditor().TD);
    const pikaElement = $('.pika-single');

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);

    await scrollViewportVertically(100); // scroll the viewport so the edited cell is partially visible from above

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);

    await scrollViewportVertically(125); // scroll the viewport so the edited cell is not visible

    expect(pikaElement.is(':visible')).toBe(false);
  });

  it('should move a datepicker together with the edited cell when the table is scrolled up', async() => {
    handsontable({
      data: createSpreadsheetData(50, 20),
      width: 230,
      height: 230,
      type: 'date',
      rowHeights: 40,
    });

    await selectCell(25, 2);
    await keyDownUp('enter');

    const editorElement = $(getActiveEditor().TD);
    const pikaElement = $('.pika-single');

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);

    await scrollViewportVertically(805); // scroll the viewport so the edited cell is partially visible from below

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);

    await scrollViewportVertically(780); // scroll the viewport so the edited cell is not visible

    expect(pikaElement.is(':visible')).toBe(false);
  });

  it('should move a datepicker together with the edited cell when the table is scrolled left', async() => {
    handsontable({
      data: createSpreadsheetData(50, 20),
      width: 230,
      height: 230,
      type: 'date',
      colWidths: 80,
    });

    await selectCell(2, 10);
    await keyDownUp('enter');

    const editorElement = $(getActiveEditor().TD);
    const pikaElement = $('.pika-single');

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);

    await scrollViewportHorizontally(620); // scroll the viewport so the edited cell is partially visible from right

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);

    await scrollViewportHorizontally(580); // scroll the viewport so the edited cell is not visible

    expect(pikaElement.is(':visible')).toBe(false);
  });

  it('should move a datepicker together with the edited cell when the table is scrolled right', async() => {
    handsontable({
      data: createSpreadsheetData(50, 20),
      width: 230,
      height: 230,
      type: 'date',
      colWidths: 80,
    });

    await selectCell(2, 2);
    await keyDownUp('enter');

    await scrollViewportHorizontally(30);

    const editorElement = $(getActiveEditor().TD);
    const pikaElement = $('.pika-single');

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);

    await scrollViewportHorizontally(180); // scroll the viewport so the edited cell is partially visible from left

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: 0,
    });
    expect(pikaElement.is(':visible')).toBe(true);

    await scrollViewportHorizontally(240); // scroll the viewport so the edited cell is not visible

    expect(pikaElement.is(':visible')).toBe(false);
  });

  it('should show datepicker in the right position when cell is opened in the top overlay', async() => {
    handsontable({
      data: createSpreadsheetData(50, 20),
      fixedRowsTop: 3,
      width: 200,
      height: 200,
      type: 'date',
    });

    await selectCell(1, 1);
    await keyDownUp('enter');

    await scrollViewportVertically(100);

    const editorElement = $(getActiveEditor().TD);
    const pikaElement = $('.pika-single');

    await waitForNextAnimationFrames(2);

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);

    await scrollViewportVertically(130);

    await waitForNextAnimationFrames(2);

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);
  });

  it('should show datepicker in the right position when cell is opened in the left overlay', async() => {
    handsontable({
      data: createSpreadsheetData(50, 20),
      fixedColumnsStart: 3,
      width: 200,
      height: 200,
      type: 'date',
    });

    await selectCell(1, 1);
    await keyDownUp('enter');

    await scrollViewportHorizontally(100);

    const editorElement = $(getActiveEditor().TD);
    const pikaElement = $('.pika-single');

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);

    await scrollViewportHorizontally(130);

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);
  });

  it('should show datepicker in the right position when cell is opened in the bottom overlay', async() => {
    handsontable({
      data: createSpreadsheetData(50, 20),
      fixedRowsBottom: 3,
      width: 200,
      height: 200,
      type: 'date',
    });

    await selectCell(48, 1);
    await keyDownUp('enter');

    const editorElement = $(getActiveEditor().TD);
    const pikaElement = $('.pika-single');

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);

    await scrollViewportVertically(130);

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);
  });

  it('should show datepicker in the right position when cell is opened in the top-start corner', async() => {
    handsontable({
      data: createSpreadsheetData(50, 20),
      fixedRowsTop: 3,
      fixedColumnsStart: 3,
      width: 200,
      height: 200,
      type: 'date',
    });

    await selectCell(1, 1);
    await keyDownUp('enter');

    const editorElement = $(getActiveEditor().TD);
    const pikaElement = $('.pika-single');

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);

    await scrollViewportVertically(100);
    await scrollViewportHorizontally(100);

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);
  });

  it('should show datepicker in the right position when cell is opened in the bottom-start corner', async() => {
    handsontable({
      data: createSpreadsheetData(50, 20),
      fixedRowsBottom: 3,
      fixedColumnsStart: 3,
      width: 200,
      height: 200,
      type: 'date',
    });

    await selectCell(48, 1);
    await keyDownUp('enter');

    const editorElement = $(getActiveEditor().TD);
    const pikaElement = $('.pika-single');

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);

    await scrollViewportVertically(100);
    await scrollViewportHorizontally(100);

    expect(pikaElement.offset()).toEqual({
      top: editorElement.offset().top + editorElement.outerHeight(),
      left: editorElement.offset().left,
    });
    expect(pikaElement.is(':visible')).toBe(true);
  });

  it('should display Pikaday Calendar right-bottom of the selected cell when table have scrolls', async() => {
    const container = $('#testContainer');

    container[0].style.height = '300px';
    container[0].style.width = '200px';
    container[0].style.overflow = 'hidden';

    handsontable({
      data: createSpreadsheetData(30, 10),
      colWidths: 60,
      columns: [
        { type: 'date' },
        { type: 'date' },
        { type: 'date' },
        { type: 'date' },
        { type: 'date' },
        { type: 'date' },
        { type: 'date' }
      ]
    });

    await selectCell(20, 6);
    await waitForNextAnimationFrames(2);
    await keyDownUp('enter');

    const cellElement = $(getActiveEditor().TD);
    const datePickerElement = $('.pika-single');

    expect(cellElement.offset().top + cellElement.outerHeight()).toBeCloseTo(datePickerElement.offset().top, 0);
    expect(cellElement.offset().left).toBeCloseTo(datePickerElement.offset().left, 0);
  });
});
