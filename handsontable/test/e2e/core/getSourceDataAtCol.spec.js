describe('Core.getSourceDataAtCol', () => {
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

  it('should return col values when data is provided by dataSchema', () => {
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

    expect(getSourceDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
  });
});
