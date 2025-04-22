describe('Core.countColHeaders', () => {
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

  it('should count column headers enabled by `colHeaders` option', () => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      colHeaders: true,
    });

    expect(countColHeaders()).toBe(1);
  });

  it('should return 0 for disabled column headers', () => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      rowHeaders: true,
    });

    expect(countColHeaders()).toBe(0);
  });

  it('should count custom column headers', () => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      rowHeaders: true,
      afterGetColumnHeaderRenderers(renderers) {
        renderers.length = 0;
        renderers.push((renderedColumnIndex, TH) => {
          TH.innerText = this.getColHeader(renderedColumnIndex, 0);
        });
        renderers.push((renderedColumnIndex, TH) => {
          TH.innerText = this.getColHeader(renderedColumnIndex, 1);
        });
        renderers.push((renderedColumnIndex, TH) => {
          TH.innerText = this.getColHeader(renderedColumnIndex, 2);
        });
      },
    });

    expect(countColHeaders()).toBe(3);
  });
});
