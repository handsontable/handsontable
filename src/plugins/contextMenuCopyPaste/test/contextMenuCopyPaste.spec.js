describe("ContextMenuCopyPaste", function () {
  var id = 'testContainer';

  if (typeof navigator.mimeTypes['application/x-shockwave-flash'] === "undefined") {
    navigator.mimeTypes['application/x-shockwave-flash'] = {}; //mock Adobe Flash plugin so that contextMenuCopyPaste.js does not throw an error in PhantomJS
  }

  beforeEach(function () {
    $('head').append('<script src="../../demo/js/ZeroClipboard.js"></script>');

    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
    var wrapper = $('<div></div>').css({
      width: 400,
      height: 200,
      overflow: 'scroll'
    });

    this.$wrapper = this.$container.wrap(wrapper).parent();
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    this.$wrapper.remove();

    $('head').find('script[src*=ZeroClipboard]').remove();
    delete ZeroClipboard;
  });

  it("should add Copy and Paste context menu options at the beginning by default", function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
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

    expect($contextMenuEntries.index($copyButton)).toEqual(0);
    expect($contextMenuEntries.index($pasteButton)).toEqual(1);

  });

  it("should add Copy and Paste context menu options at the provided index", function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      minSpareRows: 1,
      contextMenu: ['row_above', 'copy', 'paste', 'row_below'],
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

    expect($contextMenuEntries.not('[class*=htSeparator]').index($copyButton)).toEqual(1);
    expect($contextMenuEntries.not('[class*=htSeparator]').index($pasteButton)).toEqual(2);
  });


  // currently not needed - cannot trigger copy action programically
  xdescribe("Copy context menu option", function () {

    xit("should allow to copy single cell's data", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
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
