describe('ContextMenu', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
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

  it('should work properly (remove row) after destroy and new init', function () {
    var test = function () {
      handsontable({
        startRows: 5,
        contextMenu: ['remove_row']
      });
      selectCell(0, 0);
      contextMenu();
      $('ul.context-menu-list li').first().trigger('mouseup.contextMenu');
      expect(getData().length).toEqual(4);
    };
    test();
    destroy();

    waits(50); //jquery.contextMenu.js waits that long to hide background so we must wait too

    runs(function () {
      test();
    });
  });

  it('should destroy contextMenu when Handsotnable is destroyed', function () {
    var test = function () {
      handsontable({
        startRows: 5,
        contextMenu: ['remove_row']
      });
      selectCell(0, 0);
      contextMenu();
      $('ul.context-menu-list li').first().trigger('mouseup.contextMenu');
      expect(getData().length).toEqual(4);
    };
    test();
    expect($('ul.context-menu-list').length).toEqual(1);
    destroy();
    expect($('ul.context-menu-list').length).toEqual(0);
  });

});