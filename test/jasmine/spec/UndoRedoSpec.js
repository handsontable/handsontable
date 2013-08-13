describe('UndoRedo', function () {
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

  it('should undo single change', function () {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });
    var HOT = getInstance();

    setDataAtCell(0, 0, 'new value');

    HOT.undo();
    expect(getDataAtCell(0, 0)).toBe('A0');
  });

  it('should undo single change after hitting CTRL+Z', function () {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });
    var HOT = getInstance();

    selectCell(0, 0);
    setDataAtCell(0, 0, 'new value');

    var keyboardEvent = $.Event('keydown', {ctrlKey: true, keyCode: 'Z'.charCodeAt(0)});
    this.$container.trigger(keyboardEvent);
    expect(getDataAtCell(0, 0)).toBe('A0');
  });

  it('should redo single change', function () {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });
    var HOT = getInstance();

    setDataAtCell(0, 0, 'new value');

    expect(getDataAtCell(0, 0)).toBe('new value');

    HOT.undo();
    expect(getDataAtCell(0, 0)).toBe('A0');

    HOT.redo();
    expect(getDataAtCell(0, 0)).toBe('new value');
  });

  it('should redo single change after hitting CTRL+Y', function () {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });
    var HOT = getInstance();

    selectCell(0, 0);
    setDataAtCell(0, 0, 'new value');

    expect(getDataAtCell(0, 0)).toBe('new value');

    HOT.undo();
    expect(getDataAtCell(0, 0)).toBe('A0');

    var keyboardEvent = $.Event('keydown', {ctrlKey: true, keyCode: 'Y'.charCodeAt(0)});
    this.$container.trigger(keyboardEvent);

    expect(getDataAtCell(0, 0)).toBe('new value');
  });

  it('should redo single change after hitting CTRL+SHIFT+Z', function () {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });
    var HOT = getInstance();

    selectCell(0, 0);
    setDataAtCell(0, 0, 'new value');

    expect(getDataAtCell(0, 0)).toBe('new value');

    HOT.undo();
    expect(getDataAtCell(0, 0)).toBe('A0');

    var keyboardEvent = $.Event('keydown', {ctrlKey: true, shiftKey: true, keyCode: 'Z'.charCodeAt(0)});
    this.$container.trigger(keyboardEvent);

    expect(getDataAtCell(0, 0)).toBe('new value');
  });

  it('should undo changes only for table where the change actually took place', function(){
    this.$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');

    var hot1 = handsontable({
      data: [
        [1],
        [2],
        [3]
      ]
    });

    this.$container2.handsontable({
      data: [
        ['A'],
        ['B'],
        ['C']
      ]
    });

    var hot2 = this.$container2.handsontable('getInstance');

    hot1.setDataAtCell(0, 0, 4);
    expect(hot1.getDataAtCell(0, 0)).toEqual(4);
    expect(hot2.getDataAtCell(0, 0)).toEqual('A');

    hot2.undo();
    expect(hot2.getDataAtCell(0, 0)).toEqual('A');
    expect(hot1.getDataAtCell(0, 0)).toEqual(4);

    hot1.undo();
    expect(hot2.getDataAtCell(0, 0)).toEqual('A');
    expect(hot1.getDataAtCell(0, 0)).toEqual(1);

    hot2.destroy();
    this.$container2.remove();
  });

  it('should redo changes only for table where the change actually took place', function(){
    this.$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');

    var hot1 = handsontable({
      data: [
        [1],
        [2],
        [3]
      ]
    });

    this.$container2.handsontable({
      data: [
        ['A'],
        ['B'],
        ['C']
      ]
    });

    var hot2 = this.$container2.handsontable('getInstance');

    hot1.setDataAtCell(0, 0, 4);
    expect(hot1.getDataAtCell(0, 0)).toEqual(4);
    expect(hot2.getDataAtCell(0, 0)).toEqual('A');

    hot1.undo();
    expect(hot1.getDataAtCell(0, 0)).toEqual(1);
    expect(hot2.getDataAtCell(0, 0)).toEqual('A');

    hot2.redo();
    expect(hot1.getDataAtCell(0, 0)).toEqual(1);
    expect(hot2.getDataAtCell(0, 0)).toEqual('A');

    hot1.redo();
    expect(hot1.getDataAtCell(0, 0)).toEqual(4);
    expect(hot2.getDataAtCell(0, 0)).toEqual('A');

    hot2.destroy();
    this.$container2.remove();
  });
});