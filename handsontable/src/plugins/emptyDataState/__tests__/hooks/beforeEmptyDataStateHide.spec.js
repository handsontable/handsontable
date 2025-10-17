describe('EmptyDataState - beforeEmptyDataStateHide hook', () => {
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

  it('should run beforeEmptyDataStateHide hook', async() => {
    const beforeEmptyDataStateHideSpy = jasmine.createSpy('beforeEmptyDataStateHide');

    handsontable({
      data: [],
      emptyDataState: true,
      beforeEmptyDataStateHide: beforeEmptyDataStateHideSpy,
    });

    hot().updateSettings({
      data: createSpreadsheetData(5, 5),
    });

    expect(beforeEmptyDataStateHideSpy).toHaveBeenCalledTimes(1);
  });

  it('should run beforeEmptyDataStateHide before afterEmptyDataStateHide', async() => {
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
