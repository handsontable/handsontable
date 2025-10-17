describe('EmptyDataState - beforeEmptyDataStateShow hook', () => {
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

  it('should run beforeEmptyDataStateShow hook', async() => {
    const beforeEmptyDataStateShowSpy = jasmine.createSpy('beforeEmptyDataStateShow');

    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
      beforeEmptyDataStateShow: beforeEmptyDataStateShowSpy,
    });

    hot().updateSettings({
      data: [],
    });

    expect(beforeEmptyDataStateShowSpy).toHaveBeenCalledTimes(1);
  });

  it('should run beforeEmptyDataStateShow before afterEmptyDataStateShow', async() => {
    const beforeEmptyDataStateShowSpy = jasmine.createSpy('beforeEmptyDataStateShow');
    const afterEmptyDataStateShowSpy = jasmine.createSpy('afterEmptyDataStateShow');

    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
      beforeEmptyDataStateShow: beforeEmptyDataStateShowSpy,
      afterEmptyDataStateShow: afterEmptyDataStateShowSpy,
    });

    hot().updateSettings({
      data: [],
    });

    expect(beforeEmptyDataStateShowSpy).toHaveBeenCalledBefore(afterEmptyDataStateShowSpy);
  });
});
