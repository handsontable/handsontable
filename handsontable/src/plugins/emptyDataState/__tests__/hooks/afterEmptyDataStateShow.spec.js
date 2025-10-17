describe('EmptyDataState - afterEmptyDataStateShow hook', () => {
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

  it('should run afterEmptyDataStateShow hook', async() => {
    const afterEmptyDataStateShowSpy = jasmine.createSpy('afterEmptyDataStateShow');

    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
      afterEmptyDataStateShow: afterEmptyDataStateShowSpy,
    });

    hot().updateSettings({
      data: [],
    });

    expect(afterEmptyDataStateShowSpy).toHaveBeenCalledTimes(1);
  });

  it('should run afterEmptyDataStateShow after beforeEmptyDataStateShow', async() => {
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
