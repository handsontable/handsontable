describe('Core_render', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('all cells should get green background', function () {
    function greenCell(instance, td, row, col, prop, value, cellProperties) {
      Handsontable.TextRenderer.apply(this, arguments);
      td.style.backgroundColor = "green";

    }

    handsontable({
      data: [
        ["a", "b"],
        ["c", "d"]
      ],
      minRows: 4,
      minCols: 4,
      minSpareRows: 4,
      minSpareCols: 4,
      cells: function () {
        return {
          type: {renderer: greenCell}
        };
      }
    });

    var $tds = this.$container.find('.htCore tbody td');
    $tds.each(function () {
      expect(this.style.backgroundColor).toEqual('green');
    });
  });

  it('render should update border dimensions', function () {
    var data = [
      ["a", "b"],
      ["c", "d"]
    ];

    handsontable({
      data: data,
      minRows: 4,
      minCols: 4,
      minSpareRows: 4,
      minSpareCols: 4
    });

    selectCell(1, 1);
    data[1][1] = "dddddddddddddddddddd";
    render();

    var $td = this.$container.find('.htCore tbody tr:eq(1) td:eq(1)');
    expect(this.$container.find('.wtBorder.current').width()).toBeGreaterThan($td.width());
  });

  it('should not render table twice', function () {
    var counter = 0;

    handsontable({
      data: [
        ['Joe Red']
      ],
      afterRender: function () {
        counter++;
      }
    });
    populateFromArray(0, 0, [['t', 'e', 's', 't']]);

    expect(counter).toEqual(2); // 1 from load and 1 from populateFromArray
  });

  it('should run afterRenderer hook', function () {
    handsontable({
      data : [[1,2,3,4,5],[1,2,3,4,5]],
      afterRenderer: function (td, row, col, prop, value, cellProperties) {
        td.innerHTML = 'Changed by plugin';
      }
    });

    expect(this.$container.find('td:eq(0)')[0].innerHTML).toEqual('Changed by plugin');
  });
});