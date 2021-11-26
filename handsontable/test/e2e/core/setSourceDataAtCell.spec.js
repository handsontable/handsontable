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

    expect(getSourceData()[0][0]).toBe('foo');

    loadData([{ foo: 'bar' }]);

    expect(getSourceData()[0].foo).toBe('bar');

    setSourceDataAtCell(0, 'foo', 'foo');

    expect(getSourceData()[0].foo).toBe('foo');
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

    expect(getSourceData()[0].lorem).toBe('foo');
    expect(getSourceData()[1].lorem).toBe('sit');
    expect(getSourceData()[2].lorem).toBe('amet');
  });

  it('should trigger table render cycle after changing the data', () => {
    const hot = handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
    });

    spyOn(hot, 'render').and.callThrough();

    setSourceDataAtCell(0, 1, 'foo');

    expect(hot.render).toHaveBeenCalled();
  });

  it('should call "refreshValue" method of the active editor when new data is set', () => {
    const hot = handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
    });

    selectCell(0, 1);
    keyDown('enter');

    spyOn(hot.getActiveEditor(), 'refreshValue').and.callThrough();

    setSourceDataAtCell(0, 1, 'foo');

    expect(hot.getActiveEditor().refreshValue).toHaveBeenCalled();
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

    setSourceDataAtCell(0, 'foo', 'foo2', 'caller-custom-source');

    expect(afterSetSourceDataAtCellSpy).toHaveBeenCalledWith([[0, 'foo', 'bar', 'foo2']], 'caller-custom-source');

    afterSetSourceDataAtCellSpy.calls.reset();

    setSourceDataAtCell([[0, 'lorem', 'changed1'], [1, 'foo', 'changed2']]);

    expect(afterSetSourceDataAtCellSpy).toHaveBeenCalledWith([
      [0, 'lorem', 'ipsum', 'changed1'],
      [1, 'foo', 'lorem', 'changed2']
    ]);
  });
});
