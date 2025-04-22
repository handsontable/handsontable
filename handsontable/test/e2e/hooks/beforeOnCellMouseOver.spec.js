describe('The beforeOnCellMouseOver hook', () => {
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

  it('should be triggered every time the cursor starts hovering over a cell or a header', async() => {
    const spy = jasmine.createSpy('beforeOnCellMouseOver');

    handsontable({
      data: createSpreadsheetData(10, 10),
      rowHeaders: true,
      colHeaders: true,
      beforeOnCellMouseOver: spy,
    });

    const $colHeader = getTopClone().find('thead tr:eq(0) th:eq(1)');

    $('body').simulate('mouseover');
    await sleep(50);

    $colHeader.simulate('mouseover');
    await sleep(50);

    $colHeader.simulate('mouseout');
    await sleep(50);

    $('body').simulate('mouseover');
    await sleep(100);

    $('body').simulate('mouseout');
    await sleep(50);

    $colHeader.simulate('mouseover');
    await sleep(100);

    $colHeader.simulate('mouseout');
    await sleep(50);

    getMaster().find('tbody tr:eq(0) td:eq(1)').simulate('mouseover');
    await sleep(100);

    getMaster().find('tbody tr:eq(0) td:eq(1)').simulate('mouseout');
    await sleep(50);

    getMaster().find('tbody tr:eq(0) td:eq(2)').simulate('mouseover');
    await sleep(100);

    getMaster().find('tbody tr:eq(0) td:eq(2)').simulate('mouseout');
    await sleep(50);

    expect(spy).toHaveBeenCalledTimes(4);
  });
});
