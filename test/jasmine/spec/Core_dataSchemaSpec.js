describe('Core_dataSchema', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
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

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDownUp('enter');
      keyProxy().val('Ted');
      keyDownUp('enter', keyProxy());
      expect(getData()[0].name.first).toEqual('Ted');
    });
  });
});