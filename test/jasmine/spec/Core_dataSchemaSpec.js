describe('Core_dataSchema', function () {
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

  it('should create new row from dataSchema', function () {
    handsontable({
      data: [],
      dataSchema: {id: null, name: {first: null, last: null}, address: null},
      minRows: 5,
      minCols: 4,
      colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
      columns: [
        {data: "id"},
        {data: "name.first"},
        {data: "name.last"},
        {data: "address"}
      ],
      minSpareRows: 1
    });
    selectCell(0, 1);

    keyDownUp('enter');
    keyProxy().val('Ted');
    keyDownUp('enter');
    expect(getData()[0].name.first).toEqual('Ted');
  });

  it('should create new row from dataSchema (functional)', function () {
    handsontable({
      data: [],
      dataSchema: function (index) {
        return {id: 1000 + index, name: {first: null, last: null}, address: null}
      },
      isEmptyRow: function (r) {
        var row = this.getData()[r];
        return (
          (row.name.first === null || row.name.first === '')
            && (row.name.last === null || row.name.last === '')
            && (row.address === null || row.address === '')
          )
      },
      minRows: 5,
      minCols: 4,
      colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
      columns: [
        {data: "id"},
        {data: "name.first"},
        {data: "name.last"},
        {data: "address"}
      ],
      minSpareRows: 1
    });
    selectCell(4, 1);

    expect(countRows()).toEqual(5);
    keyDownUp('enter');
    keyProxy().val('Ted');

    //need it in next frame as long as HT is rendered in async
    keyDownUp('enter');

    //need it in next frame as long as HT is rendered in async
    keyDownUp('enter');
    expect(getData()[4].name.first).toEqual('Ted');
    expect(getData()[4].id).toEqual(1004);
    expect(countRows()).toEqual(6); //row should be added by keepEmptyRows
  });
});