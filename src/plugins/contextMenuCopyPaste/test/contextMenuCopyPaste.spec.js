describe("ContextMenuCopyPaste", function () {
  var id = 'testContainer';

  beforeEach(function () {
    $('head').append('<script src="../../demo/js/ZeroClipboard.js"></script>');

    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }

    $('head').find('script[src*=ZeroClipboard]').remove();
    delete ZeroClipboard;
  });

  it("should add Copy and Paste context menu options at the end if no entryIndex is provided", function () {
    var hot = handsontable({
      data: createSpreadsheetObjectData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      minSpareRows: 1,
      contextMenu: true,
      contextMenuCopyPaste: {
        swfPath: "../../demo/swf/ZeroClipboard.swf"
      }
    });

    selectCell(1, 1);

    contextMenu();

    var $contextMenuEntries = $('.htContextMenu .ht_master .htCore tbody').find('td')
      , $copyButton = $contextMenuEntries.find('div').filter(function () {
        return (/Copy/i).test($(this).text())
      }).parents('td')
      , $pasteButton = $contextMenuEntries.find('div').filter(function () {
        return (/Paste/i).test($(this).text())
      }).parents('td');

    expect($contextMenuEntries.index($copyButton)).toEqual($contextMenuEntries.size() - 2);
    expect($contextMenuEntries.index($pasteButton)).toEqual($contextMenuEntries.size() - 1);

  });

  it("should add Copy and Paste context menu options at a provided entryIndex", function () {
    var hot = handsontable({
      data: createSpreadsheetObjectData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      minSpareRows: 1,
      contextMenu: true,
      contextMenuCopyPaste: {
        swfPath: "../../demo/swf/ZeroClipboard.swf",
        entryIndex: 5
      }
    });

    selectCell(1, 1);

    contextMenu();

    var $contextMenuEntries = $('.htContextMenu .ht_master .htCore tbody').find('td')
      , $copyButton = $contextMenuEntries.find('div').filter(function () {
        return (/Copy/i).test($(this).text())
      }).parents('td')
      , $pasteButton = $contextMenuEntries.find('div').filter(function () {
        return (/Paste/i).test($(this).text())
      }).parents('td');

    expect($contextMenuEntries.not('[class*=htSeparator]').index($copyButton)).toEqual(hot.getSettings().contextMenuCopyPaste.entryIndex);
    expect($contextMenuEntries.not('[class*=htSeparator]').index($pasteButton)).toEqual(hot.getSettings().contextMenuCopyPaste.entryIndex + 1);
  });


  // currently not needed - cannot trigger copy action programically
  xdescribe("Copy context menu option", function () {

    xit("should allow to copy single cell's data", function () {
      var hot = handsontable({
        data: createSpreadsheetObjectData(10, 5),
        rowHeaders: true,
        colHeaders: true,
        minSpareRows: 1,
        contextMenu: true,
        contextMenuCopyPaste: {
          swfPath: "swf/ZeroClipboard.swf"
        }
      });

      selectCell(1,1);

      contextMenu();

      var copyButton = $('.htContextMenu .ht_master .htCore tbody').find('td').find('div').filter(function(){
        return (/Paste/i).test($(this).text())
      }).parents('td');

      copyButton.trigger('mousedown');

    });

  });

});
