describe('Core.setDataAtCell', () => {
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

  it('should set the provided value in the dataset', async() => {
    handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']]
    });

    await setDataAtCell(0, 0, 'foo');

    expect(getDataAtCell(0, 0)).toBe('foo');
  });

  it('should trigger table render cycle after changing the data', async() => {
    const hot = handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
    });

    spyOn(hot.view, 'render').and.callThrough();

    await setDataAtCell(0, 1, 'foo');

    expect(hot.view.render).toHaveBeenCalled();
  });

  it('should call "refreshValue" method of the active editor when new data is set', async() => {
    handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
    });

    await selectCell(0, 1);
    await keyDownUp('enter');

    spyOn(getActiveEditor(), 'refreshValue').and.callThrough();

    await setDataAtCell(0, 1, 'foo');

    expect(getActiveEditor().refreshValue).toHaveBeenCalled();
  });

  it('should call the `modifySourceData` hook (with the `set` argument)', async() => {
    const argumentHistory = [];

    handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
      modifyData: (row, prop, valueHolder, ioMode) => {
        if (ioMode === 'set') {
          argumentHistory.push([row, prop, valueHolder, ioMode]);
        }
      }
    });

    await setDataAtCell(0, 1, 'foo');

    expect(argumentHistory[0][0]).toBe(0);
    expect(argumentHistory[0][1]).toBe(1);
    expect(argumentHistory[0][2].value).toBe('foo');
    expect(argumentHistory[0][3]).toBe('set');
  });

  it('should be possible to change the value being saved using the `modifyData` hook', async() => {
    handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
      modifyData: (row, prop, valueHolder) => {
        valueHolder.value = 'CHANGED';
      }
    });

    await setDataAtCell(0, 1, 'foo');

    expect(getDataAtCell(0, 1)).toEqual('CHANGED');
  });

  it('should trigger the `beforeChange` and `afterChange` hooks with all arguments', async() => {
    const beforeChange = jasmine.createSpy('beforeChange');
    const afterChange = jasmine.createSpy('afterChange');

    handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
      beforeChange,
      afterChange,
    });

    beforeChange.calls.reset();
    afterChange.calls.reset();
    await setDataAtCell(0, 1, 'foo', 'single-change');

    expect(beforeChange).toHaveBeenCalledWith([[0, 1, 2, 'foo']], 'single-change');
    expect(afterChange).toHaveBeenCalledWith([[0, 1, 2, 'foo']], 'single-change');

    beforeChange.calls.reset();
    afterChange.calls.reset();

    await setDataAtCell([[0, 1, 'foo2']], 'multiple-change');

    expect(beforeChange).toHaveBeenCalledWith([[0, 1, 'foo', 'foo2']], 'multiple-change');
  });
});
