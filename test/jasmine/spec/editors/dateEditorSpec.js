describe('DateEditor', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function getDates(){
    return [
      ["01/14/2006"],
      ["12/01/2008"],
      ["11/19/2011"],
      ["02/02/2004"],
      ["07/24/2011"]
    ];
  }

  it("should display Pikday calendar", function () {
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

  it("should remove any HTML connected with Pikaday Calendar", function () {
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

  it("should select date corresponding to cell value", function () {
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

    expect($('.pika-single').find('.pika-select-year').find(':selected').val()).toMatch(date.getFullYear());
    expect($('.pika-single').find('.pika-select-month').find(':selected').val()).toMatch(date.getMonth());
    expect($('.pika-single').find('.pika-table .is-selected').text()).toMatch(date.getDate());
  });

  it("should save new date after clicked on calendar", function () {
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

    waits(150);
    runs(function () {
      expect(getDataAtCell(0, 0)).toMatch('01/01/2006');
    });
  });

  it("should display fill handle after selected date on calendar", function () {
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

    waits(150);
    runs(function () {
      expect(getDataAtCell(0, 0)).toMatch('01/01/2006');
      expect($('.htBorders .current.corner').is(':visible')).toBe(true);
    });
  });

  it("should setup in settings and display defaultDate on calendar", function () {
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
    expect(getDataAtCell(5, 0)).toMatch(null);

    keyDown('enter');

    var date = new Date('01/01/1900');

    expect($('.pika-single').find('.pika-select-year').find(':selected').val()).toMatch(date.getFullYear());
    expect($('.pika-single').find('.pika-select-month').find(':selected').val()).toMatch(date.getMonth());
    expect($('.pika-single').find('.pika-table .is-selected').text()).toMatch(date.getDate());

    keyDown('enter');

    waits(150);
    runs(function () {
      expect(getDataAtCell(5, 0)).toMatch('01/01/1900');
    });
  });

  it("should close calendar after picking new date", function () {
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

  it("should enable to input any value in textarea", function () {
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

    waits(30);
    runs(function() {
      expect(getDataAtCell(0, 0)).toEqual('foo');
    });

  });

  it("should restore original when edited and pressed ESC ", function () {
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

    keyDownUp(Handsontable.helper.keyCode.ESCAPE); //cancel editing

    editor.finishEditing();

    waits(30);

    runs(function() {
      expect(getDataAtCell(0, 0)).toEqual('01/14/2006');
    });

  });

  it("should display a calendar based on a current date, even if a date in a wrong format was entered previously", function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      columns: [
        {type: 'date'},
        {type: 'date', dateFormat: 'YYYY-MM-DD'}
      ],
      minSpareRows: 1
    }),
      resultDate;

    setDataAtCell(4,1, '15-11-11');

    waits(100);
    runs(function() {

      selectCell(5,1);
      keyDown('enter');

      expect($('.pika-single').is(':visible')).toBe(true);

      mouseDown($('.pika-single').find('.pika-table tbody tr:eq(3) td:eq(3) button'));
    });

    waits(100);
    runs(function() {
      resultDate = getDataAtCell(5,1);

      expect(moment(resultDate).year()).toEqual(moment().year());
      expect(moment(resultDate).month()).toEqual(moment().month());
    });

  });

  it("should display Pikaday Calendar bottom of the selected cell", function() {
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
    expect(cellOffset.top + 23 === datePickerOffset.top).toBe(true);
    expect(cellOffset.left === datePickerOffset.left).toBe(true);
  });

  it("should display Pikaday Calendar bottom of the selected cell when table have scrolls", function() {
    var container = $('#testContainer');

    container[0].style.height = '300px';
    container[0].style.width = '200px';
    container[0].style.overflow = 'hidden';

    var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 10),
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

    // 23 is a height of the editor cell
    if(!!navigator.userAgent.match(/MSIE 10/)) { // IE10 hack
      expect(datePickerOffset.top).toBeAroundValue(cellOffset.top + 23);
    } else {
      expect(cellOffset.top + 23 === datePickerOffset.top).toBe(true);
    }
    expect(cellOffset.left === datePickerOffset.left).toBe(true);
  });
});
