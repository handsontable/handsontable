describe('Core.valueParser', () => {
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

  it('should be called once after the user finishes editing', async() => {
    const valueParser = jasmine.createSpy('valueParser');

    handsontable({
      data: createSpreadsheetData(1, 1),
      valueParser,
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    keyProxy().val('test');

    await keyDownUp('enter');

    expect(valueParser).toHaveBeenCalledTimes(1);
    expect(valueParser).toHaveBeenCalledWith('test', getCellMeta(0, 0));
  });

  it('should overwrite value that comes from the editor', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2),
      valueParser(value, cellMeta) {
        const { row, col } = cellMeta;

        if (row === 0 && col === 0) {
          return value * 2;
        }

        if (row === 1 && col === 1) {
          return value * 3;
        }

        return value;
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    keyProxy().val('123');

    await keyDownUp('enter');
    await waitForNextAnimationFrames(1);

    await selectCell(1, 1);
    await keyDownUp('enter');

    keyProxy().val('222');

    await keyDownUp('enter');
    await waitForNextAnimationFrames(1);

    expect(getData()).toEqual([
      [246, 'B1'],
      ['A2', 666],
    ]);
    expect(getSourceData()).toEqual([
      [246, 'B1'],
      ['A2', 666],
    ]);
  });
});
