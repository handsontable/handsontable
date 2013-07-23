describe('ColumnSorting', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');

    this.sortByColumn = function(columnIndex){
      this.$container.find('th span.columnSorting:eq(' + columnIndex + ')').click();
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



  it('should sort table by first visible column', function(){
    this.$container.width(350);
    var hot = handsontable({
      data: [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [9, 8, 7, 6, 5, 4, 3, 2, 1],
        [8, 7, 6, 5, 4, 3, 3, 1, 9],
        [2, 3, 0, 5, 6, 7, 8, 9, 1]
      ],
      colHeaders: true,
      columnSorting: true
    });

    hot.selectCell(0, 7);
    var selected = hot.getSelected();

    expect(hot.getDataAtCell(selected[0], selected[1])).toEqual(8);
    expect(hot.colOffset()).toEqual(2);

    this.sortByColumn(0);

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('0');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('5');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('6');
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

    this.sortByColumn(0);

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

    this.sortByColumn(0);

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

    this.sortByColumn(0);

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

    this.sortByColumn(0);
    this.sortByColumn(0);

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

    this.sortByColumn(0);
    this.sortByColumn(0);

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

      expect(selected[0]).toEqual(0);
      expect(selected[1]).toEqual(0);
    });
  });

  it('should sort date columns', function(){

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

    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toMatch(/01\/14\/2006/);

    this.$container.find('th span.columnSorting:eq(2)').click();  // DESC sort after first click

    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toMatch(/02\/02\/2004/);

    this.$container.find('th span.columnSorting:eq(2)').click();  // ASC sort after second click

    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toMatch(/11\/19\/2011/);


  });

  it('should sort table with multiple row headers', function(){

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

  it('should allow to define sorting column and order during initialization', function(){
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

  it('should allow to change sorting column with updateSettings', function(){
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

  it('should allow to change sorting order with updateSettings', function(){
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

});