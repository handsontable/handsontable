describe('FixedRowsBottom', function() {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Bottom Rows initialization', function() {

    it('should create an appropriate number of rows, declared by the fixedRowsBottom property', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 9),
        width: 200,
        height: 100
      });

      expect(hot.view.wt.wtOverlays.bottomOverlay.clone.wtTable.TBODY.childNodes.length).toEqual(0);

      hot.updateSettings({
        fixedRowsBottom: 2
      });

      expect(hot.view.wt.wtOverlays.bottomOverlay.clone.wtTable.TBODY.childNodes.length).toEqual(2);

      hot.updateSettings({
        fixedRowsBottom: 3
      });

      expect(hot.view.wt.wtOverlays.bottomOverlay.clone.wtTable.TBODY.childNodes.length).toEqual(3);
    });

    it('should create a bottom-left corner container if both fixedColumnsLeft and fixedRowsBottom are set to > 0', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 9),
        fixedColumnsLeft: 2,
        fixedRowsBottom: 2,
        width: 200,
        height: 100
      });

      // expect 5 overlay containers: master, top, left, bottom (the default setup) + bottom-left corner
      expect(this.$container.find('.handsontable').size()).toEqual(5);
    });

    it('should create an appropriate number of rows and cols for the bottom-left corner overlay', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(20, 20),
        fixedColumnsLeft: 2,
        fixedRowsBottom: 3,
        width: 400,
        height: 400
      });

      var cornerOverlayTBODY = hot.view.wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.TBODY;
      expect(cornerOverlayTBODY.childNodes.length).toEqual(3);
      expect(cornerOverlayTBODY.childNodes[0].childNodes.length).toEqual(2);
    });

    it('should place the bottom fixed rows at the bottom-left and bottom-right of the container', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(20, 20),
        fixedRowsBottom: 3,
        width: 400,
        height: 400
      });

      var containerBoundingBox = this.$container[0].getBoundingClientRect();
      var bottomOverlay = hot.view.wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
      var bottomOverlayBoundingBox = bottomOverlay.getBoundingClientRect();
      var scrollbarWidth = Handsontable.Dom.getScrollbarWidth();

      expect(containerBoundingBox.bottom).toEqual(bottomOverlayBoundingBox.bottom);
      expect(containerBoundingBox.left).toEqual(bottomOverlayBoundingBox.left);
      expect(containerBoundingBox.right).toEqual(bottomOverlayBoundingBox.right + scrollbarWidth);
      expect(containerBoundingBox.top).toBeLessThan(bottomOverlayBoundingBox.top);
    });

    it('should place the bottom-left corner overlay at the bottom-left of the container', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(20, 20),
        fixedRowsBottom: 3,
        fixedColumnsLeft: 2,
        width: 400,
        height: 400
      });

      var containerBoundingBox = this.$container[0].getBoundingClientRect();
      var cornerOverlay = hot.view.wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder;
      var cornerOverlayBoundingBox = cornerOverlay.getBoundingClientRect();
      var scrollbarWidth = Handsontable.Dom.getScrollbarWidth();

      expect(containerBoundingBox.bottom).toEqual(cornerOverlayBoundingBox.bottom + scrollbarWidth);
      expect(containerBoundingBox.left).toEqual(cornerOverlayBoundingBox.left);
      expect(containerBoundingBox.right).toBeGreaterThan(cornerOverlayBoundingBox.right);
      expect(containerBoundingBox.top).toBeLessThan(cornerOverlayBoundingBox.top);
    });

  });

  describe('Events', function() {
    describe('Scroll', function() {

      it('should stay at the bottom of the container after scrolling the table (along with the bottom-left corner)', function() {
        var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          fixedRowsBottom: 3,
          fixedColumnsLeft: 2,
          width: 400,
          height: 400
        });

        hot.view.scrollViewport(new WalkontableCellCoords(30,30));

        waits(100);

        runs(function() {
          var containerBoundingBox = this.$container[0].getBoundingClientRect();
          var bottomOverlay = hot.view.wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
          var bottomOverlayBoundingBox = bottomOverlay.getBoundingClientRect();
          var scrollbarWidth = Handsontable.Dom.getScrollbarWidth();

          expect(containerBoundingBox.bottom).toEqual(bottomOverlayBoundingBox.bottom);
          expect(containerBoundingBox.left).toEqual(bottomOverlayBoundingBox.left);
          expect(containerBoundingBox.right).toEqual(bottomOverlayBoundingBox.right + scrollbarWidth);

          var cornerOverlay = hot.view.wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder;
          var cornerOverlayBoundingBox = cornerOverlay.getBoundingClientRect();

          expect(containerBoundingBox.bottom).toEqual(cornerOverlayBoundingBox.bottom + scrollbarWidth);
          expect(containerBoundingBox.left).toEqual(cornerOverlayBoundingBox.left);
        });

      });

      it('should remain the values from the n last table rows (where n=fixedRowsBottom setting)', function() {
        var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          fixedRowsBottom: 3,
          fixedColumnsLeft: 2,
          width: 400,
          height: 400
        });

        hot.view.scrollViewport(new WalkontableCellCoords(49,49));

        waits(100);

        runs(function() {
          var bottomOverlay = hot.view.wt.wtOverlays.bottomOverlay.clone.wtTable.TBODY,
            bottomRows = bottomOverlay.childNodes.length,
            bottomCols = bottomOverlay.childNodes[0].childNodes.length;
          var cornerOverlay = hot.view.wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.TBODY;

          expect(bottomOverlay.childNodes[bottomRows - 1].childNodes[bottomCols - 1].innerText).toEqual('AX50');
          expect(cornerOverlay.childNodes[3 - 1].childNodes[2 - 1].innerText).toEqual('B50');
        });
      });
    });

    describe('Keyboard', function() {

      describe('Editing', function() {

        it('should display the text editor exactly over the edited cell', function() {
          var hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(50, 50),
            fixedRowsBottom: 3,
            width: 400,
            height: 400
          });

          var editedCell = getCell(49,5, true);
          var editedCellOffset = $(editedCell).offset();
          selectCell(49, 5);
          keyDownUp(Handsontable.helper.keyCode.ENTER);
          var textarea = $('.handsontableInputHolder').find('textarea').eq(0);
          var textareaOffset = textarea.offset();

          expect(editedCellOffset.top).toEqual(textareaOffset.top + 1);
          expect(editedCellOffset.left).toEqual(textareaOffset.left + 1);
        });

        it('should allow cell editing within fixed bottom rows', function() {
          var hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(50, 50),
            fixedRowsBottom: 3,
            width: 400,
            height: 400
          });

          selectCell(49, 5);
          expect(getDataAtCell(49,5)).toEqual('F50');

          keyDownUp(Handsontable.helper.keyCode.ENTER);

          var editorHolder = $('.handsontableInputHolder');
          editorHolder.find('textarea').eq(0).val(':x');
          keyDownUp(Handsontable.helper.keyCode.ENTER);
          expect(getDataAtCell(49,5)).toEqual(':x');
        });
      });

      xdescribe('Navigation', function() {
        var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          fixedRowsBottom: 3,
          fixedColumnsLeft: 2,
          width: 400,
          height: 400
        });

      });

    });
  });
});