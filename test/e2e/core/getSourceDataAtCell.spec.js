describe('Core.getSourceDataAtCell', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return null when is call without arguments', () => {
    handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
    });

    expect(getSourceDataAtCell()).toBeNull();
  });

  it('should return cell value when provided data was an array of arrays', () => {
    handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
    });

    expect(getSourceDataAtCell(1, 1)).toEqual('b');
  });

  it('should return cell value when provided data was an array of objects', () => {
    handsontable({
      data: [{ a: 1, b: 2, c: 3 }, { a: 'a', b: 'b', c: 'c' }],
      copyable: true
    });

    expect(getSourceDataAtCell(1, 'b')).toEqual('b');
  });

  it('should return cell value when provided data was an array of objects (nested structure)', () => {
    handsontable({
      data: [{ a: 1, b: { a: 21, b: 22 }, c: 3 }, { a: 'a', b: { a: 'ba', b: 'bb' }, c: 'c' }],
      columns: [
        { data: 'a' },
        { data: 'b.a' },
        { data: 'b.b' },
        { data: 'c' },
      ]
    });

    expect(getSourceDataAtCell(1, 'b.b')).toEqual('bb');
  });

  it('should return cell value when data is provided by dataSchema', () => {
    handsontable({
      data: [
        model({ id: 1, name: 'Ted Right', address: '' }),
        model({ id: 2, name: 'Frank Honest', address: '' }),
        model({ id: 3, name: 'Joan Well', address: '' }),
        model({ id: 4, name: 'Gail Polite', address: '' }),
        model({ id: 5, name: 'Michael Fair', address: '' })
      ],
      dataSchema: model,
      columns: [
        { data: property('id') },
        { data: property('name') },
        { data: property('address') }
      ]
    });

    function model(opts) {
      const _pub = {};
      const _priv = {
        id: undefined,
        name: undefined,
        address: undefined
      };

      Handsontable.helper.objectEach(opts, (value, key) => {
        _priv[key] = value;
      });

      _pub.attr = function(attr, val) {
        if (typeof val === 'undefined') {
          return _priv[attr];
        }
        _priv[attr] = val;

        return _pub;
      };

      return _pub;
    }

    function property(attr) {
      return function(row, value) {
        return row.attr(attr, value);
      };
    }

    expect(getSourceDataAtCell(1, 1)).toEqual('Frank Honest');
  });

  describe('`modifyRowData` hook', () => {
    it('should be possible to change data for row on the fly ', () => {
      handsontable({
        data: [
          ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
          ['2008', 10, 11, 12, 13],
          ['2009', 20, 11, 14, 13],
          ['2010', 30, 15, 12, 13]
        ],
        modifyRowData(row) {
          const newDataset = [];

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
