describe('DateEditor', () => {
  var id = 'testContainer';

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
    var onOpenSpy = jasmine.createSpy('open');
    var onCloseSpy = jasmine.createSpy('close');
    var hot = handsontable({
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
              months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
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

    var config = hot.getActiveEditor().$datePicker.config();

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

    var date = new Date(getDates()[0][0]);

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

    var date = new Date('01/01/1900');

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

  it('should enable to input any value in textarea', (done) => {
    var hot = handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date'
        }
      ]
    });

    selectCell(0, 0);

    var editor = hot.getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.TEXTAREA.value = 'foo';
    keyDownUp('o'.charCodeAt(0));

    expect(editor.getValue()).toEqual('foo');

    editor.finishEditing();

    setTimeout(() => {
      expect(getDataAtCell(0, 0)).toEqual('foo');
      done();
    }, 30);
  });

  it('should restore original when edited and pressed ESC ', (done) => {
    var hot = handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date'
        }
      ]
    });

    selectCell(0, 0);

    var editor = hot.getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.TEXTAREA.value = 'foo';

    expect(editor.getValue()).toEqual('foo');

    keyDownUp(Handsontable.helper.KEY_CODES.ESCAPE); // cancel editing

    editor.finishEditing();

    setTimeout(() => {
      expect(getDataAtCell(0, 0)).toEqual('01/14/2006');
      done();
    }, 30);
  });

  it('should display a calendar based on a current date, even if a date in a wrong format was entered previously', (done) => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      columns: [
        {type: 'date'},
        {type: 'date', dateFormat: 'YYYY-MM-DD'}
      ],
      minSpareRows: 1
    });

    setDataAtCell(4, 1, '15-11-11');

    setTimeout(() => {
      selectCell(5, 1);
      keyDown('enter');

      expect($('.pika-single').is(':visible')).toBe(true);

      mouseDown($('.pika-single').find('.pika-table tbody tr:eq(3) td:eq(3) button'));
    }, 150);

    setTimeout(() => {
      let resultDate = getDataAtCell(5, 1);

      expect(moment(resultDate).year()).toEqual(moment().year());
      expect(moment(resultDate).month()).toEqual(moment().month());
      done();
    }, 300);
  });

  it('should display Pikaday Calendar bottom of the selected cell', () => {
    var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 2),
        columns: [
          {type: 'date'},
          {type: 'date'}
        ]
      }),
      cellOffset,
      datePickerOffset;

    selectCell(1, 1);
    keyDown('enter');

    cellOffset = $(hot.getActiveEditor().TD).offset();
    datePickerOffset = $('.pika-single').offset();

    // 23 is a height of the editor cell
    expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0);
    expect(cellOffset.left).toBeCloseTo(datePickerOffset.left, 0);
  });

  it('should display Pikaday Calendar bottom of the selected cell when table have scrolls', () => {
    var container = $('#testContainer');

    container[0].style.height = '300px';
    container[0].style.width = '200px';
    container[0].style.overflow = 'hidden';

    var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 10),
        colWidths: 60,
        columns: [
          {type: 'date'},
          {type: 'date'},
          {type: 'date'},
          {type: 'date'},
          {type: 'date'},
          {type: 'date'},
          {type: 'date'}
        ]
      }),
      cellOffset,
      datePickerOffset;

    selectCell(20, 6);
    keyDown('enter');

    cellOffset = $(hot.getActiveEditor().TD).offset();
    datePickerOffset = $('.pika-single').offset();

    expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0);
    expect(cellOffset.left).toBeCloseTo(datePickerOffset.left, 0);
  });

  it('should not modify the edited date and time, when opening the editor', () => {
    var hot = handsontable({
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
      }),
      editor,
      cellValue;

    // setDataAtCell(0, 0, '02/02/2015 8:00 AM');
    cellValue = getDataAtCell(0, 0);

    selectCell(0, 0);
    keyDown('enter');

    editor = hot.getActiveEditor();

    expect(editor.TEXTAREA.value).toEqual(cellValue);
  });
});
