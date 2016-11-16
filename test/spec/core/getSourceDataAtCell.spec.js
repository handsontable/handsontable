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

  it("should return cell value when data is provided by dataSchema", function () {
    handsontable({
      data: [
        model({id: 1, name: 'Ted Right', address: ''}),
        model({id: 2, name: 'Frank Honest', address: ''}),
        model({id: 3, name: 'Joan Well', address: ''}),
        model({id: 4, name: 'Gail Polite', address: ''}),
        model({id: 5, name: 'Michael Fair', address: ''})
      ],
      dataSchema: model,
      columns: [
        {data: property('id')},
        {data: property('name')},
        {data: property('address')}
      ]
    });

    function model(opts) {
      var
        _pub = {},
        _priv = {
          "id": undefined,
          "name": undefined,
          "address": undefined
        };

      for (var i in opts) {
        if (opts.hasOwnProperty(i)) {
          _priv[i] = opts[i];
        }
      }

      _pub.attr = function (attr, val) {
        if (typeof val === 'undefined') {
          return _priv[attr];
        }
        _priv[attr] = val;

        return _pub;
      };

      return _pub;
    }

    function property(attr) {
      return function (row, value) {
        return row.attr(attr, value);
      }
    }

    expect(getSourceDataAtCell(1, 1)).toEqual('Frank Honest');
  });

  describe('`modifyRowData` hook', function () {
    it('should be possible to change data for row on the fly ', function () {
      handsontable({
        data: [
          ["", "Kia", "Nissan", "Toyota", "Honda"],
          ["2008", 10, 11, 12, 13],
          ["2009", 20, 11, 14, 13],
          ["2010", 30, 15, 12, 13]
        ],
        modifyRowData: function(row) {
          var newDataset = [];

          if (row === 1) {
            newDataset.push('2016', 0, 0, 0, 0);
          }

          return newDataset.length ? newDataset : void 0;
        }
      });

      expect(getSourceDataAtCell(1, 0)).toEqual('2016');
    });
  });
});
