describe("ContextMenuCopyPaste", function () {
  var id = 'testContainer';

  if (typeof navigator.mimeTypes['application/x-shockwave-flash'] === "undefined") {
    navigator.mimeTypes['application/x-shockwave-flash'] = {}; //mock Adobe Flash plugin so that contextMenuCopyPaste.js does not throw an error in PhantomJS
  }

  beforeEach(function () {
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

  it("should disable `Copy` and `Paste` items when context menu was triggered from corner header", function () {
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

    $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0).simulate('mousedown', {which: 3});
    contextMenu();

    expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
      'Copy',
      'Paste',
      'Insert column on the left',
      'Insert column on the right',
      'Remove row',
      'Remove column',
      'Undo',
      'Redo',
      'Read only',
      'Alignment',
    ].join(''));
  });

  // see https://github.com/handsontable/handsontable/issues/3140
  it("should not throwing error when ContextMenu plugin is disabled", function () {
    var spy = jasmine.createSpy();
    var prevError = window.onerror;

    window.onerror = function() {
      spy();
    };

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

    hot.getPlugin('contextMenu').disablePlugin();
    $(getCell(0, 0)).simulate('mouseenter');

    expect(spy).not.toHaveBeenCalled();
    window.onerror = prevError;
  });
});
