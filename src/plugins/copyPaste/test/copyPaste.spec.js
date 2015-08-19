describe('CopyPaste', function () {
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

  it("should remove additional new line from copied text (only safari)", function () {
    var getData = jasmine.createSpy().andReturn('a\nb\n\n');
    var hot = handsontable();

    $('.copyPaste')[0].onpaste({clipboardData: {getData: getData}});

    if (Handsontable.helper.isSafari()) {
      expect($('.copyPaste')[0].value).toEqual('a\nb\n');
      expect(getData).toHaveBeenCalledWith('Text');

    } else if (Handsontable.helper.isChrome()) {
      expect($('.copyPaste')[0].value).toBe('a\nb\n\n');
      expect(getData).toHaveBeenCalledWith('Text');
    }
  });


  describe("enabling/disabing plugin", function () {
    it("should enable copyPaste by default", function () {

      var hot = handsontable();

      expect(hot.copyPaste).toBeDefined();

    });

    it("should create copyPaste div if enabled", function () {
      expect($('#CopyPasteDiv').length).toEqual(0);

      var hot = handsontable();

      selectCell(0, 0);
      keyDownUp(Handsontable.helper.KEY_CODES.CONTROL_LEFT); //copyPaste div isn't created until you click CTRL

      expect($('#CopyPasteDiv').length).toEqual(1);
    });

    it("should not create copyPaste div if disabled", function () {
      expect($('#CopyPasteDiv').length).toEqual(0);

      var hot = handsontable({
        copyPaste: false
      });

      selectCell(0, 0);
      keyDownUp(Handsontable.helper.KEY_CODES.CONTROL_LEFT);

      expect($('#CopyPasteDiv').length).toEqual(0);
    });

    it("should not create copyPaste property if plugin is disabled", function () {
      var hot = handsontable({
        copyPaste: false
      });

      expect(hot.copyPaste).toBeUndefined();
    });

    it("should enable/disable plugin using updateSettings", function () {
      var hot = handsontable();

      expect(hot.copyPaste).toBeDefined();

      updateSettings({
        copyPaste: false
      });

      expect(hot.copyPaste).toBe(null);
    });

    it("should remove copyPaste div if plugin has been disabled using updateSetting", function () {
      expect($('#CopyPasteDiv').length).toEqual(0);

      var hot = handsontable();

      selectCell(0, 0);
      keyDownUp(Handsontable.helper.KEY_CODES.CONTROL_LEFT);

      expect($('#CopyPasteDiv').length).toEqual(1);

      updateSettings({
        copyPaste: false
      });

      expect($('#CopyPasteDiv').length).toEqual(0);

      selectCell(0, 0);
      keyDownUp(Handsontable.helper.KEY_CODES.CONTROL_LEFT);

      expect($('#CopyPasteDiv').length).toEqual(0);
    });
  });

  describe("setting values copyable", function () {
    it("should set copyable text when selecting a single cell and hitting ctrl", function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2)
      });

      var copyPasteTextarea = $('textarea.copyPaste');

      expect(copyPasteTextarea.val().length).toEqual(0);

      selectCell(0, 0);
      keyDownUp(Handsontable.helper.KEY_CODES.CONTROL_LEFT);

      expect(copyPasteTextarea.val()).toEqual('A1\n');
    });

    it("should set copyable text when selecting a single cell and hitting left command", function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2)
      });

      var copyPasteTextarea = $('textarea.copyPaste');

      expect(copyPasteTextarea.val().length).toEqual(0);

      selectCell(0, 0);
      keyDownUp(Handsontable.helper.KEY_CODES.COMMAND_LEFT);

      expect(copyPasteTextarea.val()).toEqual('A1\n');
    });

    it("should set copyable text when selecting a single cell and hitting right command", function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2)
      });

      var copyPasteTextarea = $('textarea.copyPaste');

      expect(copyPasteTextarea.val().length).toEqual(0);

      selectCell(0, 0);
      keyDownUp(Handsontable.helper.KEY_CODES.COMMAND_RIGHT);

      expect(copyPasteTextarea.val()).toEqual('A1\n');
    });

    it("should set copyable text when selecting multiple cells and hitting ctrl", function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2)
      });

      var copyPasteTextarea = $('textarea.copyPaste');

      expect(copyPasteTextarea.val().length).toEqual(0);

      selectCell(0, 0, 1, 0);
      keyDownUp(Handsontable.helper.KEY_CODES.CONTROL_LEFT);

      expect(copyPasteTextarea.val()).toEqual('A1\nA2\n');
    });

    it("should set copyable text when selecting all cells with CTRL+A", function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2)
      });

      var copyPasteTextarea = $('textarea.copyPaste');

      expect(copyPasteTextarea.val().length).toEqual(0);

      selectCell(0, 0);

      $(document.activeElement).simulate('keydown', {keyCode: Handsontable.helper.KEY_CODES.A, ctrlKey: true});
      waits(0);

      runs(function () {
        expect(getSelected()).toEqual([0, 0, 1, 1]);

        expect(copyPasteTextarea.val()).toEqual('A1\tB1\nA2\tB2\n');
      });
    });

    it("should not throw error when no cell is selected (#1221)", function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2)
      });

      selectCell(0, 0);
      deselectCell();

      function keydownCtrl(){
//        $(document).trigger($.Event('keydown', {
//          keyCode: Handsontable.helper.keyCode.COMMAND_LEFT
//        }));
        $(document).simulate('keydown', {
          keyCode: Handsontable.helper.KEY_CODES.COMMAND_LEFT
        });
      }

      // expect no to throw any exception
      expect(keydownCtrl).not.toThrow();
    });

    it("should set copyable text when selecting a single cell with specified type and hitting ctrl (#1300)", function () {
      handsontable({
        data: [['A', 1], ['B', 2]],
        columns: [
          {
            type: 'text'
          },
          {
            type: 'numeric'
          }
        ]
      });

      var copyPasteTextarea = $('textarea.copyPaste');

      expect(copyPasteTextarea.val().length).toEqual(0);

      selectCell(0, 0, 1, 1);
      keyDownUp(Handsontable.helper.KEY_CODES.CONTROL_LEFT);

      expect(copyPasteTextarea.val()).toEqual('A\t1\nB\t2\n');
    });

    it("should set copyable text when selecting a single cell with editor type as false (#2574)", function () {
      handsontable({
        data: [['A', 1], ['B', 2]],
        columns: [
          {
            type: 'text'
          },
          {
            editor: false
          }
        ]
      });

      var copyPasteTextarea = $('textarea.copyPaste');

      expect(copyPasteTextarea.val().length).toEqual(0);

      selectCell(1, 1, 1, 1);
      keyDownUp(Handsontable.helper.KEY_CODES.CONTROL_LEFT);

      expect(copyPasteTextarea.val()).toEqual('2\n');
    });


    describe("working with multiple tables", function () {
      beforeEach(function () {
        this.$container2 = $('<div id="' + id + '2"></div>').appendTo('body');
      });

      afterEach(function () {
        if (this.$container2) {
          this.$container2.handsontable('destroy');
          this.$container2.remove();
        }
      });

      it("should disable copyPaste only in particular table", function () {
        var hot1 = handsontable();
        var hot2 = this.$container2.handsontable({
          copyPaste: false
        });

        expect(hot1.copyPaste).toBeDefined();
        expect(hot2.copyPaste).toBeUndefined();
      });

      it("should create only one CopyPasteDiv regardless of the number of tables", function () {
        var hot1 = handsontable();
        var hot2 = this.$container2.handsontable();

        expect($('#CopyPasteDiv').length).toEqual(1);
      });

      it("should leave CopyPasteDiv as long as at least one table has copyPaste enabled", function () {
        var hot1 = handsontable();
        var hot2 = this.$container2.handsontable().handsontable('getInstance');

        expect($('#CopyPasteDiv').length).toEqual(1);

        hot1.updateSettings({
          copyPaste: false
        });

        expect($('#CopyPasteDiv').length).toEqual(1);

        hot2.updateSettings({
          copyPaste: false
        });

        expect($('#CopyPasteDiv').length).toEqual(0);
      });
    });
  });
});
