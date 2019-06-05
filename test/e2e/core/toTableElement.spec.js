describe('Core.toTableElement', () => {
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

  it('should convert instance into HTMLTableElement', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      colHeaders: true,
      rowHeaders: true,
    });

    const newTable = hot.toTableElement();

    expect(newTable.nodeName).toBe('TABLE');
    expect(newTable.tBodies.length).toBe(1);
    expect(newTable.tHead).not.toBe(null);
    expect(newTable.rows.length).toBe(3);
    expect(newTable.rows[2].cells[2].innerText).toBe('B2');
  });
});
