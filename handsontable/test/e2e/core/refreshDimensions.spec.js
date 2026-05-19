describe('Core.await refreshDimensions()', () => {
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

  it('should trigger `beforeRefreshDimensions` and `afterRefreshDimensions` hooks internally', async() => {
    const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');
    const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');

    handsontable({
      data: createSpreadsheetData(5, 5),
      beforeRefreshDimensions,
      afterRefreshDimensions,
    });

    await refreshDimensions();

    const layout = getThemeLayout();
    const expectedHeight = layout.overlayHeight({ rows: 5 });

    expect(beforeRefreshDimensions).toHaveBeenCalledOnceWith(
      { width: 1265, height: 0 },
      { width: 1265, height: expectedHeight },
      true,
    );
    expect(afterRefreshDimensions).toHaveBeenCalledOnceWith(
      { width: 1265, height: 0 },
      { width: 1265, height: expectedHeight },
      true,
    );
  });

  it('should trigger `render` and `adjustElementsSize` methods internally if the root element size is changed between calls', async() => {
    spec().$container.css('height', 100).css('overflow', 'hidden');

    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await refreshDimensions();

    spec().$container.css('height', 200);

    spyOn(hot, 'render');
    spyOn(hot.view, 'adjustElementsSize');

    await refreshDimensions();

    expect(hot.render).toHaveBeenCalledTimes(1);
    expect(hot.view.adjustElementsSize).toHaveBeenCalledBefore(hot.render);
    expect(hot.view.adjustElementsSize).toHaveBeenCalledTimes(1);
  });

  it('should trigger `render` and `adjustElementsSize` methods internally (#dev-1876)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });

    spyOn(hot, 'render');
    spyOn(hot.view, 'adjustElementsSize');

    await refreshDimensions();

    expect(hot.render).toHaveBeenCalledTimes(1);
    expect(hot.view.adjustElementsSize).toHaveBeenCalledBefore(hot.render);
    expect(hot.view.adjustElementsSize).toHaveBeenCalledTimes(1);
  });
});
