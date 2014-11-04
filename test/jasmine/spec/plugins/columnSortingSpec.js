describe('ColumnSorting', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '" style="overflow: auto; width: 300px; height: 200px;"></div>').appendTo('body');

    this.sortByColumn = function (columnIndex) {
//      this.$container.find('th span.columnSorting:eq(' + columnIndex + ')').click();
      this.$container.find('th span.columnSorting:eq(' + columnIndex + ')').simulate('click');
    }
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  var arrayOfObjects = function () {
    return [
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
    ];
  };


  it('should sort table by first visible column', function () {
    var hot = handsontable({
      data: [
        [1, 9, 3, 4, 5, 6, 7, 8, 9],
        [9, 8, 7, 6, 5, 4, 3, 2, 1],
        [8, 7, 6, 5, 4, 3, 3, 1, 9],
        [0, 3, 0, 5, 6, 7, 8, 9, 1]
      ],
      colHeaders: true,
      columnSorting: true
    });

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('9');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('3');
    expect(htCore.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('4');

    this.sortByColumn(0);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('3');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('5');
  });


  it('should sort numbers descending after 2 clicks on table header', function () {
    handsontable({
      data: arrayOfObjects(),
      colHeaders: true,
      columnSorting: true
    });

    this.sortByColumn(0);
    this.sortByColumn(0);

    expect(this.$container.find('tr td').first().html()).toEqual('10');
  });

  it('should remove specified row from sorted table and NOT sort the table again', function () {

    var hot = handsontable({
      data: [
        [1, 'B'],
        [3, 'D'],
        [2, 'A'],
        [0, 'C']
      ],
      colHeaders: true,
      columnSorting: true
    });

    this.sortByColumn(0);

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    expect(htCore.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');

    expect(htCore.find('tbody tr').length).toEqual(4);

    //Now if sort is launched, sorting ordered will be reversed
    hot.sortOrder = false;


    hot.alter('remove_row', 0);

    expect(htCore.find('tbody tr').length).toEqual(3);
    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
  });

  it('should add an empty row to sorted table', function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'A'],
        [3, 'D'],
        [2, 'C']
      ],
      colHeaders: true,
      columnSorting: true
    });

    this.sortByColumn(0);

    var htCore = getHtCore();

    expect(htCore.find('tbody tr').length).toEqual(4);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    expect(htCore.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');

    hot.alter('insert_row', 1, 2);

    expect(htCore.find('tbody tr').length).toEqual(6);
    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('');
    expect(htCore.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('2');
    expect(htCore.find('tbody tr:eq(5) td:eq(0)').text()).toEqual('3');
  });

  it('should add an empty row to sorted table at a given index', function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'A'],
        [3, 'D'],
        [2, 'C']
      ],
      colHeaders: true,
      columnSorting: true
    });

    var htCore = getHtCore();

    this.sortByColumn(0);

    expect(htCore.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');
    expect(htCore.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('');

    hot.alter('insert_row', 2);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');

    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('');

    expect(htCore.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('2');
  });

  it('should NOT sort the table after value update in sorted column', function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'A'],
        [3, 'D'],
        [2, 'C']
      ],
      colHeaders: true,
      columnSorting: true
    });

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');

    this.sortByColumn(0);
    this.sortByColumn(0);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');

    hot.setDataAtCell(1, 0, 20);

    render();

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('20');


  });

  it('should sort date columns', function () {

    var hot = handsontable({
      data: [
        ["Mercedes", "A 160", "01/14/2006", 6999.9999],
        ["Citroen", "C4 Coupe", "12/01/2008", 8330],
        ["Audi", "A4 Avant", "11/19/2011", 33900],
        ["Opel", "Astra", "02/02/2004", 7000],
        ["BMW", "320i Coupe", "07/24/2011", 30500]
      ],
      columns: [
        {},
        {},
        {
          type: 'date',
          dateFormat: 'mm/dd/yy'
        },
        {
          type: 'numeric'
        }
      ],
      colHeaders: true,
      columnSorting: true
    });

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toMatch(/01\/14\/2006/);

    htCore.find('th span.columnSorting:eq(2)').simulate('click');  // DESC sort after first click

    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toMatch(/02\/02\/2004/);

    htCore.find('th span.columnSorting:eq(2)').simulate('click');  // ASC sort after second click

    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toMatch(/11\/19\/2011/);


  });

  it('should sort table with multiple row headers', function () {

    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      columns: [
        {},
        {},
        {
          type: 'date',
          dateFormat: 'mm/dd/yy'
        },
        {
          type: 'numeric'
        }
      ],
      colHeaders: true,
      columnSorting: true,
      removeRowPlugin: true //this plugin ads an extra row header, so now we have 2 instead of 1
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');

    this.sortByColumn(0); // sort by first column

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');

    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('D');

    this.sortByColumn(1);  // sort by second column

    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A');


  });

  it('should allow to define sorting column and order during initialization', function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      colHeaders: true,
      columnSorting: {
        column: 0,
        order: true
      }
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('D');
  });

  it('should allow to change sorting column with updateSettings', function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      colHeaders: true,
      columnSorting: {
        column: 0,
        order: true
      }
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('D');

    updateSettings({
      columnSorting: {
        column: 1,
        order: true
      }
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A');
  });

  it('should allow to change sorting order with updateSettings', function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      colHeaders: true,
      columnSorting: {
        column: 0,
        order: true
      }
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');

    updateSettings({
      columnSorting: {
        column: 0,
        order: false
      }
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
  });

  it("should NOT sort spare rows", function () {
    var myData = [
      {a: false, b: 2, c: 3},
      {a: true, b: 11, c: -4},
      {a: false, b: 10, c: 11}
    ];

    function customIsEmptyRow(row) {
      var data = getData();
      return data[row].isNew;
    }

    handsontable({
      data: myData,
      minSpareRows: 1,
      rowHeaders: true,
      colHeaders: ["A", "B", "C"],
      columns: [
        { data: "a", type: "checkbox" },
        { data: "b", type: "text" },
        { data: "c", type: "text" }
      ],
      dataSchema: {isNew: true, a: false}, // default for a to avoid #bad value#
      columnSorting: true,
      isEmptyRow: customIsEmptyRow
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0) :checkbox').is(':checked')).toBe(false);
    expect(this.$container.find('tbody tr:eq(1) td:eq(0) :checkbox').is(':checked')).toBe(true);
    expect(this.$container.find('tbody tr:eq(2) td:eq(0) :checkbox').is(':checked')).toBe(false);
    expect(this.$container.find('tbody tr:eq(3) td:eq(0) :checkbox').is(':checked')).toBe(false); //spare row

    updateSettings({
      columnSorting: {
        column: 0,
        order: false
      }
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0) :checkbox').is(':checked')).toBe(false);
    expect(this.$container.find('tbody tr:eq(1) td:eq(0) :checkbox').is(':checked')).toBe(false);
    expect(this.$container.find('tbody tr:eq(2) td:eq(0) :checkbox').is(':checked')).toBe(true);
    expect(this.$container.find('tbody tr:eq(3) td:eq(0) :checkbox').is(':checked')).toBe(false); //spare row
  });

  it("should reset column sorting with updateSettings", function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      colHeaders: true,
      columnSorting: {
        column: 0,
        order: true
      }
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');

    updateSettings({
      columnSorting: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
  });

  it("should expose sort method when columnSorting is enabled", function () {
    var hot = handsontable();

    expect(hot.getSettings()['columnSorting']).toBeFalsy();
    expect(hot.sort).toBeUndefined();

    updateSettings({
      columnSorting: true
    });

    expect(hot.getSettings()['columnSorting']).toBe(true);
    expect(hot.sort).toBeDefined();
    expect(typeof hot.sort).toBe('function');

    updateSettings({
      columnSorting: false
    });

    expect(hot.getSettings()['columnSorting']).toBeFalsy();
    expect(hot.sort).toBeUndefined();

  });

  it("should sort table using HOT.sort method", function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      columnSorting: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('0');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('2');

    hot.sort(0, true);

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');

  });

  it("should reset column sorting with updateSettings", function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      colHeaders: true,
      columnSorting: {
        column: 0,
        order: true
      }
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');

    updateSettings({
      columnSorting: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
  });

  it("should fire beforeColumnSort event before sorting data", function () {

    var hot = handsontable({
      data: [
        [2],
        [4],
        [1],
        [3]
      ],
      columnSorting: true
    });

    this.beforeColumnSortHandler = function () {
      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('4');
      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
    };

    spyOn(this, 'beforeColumnSortHandler');

    hot.addHook('beforeColumnSort', this.beforeColumnSortHandler);

    var sortColumn = 0;
    var sortOrder = true;

    hot.sort(sortColumn, sortOrder);

    expect(this.beforeColumnSortHandler.callCount).toEqual(1);
    expect(this.beforeColumnSortHandler).toHaveBeenCalledWith(sortColumn, sortOrder, void 0, void 0, void 0, void 0);
  });

  it("should add beforeColumnSort event listener in constructor", function () {

    var beforeColumnSortCallback = jasmine.createSpy('beforeColumnSortHandler');

    var hot = handsontable({
      data: [[2], [4], [1], [3]],
      columnSorting: true,
      beforeColumnSort: beforeColumnSortCallback
    });

    var sortColumn = 0;
    var sortOrder = true;

    hot.sort(sortColumn, sortOrder);

    expect(beforeColumnSortCallback.callCount).toEqual(1);
    expect(beforeColumnSortCallback).toHaveBeenCalledWith(sortColumn, sortOrder, void 0, void 0, void 0, void 0);
  });

  it("should fire afterColumnSort event before data has been sorted", function () {

    var hot = handsontable({
      data: [
        [2],
        [4],
        [1],
        [3]
      ],
      columnSorting: true
    });

    this.afterColumnSortHandler = function () {
      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('4');
    };

    spyOn(this, 'afterColumnSortHandler');

    hot.addHook('afterColumnSort', this.afterColumnSortHandler);

    var sortColumn = 0;
    var sortOrder = true;

    hot.sort(sortColumn, sortOrder);

    expect(this.afterColumnSortHandler.callCount).toEqual(1);
    expect(this.afterColumnSortHandler).toHaveBeenCalledWith(sortColumn, sortOrder, void 0, void 0, void 0, void 0);
  });

  it("should add afterColumnSort event listener in constructor", function () {

    var afterColumnSortCallback = jasmine.createSpy('afterColumnSortHandler');

    var hot = handsontable({
      data: [[2], [4], [1], [3]],
      columnSorting: true,
      afterColumnSort: afterColumnSortCallback
    });

    var sortColumn = 0;
    var sortOrder = true;

    hot.sort(sortColumn, sortOrder);

    expect(afterColumnSortCallback.callCount).toEqual(1);
    expect(afterColumnSortCallback).toHaveBeenCalledWith(sortColumn, sortOrder, void 0, void 0, void 0, void 0);
  });


  it("should insert row when plugin is enabled, but table hasn't been sorted", function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      columnSorting: true
    });

    expect(countRows()).toEqual(4);
    expect(hot.sortColumn).toBeUndefined();

    alter('insert_row');

    expect(countRows()).toEqual(5);
  });

  it("should remove row when plugin is enabled, but table hasn't been sorted", function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      columnSorting: true
    });

    expect(countRows()).toEqual(4);
    expect(hot.sortColumn).toBeUndefined();

    alter('remove_row');

    expect(countRows()).toEqual(3);
  });

  it("should display new row added directly to dataSource, when observeChanges plugin is enabled", function () {
    var data = [
      [1, 'B'],
      [0, 'A'],
      [3, 'D'],
      [2, 'C']
    ];

    var hot = handsontable({
      data: data,
      colHeaders: true,
      columnSorting: true,
      observeChanges: true
    });

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
    expect(htCore.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('2');

    this.sortByColumn(0);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    expect(htCore.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');

    expect(htCore.find('tbody tr').length).toEqual(4);

    var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
    hot.addHook('afterChangesObserved', afterChangesObservedCallback);

    data.push([5, 'E']);

    waitsFor(function () {
      return afterChangesObservedCallback.calls.length > 0;
    }, 'afterChangesObserved event fire', 1000);

    runs(function () {
      expect(countRows()).toEqual(5);
      expect(this.$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('5');
      expect(this.$container.find('tbody tr:eq(4) td:eq(1)').text()).toEqual('E');
    });


  });

  xit("should not display new row added directly to dataSource, when observeChanges plugin is explicitly disabled", function () {
    var data = [
      [1, 'B'],
      [0, 'A'],
      [3, 'D'],
      [2, 'C']
    ];

    var hot = handsontable({
      data: data,
      colHeaders: true,
      columnSorting: true,
      observeChanges: false
    });

    var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
    hot.addHook('afterChangesObserved', afterChangesObservedCallback);

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
    expect(htCore.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('2');

    this.sortByColumn(0);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    expect(htCore.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');

    expect(htCore.find('tbody tr').length).toEqual(4);

    data.push([5, 'E']);

    waits(100);

    runs(function () {
      expect(countRows()).toEqual(4);
      expect(afterChangesObservedCallback).not.toHaveBeenCalled();
    });


  });

  it("should display new row added directly to dataSource, when observeChanges plugin status is undefined", function () {
    var data = [
      [1, 'B'],
      [0, 'A'],
      [3, 'D'],
      [2, 'C']
    ];

    var onUpdateSettings = jasmine.createSpy('onUpdateSettings');

    var hot = handsontable({
      data: data,
      colHeaders: true,
      columnSorting: true,
      afterUpdateSettings: onUpdateSettings
    });

    var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
    hot.addHook('afterChangesObserved', afterChangesObservedCallback);

    var htCore = getHtCore();

    //columnSorting enables observeChanges plugin by asynchronously invoking updateSettings
    waitsFor(function () {
      return onUpdateSettings.calls.length > 0;
    }, 'Update settings', 1000);


    runs(function () {
      expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('0');
      expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
      expect(htCore.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('2');

      this.sortByColumn(0);

      expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
      expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
      expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
      expect(htCore.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');

      expect(htCore.find('tbody tr').length).toEqual(4);

      var afterChangesObservedCallback = jasmine.createSpy('afterChangesObservedCallback');
      hot.addHook('afterChangesObserved', afterChangesObservedCallback);

      data.push([5, 'E']);
    });

    waitsFor(function () {
      return afterChangesObservedCallback.calls.length > 0;
    }, 'afterChangesObserved event fire', 1000);

    runs(function () {
      expect(countRows()).toEqual(5);
      expect(htCore.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('5');
      expect(htCore.find('tbody tr:eq(4) td:eq(1)').text()).toEqual('E');
    });


  });

  it("should apply sorting when there are two tables and only one has sorting enabled and has been already sorted (#1020)", function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      columnSorting: {
        column: 1
      }
    });

    this.$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');
    this.$container2.handsontable();
    var hot2 = this.$container2.handsontable('getInstance');

    selectCell(0, 1);
    keyDown('enter');
    expect($('.handsontableInput').val()).toEqual('A');

    this.$container2.handsontable('destroy');
    this.$container2.remove();
  });

  it("should reset sorting after loading new data", function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      columnSorting: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('0');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('2');

    hot.sort(0, true);

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');

    loadData([
      [50, 'E'],
      [10, 'G'],
      [30, 'F'],
      [60, 'I'],
      [40, 'J'],
      [20, 'H']
    ]);

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('50');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('10');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('30');
    expect(this.$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('60');
    expect(this.$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('40');
    expect(this.$container.find('tbody tr:eq(5) td:eq(0)').text()).toEqual('20');

  });

  it("should reset sorting after loading new data (default sorting column and order set)", function () {
    var hot = handsontable({
      data: [
        [1, 'B'],
        [0, 'D'],
        [3, 'A'],
        [2, 'C']
      ],
      columnSorting: {
        column: 1,
        order: true
      }
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('0');

    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A');
    expect(this.$container.find('tbody tr:eq(1) td:eq(1)').text()).toEqual('B');
    expect(this.$container.find('tbody tr:eq(2) td:eq(1)').text()).toEqual('C');
    expect(this.$container.find('tbody tr:eq(3) td:eq(1)').text()).toEqual('D');

    hot.sort(0, true);

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');

    loadData([
      [50, 'E'],
      [10, 'G'],
      [30, 'F'],
      [60, 'I'],
      [40, 'J'],
      [20, 'H']
    ]);

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('50');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('30');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('10');
    expect(this.$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('20');
    expect(this.$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('60');
    expect(this.$container.find('tbody tr:eq(5) td:eq(0)').text()).toEqual('40');

    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('E');
    expect(this.$container.find('tbody tr:eq(1) td:eq(1)').text()).toEqual('F');
    expect(this.$container.find('tbody tr:eq(2) td:eq(1)').text()).toEqual('G');
    expect(this.$container.find('tbody tr:eq(3) td:eq(1)').text()).toEqual('H');
    expect(this.$container.find('tbody tr:eq(4) td:eq(1)').text()).toEqual('I');
    expect(this.$container.find('tbody tr:eq(5) td:eq(1)').text()).toEqual('J');

  });

  it('should return updated data at specyfied row after sorted', function () {
    var hot = handsontable({
      data:  [
        [1, "Ted", "Right"],
        [2, "Frank", "Honest"],
        [3, "Joan", "Well"],
        [4, "Sid", "Strong"],
        [5, "Jane", "Neat"]
      ],
      colHeaders: true,
      rowHeaders: true,
      columnSorting: true
    });

    this.sortByColumn(0);

    expect(getDataAtRow(0)).toEqual([1, "Ted", "Right"]);
    expect(getDataAtRow(4)).toEqual([5, "Jane", "Neat"]);

    this.sortByColumn(0);

    expect(getDataAtRow(0)).toEqual([5, "Jane", "Neat"]);
    expect(getDataAtRow(4)).toEqual([1, "Ted", "Right"]);

    this.sortByColumn(0);

    expect(getDataAtRow(0)).toEqual([1, "Ted", "Right"]);
    expect(getDataAtRow(4)).toEqual([5, "Jane", "Neat"]);
  });

  it('should return updated data at specyfied col after sorted', function () {
    var hot = handsontable({
      data:  [
        [1, "Ted", "Right"],
        [2, "Frank", "Honest"],
        [3, "Joan", "Well"],
        [4, "Sid", "Strong"],
        [5, "Jane", "Neat"]
      ],
      colHeaders: true,
      rowHeaders: true,
      columnSorting: true
    });

    this.sortByColumn(0);

    expect(getDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getDataAtCol(1)).toEqual(["Ted", "Frank", "Joan", "Sid", "Jane"]);

    this.sortByColumn(0);

    expect(getDataAtCol(0)).toEqual([5, 4, 3, 2, 1]);
    expect(getDataAtCol(1)).toEqual(["Jane", "Sid",  "Joan", "Frank", "Ted"]);

    this.sortByColumn(0);

    expect(getDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getDataAtCol(1)).toEqual(["Ted", "Frank", "Joan", "Sid", "Jane"]);
  });


  it('should return original data source at specyfied row after sorted', function () {
    var hot = handsontable({
      data:  [
        [1, "Ted", "Right"],
        [2, "Frank", "Honest"],
        [3, "Joan", "Well"],
        [4, "Sid", "Strong"],
        [5, "Jane", "Neat"]
      ],
      colHeaders: true,
      rowHeaders: true,
      columnSorting: true
    });

    this.sortByColumn(0);

    expect(getDataAtRow(0)).toEqual([1, "Ted", "Right"]);
    expect(getDataAtRow(4)).toEqual([5, "Jane", "Neat"]);

    expect(getSourceDataAtRow(0)).toEqual([1, "Ted", "Right"]);
    expect(getSourceDataAtRow(4)).toEqual([5, "Jane", "Neat"]);

    this.sortByColumn(0);

    expect(getDataAtRow(0)).toEqual([5, "Jane", "Neat"]);
    expect(getDataAtRow(4)).toEqual([1, "Ted", "Right"]);

    expect(getSourceDataAtRow(0)).toEqual([1, "Ted", "Right"]);
    expect(getSourceDataAtRow(4)).toEqual([5, "Jane", "Neat"]);

  });

  it('should return original data source at specyfied col after sorted', function () {
    var hot = handsontable({
      data:  [
        [1, "Ted", "Right"],
        [2, "Frank", "Honest"],
        [3, "Joan", "Well"],
        [4, "Sid", "Strong"],
        [5, "Jane", "Neat"]
      ],
      colHeaders: true,
      rowHeaders: true,
      columnSorting: true
    });

    this.sortByColumn(0);

    expect(getDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getDataAtCol(1)).toEqual(["Ted", "Frank", "Joan", "Sid", "Jane"]);

    expect(getSourceDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getSourceDataAtCol(1)).toEqual(["Ted", "Frank", "Joan", "Sid", "Jane"]);

    this.sortByColumn(0);

    expect(getDataAtCol(0)).toEqual([5, 4, 3, 2, 1]);
    expect(getDataAtCol(1)).toEqual(["Jane", "Sid",  "Joan", "Frank", "Ted"]);

    expect(getSourceDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getSourceDataAtCol(1)).toEqual(["Ted", "Frank", "Joan", "Sid", "Jane"]);

    this.sortByColumn(0);

    expect(getDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getDataAtCol(1)).toEqual(["Ted", "Frank", "Joan", "Sid", "Jane"]);

    expect(getSourceDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    expect(getSourceDataAtCol(1)).toEqual(["Ted", "Frank", "Joan", "Sid", "Jane"]);
  });

  it("should ignore case when sorting", function () {
    var hot = handsontable({
      data: [
        [1, "albuquerque"],
        [2, "Alabama"],
        [3, "Missouri"]
      ],
      colHeaders: true,
      columnSorting: true
    });

    this.sortByColumn(1);
    expect(getDataAtCol(0)).toEqual([2, 1, 3]);
    expect(getDataAtCol(1)).toEqual(["Alabama", "albuquerque", "Missouri"]);

    this.sortByColumn(1);
    expect(getDataAtCol(0)).toEqual([3, 1, 2]);
    expect(getDataAtCol(1)).toEqual(["Missouri", "albuquerque", "Alabama"]);

  });

  it("should push empty cells to the end of sorted column", function () {
    var hot = handsontable({
      data:  [
        [1, "Ted", "Right"],
        [2, "", "Honest"],
        [3, "", "Well"],
        [4, "Sid", "Strong"],
        [5, "Jane", "Neat"],
      ],
      colHeaders: true,
      rowHeaders: true,
      columnSorting: true,
      minSpareRows: 1
    });

    this.sortByColumn(1);
    expect(getDataAtCol(0)).toEqual([5, 4, 1, 2, 3, null]);
    expect(getDataAtCol(1)).toEqual(["Jane", "Sid", "Ted", "", "", null]);

    this.sortByColumn(1);
    expect(getDataAtCol(0)).toEqual([1, 4, 5, 2, 3, null]);
    expect(getDataAtCol(1)).toEqual(["Ted", "Sid", "Jane", "", "", null]);

  });
});
