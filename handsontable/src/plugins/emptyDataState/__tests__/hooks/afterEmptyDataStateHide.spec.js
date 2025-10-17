describe('EmptyDataState - afterEmptyDataStateHide hook', () => {
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

  it('should run afterEmptyDataStateHide hook', async() => {
    const afterEmptyDataStateHideSpy = jasmine.createSpy('afterEmptyDataStateHide');

    handsontable({
      data: [],
      emptyDataState: true,
      afterEmptyDataStateHide: afterEmptyDataStateHideSpy,
    });

    hot().updateSettings({
      data: createSpreadsheetData(5, 5),
    });

    expect(afterEmptyDataStateHideSpy).toHaveBeenCalledTimes(1);
  });

  it('should run afterEmptyDataStateHide after beforeEmptyDataStateHide', async() => {
    const beforeEmptyDataStateHideSpy = jasmine.createSpy('beforeEmptyDataStateHide');
    const afterEmptyDataStateHideSpy = jasmine.createSpy('afterEmptyDataStateHide');

    handsontable({
      data: [],
      emptyDataState: true,
      beforeEmptyDataStateHide: beforeEmptyDataStateHideSpy,
      afterEmptyDataStateHide: afterEmptyDataStateHideSpy,
    });

    hot().updateSettings({
      data: createSpreadsheetData(5, 5),
    });

    expect(beforeEmptyDataStateHideSpy).toHaveBeenCalledBefore(afterEmptyDataStateHideSpy);
  });
});
