describe('FillHandle', function () {
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

  it('should appear when fillHandle equals true', function () {
    handsontable({
      fillHandle: true
    });

    selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should not appear when fillHandle equals false', function () {
    handsontable({
      fillHandle: false
    });
    selectCell(2, 2);

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should disappear when beginediting is triggered', function () {
    handsontable({
      fillHandle: true
    });
    selectCell(2, 2);

    keyDown('enter');

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should appear when finishediting is triggered', function () {
    handsontable({
      fillHandle: true
    });
    selectCell(2, 2);

    keyDown('enter');
    keyDown('enter');

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should not appear when fillHandle equals false and finishediting is triggered', function () {
    handsontable({
      fillHandle: false
    });
    selectCell(2, 2);

    keyDown('enter');
    keyDown('enter');

    expect(isFillHandleVisible()).toBe(false);
  });

  it('should appear when editor is discarded using the ESC key', function () {
    handsontable({
      fillHandle: true
    });
    selectCell(2, 2);

    keyDown('enter');
    keyDown('esc');

    expect(isFillHandleVisible()).toBe(true);
  });

  it('should add custom value after autofill', function () {
    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill: function (start, end, data) {
        data[0][0] = "test";
      }
    });
    selectCell(0, 0);

    this.$container.find('.wtBorder.corner').simulate('mousedown');
    this.$container.find('tr:eq(1) td:eq(0)').simulate('mouseover');
    this.$container.find('tr:eq(2) td:eq(0)').simulate('mouseover');
    this.$container.find('.wtBorder.corner').simulate('mouseup');

    expect(getSelected()).toEqual([0, 0, 2, 0]);
    expect(getDataAtCell(1, 0)).toEqual("test");
  });

  it('should use correct cell coordinates also when Handsontable is used inside a TABLE (#355)', function () {
    var $table = $('<table><tr><td></td></tr></table>').appendTo('body');
    this.$container.appendTo($table.find('td'));

    var ev;

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill: function (start, end, data) {
        data[0][0] = "test";
      }
    });
    selectCell(1, 1);

    this.$container.find('.wtBorder.current.corner').simulate('mousedown');
    this.$container.find('tr:eq(1) td:eq(0)').simulate('mouseover');
    this.$container.find('tr:eq(2) td:eq(0)').simulate('mouseover');
    this.$container.find('tr:eq(2) td:eq(0)').simulate('mouseup');

    expect(getSelected()).toEqual([1, 1, 2, 1]);
    expect(getDataAtCell(2, 1)).toEqual("test");

    document.body.removeChild($table[0]);
  });
  it("should fill cells below until the end of content in the neighbouring column with current cell's data", function() {
    var hot = handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, null, null, null, null],
        [1, 2, null, null, null, null]
      ]
    });

    selectCell(1,3);
    var fillHandle = this.$container.find('.wtBorder.current.corner')[0];
    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2,3)).toEqual(null);
    expect(getDataAtCell(3,3)).toEqual(null);

    selectCell(1,2);
    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2,2)).toEqual(3);
    expect(getDataAtCell(3,2)).toEqual(3);

  });

  it("should fill cells below until the end of content in the neighbouring column with the currently selected area's data", function() {
    var hot = handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, null, null, null, null],
        [1, 2, null, null, null, null]
      ]
    });

    selectCell(1,3,1,4);
    var fillHandle = this.$container.find('.wtBorder.area.corner')[0];
    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2,3)).toEqual(null);
    expect(getDataAtCell(3,3)).toEqual(null);
    expect(getDataAtCell(2,4)).toEqual(null);
    expect(getDataAtCell(3,4)).toEqual(null);

    selectCell(1,2,1,3);
    mouseDoubleClick(fillHandle);

    expect(getDataAtCell(2,2)).toEqual(3);
    expect(getDataAtCell(3,2)).toEqual(3);
    expect(getDataAtCell(2,3)).toEqual(4);
    expect(getDataAtCell(3,3)).toEqual(4);

  });

  it('should add new row after dragging the handle to the last table row', function () {
    var hot = handsontable({
      data: [
        [1, 2, "test", 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ]
    });

    selectCell(0, 2);

    this.$container.find('.wtBorder.current.corner').simulate('mousedown');
    this.$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    expect(hot.countRows()).toBe(4);
    waits(300);

    runs(function () {
      expect(hot.countRows()).toBe(5);

      this.$container.find('tr:last-child td:eq(2)').simulate('mouseover');

      waits(300);

      runs(function () {
        expect(hot.countRows()).toBe(6);
      });

    });
  });

  it('should not add new rows if the current number of rows reaches the maxRows setting', function () {
    var hot = handsontable({
      data: [
        [1, 2, "test", 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      maxRows: 5
    });

    selectCell(0, 2);

    this.$container.find('.wtBorder.current.corner').simulate('mousedown');
    this.$container.find('tr:last-child td:eq(2)').simulate('mouseover');

    expect(hot.countRows()).toBe(4);
    waits(300);

    runs(function () {
      expect(hot.countRows()).toBe(5);

      this.$container.find('tr:last-child td:eq(2)').simulate('mouseover');

      waits(300);

      runs(function () {
        expect(hot.countRows()).toBe(5);
      });

    });
  });

  it('should add new row after dragging the handle below the viewport', function () {
    var hot = handsontable({
      data: [
        [1, 2, "test", 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ]
    });

    selectCell(0, 2);

    this.$container.find('.wtBorder.current.corner').simulate('mousedown');
    var ev = {}
      , $lastRow = this.$container.find('tr:last-child td:eq(2)');

    expect(hot.countRows()).toBe(4);

    ev.clientX = $lastRow.offset().left / 2;
    ev.clientY = $lastRow.offset().top + 50;

    $(document).simulate('mousemove', ev);

    waits(300);

    runs(function () {
      expect(hot.countRows()).toBe(5);

      ev.clientY = $lastRow.offset().top + 150;
      $(document).simulate('mousemove',ev);

      waits(300);

      runs(function () {
        expect(hot.countRows()).toBe(6);
      });
    });
  });

  it('should not fill any cells when dragging the handle to the headers', function () {
    var hot = handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 7, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      colHeaders: true
    });

    // col headers:

    selectCell(2, 2);

    this.$container.find('.wtBorder.current.corner').simulate('mousedown');

    var errors = 0;

    try {
      this.$container.find('thead tr:first-child th:eq(2)').simulate('mouseover').simulate('mouseup');
    } catch(err) {
      errors++;
    }

    expect(errors).toEqual(0);
    expect(getDataAtCell(1,2)).toEqual(3);
    expect(getDataAtCell(0,2)).toEqual(3);
    expect($(".fill").filter(function() { return $(this).css("display") != "none" }).length).toEqual(0); // check if fill selection is refreshed

    // row headers:
    selectCell(2, 2);

    this.$container.find('.wtBorder.current.corner').simulate('mousedown');

    errors = 0;

    try {
      this.$container.find('tbody tr:nth(2) th:first-child').simulate('mouseover').simulate('mouseup');
    } catch(err) {
      errors++;
    }

    expect(errors).toEqual(0);
    expect(getDataAtCell(2,1)).toEqual(2);
    expect(getDataAtCell(2,0)).toEqual(1);
    expect($(".fill").filter(function() { return $(this).css("display") != "none" }).length).toEqual(0); // check if fill selection is refreshed
  });


  it('should not add a new row if dragging from the last row upwards or sideways', function () {
    var mouseOverSpy = jasmine.createSpy('mouseOverSpy');
    var hot = handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, "test", 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      afterOnCellMouseOver: mouseOverSpy
    });

    selectCell(3, 2);

    this.$container.find('.wtBorder.current.corner').simulate('mousedown');
    this.$container.find('tr:nth-child(3) td:eq(2)').simulate('mouseover');

    waitsFor(function () {
      return mouseOverSpy.callCount > 0;
    }, 'mouseover performed', 1000);

    runs(function () {
      expect(hot.countRows()).toBe(4);

      selectCell(3, 2);
      this.$container.find('.wtBorder.current.corner').simulate('mousedown');
      this.$container.find('tr:nth-child(4) td:eq(3)').simulate('mouseover');

      waitsFor(function () {
        return mouseOverSpy.callCount > 0;
      }, 'mouseover performed', 1000);

      runs(function () {
        expect(hot.countRows()).toBe(4);

        selectCell(3, 2);
        this.$container.find('.wtBorder.current.corner').simulate('mousedown');
        this.$container.find('tr:nth-child(4) td:eq(1)').simulate('mouseover');

        waitsFor(function () {
          return mouseOverSpy.callCount > 0;
        }, 'mouseover performed', 1000);

        runs(function () {
          expect(hot.countRows()).toBe(4);
        });

      });

    });

  });

});

