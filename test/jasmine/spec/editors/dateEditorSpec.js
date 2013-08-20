describe('TextEditor', function () {
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
    ]
  }

  it("should display jQuery Calendar", function () {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date'
        }
      ]
    });

    expect($('.htDatepickerHolder').is(':visible')).toBe(false);

    selectCell(0, 0);
    keyDown('enter');

    expect($('.htDatepickerHolder').is(':visible')).toBe(true);

  });

  it("should remove any HTML connected with jQuery Calendar", function () {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date'
        }
      ]
    });

    expect($('.htDatepickerHolder').length).toBe(0);

    selectCell(0, 0);
    keyDown('enter');

    expect($('.htDatepickerHolder').length).toBe(1);

    destroy();

    expect($('.htDatepickerHolder').length).toBe(0);

  });


  it("should select date corresponding to cell value", function () {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date',
          dateFormat: 'mm/dd/yy'
        }
      ]
    });

    selectCell(0, 0);
    keyDown('enter');

    var date = new Date(getDates()[0][0]);

    expect($('.htDatepickerHolder').find('.ui-datepicker-year').val()).toMatch(date.getFullYear());
    expect($('.htDatepickerHolder').find('.ui-datepicker-month').val()).toMatch(date.getMonth());
    expect($('.htDatepickerHolder').find('.ui-datepicker-calendar .ui-state-active').text()).toMatch(date.getDate());

  });

  it("should select save new date after clicking on calendar", function () {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date',
          dateFormat: 'mm/dd/yy'
        }
      ]
    });

    selectCell(0, 0);
    expect(getDataAtCell(0, 0)).toMatch('01/14/2006');

    keyDown('enter');


    $('.htDatepickerHolder').find('.ui-datepicker-calendar tbody tr:eq(0) td:eq(0) a').click();

    expect(getDataAtCell(0, 0)).toMatch('01/01/2006');

  });

  it("should close calendar after picking new date", function () {
    handsontable({
      data: getDates(),
      columns: [
        {
          type: 'date',
          dateFormat: 'mm/dd/yy'
        }
      ]
    });

    selectCell(0, 0);
    keyDown('enter');

    expect($('.htDatepickerHolder').is(':visible')).toBe(true);

    $('.htDatepickerHolder').find('.ui-datepicker-calendar tbody tr:eq(0) td:eq(0) a').click();

    expect($('.htDatepickerHolder').is(':visible')).toBe(false);

  });
});