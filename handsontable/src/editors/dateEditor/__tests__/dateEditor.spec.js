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

  it('should return true in the `isOpened` after open the date editor', async() => {
    handsontable({
      type: 'date'
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);
  });

  it('should return false in the `isOpened` after close the date editor', async() => {
    handsontable({
      type: 'date'
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.finishEditing();

    await waitForNextAnimationFrames(2);

    expect(editor.isOpened()).toBe(false);
  });

  it('should render an editor in specified position at cell 0, 0', async() => {
    handsontable({
      columns: [{ type: 'date' }],
    });

    await selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should render an editor in specified position at cell 0, 0 when all headers are selected', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      columns: [{ type: 'date' }],
    });

    await listen();

    await selectAll();

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('F2');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should render an editor in specified position while opening an editor from top to bottom when ' +
     'top and bottom overlays are enabled', async() => {
    handsontable({
      data: createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      columns: [{ type: 'date' }, {}],
    });

    await selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(1, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(5, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(6, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from left to right when ' +
     'left overlay is enabled', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsStart: 3,
      type: 'date',
    });

    await selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    await selectCell(0, 1);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 1, true)).offset());

    await selectCell(0, 2);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    await selectCell(0, 3);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    await selectCell(0, 4);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from top to bottom when ' +
     'top and bottom overlays are enabled and the first row of the both overlays are hidden', async() => {
    handsontable({
      data: createSpreadsheetData(8, 2),
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

    await selectCell(1, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    // First renderable row index.
    expect(editor.offset()).toEqual($(getCell(1, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(6, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from left to right when ' +
     'left overlay is enabled and the first column of the overlay is hidden', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsStart: 3,
      hiddenColumns: {
        indicators: true,
        columns: [0],
      },
      type: 'date',
    });

    await selectCell(0, 1);
    await keyDownUp('enter');

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    // First renderable column index.
    expect(editor.offset()).toEqual($(getCell(0, 1, true)).offset());

    await selectCell(0, 2);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    await selectCell(0, 3);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    await selectCell(0, 4);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should not highlight the input element by browsers native selection', async() => {
    handsontable({
      type: 'date',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = getActiveEditor().TEXTAREA;

    expect(window.getComputedStyle(editor, 'focus').getPropertyValue('outline-style')).toBe('none');
  });

  it('should display Pikaday calendar', async() => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date'
        }
      ]
    });

    expect($('.pika-single').is(':visible')).toBe(false);

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect($('.pika-single').is(':visible')).toBe(true);
  });

  it('should pass date picker config object to Pikaday', async() => {
    const onOpenSpy = jasmine.createSpy('open');
    const onCloseSpy = jasmine.createSpy('close');

    handsontable({
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

    await selectCell(0, 0);
    await keyDownUp('enter');
    await keyDownUp('escape');

    const config = getActiveEditor().$datePicker.config();

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

  it('should render Pikaday within element that contains correct "dir" attribute value', async() => {
    handsontable({
      data: createSpreadsheetData(5, 2),
      columns: [
        { type: 'date' },
        { type: 'date' }
      ]
    });

    await selectCell(1, 1);
    await keyDown('enter');

    const datePicker = getActiveEditor().datePicker;
    const config = getActiveEditor().$datePicker.config();

    expect(datePicker.getAttribute('dir')).toBe('ltr');
    expect(config.isRTL).toBe(false);
  });

  it('should remove any HTML connected with Pikaday Calendar', async() => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date'
        }
      ]
    });

    expect($('.pika-single').length).toBe(0);

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect($('.pika-single').length).toBe(1);

    destroy();

    expect($('.pika-single').length).toBe(0);
  });

  it('should select date corresponding to cell value', async() => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const date = new Date(getDates()[0][0]);

    expect($('.pika-single').find('.pika-select-year').find(':selected').val()).toMatch(date.getFullYear().toString());
    expect($('.pika-single').find('.pika-select-month').find(':selected').val()).toMatch(date.getMonth().toString());
    expect($('.pika-single').find('.pika-table .is-selected').text()).toMatch(date.getDate().toString());
  });

  it('should save new date after clicked on calendar', async() => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }
      ]
    });

    await selectCell(0, 0);

    expect(getDataAtCell(0, 0)).toMatch('01/14/2006');

    await keyDownUp('enter');
    await mouseDown($('.pika-single').find('.pika-table tbody tr:eq(0) td:eq(0) button'));

    await waitForNextAnimationFrames(2);

    expect(getDataAtCell(0, 0)).toMatch('01/01/2006');
  });

  it('should display fill handle after selected date on calendar', async() => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }
      ]
    });

    await selectCell(0, 0);

    expect(getDataAtCell(0, 0)).toMatch('01/14/2006');

    await keyDownUp('enter');
    await mouseDown($('.pika-single').find('.pika-table tbody tr:eq(0) td:eq(0) button'));

    await waitForNextAnimationFrames(2);

    expect(getDataAtCell(0, 0)).toMatch('01/01/2006');
    expect($('.htBorders .current.corner').is(':visible')).toBe(true);
  });

  it('should setup in settings and display defaultDate on calendar', async() => {
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

    await selectCell(5, 0);

    expect(getDataAtCell(5, 0)).toBe(null);

    await keyDownUp('enter');

    const date = new Date('01/01/1900');

    expect($('.pika-single').find('.pika-select-year').find(':selected').val()).toMatch(date.getFullYear().toString());
    expect($('.pika-single').find('.pika-select-month').find(':selected').val()).toMatch(date.getMonth().toString());
    expect($('.pika-single').find('.pika-table .is-selected').text()).toMatch(date.getDate().toString());

    await keyDownUp('enter');

    await waitForNextAnimationFrames(2);

    expect(getDataAtCell(5, 0)).toMatch('01/01/1900');
  });

  it('should correctly format date for an empty cell (#dev-1807)', async() => {
    handsontable({
      data: [['']],
      columns: [
        {
          type: 'date',
          dateFormat: 'YYYY-MM-DD',
          correctFormat: true,
          defaultDate: '2000-01-01'
        }
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');
    await keyDownUp('enter');

    await waitForNextAnimationFrames(2);

    expect(getDataAtCell(0, 0)).toBe('2000-01-01');
  });

  it('should close calendar after picking new date', async() => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect($('.pika-single').is(':visible')).toBe(true);

    await mouseDown($('.pika-single').find('.pika-table tbody tr:eq(0) td:eq(0) button'));

    expect($('.pika-single').is(':visible')).toBe(false);
  });

  it('should enable to input any value in textarea', async() => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date'
        }
      ]
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.TEXTAREA.value = 'foo';

    await keyDownUp('o');

    expect(editor.getValue()).toEqual('foo');

    editor.finishEditing();

    await waitForNextAnimationFrames(2);

    expect(getDataAtCell(0, 0)).toEqual('foo');
  });

  it('should not close editor when inserting wrong value and allowInvalid is set to false, (#5419)', async() => {
    handsontable({
      data: getDates(),
      allowInvalid: false,
      columns: [
        {
          type: 'date'
        }
      ]
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.TEXTAREA.value = 'foo';

    expect(editor.getValue()).toEqual('foo');

    editor.finishEditing();

    await waitForNextAnimationFrames(2);

    expect(editor.isOpened()).toBe(true);
    expect(editor.getValue()).toEqual('foo');
  });

  // Input element can not lose the focus while entering new characters. It breaks IME editor functionality for Asian users.
  it('should not lose the focus on input element while inserting new characters if `imeFastEdit` is enabled (#839)', async() => {
    handsontable({
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
      imeFastEdit: true,
    });

    await selectCell(0, 0);

    // The `imeFastEdit` timeout is set to 50ms.
    await waitForNextAnimationFrames(2);

    const activeElement = getActiveEditor().TEXTAREA;

    expect(activeElement).toBeDefined();
    expect(activeElement).not.toBe(null);
    expect(document.activeElement).toBe(activeElement);

    await keyDownUp('enter');

    expect(document.activeElement).toBe(activeElement);

    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = 't';

    await keyDownUp('t');

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = 'te';

    await keyDownUp('e');

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = 'teo';

    await keyDownUp('o');

    expect(document.activeElement).toBe(activeElement);
  });

  it('should restore original when edited and pressed ESC ', async() => {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date'
        }
      ]
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.TEXTAREA.value = 'foo';

    expect(editor.getValue()).toEqual('foo');

    await keyDownUp('escape'); // cancel editing

    editor.finishEditing();

    expect(getDataAtCell(0, 0)).toEqual('01/14/2006');
  });

  it('should display a calendar based on a current date, even if a date in a wrong format was entered previously', async() => {
    handsontable({
      data: createSpreadsheetData(5, 2),
      columns: [
        { type: 'date' },
        { type: 'date', dateFormat: 'YYYY-MM-DD' }
      ],
      minSpareRows: 1
    });

    await setDataAtCell(4, 1, '15-11-11');

    await waitForNextAnimationFrames(2);

    await selectCell(5, 1);
    await keyDownUp('enter');

    expect($('.pika-single').is(':visible')).toBe(true);

    await mouseDown($('.pika-single').find('.pika-table tbody tr:eq(3) td:eq(3) button'));

    await waitForNextAnimationFrames(2);
    const resultDate = getDataAtCell(5, 1);

    expect(moment(resultDate).year()).toEqual(moment().year());
    expect(moment(resultDate).month()).toEqual(moment().month());
  });

  it('should not modify the edited date and time, when opening the editor', async() => {
    handsontable({
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

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = getActiveEditor();

    expect(editor.TEXTAREA.value).toEqual(cellValue);
  });

  it('should use the default Pikaday\'s configuration if cell does not customize picker', async() => {
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

    await selectCell(0, 0);
    await keyDownUp('enter');
    await waitForNextAnimationFrames(2);

    expect($('.pika-lendar').length).toEqual(1);

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2);

    await selectCell(0, 1);
    await keyDownUp('enter');
    await waitForNextAnimationFrames(2);

    expect($('.pika-lendar').length).toEqual(3);

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2);

    await selectCell(0, 0);
    await keyDownUp('enter');
    await waitForNextAnimationFrames(2);

    expect($('.pika-lendar').length).toEqual(1);
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      editor: 'date',
    });

    await selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });

  using('data set', [
    { date: '01/02/2023', dateFormat: 'DD/MM/YYYY', day: 1, month: 1, year: 2023 },
    { date: '01/02/23', dateFormat: 'DD/MM/YY', day: 1, month: 1, year: 2023 },
    { date: '1/2/23', dateFormat: 'D/M/YY', day: 1, month: 1, year: 2023 },
    { date: '01/02/23', dateFormat: 'D/M/YY', day: 2, month: 0, year: 2023 },
    { date: '01-02-2023', dateFormat: 'DD-MM-YYYY', day: 1, month: 1, year: 2023 },
    { date: '1-2-23', dateFormat: 'D-M-YY', day: 1, month: 1, year: 2023 },
    { date: '1-12-23', dateFormat: 'D-M-YY', day: 1, month: 11, year: 2023 },
    { date: '1.2.23', dateFormat: 'D.M.YY', day: 1, month: 1, year: 2023 },
    { date: '2023 February 2nd', dateFormat: 'YYYY MMMM Do', day: 2, month: 1, year: 2023 },
    { date: 'Feb 2nd \'23', dateFormat: 'MMM Do \'YY', day: 2, month: 1, year: 2023 },
    { date: 'The 2nd of February \'23', dateFormat: '[The] Do [of] MMMM \'YY', day: 2, month: 1, year: 2023 },
    { date: 'Day: 2, Month: 2, Year: 2023',
      dateFormat: '[Day:] D, [Month:] M, [Year:] YYYY',
      day: 2,
      month: 1,
      year: 2023
    },

  ], ({ date, day, month, year, dateFormat }) => {
    it('it should display the correct date in the date picker', async() => {
      handsontable({
        data: [[date]],
        editor: 'date',
        dateFormat
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const datePickerDate = hot().getActiveEditor().$datePicker._d;

      expect(datePickerDate.getDate()).toEqual(day);
      expect(datePickerDate.getMonth()).toEqual(month);
      expect(datePickerDate.getFullYear()).toEqual(year);
    });
  });

  using('data set', [
    { value: '01/02/23', dateFormat: 'DD/MM/YYYY', day: 1, month: 1, year: 2023 },
    { value: '1/2/23', dateFormat: 'DD/MM/YY', day: 1, month: 1, year: 2023 },
    { value: '01/02/2023', dateFormat: 'D/M/YY', day: 1, month: 1, year: 2023 },
    { value: '1-2-23', dateFormat: 'DD-MM-YYYY', day: 1, month: 1, year: 2023 },
    { value: '01/02/2023', dateFormat: 'DD-MM-YYYY', day: 1, month: 1, year: 2023 },
    { value: '01-02-2023', dateFormat: 'DD.MM.YYYY', day: 1, month: 1, year: 2023 },
    { value: '1-2-2023', dateFormat: 'D-M-YY', day: 1, month: 1, year: 2023 },
    { value: '1.2.2023', dateFormat: 'D.M.YY', day: 1, month: 1, year: 2023 },
    { value: '23 February 2nd', dateFormat: 'YYYY MMMM Do', day: 2, month: 1, year: 2023 },
    { value: 'Feb 2nd \'2023', dateFormat: 'MMM Do \'YY', day: 2, month: 1, year: 2023 },
    { value: 'The 2nd of February 2023', dateFormat: '[The] Do [of] MMMM \'YY', day: 2, month: 1, year: 2023 },
    {
      value: 'Day: 2, Month: 2, Year: 23',
      dateFormat: '[Day:] D, [Month:] M, [Year:] YYYY',
      day: 2,
      month: 1,
      year: 2023
    },
    {
      value: 'Day: 2, Month: 2, Year: 2023',
      dateFormat: '[Day:] D, [Month:] M, [Year:] YY',
      day: 2,
      month: 1,
      year: 2023
    },
  ], ({ date, dateFormat }) => {
    // TODO: Not sure which of these are intentional
    it('it should NOT display the correct dat in the date picker (wrong date format)', async() => {
      handsontable({
        data: [[date]],
        editor: 'date',
        dateFormat
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const datePickerDate = hot().getActiveEditor().$datePicker._d;

      expect(datePickerDate).toEqual(undefined);
    });
  });

  it('should close the date picker editor after call `useTheme`', async() => {
    const hot = handsontable({
      columns: [{ type: 'date' }],
    });

    await selectCell(0, 0);
    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    hot.useTheme(undefined);

    expect(editor.isOpened()).toBe(false);
  });

  describe('IME support', () => {
    it('should focus editable element after a timeout when selecting the cell if `imeFastEdit` is enabled', async() => {
      handsontable({
        columns: [
          {
            editor: 'date',
          }
        ],
        imeFastEdit: true,
      });

      await selectCell(0, 0, 0, 0, true, false);
      // The `imeFastEdit` timeout is set to 50ms.
      await waitForNextAnimationFrames(2);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });

  describe('Cleaning up after the editor', () => {
    it('should not leave any editor containers after destroying the Handsontable instance', async() => {
      handsontable({
        data: [['02/02/2015 8:00 AM']],
        columns: [
          {
            type: 'date'
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp('enter');

      destroy();

      expect($('.htDatepickerHolder').size()).toEqual(0);
    });
  });
});
