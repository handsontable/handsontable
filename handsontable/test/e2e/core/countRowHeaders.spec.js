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

  it('should count row headers enabled by `rowHeaders` option', () => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      rowHeaders: true,
    });

    expect(countRowHeaders()).toBe(1);
  });

  it('should return 0 for disabled row headers', () => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      colHeaders: true,
    });

    expect(countRowHeaders()).toBe(0);
  });

  it('should count custom row headers', () => {
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
