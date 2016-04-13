describe("MultipleSelectionHandles", function () {
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


  describe("at init:", function () {

    it("should add 2 visible selection handles (for each overlay) if mobile device is detected", function () {
      var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
          width: 400,
          height: 400,
          fixedRowsTop: 2,
          fixedColumnsLeft: 2
        })
        , selected = null
        , overlay = null;

      if(!Handsontable.helper.isMobileBrowser()) {
        return true;
      }


      hot.selectCell(3, 3);
      selected = hot.getSelected();
      overlay = getCorrespondingOverlay(hot.getCell(selected[0], selected[1], true), this.$container);

      expect(overlay.find(".bottomRightSelectionHandle").size()).toEqual(3); // one for area, fill and current - 2 may be redundant
      expect(overlay.find(".topLeftSelectionHandle").size()).toEqual(3);

      hot.selectCell(0, 0);
      selected = hot.getSelected();
      overlay = getCorrespondingOverlay(hot.getCell(selected[0], selected[1], true), this.$container);

      expect(overlay.find(".bottomRightSelectionHandle").size()).toEqual(3); // one for area, fill and current
      expect(overlay.find(".topLeftSelectionHandle").size()).toEqual(3);

      hot.selectCell(0, 3);
      selected = hot.getSelected();
      overlay = getCorrespondingOverlay(hot.getCell(selected[0], selected[1], true), this.$container);

      expect(overlay.find(".bottomRightSelectionHandle").size()).toEqual(3); // one for area, fill and current
      expect(overlay.find(".topLeftSelectionHandle").size()).toEqual(3);

      hot.selectCell(3, 0);
      selected = hot.getSelected();
      overlay = getCorrespondingOverlay(hot.getCell(selected[0], selected[1], true), this.$container);

      expect(overlay.find(".bottomRightSelectionHandle").size()).toEqual(3); // one for area, fill and current
      expect(overlay.find(".topLeftSelectionHandle").size()).toEqual(3);

    });

    it("should add a larger hit area to each selection handle if mobile device is detected", function () {
      var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
          width: 400,
          height: 400,
          fixedRowsTop: 2,
          fixedColumnsLeft: 2
        })
        , selected = null
        , overlay = null;

      if(!Handsontable.helper.isMobileBrowser()) {
        return true;
      }

      hot.selectCell(3, 3);
      selected = hot.getSelected();
      overlay = getCorrespondingOverlay(hot.getCell(selected[0], selected[1], true), this.$container);

      var topLefts = overlay.find(".topLeftSelectionHandle")
        , bottomRights = overlay.find(".bottomRightSelectionHandle");

      for(var elem = 0; elem < topLefts.length; elem++) {
        var parent = $(topLefts[elem]).parent();

        var hitArea = parent.find(".topLeftSelectionHandle-HitArea");

        expect(hitArea.size()).toEqual(1);
        expect(hitArea.eq(0).width()).toBeGreaterThan($(topLefts[elem]).width());
        expect(hitArea.eq(0).height()).toBeGreaterThan($(topLefts[elem]).height());
      }

      for(var elem = 0; elem < bottomRights.length; elem++) {
        var parent = $(bottomRights[elem]).parent();

        var hitArea = parent.find(".bottomRightSelectionHandle-HitArea");

        expect(hitArea.size()).toEqual(1);
        expect(hitArea.eq(0).width()).toBeGreaterThan($(bottomRights[elem]).width());
        expect(hitArea.eq(0).height()).toBeGreaterThan($(bottomRights[elem]).height());
      }

    });

    it("should NOT add any selection handles if mobile device is NOT detected", function () {
      var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
          width: 400,
          height: 400,
          fixedRowsTop: 2,
          fixedColumnsLeft: 2
        })
        , selected = null
        , overlay = null;

      if(Handsontable.helper.isMobileBrowser()) {
        return true;
      }

      hot.selectCell(3, 3);
      selected = hot.getSelected();
      overlay = getCorrespondingOverlay(hot.getCell(selected[0], selected[1], true), this.$container);

      expect(overlay.find(".bottomRightSelectionHandle").size()).toEqual(0);
      expect(overlay.find(".topLeftSelectionHandle").size()).toEqual(0);

      hot.selectCell(0, 0);
      selected = hot.getSelected();
      overlay = getCorrespondingOverlay(hot.getCell(selected[0], selected[1], true), this.$container);

      expect(overlay.find(".bottomRightSelectionHandle").size()).toEqual(0);
      expect(overlay.find(".topLeftSelectionHandle").size()).toEqual(0);

      hot.selectCell(0, 3);
      selected = hot.getSelected();
      overlay = getCorrespondingOverlay(hot.getCell(selected[0], selected[1], true), this.$container);

      expect(overlay.find(".bottomRightSelectionHandle").size()).toEqual(0);
      expect(overlay.find(".topLeftSelectionHandle").size()).toEqual(0);

      hot.selectCell(3, 0);
      selected = hot.getSelected();
      overlay = getCorrespondingOverlay(hot.getCell(selected[0], selected[1], true), this.$container);

      expect(overlay.find(".bottomRightSelectionHandle").size()).toEqual(0);
      expect(overlay.find(".topLeftSelectionHandle").size()).toEqual(0);
    });

    it("should not display any selection handles between overlays, if selection is spread over more than one overlay", function () {
      var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(10, 7),
          width: 400,
          height: 400,
          fixedRowsTop: 2,
          fixedColumnsLeft: 2
        })
        , selected = null
        , firstOverlay = null
        , secondOverlay = null;

      if(!Handsontable.helper.isMobileBrowser()) {
        return true;
      }

      hot.selectCell(1, 3, 4, 4);
      selected = hot.getSelected();

      firstOverlay = getCorrespondingOverlay(hot.getCell(selected[0], selected[1], true), this.$container);

      var firstOverlayBottomRights = firstOverlay.find(".bottomRightSelectionHandle");

      expect(firstOverlayBottomRights.size()).toEqual(3);
      expect(firstOverlay.find(".topLeftSelectionHandle").size()).toEqual(3);

      for(var i = 0, handleCount = firstOverlayBottomRights.length; i < handleCount; i++) {
        expect(firstOverlayBottomRights.eq(i).css("display")).toEqual("none");
      }
    });
  });

});
