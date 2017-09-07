describe('CollapsibleColumns', function() {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');

    this.generateComplexSetup = function(rows, cols, obj) {
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
    };

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
        hiddenColumns: true,
        nestedHeaders: [
          ['a', {label: 'd', colspan: 4}, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true
      });

      var collapsibleColumnsPlugin = hot.getPlugin('collapsibleColumns');

      expect($('.collapsibleIndicator').size()).toBeGreaterThan(0);

      collapsibleColumnsPlugin.disablePlugin();
      hot.render();

      expect($('.collapsibleIndicator').size()).toEqual(0);
    });

    it('should be possible to re-enable the plugin using the enablePlugin method', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', {label: 'd', colspan: 4}, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true
      });

      var collapsibleColumnsPlugin = hot.getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.disablePlugin();
      hot.render();
      collapsibleColumnsPlugin.enablePlugin();
      hot.render();

      expect($('.collapsibleIndicator').size()).toBeGreaterThan(0);
    });

    it('should be possible to initialize the plugin using the updateSettings method', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', {label: 'd', colspan: 4}, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ]
      });

      hot.updateSettings({
        collapsibleColumns: true
      });

      expect($('.collapsibleIndicator').size()).toBeGreaterThan(0);
    });

  });

  describe('collapsing headers functionality', function() {

    it('should hide all "child" columns except the first one after clicking the "collapse/expand" button/indicator', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', {label: 'd', colspan: 4}, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
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

    it('should hide all the "child" columns except the first "child" group, (if a "child group" exists), after clicking the collapse/expand button', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', {label: 'd', colspan: 4}, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', {label: 'b', colspan: 2}, {label: 'c', colspan: 2}, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
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

    xit('should maintain the collapse functionality, when the table has been scrolled', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        hiddenColumns: true,
        nestedHeaders: this.generateComplexSetup(4, 70, true),
        collapsibleColumns: true,
        width: 400,
        height: 300
      });

      hot.view.wt.scrollHorizontal(37);
      hot.render();

      var button = $('.collapsibleIndicator').eq(0);
      var colgroupArray = $('colgroup col');

      button.simulate('mousedown');

      expect(parseInt(colgroupArray.eq(4).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(7).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(8).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(9).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(10).width(), 10)).toBeGreaterThan(0);
    });
  });

  describe('expand headers functionality', function() {

    it('should expand all the "child" columns of the colspanned header afte clicking the expand button', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', {label: 'd', colspan: 4}, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', {label: 'b', colspan: 2}, {label: 'c', colspan: 2}, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
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

    it('should maintain the expand functionality, when the table has been scrolled', function(done) {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        hiddenColumns: true,
        nestedHeaders: this.generateComplexSetup(4, 70, true),
        collapsibleColumns: true,
        width: 400,
        height: 300
      });

      setTimeout(function() {
        hot.view.wt.scrollHorizontal(37);
        hot.render();

        var button = $('.collapsibleIndicator').eq(0);
        var colgroupArray = $('colgroup col');

        button.simulate('mousedown');
        button = $('.collapsibleIndicator').eq(0);
        button.simulate('mousedown');

        expect(parseInt(colgroupArray.eq(4).width(), 10)).toBeGreaterThan(0);
        expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
        expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);
        expect(parseInt(colgroupArray.eq(7).width(), 10)).toBeGreaterThan(0);
        expect(parseInt(colgroupArray.eq(8).width(), 10)).toBeGreaterThan(0);
        expect(parseInt(colgroupArray.eq(9).width(), 10)).toBeGreaterThan(0);
        expect(parseInt(colgroupArray.eq(10).width(), 10)).toBeGreaterThan(0);

        done();
      }, 100);

    });

    it('should add an expand/collapse button only to the appropriate headers, if the collapsibleColumns option is set to an array of objects', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        hiddenColumns: true,
        nestedHeaders: this.generateComplexSetup(4, 70, true),
        collapsibleColumns: [
          {row: -4, col: 1, collapsible: true},
          {row: -3, col: 5, collapsible: true}
        ],
        width: 500,
        height: 300
      });

      var TRs = document.querySelectorAll('.handsontable THEAD TR');

      expect(TRs[0].querySelector('TH:nth-child(2) .collapsibleIndicator')).not.toEqual(null);
      expect(TRs[0].querySelector('TH:nth-child(10) .collapsibleIndicator')).toEqual(null);

      expect(TRs[1].querySelector('TH:nth-child(2) .collapsibleIndicator')).toEqual(null);
      expect(TRs[1].querySelector('TH:nth-child(6) .collapsibleIndicator')).not.toEqual(null);

    });

  });
});
