describe('Core_getCellMeta', function () {
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

  it('should not allow manual editing of a read only cell', function () {
    var allCellsReadOnly = false;

    handsontable({
      cells: function () {
        return {readOnly: allCellsReadOnly}
      }
    });
    allCellsReadOnly = true;
    selectCell(2, 2);

    keyDown('enter');

    expect(isEditorVisible()).toEqual(false);
  });

  it('should allow manual editing of cell that is no longer read only', function () {
    var allCellsReadOnly = true;

    handsontable({
      cells: function () {
        return {readOnly: allCellsReadOnly}
      }
    });
    allCellsReadOnly = false;
    selectCell(2, 2);

    keyDown('enter');

    expect(isEditorVisible()).toEqual(true);
  });

  it('should use default cell editor for a cell that has declared only cell renderer', function () {
    handsontable({
      cells: function () {
        return {
          type: {
            renderer: function (instance, td, row, col, prop, value, cellProperties) {
              //taken from demo/renderers.html
              Handsontable.TextCell.renderer.apply(this, arguments);
              $(td).css({
                background: 'yellow'
              });
            }
          }
        }
      }
    });
    selectCell(2, 2);

    keyDown('enter');
    document.activeElement.value = 'new value';
    destroyEditor();
    expect(getDataAtCell(2, 2)).toEqual('new value');
  });

  it('should allow to use type and renderer in `flat` notation', function () {
    handsontable({
      data: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [0, 9, 8, 7]
      ],
      cells: function (row, col) {
        if (row === 2 && col === 2) {
          return {
            type: 'checkbox',
            renderer: function (instance, td, row, col, prop, value, cellProperties) {
                //taken from demo/renderers.html
                Handsontable.TextCell.renderer.apply(this, arguments);

                td.style.backgroundColor = 'yellow';
            }
          }
        }
      }
    });

    expect(getCell(2, 2).style.backgroundColor).toEqual('yellow');
    expect(getCell(1, 1).style.backgroundColor).toEqual('');
  });

  it('this in cells should point to cellProperties', function () {
    var called = 0
      , _row
      , _this;

    handsontable({
      cells: function (row, col, prop) {
        called++;
        _row = row;
        _this = this;
      }
    });

    var HOT = getInstance();

    expect(called).toBeGreaterThan(0);
    expect(_this.row).toEqual(_row);
    expect(_this.renderer).toBe(Handsontable.TextRenderer);
    expect(_this.instance).toBe(HOT);
  });

  it("should get proper cellProperties when order of displayed rows is different than order of stored data", function () {
    var hot = handsontable({
      data: [
        ['C'],
        ['A'],
        ['B']
      ],
      minSpareRows: 1,
      cells: function (row, col, prop) {
        var cellProperties = {};
        if (getData()[row][col] === 'A') {
          cellProperties.readOnly = true;
        }
        return cellProperties;
      }
    });


    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('C');
    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').hasClass('htDimmed')).toBe(false);

    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').hasClass('htDimmed')).toBe(true);

    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('B');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').hasClass('htDimmed')).toBe(false);

    //Column sorting changes the order of displayed rows while keeping table data unchanged
    updateSettings({
      columnSorting: {
        column: 0,
        order: true
      }
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A');
    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').hasClass('htDimmed')).toBe(true);

    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('B');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').hasClass('htDimmed')).toBe(false);

    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('C');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').hasClass('htDimmed')).toBe(false);



  });

  it('should inherit readOnly from cell type (legacy)', function () {
    handsontable({
      data : [[1,2]],
      cells : function (row, col, prop) {
        return {
          type : {
            readOnly: true
          }
        }
      }
    });
    expect(getCellMeta(0, 0).readOnly).toEqual(true);
  });

});
