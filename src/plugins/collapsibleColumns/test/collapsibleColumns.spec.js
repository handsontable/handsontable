describe("CollapsibleColumns", function() {
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

  describe("collapsing headers functionality", function() {

    it("should hide all 'child' columns except the first one after clicking the 'collapse/expand' buttom/indicator", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: {
          colHeaders: [
            ['a', 'd', 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
            ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
          ],
          colspan: [
            [1, 4]
          ],
          overwriteHeaders: true
        },
        collapsibleColumns: true
      });

      var button = $('.collapsibleIndicator').first();
      var colgroupArray = $('colgroup col');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

      button.simulate('mousedown');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);
    });

    it("should hide all the 'child' columns except the first 'child' group, (if a 'child group' exists), after clicking the collapse/expand button", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: {
          colHeaders: [
            ['a', 'd', 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
            ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
          ],
          colspan: [
            [1, 4],
            [1, 2, 2]
          ],
          overwriteHeaders: true
        },
        collapsibleColumns: true
      });

      var button = $('.collapsibleIndicator').first();
      var colgroupArray = $('colgroup col');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

      button.simulate('mousedown');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);
    });

  });

  describe("expand headers functionality", function() {

    it("should expand all the 'child' columns of the colspanned header afte clicking the expand button", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: {
          colHeaders: [
            ['a', 'd', 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
            ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
          ],
          colspan: [
            [1, 4],
            [1, 2, 2]
          ],
          overwriteHeaders: true
        },
        collapsibleColumns: true
      });

      var button = $('.collapsibleIndicator').first();
      var colgroupArray = $('colgroup col');
      button.simulate('mousedown');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

      $('.collapsibleIndicator').first().simulate('mousedown');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

    });

  });
});