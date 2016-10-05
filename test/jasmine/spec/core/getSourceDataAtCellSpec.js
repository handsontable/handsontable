describe('Core.getSourceDataAtCell', function () {
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

  it('should return null when is call without arguments', function () {
    handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
    });

    expect(getSourceDataAtCell()).toBeNull();
  });

  it('should return cell value when provided data was an array of arrays', function () {
    handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
    });

    expect(getSourceDataAtCell(1, 1)).toEqual('b');
  });

  it('should return cell value when provided data was an array of objects', function () {
    handsontable({
      data: [{a: 1, b: 2, c: 3}, {a: 'a', b: 'b', c: 'c'}],
      copyable: true
    });

    expect(getSourceDataAtCell(1, 'b')).toEqual('b');
  });

  it('should return cell value when provided data was an array of objects (nested structure)', function () {
    handsontable({
      data: [{a: 1, b: {a: 21, b: 22}, c: 3}, {a: 'a', b: {a: 'ba', b: 'bb'}, c: 'c'}],
      columns: [
        {data: 'a'},
        {data: 'b.a'},
        {data: 'b.b'},
        {data: 'c'},
      ]
    });

    expect(getSourceDataAtCell(1, 'b.b')).toEqual('bb');
  });
});
