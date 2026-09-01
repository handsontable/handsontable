describe('Core.countRowHeaders', () => {
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

  it('should count row headers enabled by `rowHeaders` option', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      rowHeaders: true,
    });

    expect(countRowHeaders()).toBe(1);
  });

  it('should return 0 for disabled row headers', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      colHeaders: true,
    });

    expect(countRowHeaders()).toBe(0);
  });

  it('should not throw and return 0 when the table view is unavailable (e.g. during teardown)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
    });

    // During init/teardown `view` can be undefined; a shortcut `runOnlyIf` guard
    // calling these methods then must not throw (regression: HANDSONTABLE-DOCS-1JX).
    const { view } = hot;

    hot.view = undefined;

    expect(() => hot.countRowHeaders()).not.toThrow();
    expect(hot.countRowHeaders()).toBe(0);
    expect(() => hot.countColHeaders()).not.toThrow();
    expect(hot.countColHeaders()).toBe(0);

    // restore the view so the instance can tear down cleanly in afterEach
    hot.view = view;
  });

  it('should count custom row headers', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      rowHeaders: true,
      afterGetRowHeaderRenderers(renderers) {
        renderers.length = 0;
        renderers.push((renderedRowIndex, TH) => {
          TH.innerText = this.getRowHeader(renderedRowIndex, 0);
        });
        renderers.push((renderedRowIndex, TH) => {
          TH.innerText = this.getRowHeader(renderedRowIndex, 1);
        });
        renderers.push((renderedRowIndex, TH) => {
          TH.innerText = this.getRowHeader(renderedRowIndex, 2);
        });
      },
    });

    expect(countRowHeaders()).toBe(3);
  });
});
