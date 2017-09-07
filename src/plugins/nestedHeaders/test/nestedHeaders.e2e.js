describe('NestedHeaders', function() {
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

  describe('initialization', function() {

    it('should be possible to disable the plugin using the disablePlugin method', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', {label: 'b', colspan: 3}, 'c', 'd'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        ]
      });

      var plugin = hot.getPlugin('nestedHeaders');

      expect($('TH[colspan=3]').size()).toBeGreaterThan(0);

      plugin.disablePlugin();
      hot.render();

      expect($('TH[colspan=3]').size()).toEqual(0);
    });

    it('should be possible to re-enable the plugin using the enablePlugin method', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', {label: 'b', colspan: 3}, 'c', 'd'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        ]
      });

      var plugin = hot.getPlugin('nestedHeaders');

      plugin.disablePlugin();
      hot.render();
      plugin.enablePlugin();
      hot.render();

      expect($('TH[colspan=3]').size()).toBeGreaterThan(0);
    });

    it('should be possible to initialize the plugin using the updateSettings method', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true
      });

      expect($('TH[colspan=3]').size()).toEqual(0);

      hot.updateSettings({
        nestedHeaders: [
          ['a', {label: 'b', colspan: 3}, 'c', 'd'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        ]
      });

      expect($('TH[colspan=3]').size()).toBeGreaterThan(0);
    });

  });

  describe('Basic functionality:', function() {
    it('should add as many header levels as the \'colHeaders\' property suggests', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', 'b', 'c', 'd'],
          ['a', 'b', 'c', 'd']
        ]
      });

      expect(hot.view.wt.wtTable.THEAD.querySelectorAll('tr').length).toEqual(2);
    });

    it('should adjust headers widths', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', {label: 'b', colspan: 2}, 'c', 'd'],
          ['a', 'Long column header', 'c', 'd']
        ]
      });

      var headers = hot.view.wt.wtTable.THEAD.querySelectorAll('tr:first-of-type th');

      expect(hot.getColWidth(1)).toBeGreaterThan(50);
      expect(headers[1].offsetWidth).toBeGreaterThan(100);
    });
  });

  describe('The \'colspan\' property', function() {
    it('should create nested headers, when using the \'colspan\' property', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
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

    it('should allow creating a more complex nested setup', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
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

    it('should render the setup properly after the table being scrolled', function() {
      function generateComplexSetup(rows, cols, obj) {
        var data = [];

        for (var i = 0; i < rows; i++) {
          for (var j = 0; j < cols; j++) {
            if (!data[i]) {
              data[i] = [];
            }

            if (!obj) {
              data[i][j] = i + '_' + j;
              /* eslint-disable no-continue */
              continue;
            }

            if (i === 0 && j % 2 !== 0) {
              data[i][j] = {
                label: i + '_' + j,
                colspan: 8
              };
            } else if (i === 1 && (j % 3 === 1 || j % 3 === 2)) {
              data[i][j] = {
                label: i + '_' + j,
                colspan: 4
              };
            } else if (i === 2 && (j % 5 === 1 || j % 5 === 2 || j % 5 === 3 || j % 5 === 4)) {
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
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 70, true),
        width: 400,
        height: 300,
        viewportColumnRenderingOffset: 15
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

      levels = [nonHiddenTHs(0), nonHiddenTHs(1), nonHiddenTHs(2), nonHiddenTHs(3)];

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

  describe('Selection:', function() {
    it('should select every column under the extended header', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', {label: 'B', colspan: 8}, 'C'],
          ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
          ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)').simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)').simulate('mouseup');

      expect(hot.getSelected()).toEqual([0, 1, hot.countRows() - 1, 2]);

      this.$container.find('.ht_clone_top thead tr:eq(1) th:eq(1)').simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(1) th:eq(1)').simulate('mouseup');

      expect(hot.getSelected()).toEqual([0, 1, hot.countRows() - 1, 4]);

      this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(1)').simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(1)').simulate('mouseup');

      expect(hot.getSelected()).toEqual([0, 1, hot.countRows() - 1, 8]);
    });

    it('should select every column under the extended headers, when changing the selection by dragging the cursor', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', {label: 'B', colspan: 8}, 'C'],
          ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
          ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)').simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(5)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(5)').simulate('mouseup');

      expect(hot.getSelected()).toEqual([0, 3, hot.countRows() - 1, 6]);

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)').simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)').simulate('mouseup');

      expect(hot.getSelected()).toEqual([0, 4, hot.countRows() - 1, 1]);

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)').simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(5)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(5)').simulate('mouseup');

      expect(hot.getSelected()).toEqual([0, 3, hot.countRows() - 1, 6]);
    });

    it('should highlight only last line of headers on cell selection', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', {label: 'B', colspan: 8}, 'C'],
          ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
          ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_master tbody tr:eq(2) td:eq(1)').simulate('mousedown');
      this.$container.find('.ht_master tbody tr:eq(2) td:eq(1)').simulate('mouseup');

      var headerLvl3 = this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)');
      var headerLvl4 = this.$container.find('.ht_clone_top thead tr:eq(3) th:eq(1)');

      expect(headerLvl3.hasClass('ht__highlight')).toBeFalsy();
      expect(headerLvl4.hasClass('ht__highlight')).toBeTruthy();
    });

    it('should highlight every header which was in selection on headers selection', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', {label: 'B', colspan: 8}, 'C'],
          ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
          ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)').simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)').simulate('mouseup');

      var headerLvl2 = this.$container.find('.ht_clone_top thead tr:eq(1) th:eq(1)');
      var headerLvl3 = this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)');
      var headerLvl41 = this.$container.find('.ht_clone_top thead tr:eq(3) th:eq(1)');
      var headerLvl42 = this.$container.find('.ht_clone_top thead tr:eq(3) th:eq(2)');

      expect(headerLvl2.hasClass('ht__highlight')).toBeFalsy();
      expect(headerLvl3.hasClass('ht__highlight')).toBeTruthy();
      expect(headerLvl41.hasClass('ht__highlight')).toBeTruthy();
      expect(headerLvl42.hasClass('ht__highlight')).toBeTruthy();
    });
  });

});
