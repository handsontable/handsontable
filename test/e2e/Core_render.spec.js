describe('Core_render', () => {
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

  it('all cells should get green background', () => {
    function greenCell(instance, td, ...args) {
      Handsontable.renderers.TextRenderer.apply(this, [instance, td, ...args]);
      td.style.backgroundColor = 'green';

    }

    handsontable({
      data: [
        ['a', 'b'],
        ['c', 'd']
      ],
      minRows: 4,
      minCols: 4,
      minSpareRows: 4,
      minSpareCols: 4,
      cells() {
        return {
          renderer: greenCell
        };
      }
    });

    const $tds = spec().$container.find('.htCore tbody td');

    $tds.each(function() {
      expect(this.style.backgroundColor).toEqual('green');
    });
  });

  it('render should update border dimensions', () => {
    const data = [
      ['a', 'b'],
      ['c', 'd']
    ];

    handsontable({
      data,
      minRows: 4,
      minCols: 4,
      minSpareRows: 4,
      minSpareCols: 4
    });

    selectCell(1, 1);
    data[1][1] = 'dddddddddddddddddddd';
    render();

    const $td = spec().$container.find('.htCore tbody tr:eq(1) td:eq(1)');

    expect(spec().$container.find('.wtBorder.current').width()).toBeGreaterThan($td.width());
  });

  it('should not render table twice', () => {
    const afterRender = jasmine.createSpy('afterRender');

    handsontable({
      data: [
        ['Joe Red']
      ],
      afterRender,
    });
    populateFromArray(0, 0, [['t', 'e', 's', 't']]);

    expect(afterRender).toHaveBeenCalledTimes(2); // 1 from load and 1 from populateFromArray
  });

  it('should run afterRenderer hook', () => {
    let lastCellProperties;

    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      afterRenderer(td, row, col, prop, value, cellProperties) {
        td.innerHTML = 'Changed by plugin';

        if (!cellProperties) {
          throw new Error();
        }
        lastCellProperties = cellProperties;
      }
    });

    expect(spec().$container.find('td:eq(0)')[0].innerHTML).toEqual('Changed by plugin');
    expect(lastCellProperties.row).toEqual(1);
    expect(lastCellProperties.col).toEqual(4);
  });

  it('should run beforeValueRender hook', () => {
    handsontable({
      data: [['A1', 'B1']],
      beforeValueRender(value, cellProperties) {
        return cellProperties.col === 0 ? 'Test' : value;
      }
    });

    expect(spec().$container.find('td:eq(0)')[0].innerHTML).toEqual('Test');
    expect(spec().$container.find('td:eq(1)')[0].innerHTML).toEqual('B1');
  });

  it('should run beforeRenderer hook', () => {
    let lastCellProperties;

    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeRenderer(td, row, col, prop, value, cellProperties) {
        td.innerHTML = 'Changed by plugin';
        lastCellProperties = cellProperties;
      }
    });

    // Value is overwritten by text renderer
    expect(spec().$container.find('td:eq(0)')[0].innerHTML).toEqual('1');
    expect(lastCellProperties.row).toEqual(1);
    expect(lastCellProperties.col).toEqual(4);
  });

  it('should reflect changes applied in beforeRenderer into afterRenderer', () => {
    const afterRenderer = jasmine.createSpy();

    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeRenderer(td, row, col, prop, value, cellProperties) {
        cellProperties.foo = 'bar';
      },
      afterRenderer,
    });

    expect(afterRenderer.calls.count()).toBe(10);
    expect(afterRenderer.calls.argsFor(0)[0] instanceof HTMLTableCellElement).toBe(true);
    expect(afterRenderer.calls.argsFor(0)[1]).toBe(0);
    expect(afterRenderer.calls.argsFor(0)[2]).toBe(0);
    expect(afterRenderer.calls.argsFor(0)[3]).toBe(0);
    expect(afterRenderer.calls.argsFor(0)[4]).toBe(1);
    expect(afterRenderer.calls.argsFor(0)[5].foo).toBe('bar');
  });
});
