describe('Formulas -> lookup reference functions', () => {
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

  it('MATCH', () => {
    const data = getDataForFormulas(0, 'name', ['=MATCH()', '=MATCH("Saranap", C1:C5)', '=MATCH(4, A1:A5, 1)']);

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 1)).toBe(1);
    expect(hot.getDataAtCell(2, 1)).toBe(3);
  });
});
