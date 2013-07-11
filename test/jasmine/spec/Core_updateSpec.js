describe('Core_updateSettings', function () {
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

  it('should inherit cell type', function () {

    handsontable({
      data : [[1,2]],
      columns : [
        { },
        { type : 'checkbox' }
      ],
      cells : function (row, col, prop) {
        if (row === 0 && col === 0) {
          return {
            type : 'numeric'
          }
        }
      }
    });

    expect(getCellMeta(0, 0).type).toEqual('numeric');
    expect(getCellMeta(0, 1).type).toEqual('checkbox');

  });

  it('should not reset columns types to text', function () {
    handsontable({
      data : [[1, true]],
      columns : [
        { type : 'numeric' },
        { type : 'checkbox' }
      ]
    });

    var td = this.$container.find('td');

    expect(td.eq(0).text()).toEqual('1');
    expect(td.eq(1).text()).toEqual('');

    updateSettings({});

    expect(td.eq(0).text()).toEqual('1');
    expect(td.eq(1).text()).toEqual('');

  });

  it('should update readOnly global setting', function(){
    handsontable({
      readOnly: true,
      data : [['foo', 'bar']],
      columns : [
        { },
        { }
      ]
    });

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(true);

    expect(getCellMeta(0, 1).readOnly).toBe(true);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(true);

    updateSettings({
      readOnly: false
    });

    expect(getCellMeta(0, 0).readOnly).toBe(false);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(false);

    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(false);
  });

  it('should update readOnly columns setting', function(){
    handsontable({
      data : [['foo', true]],
      columns : [
        { type : 'text',
          readOnly: true
        },
        { type : 'checkbox' }
      ]
    });

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(true);

    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(false);

    updateSettings({
      columns: [
        { type : 'text',
          readOnly: false
        },
        { type : 'checkbox' }
      ]
    });

    expect(getCellMeta(0, 0).readOnly).toBe(false);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(false);

    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(false);
  });

  it('should update readOnly columns setting and override global setting', function(){
    handsontable({
      readOnly: true,
      data : [['foo', true]],
      columns : [
        { type : 'text'
        },
        { type : 'checkbox' }
      ]
    });

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(true);

    expect(getCellMeta(0, 1).readOnly).toBe(true);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(false);

    updateSettings({
      columns: [
        { type : 'text',
          readOnly: false
        },
        { type : 'checkbox' }
      ]
    });

    expect(getCellMeta(0, 0).readOnly).toBe(false);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(false);

    expect(getCellMeta(0, 1).readOnly).toBe(true);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(false);
  });


});
