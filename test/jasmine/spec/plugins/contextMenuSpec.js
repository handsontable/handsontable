describe('ContextMenu', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      this.$container.remove();
      $.contextMenu('destroy');
    }
  });

  it('should show enabled Insert row (above and below) in context menu', function () {
    handsontable({
      startRows: 5,
      contextMenu: ['row_above', 'row_below']
    });
    selectCell(4, 4);
    contextMenu();
    expect($('ul.context-menu-list li').length).toEqual(2);
    expect($('ul.context-menu-list li.disabled').length).toEqual(0);
  });

  it('should disable Insert row in context menu when maxRows is reached', function () {
    handsontable({
      startRows: 5,
      maxRows: 5,
      contextMenu: ['row_above', 'row_below']
    });
    selectCell(4, 4);
    contextMenu();
    expect($('ul.context-menu-list li').length).toEqual(2);
    expect($('ul.context-menu-list li.disabled').length).toEqual(2);
  });

  it('should disable Insert row in context menu when maxRows is reached', function () {
    handsontable({
      startCols: 5,
      maxCols: 5,
      contextMenu: ['col_left', 'col_right']
    });
    selectCell(4, 4);
    contextMenu();
    expect($('ul.context-menu-list li').length).toEqual(2);
    expect($('ul.context-menu-list li.disabled').length).toEqual(2);
  });
});