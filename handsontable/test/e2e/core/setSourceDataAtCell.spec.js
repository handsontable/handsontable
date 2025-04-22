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

  it('should set the provided value in the source data set', async() => {
    handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']]
    });

    await setSourceDataAtCell(0, 0, 'foo');

    expect(getSourceData()[0][0]).toBe('foo');

    await loadData([{ foo: 'bar' }]);

    expect(getSourceData()[0].foo).toBe('bar');

    await setSourceDataAtCell(0, 'foo', 'foo');

    expect(getSourceData()[0].foo).toBe('foo');
  });

  it('should set the provided value in the source data set, using the physical coordinates', async() => {
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

    await setSourceDataAtCell(0, 'lorem', 'foo');

    expect(getSourceData()[0].lorem).toBe('foo');
    expect(getSourceData()[1].lorem).toBe('sit');
    expect(getSourceData()[2].lorem).toBe('amet');
  });

  it('should trigger table render cycle after changing the data', async() => {
    const hot = handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
    });

    spyOn(hot, 'render').and.callThrough();

    await setSourceDataAtCell(0, 1, 'foo');

    expect(hot.render).toHaveBeenCalled();
  });

  it('should call "refreshValue" method of the active editor when new data is set', async() => {
    handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
    });

    await selectCell(0, 1);
    await keyDownUp('enter');

    spyOn(getActiveEditor(), 'refreshValue').and.callThrough();

    await setSourceDataAtCell(0, 1, 'foo');

    expect(getActiveEditor().refreshValue).toHaveBeenCalled();
  });

  it('should throw the `modifySourceData` hook (with the `set` argument) when calling the `setSourceDataAtCell` method', async() => {
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

    await setSourceDataAtCell(0, 'foo', 'foo2');

    expect(argumentHistory[0][0]).toEqual(0);
    expect(argumentHistory[0][1]).toEqual('foo');
    expect(argumentHistory[0][2].value).toEqual('foo2');
    expect(argumentHistory[0][3]).toEqual('set');
  });

  it('should be possible to change the value being saved using the `modifySourceData` hook', async() => {
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

    await setSourceDataAtCell(0, 'foo', 'foo2');

    expect(getSourceData()[0].foo).toEqual('CHANGED');
  });

  it('should run the `afterSetSourceDataAtCell` hook', async() => {
    const afterSetSourceDataAtCellSpy = jasmine.createSpy('afterSetSourceDataAtCell');

    handsontable({
      data: [
        { foo: 'bar', lorem: 'ipsum' },
        { foo: 'lorem', lorem: 'sit' },
        { foo: 'dolor', lorem: 'amet' }
      ],
      afterSetSourceDataAtCell: afterSetSourceDataAtCellSpy
    });

    await setSourceDataAtCell(0, 'foo', 'foo2', 'caller-custom-source');

    expect(afterSetSourceDataAtCellSpy).toHaveBeenCalledWith([[0, 'foo', 'bar', 'foo2']], 'caller-custom-source');

    afterSetSourceDataAtCellSpy.calls.reset();

    await setSourceDataAtCell([[0, 'lorem', 'changed1'], [1, 'foo', 'changed2']]);

    expect(afterSetSourceDataAtCellSpy).toHaveBeenCalledWith([
      [0, 'lorem', 'ipsum', 'changed1'],
      [1, 'foo', 'lorem', 'changed2']
    ]);
  });

  it('should be possible to change the data source by passing an array of changes and a string as row value (dataset as array of arrays)', async() => {
    const changesList = [
      ['0', '0', 'a'], ['0', '1', 'b'], ['0', '2', 'c'],
    ];

    handsontable({
      data: createEmptySpreadsheetData(1, 3)
    });

    await setSourceDataAtCell(changesList);

    expect(getSourceData()).toEqual([['a', 'b', 'c']]);
  });

  it('should be possible to change the data source by passing an array of changes and a string as row value (dataset as array of objects)', async() => {
    const changesList = [
      ['0', 'id', 'a'], ['0', 'name', 'b'], ['0', 'address', 'c'],
    ];

    handsontable({
      data: { id: 1, name: 'Ted Right', address: '' }
    });

    await setSourceDataAtCell(changesList);

    expect(getSourceData()).toEqual([{ id: 'a', name: 'b', address: 'c' }]);
  });

  it('should not replace the source value for row values as a `__proto__`, `constructor`, `prototype` with array of arrays data source', async() => {
    const changesList = [
      ['__proto__', '0', 'a'], ['constructor', '1', 'b'], ['prototype', '2', 'c'],
    ];

    handsontable({
      data: createEmptySpreadsheetData(1, 3)
    });

    await setSourceDataAtCell(changesList);

    expect(getSourceData()).toEqual([['', '', '']]);
  });

  it('should not replace the source value for row values as a `__proto__`, `constructor`, `prototype` with array of object data source', async() => {
    const changesList = [
      ['__proto__', 'id', 'a'], ['constructor', 'name', 'b'], ['prototype', 'address', 'c'],
    ];

    handsontable({
      data: { id: 1, name: 'Ted Right', address: '' }
    });

    await setSourceDataAtCell(changesList);

    expect(getSourceData()).toEqual([{ id: 1, name: 'Ted Right', address: '' }]);
  });
});
