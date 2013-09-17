describe('manualColumnMove', function () {
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

  function moveSecondDisplayedColumnBeforeFirstColumn(container){
    var $colHeaders = container.find('thead tr:eq(0) th');
    var $firstColHeader = $colHeaders.eq(0);
    var $secondColHeader = $colHeaders.eq(1);
    var $manualColumnMover = $secondColHeader.find('.manualColumnMover');

    //Grab the second column
    var mouseDownEvent = $.Event('mousedown');
    mouseDownEvent.pageX = $manualColumnMover.position().left;
    $manualColumnMover.trigger(mouseDownEvent);

    //Drag the second column over the first column
    var mouseMoveEvent = $.Event('mousemove');
    mouseMoveEvent.pageX = $manualColumnMover.position().left - 20;
    $manualColumnMover.trigger(mouseMoveEvent);

    $firstColHeader.trigger('mouseenter');

    //Drop the second column
    $secondColHeader.trigger('mouseup');
  }

  it("should change column order at init", function () {
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
      manualColumnMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');
  });

  it("should change the default column order with updateSettings", function () {
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
      manualColumnMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    updateSettings({
      manualColumnMove: [2, 1, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');
  });

  it("should change column order with updateSettings", function () {
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
      manualColumnMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');

    updateSettings({
      manualColumnMove: [2, 1, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');
  });

  it("should reset column order", function () {
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
      manualColumnMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');

    updateSettings({
      manualColumnMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');
  });

  it("should move columns when viewport has been scrolled", function () {

    this.$container.width(120);

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
      colHeaders: true,
      manualColumnMove: true
    });

    selectCell(0, 2);
    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Right');

    moveSecondDisplayedColumnBeforeFirstColumn(this.$container);

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');


  });

  it("should move columns only in specific HOT instance", function () {

    this.$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');

    this.$container2.width(120);
    this.$container.width(120);

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
      colHeaders: true,
      manualColumnMove: true
    });

    this.$container2.handsontable({
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
      colHeaders: true,
      manualColumnMove: true
    });

    var hot2 = this.$container2.handsontable('getInstance');

    hot2.selectCell(0, 0);
    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    expect(this.$container2.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container2.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container2.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    moveSecondDisplayedColumnBeforeFirstColumn(this.$container2);

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    expect(this.$container2.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Ted');
    expect(this.$container2.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('1');
    expect(this.$container2.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    hot2.destroy();
    this.$container2.remove();
  });

  it("should mark apropriate column as invalid, when column order is changed", function () {
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
      colHeaders: true,
      manualColumnMove: [2, 0, 1],
      columns: [
        {
          type: 'numeric',
          data: 'id'},
        {
          data: 'name'
        },
        {
          data: 'lastName'
        }
      ],
      allowInvalid: true
    });

    selectCell(0, 0);
    keyDown('enter');
    keyDown('enter');

    expect(this.$container.find('.htInvalid').length).toEqual(0);

    selectCell(0, 1);
    keyDown('enter');
    var editor = $('.handsontableInput');
    editor.val('foo');
    keyDown('enter');

    expect(this.$container.find('.htInvalid').length).toEqual(1);
    expect(this.$container.find('.htInvalid').text()).toMatch('foo');

  });

  it("should not move the column if you click the handle without dragging", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
      ],
      colHeaders: true,
      manualColumnMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    selectCell(0, 0);

    var $colHeader = this.$container.find('thead tr:eq(0) th:eq(2)');
    var $manualColumnMover = $colHeader.find('.manualColumnMover');

    //Grab the column
    var mouseDownEvent = $.Event('mousedown');
    mouseDownEvent.pageX = $manualColumnMover.position().left;
    $manualColumnMover.trigger(mouseDownEvent);

    //Drop it without dragging
    $colHeader.trigger('mouseup');

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');
  })
});
