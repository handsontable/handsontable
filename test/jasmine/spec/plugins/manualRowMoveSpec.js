describe('manualRowMove', function () {
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

  var moveSecondDisplayedRowBeforeFirstRow = function(container, secondDisplayedRowIndex) {
    var $rowHeaders = container.find('tbody tr th'),
        $firstRowHeader = $rowHeaders.eq(secondDisplayedRowIndex - 1),
        $secondRowHeader = $rowHeaders.eq(secondDisplayedRowIndex),
        $manualRowMover = $secondRowHeader.find('.manualRowMover');

    if ($manualRowMover.length) {
      var mouseDownEvent = $.Event('mousedown');
      mouseDownEvent.pageY = $manualRowMover.position().top;
      $manualRowMover.trigger(mouseDownEvent);

      var mouseMoveEvent = $.Event('mousemove');
      mouseMoveEvent.pageY = $manualRowMover.position().top - 100;
      $manualRowMover.trigger(mouseMoveEvent);

      $firstRowHeader.trigger('mouseenter');
      $secondRowHeader.trigger('mouseup');
    }
  }

  it('should change row order at init', function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve", lastName: "Branson"}
      ],
      manualRowMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
  });

  it('should change the default row order with updateSettings', function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve", lastName: "Branson"}
      ],
      manualRowMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

    updateSettings({
      manualRowMove: [2, 1, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
  });

  it('should change row order with updateSettings', function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve", lastName: "Branson"}
      ],
      manualRowMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');

    updateSettings({
      manualRowMove: [2, 1, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
  });

  it('should reset row order', function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve", lastName: "Branson"}
      ],
      manualRowMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');

    updateSettings({
      manualRowMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
  });

  it('should move rows for manualRowMove: true', function () {

    this.$container.height(150);

    var hot = handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve10", lastName: "Branson"},
        {id: 11, name: "Ted11", lastName: "Right"},
        {id: 12, name: "Frank12", lastName: "Honest"},
        {id: 13, name: "Joan13", lastName: "Well"},
        {id: 14, name: "Sid14", lastName: "Strong"},
        {id: 15, name: "Jane15", lastName: "Neat"},
        {id: 16, name: "Chuck16", lastName: "Jackson"},
        {id: 17, name: "Meg17", lastName: "Jansen"},
        {id: 18, name: "Rob18", lastName: "Norris"},
        {id: 19, name: "Sean19", lastName: "O'Hara"},
        {id: 20, name: "Eve20", lastName: "Branson"}
      ],
      rowHeaders: true,
      manualRowMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

    var htCore = getHtCore();

    selectCell(7, 0);

    var lastVisibleRowIndex = hot.view.wt.wtTable.getLastVisibleRow();
    expect(htCore.find('tbody tr:eq(' + (lastVisibleRowIndex - 1) + ') td:eq(0)').text()).toEqual('8');
    expect(htCore.find('tbody tr:eq(' + (lastVisibleRowIndex) + ') td:eq(0)').text()).toEqual('9');

    waits(500);

    runs(function () {
      moveSecondDisplayedRowBeforeFirstRow(htCore, lastVisibleRowIndex - 1);

      expect(htCore.find('tbody tr:eq(' + (lastVisibleRowIndex - 1) + ') td:eq(0)').text()).toEqual('9');
      expect(htCore.find('tbody tr:eq(' + (lastVisibleRowIndex) + ') td:eq(0)').text()).toEqual('8');
    });
  });

  it('should not move rows for manualRowMove: false', function () {

    this.$container.height(150);

    var hot = handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve10", lastName: "Branson"},
        {id: 11, name: "Ted11", lastName: "Right"},
        {id: 12, name: "Frank12", lastName: "Honest"},
        {id: 13, name: "Joan13", lastName: "Well"},
        {id: 14, name: "Sid14", lastName: "Strong"},
        {id: 15, name: "Jane15", lastName: "Neat"},
        {id: 16, name: "Chuck16", lastName: "Jackson"},
        {id: 17, name: "Meg17", lastName: "Jansen"},
        {id: 18, name: "Rob18", lastName: "Norris"},
        {id: 19, name: "Sean19", lastName: "O'Hara"},
        {id: 20, name: "Eve20", lastName: "Branson"}
      ],
      rowHeaders: true,
      manualRowMove: false
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

    var htCore = getHtCore();

    selectCell(7, 0);

    var lastVisibleRowIndex = hot.view.wt.wtTable.getLastVisibleRow();
    expect(htCore.find('tbody tr:eq(' + (lastVisibleRowIndex - 1) + ') td:eq(0)').text()).toEqual('8');
    expect(htCore.find('tbody tr:eq(' + (lastVisibleRowIndex) + ') td:eq(0)').text()).toEqual('9');

    waits(500);

    runs(function () {
      moveSecondDisplayedRowBeforeFirstRow(htCore, lastVisibleRowIndex - 1);

      expect(htCore.find('tbody tr:eq(' + (lastVisibleRowIndex - 1) + ') td:eq(0)').text()).toEqual('8');
      expect(htCore.find('tbody tr:eq(' + (lastVisibleRowIndex) + ') td:eq(0)').text()).toEqual('9');
    });
  });

  it('should trigger an afterRowMove event after row move', function () {
    var afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

    this.$container.height(150);

    var hot = handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"}
      ],
      rowHeaders: true,
      manualRowMove: true,
      afterRowMove: afterMoveRowCallback
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

    var htCore = getHtCore();
    var lastVisibleRowIndex = hot.view.wt.wtTable.getLastVisibleRow();

    waits(500);

    runs(function () {
      moveSecondDisplayedRowBeforeFirstRow(htCore, lastVisibleRowIndex - 1);

      expect(htCore.find('tbody tr:eq(' + (lastVisibleRowIndex - 1) + ') td:eq(0)').text()).toEqual('7');
      expect(htCore.find('tbody tr:eq(' + (lastVisibleRowIndex) + ') td:eq(0)').text()).toEqual('6');

      expect(afterMoveRowCallback).toHaveBeenCalledWith(lastVisibleRowIndex, lastVisibleRowIndex - 1, void 0, void 0, void 0);
    });
  });

});