describe("NestedHeaders", function() {
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

  describe("Basic functionality:", function() {

    it("should add as many header levels as the 'colHeaders' property suggests", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        nestedHeaders: {
          colHeaders: [
            ['a', 'b', 'c', 'd'],
            ['a', 'b', 'c', 'd']
          ]
        }
      });

      expect(hot.view.wt.wtTable.THEAD.querySelectorAll('tr').length).toEqual(2);

    });
  });

  describe("The 'colspan' property", function() {
    it("should create nested headers, when using the 'colspan' property", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        nestedHeaders: {
          colHeaders: [
            ['a', 'b', 'c', 'd'],
            ['a', 'b', 'c', 'd', 'e']
          ],
          colspan: [
            [1, 2, 1, 1],
            [1, 1, 1, 1, 1]
          ]
        }
      });

      var headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');

      expect(headerRows[0].querySelector('th:nth-child(1)').getAttribute('colspan')).toEqual(null);
      expect(headerRows[0].querySelector('th:nth-child(2)').getAttribute('colspan')).toEqual('2');
      expect(headerRows[0].querySelector('th:nth-child(3)').getAttribute('colspan')).toEqual(null);

      expect(headerRows[1].querySelector('th:nth-child(1)').getAttribute('colspan')).toEqual(null);
      expect(headerRows[1].querySelector('th:nth-child(2)').getAttribute('colspan')).toEqual(null);
      expect(headerRows[1].querySelector('th:nth-child(3)').getAttribute('colspan')).toEqual(null);

    });

    it("should create nested headers, when using the 'colspan' property, while not providing a fully filled colspan array", function() {
      var colspanArray = [];
      colspanArray[1] = 2;

      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        nestedHeaders: {
          colHeaders: [
            ['a', 'b', 'c', 'd'],
            ['a', 'b', 'c', 'd', 'e']
          ],
          colspan: [
            colspanArray
          ]
        }
      });

      var headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');

      expect(headerRows[0].querySelector('th:nth-child(1)').getAttribute('colspan')).toEqual(null);
      expect(headerRows[0].querySelector('th:nth-child(2)').getAttribute('colspan')).toEqual('2');
      expect(headerRows[0].querySelector('th:nth-child(3)').getAttribute('colspan')).toEqual(null);

      expect(headerRows[1].querySelector('th:nth-child(1)').getAttribute('colspan')).toEqual(null);
      expect(headerRows[1].querySelector('th:nth-child(2)').getAttribute('colspan')).toEqual(null);
      expect(headerRows[1].querySelector('th:nth-child(3)').getAttribute('colspan')).toEqual(null);
    });

  });

  describe("The 'overwriteHeaders' property:", function() {

    it("should not overwrite the previously declared headers, when the 'overwriteHeaders' property is set to false", function() {
      var colspanArray = [];
      colspanArray[1] = 2;

      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: {
          colHeaders: [
            ['1a', '1b', '1c', '1d'],
            ['2a', '2b', '2c', '2d', '2e']
          ],
          colspan: [
            colspanArray
          ],
          overwriteHeaders: false
        }
      });

      var headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');

      expect(headerRows[0].querySelector('th:nth-child(1) span').innerText).toEqual('1a');
      expect(headerRows[0].querySelector('th:nth-child(2) span').innerText).toEqual('1b');
      expect(headerRows[0].querySelector('th:nth-child(3) span').innerText).toEqual('1c');

      expect(headerRows[1].querySelector('th:nth-child(1) span').innerText).toEqual('A');
      expect(headerRows[1].querySelector('th:nth-child(2) span').innerText).toEqual('B');
      expect(headerRows[1].querySelector('th:nth-child(3) span').innerText).toEqual('C');
    });

    it("should overwrite the previously declared headers, when the 'overwriteHeaders' property is set to true", function() {
      var colspanArray = [];
      colspanArray[1] = 2;

      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: {
          colHeaders: [
            ['1a', '1b', '1c', '1d'],
            ['2a', '2b', '2c', '2d', '2e']
          ],
          colspan: [
            colspanArray
          ],
          overwriteHeaders: true
        }
      });

      var headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');

      expect(headerRows[0].querySelector('th:nth-child(1) span').innerText).toEqual('1a');
      expect(headerRows[0].querySelector('th:nth-child(2) span').innerText).toEqual('1b');
      expect(headerRows[0].querySelector('th:nth-child(3) span').innerText).toEqual('1c');

      expect(headerRows[1].querySelector('th:nth-child(1) span').innerText).toEqual('2a');
      expect(headerRows[1].querySelector('th:nth-child(2) span').innerText).toEqual('2b');
      expect(headerRows[1].querySelector('th:nth-child(3) span').innerText).toEqual('2c');
    });

    it("should overwrite the previously declared headers, when the 'overwriteHeaders' property is not set", function() {
      var colspanArray = [];
      colspanArray[1] = 2;

      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: {
          colHeaders: [
            ['1a', '1b', '1c', '1d'],
            ['2a', '2b', '2c', '2d', '2e']
          ],
          colspan: [
            colspanArray
          ]
        }
      });

      var headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');

      expect(headerRows[0].querySelector('th:nth-child(1) span').innerText).toEqual('1a');
      expect(headerRows[0].querySelector('th:nth-child(2) span').innerText).toEqual('1b');
      expect(headerRows[0].querySelector('th:nth-child(3) span').innerText).toEqual('1c');

      expect(headerRows[1].querySelector('th:nth-child(1) span').innerText).toEqual('2a');
      expect(headerRows[1].querySelector('th:nth-child(2) span').innerText).toEqual('2b');
      expect(headerRows[1].querySelector('th:nth-child(3) span').innerText).toEqual('2c');
    });

  });

});