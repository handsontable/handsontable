describe('Core.toHTML', () => {
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

  it('should convert instance into outerHTML of HTMLTableElement', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2),
      colHeaders: true,
      rowHeaders: true,
    });

    expect(toHTML()).toBe([
      '<table>',
      '<thead>',
      '<tr><th></th><th>A</th><th>B</th></tr>',
      '</thead>',
      '<tbody>',
      '<tr><th>1</th><td >A1</td><td >B1</td></tr>',
      '<tr><th>2</th><td >A2</td><td >B2</td></tr>',
      '</tbody>',
      '</table>'
    ].join(''));
  });
});
