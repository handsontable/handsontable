describe('Core.refreshDimensions', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('#rootWrapper');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should trigger `beforeRefreshDimensions` and `afterRefreshDimensions` hooks internally', () => {
    const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');
    const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');

    handsontable({
      data: createSpreadsheetData(5, 5),
      beforeRefreshDimensions,
      afterRefreshDimensions,
    });

    refreshDimensions();

    expect(beforeRefreshDimensions).forThemes(({ classic, main, horizon }) => {
      classic.toHaveBeenCalledOnceWith(
        { width: 1265, height: 0 },
        { width: 1265, height: 116 },
        true,
      );
      main.toHaveBeenCalledOnceWith(
        { width: 1265, height: 0 },
        { width: 1265, height: 146 },
        true,
      );
      horizon.toHaveBeenCalledOnceWith(
        { width: 1265, height: 0 },
        { width: 1265, height: 186 },
        true,
      );
    });
    expect(afterRefreshDimensions).forThemes(({ classic, main, horizon }) => {
      classic.toHaveBeenCalledOnceWith(
        { width: 1265, height: 0 },
        { width: 1265, height: 116 },
        true,
      );
      main.toHaveBeenCalledOnceWith(
        { width: 1265, height: 0 },
        { width: 1265, height: 146 },
        true,
      );
      horizon.toHaveBeenCalledOnceWith(
        { width: 1265, height: 0 },
        { width: 1265, height: 186 },
        true,
      );
    });
  });

  it('should trigger `render` and `adjustElementsSize` methods internally (#dev-1876)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });

    spyOn(hot, 'render');
    spyOn(hot.view, 'adjustElementsSize');

    refreshDimensions();

    expect(hot.render).toHaveBeenCalledTimes(1);
    expect(hot.render).toHaveBeenCalledBefore(hot.view.adjustElementsSize);
    expect(hot.view.adjustElementsSize).toHaveBeenCalledTimes(1);
  });
});
