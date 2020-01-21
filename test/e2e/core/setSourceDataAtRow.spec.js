describe('Core.setSourceDataAtRow', () => {
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

    setSourceDataAtRow(0, [4, 5, 6]);

    expect(getSourceDataAtRow(0)).toEqual([4, 5, 6]);

    loadData([{ foo: 'bar' }]);

    setSourceDataAtRow(0, { foo: 'test' });

    expect(getSourceDataAtRow(0)).toEqual({ foo: 'test' });
  });

  it('should set the provided value in the source data set, using the physical coordinates', () => {
    handsontable({
      data: [
        { foo: 'bar', lorem: 'ipsum' },
        { foo: 'lorem', lorem: 'sit' },
        { foo: 'dolor', lorem: 'amet' }
      ],
      manualRowMove: [1, 0],
      trimRows: [0]
    });

    setSourceDataAtRow(0, { foo: 'test', lorem: 'test2' });

    expect(getSourceData()[0]).toEqual({ foo: 'test', lorem: 'test2' });
    expect(getSourceData()[1]).toEqual({ foo: 'lorem', lorem: 'sit' });
    expect(getSourceData()[2]).toEqual({ foo: 'dolor', lorem: 'amet' });

  });

  it('should throw the `modifySourceData` hook (with the `set` argument) when calling the `setSourceDataAtRow` method ' +
    'as many times as there are columns in the dataset', () => {
    const argumentHistory = [];

    handsontable({
      data: [
        { foo: 'bar', lorem: 'ipsum' },
        { foo: 'lorem', lorem: 'sit' },
        { foo: 'dolor', lorem: 'amet' }
      ],
      modifySourceData: (row, prop, valueHolder, ioMode) => {
        argumentHistory.push([row, prop, valueHolder, ioMode]);
      }
    });

    setSourceDataAtRow(0, { foo: 'test', lorem: 'test2' });

    expect(argumentHistory[0][0]).toEqual(0);
    expect(argumentHistory[0][1]).toEqual(0);
    expect(argumentHistory[0][2].value).toEqual('test');
    expect(argumentHistory[0][3]).toEqual('set');

    expect(argumentHistory[1][0]).toEqual(0);
    expect(argumentHistory[1][1]).toEqual(1);
    expect(argumentHistory[1][2].value).toEqual('test2');
    expect(argumentHistory[1][3]).toEqual('set');
  });

  it('should be possible to change the values being saved using the `modifySourceData` hook', () => {
    handsontable({
      data: [
        { foo: 'bar', lorem: 'ipsum' },
        { foo: 'lorem', lorem: 'sit' },
        { foo: 'dolor', lorem: 'amet' }
      ],
      modifySourceData: (row, prop, valueHolder) => {
        valueHolder.value = `CHANGED-${prop}`;
      }
    });

    setSourceDataAtRow(0, { foo: '---', lorem: '---' });

    expect(getSourceData()[0]).toEqual({ foo: 'CHANGED-foo', lorem: 'CHANGED-lorem' });
  });
});
