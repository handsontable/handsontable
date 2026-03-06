describe('UndoRedo -> Filters action', () => {
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

  it('should have defined correct action properties', async() => {
    const afterUndo = jasmine.createSpy('afterUndo');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      filters: true,
      afterUndo,
    });

    getPlugin('filters').addCondition(1, 'begins_with', ['c']);
    getPlugin('filters').filter();
    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'filter',
      conditionsStack: [{
        column: 1,
        operation: 'conjunction',
        conditions: [{
          name: 'begins_with',
          args: ['c']
        }]
      }],
      previousConditionsStack: [],
    });
  });
});
