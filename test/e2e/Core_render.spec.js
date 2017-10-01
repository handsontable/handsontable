describe('Core_render', () => {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('all cells should get green background', function() {
    function greenCell(instance, td, row, col, prop, value, cellProperties) {
      Handsontable.renderers.TextRenderer.apply(this, arguments);
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

    var $tds = this.$container.find('.htCore tbody td');
    $tds.each(function() {
      expect(this.style.backgroundColor).toEqual('green');
    });
  });

  it('render should update border dimensions', function() {
    var data = [
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

    var $td = this.$container.find('.htCore tbody tr:eq(1) td:eq(1)');
    expect(this.$container.find('.wtBorder.current').width()).toBeGreaterThan($td.width());
  });

  it('should not render table twice', () => {
    var counter = 0;

    handsontable({
      data: [
        ['Joe Red']
      ],
      afterRender() {
        counter++;
      }
    });
    populateFromArray(0, 0, [['t', 'e', 's', 't']]);

    expect(counter).toEqual(2); // 1 from load and 1 from populateFromArray
  });

  it('should run afterRenderer hook', function() {
    var lastCellProperties;

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

    expect(this.$container.find('td:eq(0)')[0].innerHTML).toEqual('Changed by plugin');
    expect(lastCellProperties.row).toEqual(1);
    expect(lastCellProperties.col).toEqual(4);
  });

  it('should run beforeValueRender hook', function() {
    // some primitive i18n function
    const i18n = (locale) => {
      if  (locale.startsWith('ch')) {
        return { 'car.brand.bmw': '寶馬', 'car.brand.mercedes' : '奔馳', 'car.brand.volkswagen' : '大眾汽車'};
      }
      return { 'car.brand.bmw': 'BMW', 'car.brand.mercedes' : 'Mercedes', 'car.brand.volkswagen' : 'Volkswagen'};
    };

    // assume somewhere we get the user locale
    const userLocale = 'ch_TW';

    handsontable({
      data: [
        {brand: 'car.brand.bmw', likes: 100},
        {brand: 'car.brand.mercedes', likes: 200},
        {brand: 'car.brand.volkswagen', likes: 150}
      ],
      columns: [
        {data: 'brand'},
        {data: 'likes', type: 'numeric'},
      ],
      beforeValueRender(td, row, col, prop, value, cellProperties) {
        if (prop === 'brand') {
          return i18n(userLocale)[value]
        }
        return value
      }
    });

    // Value is overwritten by beforeValueRender
    expect(this.$container.find('td:eq(0)')[0].innerHTML).toEqual('寶馬');
    expect(this.$container.find('td:eq(1)')[0].innerHTML).toEqual('100');
    expect(this.$container.find('td:eq(2)')[0].innerHTML).toEqual('奔馳');
  });

  it('should run beforeRenderer hook', function() {
    var lastCellProperties;

    handsontable({
      data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      beforeRenderer(td, row, col, prop, value, cellProperties) {
        td.innerHTML = 'Changed by plugin';
        lastCellProperties = cellProperties;
      }
    });

    // Value is overwritten by text renderer
    expect(this.$container.find('td:eq(0)')[0].innerHTML).toEqual('1');
    expect(lastCellProperties.row).toEqual(1);
    expect(lastCellProperties.col).toEqual(4);
  });

  it('should reflect changes applied in beforeRenderer into afterRenderer', () => {
    var afterRenderer = jasmine.createSpy();

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
