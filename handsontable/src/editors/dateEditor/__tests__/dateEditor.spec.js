describe('DateEditor', () => {
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

  function getDates() {
    return [
      ['01/14/2006'],
      ['12/01/2008'],
      ['11/19/2011'],
      ['02/02/2004'],
      ['07/24/2011']
    ];
  }

  it('should render an editor in specified position at cell 0, 0', () => {
    handsontable({
      columns: [{ type: 'date' }],
    });

    selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDown('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should render an editor in specified position at cell 0, 0 when all headers are selected', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      columns: [{ type: 'date' }],
    });

    selectAll();
    listen();

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDown('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should render an editor in specified position while opening an editor from top to bottom when ' +
     'top and bottom overlays are enabled', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      columns: [{ type: 'date' }, {}],
    });

    selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDown('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    keyDown('enter');
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(1, 0, true)).offset());

    keyDown('enter');
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    keyDown('enter');
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    keyDown('enter');
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    keyDown('enter');
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(5, 0, true)).offset());

    keyDown('enter');
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(6, 0, true)).offset());

    keyDown('enter');
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from left to right when ' +
     'left overlay is enabled', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsLeft: 3,
      type: 'date',
    });

    selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDown('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    selectCell(0, 1);
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 1, true)).offset());

    selectCell(0, 2);
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    selectCell(0, 3);
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    selectCell(0, 4);
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from top to bottom when ' +
     'top and bottom overlays are enabled and the first row of the both overlays are hidden', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      hiddenRows: {
        indicators: true,
        rows: [0, 5],
      },
      columns: [{ type: 'date' }, {}],
    });

    selectCell(1, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDown('enter');

    // First renderable row index.
    expect(editor.offset()).toEqual($(getCell(1, 0, true)).offset());

    keyDown('enter');
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    keyDown('enter');
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    keyDown('enter');
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    keyDown('enter');
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(6, 0, true)).offset());

    keyDown('enter');
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from left to right when ' +
     'left overlay is enabled and the first column of the overlay is hidden', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsLeft: 3,
      hiddenColumns: {
        indicators: true,
        columns: [0],
      },
      type: 'date',
    });

    selectCell(0, 1);
    keyDown('enter');

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    // First renderable column index.
    expect(editor.offset()).toEqual($(getCell(0, 1, true)).offset());

    selectCell(0, 2);
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    selectCell(0, 3);
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    selectCell(0, 4);
    await sleep(200); // Caused by async DateEditor close.
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should not highlight the input element by browsers native selection', () => {
    handsontable({
      type: 'date',
    });

    selectCell(0, 0);
    keyDown('enter');

    const editor = getActiveEditor().TEXTAREA;

    expect(window.getComputedStyle(editor, 'focus').getPropertyValue('outline-style')).toBe('none');
  });

  it('should display Pikday calendar', () => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date'
        }
      ]
    });

    expect($('.pika-single').is(':visible')).toBe(false);

    selectCell(0, 0);
    keyDown('enter');

    expect($('.pika-single').is(':visible')).toBe(true);
  });

  it('should pass date picker config object to Pikday', () => {
    const onOpenSpy = jasmine.createSpy('open');
    const onCloseSpy = jasmine.createSpy('close');
    const hot = handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date',
          datePickerConfig: {
            firstDay: 1,
            field: 'field', // read only - shouldn't overwrite
            trigger: 'trigger', // read only - shouldn't overwrite
            container: 'container', // read only - shouldn't overwrite
            bound: true, // read only - shouldn't overwrite
            i18n: {
              previousMonth: 'Poprzedni',
              nextMonth: 'Następny',
              months: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'],
              weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
              weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            },
            onOpen: onOpenSpy,
            onClose: onCloseSpy
          }
        }
      ]
    });

    selectCell(0, 0);
    keyDown('enter');
    keyDown('esc');

    const config = hot.getActiveEditor().$datePicker.config();

    expect(config.field instanceof HTMLElement).toBe(true);
    expect(config.trigger instanceof HTMLElement).toBe(true);
    expect(config.container instanceof HTMLElement).toBe(true);
    expect(config.bound).toBe(false);
    expect(config.firstDay).toBe(1);
    expect(config.i18n.previousMonth).toBe('Poprzedni');
    expect(config.i18n.nextMonth).toBe('Następny');
    expect(onOpenSpy).toHaveBeenCalled();
    expect(onCloseSpy).toHaveBeenCalled();
  });

  it('should remove any HTML connected with Pikaday Calendar', () => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date'
        }
      ]
    });

    expect($('.pika-single').length).toBe(0);

    selectCell(0, 0);
    keyDown('enter');

    expect($('.pika-single').length).toBe(1);

    destroy();

    expect($('.pika-single').length).toBe(0);
  });

  it('should select date corresponding to cell value', () => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }
      ]
    });

    selectCell(0, 0);
    keyDown('enter');

    const date = new Date(getDates()[0][0]);

    expect($('.pika-single').find('.pika-select-year').find(':selected').val()).toMatch(date.getFullYear().toString());
    expect($('.pika-single').find('.pika-select-month').find(':selected').val()).toMatch(date.getMonth().toString());
    expect($('.pika-single').find('.pika-table .is-selected').text()).toMatch(date.getDate().toString());
  });

  it('should save new date after clicked on calendar', (done) => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }
      ]
    });

    selectCell(0, 0);
    expect(getDataAtCell(0, 0)).toMatch('01/14/2006');

    keyDown('enter');

    mouseDown($('.pika-single').find('.pika-table tbody tr:eq(0) td:eq(0) button'));

    setTimeout(() => {
      expect(getDataAtCell(0, 0)).toMatch('01/01/2006');
      done();
    }, 150);
  });

  it('should display fill handle after selected date on calendar', (done) => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }
      ]
    });

    selectCell(0, 0);
    expect(getDataAtCell(0, 0)).toMatch('01/14/2006');

    keyDown('enter');

    mouseDown($('.pika-single').find('.pika-table tbody tr:eq(0) td:eq(0) button'));

    setTimeout(() => {
      expect(getDataAtCell(0, 0)).toMatch('01/01/2006');
      expect($('.htBorders .current.corner').is(':visible')).toBe(true);
      done();
    }, 150);
  });

  it('should setup in settings and display defaultDate on calendar', (done) => {
    handsontable({
      data: getDates(),
      minSpareRows: 1,
      columns: [
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY',
          defaultDate: '01/01/1900'
        }
      ]
    });

    selectCell(5, 0);
    expect(getDataAtCell(5, 0)).toBe(null);

    keyDown('enter');

    const date = new Date('01/01/1900');

    expect($('.pika-single').find('.pika-select-year').find(':selected').val()).toMatch(date.getFullYear().toString());
    expect($('.pika-single').find('.pika-select-month').find(':selected').val()).toMatch(date.getMonth().toString());
    expect($('.pika-single').find('.pika-table .is-selected').text()).toMatch(date.getDate().toString());

    keyDown('enter');

    setTimeout(() => {
      expect(getDataAtCell(5, 0)).toMatch('01/01/1900');
      done();
    }, 150);
  });

  it('should close calendar after picking new date', () => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }
      ]
    });

    selectCell(0, 0);
    keyDown('enter');

    expect($('.pika-single').is(':visible')).toBe(true);

    mouseDown($('.pika-single').find('.pika-table tbody tr:eq(0) td:eq(0) button'));

    expect($('.pika-single').is(':visible')).toBe(false);
  });

  it('should enable to input any value in textarea', async() => {
    const hot = handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date'
        }
      ]
    });

    selectCell(0, 0);

    const editor = hot.getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.TEXTAREA.value = 'foo';
    keyDownUp('o'.charCodeAt(0));

    expect(editor.getValue()).toEqual('foo');

    editor.finishEditing();

    await sleep(100);

    expect(getDataAtCell(0, 0)).toEqual('foo');
  });

  it('should not close editor when inserting wrong value and allowInvalid is set to false, (#5419)', async() => {
    const hot = handsontable({
      data: getDates(),
      allowInvalid: false,
      columns: [
        {
          type: 'date'
        }
      ]
    });

    selectCell(0, 0);

    const editor = hot.getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.TEXTAREA.value = 'foo';

    expect(editor.getValue()).toEqual('foo');

    editor.finishEditing();

    await sleep(30);

    expect(editor.isOpened()).toBe(true);
    expect(editor.getValue()).toEqual('foo');
  });

  // Input element can not lose the focus while entering new characters. It breaks IME editor functionality for Asian users.
  it('should not lose the focus on input element while inserting new characters (#839)', async() => {
    const hot = handsontable({
      data: [
        ['one', 'two'],
        ['three', 'four']
      ],
      columns: [
        {
          type: 'date',
        },
        {},
      ],
    });

    selectCell(0, 0);

    const activeElement = hot.getActiveEditor().TEXTAREA;

    expect(activeElement).toBeDefined();
    expect(activeElement).not.toBe(null);
    expect(document.activeElement).toBe(activeElement);

    keyDownUp('enter');

    expect(document.activeElement).toBe(activeElement);

    await sleep(200);

    expect(document.activeElement).toBe(activeElement);

    hot.getActiveEditor().TEXTAREA.value = 't';
    keyDownUp('t'.charCodeAt(0));

    expect(document.activeElement).toBe(activeElement);

    hot.getActiveEditor().TEXTAREA.value = 'te';
    keyDownUp('e'.charCodeAt(0));

    expect(document.activeElement).toBe(activeElement);

    hot.getActiveEditor().TEXTAREA.value = 'teo';
    keyDownUp('o'.charCodeAt(0));

    expect(document.activeElement).toBe(activeElement);
  });

  it('should restore original when edited and pressed ESC ', async() => {
    const hot = handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date'
        }
      ]
    });

    selectCell(0, 0);

    const editor = hot.getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.TEXTAREA.value = 'foo';

    expect(editor.getValue()).toEqual('foo');

    keyDownUp(Handsontable.helper.KEY_CODES.ESCAPE); // cancel editing

    await sleep(30);

    editor.finishEditing();

    expect(getDataAtCell(0, 0)).toEqual('01/14/2006');
  });

  it('should display a calendar based on a current date, even if a date in a wrong format was entered previously', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      columns: [
        { type: 'date' },
        { type: 'date', dateFormat: 'YYYY-MM-DD' }
      ],
      minSpareRows: 1
    });

    setDataAtCell(4, 1, '15-11-11');

    await sleep(200);
    selectCell(5, 1);
    keyDown('enter');

    expect($('.pika-single').is(':visible')).toBe(true);

    mouseDown($('.pika-single').find('.pika-table tbody tr:eq(3) td:eq(3) button'));

    await sleep(200);
    const resultDate = getDataAtCell(5, 1);

    expect(moment(resultDate).year()).toEqual(moment().year());
    expect(moment(resultDate).month()).toEqual(moment().month());
  });

  it('should display Pikaday Calendar bottom of the selected cell', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      columns: [
        { type: 'date' },
        { type: 'date' }
      ]
    });

    selectCell(1, 1);
    keyDown('enter');

    const cellOffset = $(hot.getActiveEditor().TD).offset();
    const datePickerOffset = $('.pika-single').offset();

    // 23 is a height of the editor cell
    expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0);
    expect(cellOffset.left).toBeCloseTo(datePickerOffset.left, 0);
  });

  it('should display Pikaday Calendar bottom of the selected cell when table have scrolls', () => {
    const container = $('#testContainer');

    container[0].style.height = '300px';
    container[0].style.width = '200px';
    container[0].style.overflow = 'hidden';

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(30, 10),
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

    selectCell(20, 6);
    keyDown('enter');

    const cellOffset = $(hot.getActiveEditor().TD).offset();
    const datePickerOffset = $('.pika-single').offset();

    expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0);
    expect(cellOffset.left).toBeCloseTo(datePickerOffset.left, 0);
  });

  it('should not modify the edited date and time, when opening the editor', () => {
    const hot = handsontable({
      data: [['02/02/2015 8:00 AM']],
      columns: [
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY h:mm A',
          correctFormat: true,
          defaultDate: '01/01/1900',
          allowEmpty: false,
        }
      ]
    });

    // setDataAtCell(0, 0, '02/02/2015 8:00 AM');
    const cellValue = getDataAtCell(0, 0);

    selectCell(0, 0);
    keyDown('enter');

    const editor = hot.getActiveEditor();

    expect(editor.TEXTAREA.value).toEqual(cellValue);
  });

  it('should use the default Pikaday\'s cofiguration if cell does not customize picker', async() => {
    handsontable({
      data: [['10/12/2020', '01/14/2017']],
      columns: [
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY',
          correctFormat: true,
        },
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY',
          datePickerConfig: {
            numberOfMonths: 3
          }
        }
      ]
    });

    selectCell(0, 0);
    keyDownUp('enter');
    await sleep(200);

    expect($('.pika-lendar').length).toEqual(1);

    keyDownUp('enter');
    await sleep(200);

    selectCell(0, 1);
    keyDownUp('enter');
    await sleep(200);

    expect($('.pika-lendar').length).toEqual(3);

    keyDownUp('enter');
    await sleep(200);

    selectCell(0, 0);
    keyDownUp('enter');
    await sleep(200);

    expect($('.pika-lendar').length).toEqual(1);
  });

  describe('IME support', () => {
    it('should focus editable element after selecting the cell', async() => {
      handsontable({
        columns: [
          {
            editor: 'date',
          }
        ]
      });
      selectCell(0, 0, 0, 0, true, false);

      await sleep(10);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });

  describe('Cleaning up after the editor', () => {
    it('should not leave any editor containers after destroying the Handsontable instance', () => {
      handsontable({
        data: [['02/02/2015 8:00 AM']],
        columns: [
          {
            type: 'date'
          }
        ]
      });

      selectCell(0, 0);
      keyDown('enter');
      keyDown('enter');

      destroy();

      expect($('.htDatepickerHolder').size()).toEqual(0);
    });
  });
});
