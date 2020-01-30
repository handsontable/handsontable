describe('Core.setSourceDataAtRowPropProp', () => {
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

  describe('single change', () => {
    it('should set the passed value at the provided row/prop coordinates (with the data being an array of arrays)', () => {
      handsontable({
        data: [[1, 2, 3], ['a', 'b', 'c']]
      });

      setSourceDataAtRowProp(0, 1, 'it worked!');

      expect(getSourceDataAtCell(0, 1)).toEqual('it worked!');
    });

    it('should set the passed value at the provided row/prop coordinates (with the data being an array of objects)', () => {
      handsontable({
        data: [
          {
            a: 1,
            b: 2
          },
          {
            a: 'test',
            b: 'another test'
          }]
      });

      setSourceDataAtRowProp(0, 'b', 'it worked!');

      expect(getSourceDataAtCell(0, 1)).toEqual('it worked!');
      expect(getSourceDataAtCell(0, 'b')).toEqual('it worked!');
    });

    it('should set the passed value at the provided row/prop coordinates (with the data being an array of objects, on an unused property name)', () => {
      handsontable({
        data: [
          {
            a: 1,
            b: 2
          },
          {
            a: 'test',
            b: 'another test'
          }],
        columns: [
          {
            data: 'a'
          },
          {
            data: 'c'
          }
        ]
      });

      setSourceDataAtRowProp(0, 'c', 'it worked!');

      expect(getSourceDataAtCell(0, 1)).toEqual('it worked!');
      expect(getSourceDataAtCell(0, 'c')).toEqual('it worked!');
    });

    it('should set the passed value at the provided row/prop coordinates (with the data being an array of objects and prop being a nested structure)', () => {
      handsontable({
        data: [
          {
            a: 1,
            b: {
              c: 2
            }
          },
          {
            a: 'test',
            b: {
              c: 'another test'
            }
          }],
        columns: [
          {
            data: 'a'
          },
          {
            data: 'b.c'
          }
        ]
      });

      setSourceDataAtRowProp(0, 'b.c', 'it worked!');

      expect(getSourceDataAtCell(0, 1)).toEqual('it worked!');
      expect(getSourceDataAtCell(0, 'b.c')).toEqual('it worked!');
    });

    it('should set the passed value at the provided row/prop coordinates (with the data being an array of objects and prop being an unused nested structure)', () => {
      handsontable({
        data: [
          {
            a: 1
          },
          {
            a: 'test'
          }],
        columns: [
          {
            data: 'a'
          },
          {
            data: 'b.c'
          }
        ]
      });

      setSourceDataAtRowProp(0, 'b.c', 'it worked!');

      expect(getSourceDataAtCell(0, 1)).toEqual('it worked!');
      expect(getSourceDataAtCell(0, 'b.c')).toEqual('it worked!');
    });
  });

  describe('batch change', () => {
    it('should apply the changes passed in the first argument (using the array of arrays dataset)', () => {
      handsontable({
        data: [[1, 2, 3], ['a', 'b', 'c']]
      });

      setSourceDataAtRowProp([[0, 0, 'it'], [1, 1, 'worked!']]);

      expect(getSourceDataAtCell(0, 0)).toEqual('it');
      expect(getSourceDataAtCell(1, 1)).toEqual('worked!');
    });

    it('should apply the changes passed in the first argument (using the array of objects dataset)', () => {
      handsontable({
        data: [
          {
            a: 1,
            b: 2
          },
          {
            a: 3,
            b: 4
          }]
      });

      setSourceDataAtRowProp([[0, 'a', 'it'], [1, 'b', 'worked!']]);

      expect(getSourceDataAtCell(0, 0)).toEqual('it');
      expect(getSourceDataAtCell(1, 1)).toEqual('worked!');

      expect(getSourceDataAtCell(0, 'a')).toEqual('it');
      expect(getSourceDataAtCell(1, 'b')).toEqual('worked!');
    });

    it('should apply the changes passed in the first argument on unused props and rows (using the array of objects dataset)', () => {
      handsontable({
        data: [
          {
            a: 1,
            b: 2
          },
          {
            a: 3,
            b: 4
          }],
        columns: [
          {
            data: 'c'
          },
          {
            data: 'd'
          }]
      });

      setSourceDataAtRowProp([[0, 'c', 'it'], [1, 'd', 'worked!']]);

      expect(getSourceDataAtCell(0, 'c')).toEqual('it');
      expect(getSourceDataAtCell(1, 'd')).toEqual('worked!');

      expect(getSourceDataAtCell(0, 0)).toEqual('it');
      expect(getSourceDataAtCell(1, 1)).toEqual('worked!');
    });
  });
});
