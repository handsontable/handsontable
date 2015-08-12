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
        nestedHeaders: [
          ['a', 'b', 'c', 'd'],
          ['a', 'b', 'c', 'd']
        ]
      });

      expect(hot.view.wt.wtTable.THEAD.querySelectorAll('tr').length).toEqual(2);

    });
  });

  describe("The 'colspan' property", function() {
    it("should create nested headers, when using the 'colspan' property", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['a', {label: 'b', colspan: 2}, 'c', 'd'],
          ['a', 'b', 'c', 'd', 'e']
        ]
      });

      var headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');

      expect(headerRows[0].querySelector('th:nth-child(1)').getAttribute('colspan')).toEqual(null);
      expect(headerRows[0].querySelector('th:nth-child(2)').getAttribute('colspan')).toEqual('2');
      expect(headerRows[0].querySelector('th:nth-child(3)').getAttribute('colspan')).toEqual(null);

      expect(headerRows[1].querySelector('th:nth-child(1)').getAttribute('colspan')).toEqual(null);
      expect(headerRows[1].querySelector('th:nth-child(2)').getAttribute('colspan')).toEqual(null);
      expect(headerRows[1].querySelector('th:nth-child(3)').getAttribute('colspan')).toEqual(null);

    });

    it("should allow creating a more complex nested setup", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['a', {label: 'b', colspan: 4}, 'c', 'd'],
          ['a', {label: 'b', colspan: 2}, {label: 'c', colspan: 2}, 'd', 'e']
        ]
      });

      var headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');
      var nonHiddenTHs = function(row) {
        return headerRows[row].querySelectorAll('th:not(.hiddenHeader)');
      };
      var firstLevel = nonHiddenTHs(0);
      var secondLevel = nonHiddenTHs(1);

      expect(firstLevel[0].getAttribute('colspan')).toEqual(null);
      expect(firstLevel[1].getAttribute('colspan')).toEqual('4');
      expect(firstLevel[2].getAttribute('colspan')).toEqual(null);

      expect(secondLevel[0].getAttribute('colspan')).toEqual(null);
      expect(secondLevel[1].getAttribute('colspan')).toEqual('2');
      expect(secondLevel[2].getAttribute('colspan')).toEqual('2');
      expect(secondLevel[3].getAttribute('colspan')).toEqual(null);
    });

    it("should render the setup properly after the table being scrolled", function() {
      function generateComplexSetup(rows, cols, obj) {
        var data = [];

        for(var i = 0; i < rows; i++) {
          for(var j = 0; j < cols; j++) {
            if(!data[i]) {
              data[i] = [];
            }

            if(!obj) {
              data[i][j] = i + '_' + j;
              continue;
            }

            if(i === 0 && j%2 !== 0) {
              data[i][j] = {
                label: i + '_' + j,
                colspan: 8
              };
            } else if(i === 1 && (j%3 === 1 || j%3 === 2)) {
              data[i][j] = {
                label: i + '_' + j,
                colspan: 4
              };
            } else if(i === 2 && (j%5 === 1 || j%5 === 2 || j%5 === 3 || j%5 === 4)) {
              data[i][j] = {
                label: i + '_' + j,
                colspan: 2
              };
            } else {
              data[i][j] = i + '_' + j;
            }

          }
        }

        return data;
      }

      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        nestedHeaders: generateComplexSetup(4, 70, true),
        width: 400,
        height: 300
      });

      var headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');
      var nonHiddenTHs = function(row) {
        return headerRows[row].querySelectorAll('th:not(.hiddenHeader)');
      };
      var levels = [nonHiddenTHs(0), nonHiddenTHs(1), nonHiddenTHs(2), nonHiddenTHs(3)];

      // not scrolled
      expect(levels[0][0].getAttribute('colspan')).toEqual(null);
      expect(levels[0][1].getAttribute('colspan')).toEqual('8');
      expect(levels[0][2].getAttribute('colspan')).toEqual(null);
      expect(levels[0][3].getAttribute('colspan')).toEqual('8');

      expect(levels[1][0].getAttribute('colspan')).toEqual(null);
      expect(levels[1][1].getAttribute('colspan')).toEqual('4');
      expect(levels[1][2].getAttribute('colspan')).toEqual('4');
      expect(levels[1][3].getAttribute('colspan')).toEqual(null);

      expect(levels[2][0].getAttribute('colspan')).toEqual(null);
      expect(levels[2][1].getAttribute('colspan')).toEqual('2');
      expect(levels[2][2].getAttribute('colspan')).toEqual('2');
      expect(levels[2][3].getAttribute('colspan')).toEqual('2');

      expect(levels[3][0].getAttribute('colspan')).toEqual(null);
      expect(levels[3][1].getAttribute('colspan')).toEqual(null);
      expect(levels[3][2].getAttribute('colspan')).toEqual(null);
      expect(levels[3][3].getAttribute('colspan')).toEqual(null);

      hot.view.wt.scrollHorizontal(40);
      hot.render();

      var levels = [nonHiddenTHs(0), nonHiddenTHs(1), nonHiddenTHs(2), nonHiddenTHs(3)];

      // scrolled
      expect(levels[0][0].getAttribute('colspan')).toEqual('8');
      expect(levels[0][1].getAttribute('colspan')).toEqual(null);
      expect(levels[0][2].getAttribute('colspan')).toEqual('8');
      expect(levels[0][3].getAttribute('colspan')).toEqual(null);

      expect(levels[1][0].getAttribute('colspan')).toEqual('4');
      expect(levels[1][1].getAttribute('colspan')).toEqual('4');
      expect(levels[1][2].getAttribute('colspan')).toEqual(null);
      expect(levels[1][3].getAttribute('colspan')).toEqual('4');

      expect(levels[2][0].getAttribute('colspan')).toEqual('2');
      expect(levels[2][1].getAttribute('colspan')).toEqual('2');
      expect(levels[2][2].getAttribute('colspan')).toEqual('2');
      expect(levels[2][3].getAttribute('colspan')).toEqual('2');

      expect(levels[3][0].getAttribute('colspan')).toEqual(null);
      expect(levels[3][1].getAttribute('colspan')).toEqual(null);
      expect(levels[3][2].getAttribute('colspan')).toEqual(null);
      expect(levels[3][3].getAttribute('colspan')).toEqual(null);
    });

  });

});