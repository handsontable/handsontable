describe('Core.setSourceDataAtCell', () => {
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

  it('should set the provided value in the source data set', () => {
    handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']]
    });

    setSourceDataAtCell(0, 0, 'foo');

    expect(getSourceData()[0][0]).toEqual('foo');

    loadData([{ foo: 'bar' }]);

    expect(getSourceData()[0].foo).toEqual('bar');

    setSourceDataAtCell(0, 'foo', 'foo');

    expect(getSourceData()[0].foo).toEqual('foo');
  });

  it('should set the provided value in the source data set, using the physical coordinates', () => {
    handsontable({
      data: [
        { foo: 'bar', lorem: 'ipsum' },
        { foo: 'lorem', lorem: 'sit' },
        { foo: 'dolor', lorem: 'amet' }
      ],
      manualRowMove: [1, 0],
      manualColumnMove: [1, 0],
      trimRows: [0]
    });

    setSourceDataAtCell(0, 'lorem', 'foo');

    expect(getSourceData()[0].lorem).toEqual('foo');
    expect(getSourceData()[1].lorem).toEqual('sit');
    expect(getSourceData()[2].lorem).toEqual('amet');
  });

  it('should throw the `modifySourceData` hook (with the `set` argument) when calling the `setSourceDataAtCell` method', () => {
    const argumentHistory = [];

    handsontable({
      data: [
        { foo: 'bar', lorem: 'ipsum' },
        { foo: 'lorem', lorem: 'sit' },
        { foo: 'dolor', lorem: 'amet' }
      ],
      modifySourceData: (row, prop, valueHolder, ioMode) => {
        if (ioMode === 'set') {
          argumentHistory.push([row, prop, valueHolder, ioMode]);
        }
      }
    });

    setSourceDataAtCell(0, 'foo', 'foo2');

    expect(argumentHistory[0][0]).toEqual(0);
    expect(argumentHistory[0][1]).toEqual(0);
    expect(argumentHistory[0][2].value).toEqual('foo2');
    expect(argumentHistory[0][3]).toEqual('set');
  });

  it('should be possible to change the value being saved using the `modifySourceData` hook', () => {
    handsontable({
      data: [
        { foo: 'bar', lorem: 'ipsum' },
        { foo: 'lorem', lorem: 'sit' },
        { foo: 'dolor', lorem: 'amet' }
      ],
      modifySourceData: (row, prop, valueHolder) => {
        valueHolder.value = 'CHANGED';
      }
    });

    setSourceDataAtCell(0, 'foo', 'foo2');

    expect(getSourceData()[0].foo).toEqual('CHANGED');
  });

  it('should run the `afterSetSourceDataAtCell` hook', () => {
    const afterSetSourceDataAtCellSpy = jasmine.createSpy('afterSetSourceDataAtCell');

    handsontable({
      data: [
        { foo: 'bar', lorem: 'ipsum' },
        { foo: 'lorem', lorem: 'sit' },
        { foo: 'dolor', lorem: 'amet' }
      ],
      afterSetSourceDataAtCell: afterSetSourceDataAtCellSpy
    });

    setSourceDataAtCell(0, 'foo', 'foo2');

    let hookArguments = new Array(6).fill(void 0);
    hookArguments[0] = [[0, 'foo', 'bar', 'foo2']];

    expect(afterSetSourceDataAtCellSpy).toHaveBeenCalledWith(...hookArguments);

    afterSetSourceDataAtCellSpy.calls.reset();

    setSourceDataAtCell([[0, 'lorem', 'changed1'], [1, 'foo', 'changed2']]);

    hookArguments = new Array(6).fill(void 0);
    hookArguments[0] = [[0, 'lorem', 'ipsum', 'changed1'], [1, 'foo', 'lorem', 'changed2']];

    expect(afterSetSourceDataAtCellSpy).toHaveBeenCalledWith(...hookArguments);
  });
});
