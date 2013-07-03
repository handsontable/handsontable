describe('ColumnSorting', function () {
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

  it('should sort numbers descending after 2 clicks on table header', function () {
    handsontable({
      data: arrayOfObjects(),
      colHeaders: true,
      columnSorting: true
    });

    this.$container.find('th span.columnSorting').first().click();
    this.$container.find('th span.columnSorting').first().click();

    expect(this.$container.find('tr td').first().html()).toEqual('10');
  });

  it('should remove specified row from sorted table', function(){
    var hot = handsontable({
      data: [
        [1, 'B'],
        [3, 'D'],
        [0, 'A'],
        [2, 'C']
      ],
      colHeaders: true,
      columnSorting: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B');

    this.$container.find('th span.columnSorting').first().click();

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A');

    expect(this.$container.find('tbody tr').length).toEqual(4);

    hot.alter('remove_row', 0);

    expect(this.$container.find('tbody tr').length).toEqual(3);
    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B');
  });

  it('should add an empty row to sorted table', function(){
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

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');

    this.$container.find('th span.columnSorting').first().click();

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');

    expect(this.$container.find('tbody tr').length).toEqual(4);

    hot.alter('insert_row', 0);

    expect(this.$container.find('tbody tr').length).toEqual(5);
  });

  it('should add an empty row to sorted table and place it at the bottom', function(){
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

    this.$container.find('th span.columnSorting').first().click();

    expect(this.$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('');

    hot.alter('insert_row', 0);

    expect(this.$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('');
    expect(this.$container.find('tbody tr:eq(5) td:eq(0)').text()).toEqual('');
  });

  it('should sort the table after value update in sorted column', function(){
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

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');

    this.$container.find('th span.columnSorting').first().click();
    this.$container.find('th span.columnSorting').first().click();

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');

    hot.setDataAtCell(1, 0, 20);

    var rendered = false;

    Handsontable.PluginHooks.add('afterRender', function(){
      rendered = true;
    });

    waitsFor(function(){
      return rendered;
    }, 'Table to render', 1000);

    runs(function(){
      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('20');
    });



  });

  it('should sort the table after value update in sorted column and move the selection', function(){
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

    this.$container.find('th span.columnSorting').first().click();
    this.$container.find('th span.columnSorting').first().click();

    hot.selectCell(1, 0);

    var selected = hot.getSelected();

    expect(selected[0]).toEqual(1)
    expect(selected[1]).toEqual(0)

    hot.setDataAtCell(1, 0, 20);

    var rendered = false;

    Handsontable.PluginHooks.add('afterRender', function(){
      rendered = true;
    });

    waitsFor(function(){
      return rendered;
    }, 'Table to render', 1000);

    runs(function(){
      selected = hot.getSelected();

      expect(selected[0]).toEqual(0)
      expect(selected[1]).toEqual(0)
    });
  });
});