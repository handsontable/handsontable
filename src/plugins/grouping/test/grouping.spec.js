describe("Grouping plugin:", function () {
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

  describe("Initialization", function () {

    it("should not enable plugin if 'groups' config option is not set or set to false", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10)
      });
      expect(Handsontable.Grouping).toBeFalsy();

      hot.updateSettings({
        groups: false
      });
      expect(Handsontable.Grouping).toBeFalsy();

      hot.updateSettings({
        groups: [{rows: [2, 4]}]
      });
      expect(Handsontable.Grouping).toBeTruthy();

      hot.updateSettings({
        groups: false
      });
      expect(Handsontable.Grouping).toBeFalsy();

    });

    it("should create as many row/col groups as provided in the configuration", function () {
      var groupConfig = [
        { rows: [2, 4] },
        { rows: [5, 6] },
        { rows: [7, 9] },
        { cols: [7, 9] },
        { cols: [7, 9] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      var groups = Handsontable.Grouping;

      expect(groups.getRowGroups().length).toEqual(3);
      expect(groups.getColGroups().length).toEqual(2);

      hot.updateSettings({
        groups: [
          { cols: [1, 2] },
          { rows: [1, 2] },
          { rows: [3, 5] }
        ]
      });

      expect(groups.getRowGroups().length).toEqual(2);
      expect(groups.getColGroups().length).toEqual(1);

    });

    it("should throw an error when trying to define an empty group", function () {
      var groupConfig = [
        { rows: [2, 4] },
        { rows: [3, 6] }
      ];

      var caught = false
        , hot;

      try {
        hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          groups: groupConfig
        });
      } catch(err) {
        caught = true;
      }

      expect(caught).toBe(true);

      caught = true;

      groupConfig = [
        { cols: [2, 4] },
        { cols: [0] }
      ];

      try {
        hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          groups: groupConfig
        });
      } catch(err) {
        caught = true;
      }

      expect(caught).toBe(true);
    });

    it("should throw an error when trying to define a one-entry group", function () {
      var groupConfig = [
        { rows: [2, 4] },
        { rows: [3, 6] }
      ];

      var caught = false
        , hot;

      try {
        hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          groups: groupConfig
        });
      } catch(err) {
        caught = true;
      }

      expect(caught).toBe(true);

      caught = true;

      groupConfig = [
        { cols: [2, 4] },
        { cols: [3] }
      ];

      try {
        hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          groups: groupConfig
        });
      } catch(err) {
        caught = true;
      }

      expect(caught).toBe(true);
    });

    it("should throw an error when groups in the configuration overlap", function () {
      var groupConfig = [
        { rows: [2, 4] },
        { rows: [3, 6] }
      ];

      var caught = false
        , hot;

      try {
        hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          groups: groupConfig
        });
      } catch(err) {
        caught = true;
      }

      expect(caught).toBe(true);

      caught = true;

      groupConfig = [
        { cols: [2, 4] },
        { cols: [3, 6] }
      ];

      try {
        hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          groups: groupConfig
        });
      } catch(err) {
        caught = true;
      }

      expect(caught).toBe(true);
    });

    it("should arrange groups in levels if ranges contain themselves", function () {
      var groupConfig = [
        { rows: [2, 8] },
        { rows: [5, 6] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      var groups = Handsontable.Grouping;

      expect(groups.getLevels().rows).toEqual(2);

      var groupConfig = [
        { rows: [2, 8] },
        { rows: [3, 7] },
        { rows: [4, 6] },
        { cols: [2, 8] },
        { cols: [5, 6] }
      ];

      hot = updateSettings({
        groups: groupConfig
      });

      expect(groups.getLevels().rows).toEqual(3);
      expect(groups.getLevels().cols).toEqual(2);

    });

  });

  describe("GUI:", function () {
    it("should create additional column header levels for each column group level + one empty level", function () {
      var groupConfig = [
        { cols: [2, 4] },
        { cols: [5, 6] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      expect(this.$container.find(".ht_master thead tr").length).toEqual(3); // 1 level + 1 empty + 1 standard header

      groupConfig = [
        { cols: [2, 8] },
        { cols: [3, 4] }
      ];
      hot.updateSettings({groups: groupConfig});

      expect(this.$container.find(".ht_master thead tr").length).toEqual(4); // 2 levels + 1 empty + 1 standard header

      groupConfig = [
        { cols: [2, 4] },
        { cols: [5, 6] }
      ];
      hot.updateSettings({groups: groupConfig});

      expect(this.$container.find(".ht_master thead tr").length).toEqual(3); // 1 level + 1 empty + 1 standard header
    });

    it("should create additional row header levels for each row group level + one empty level", function () {
      var groupConfig = [
        { rows: [2, 4] },
        { rows: [5, 6] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      expect(this.$container.find(".ht_master tbody tr:first-child th").length).toEqual(3); // 1 level + 1 empty + 1 standard header

      groupConfig = [
        { rows: [2, 8] },
        { rows: [3, 4] }
      ];
      hot.updateSettings({groups: groupConfig});

      expect(this.$container.find(".ht_master tbody tr:first-child th").length).toEqual(4); // 2 levels + 1 empty + 1 standard header

      groupConfig = [
        { rows: [2, 4] },
        { rows: [5, 6] }
      ];
      hot.updateSettings({groups: groupConfig});

      expect(this.$container.find(".ht_master tbody tr:first-child th").length).toEqual(3); // 1 level + 1 empty + 1 standard header

    });

    it("should add 'htGroupIndicatorContainer' class to every cell in group indicator rows and columns", function () {
      var groupConfig = [
        { rows: [2, 4] },
        { rows: [5, 6] },
        { cols: [5, 9] },
        { cols: [6, 7] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      var rowGroupHeaders = this.$container.find("tbody tr th").not(":last-of-type");
      for(var i = 0, rowHeadersCount = rowGroupHeaders.length; i < rowHeadersCount; i++) {
          expect(Handsontable.Dom.hasClass(rowGroupHeaders[i], 'htGroupIndicatorContainer')).toBe(true);
      }

      var colGroupHeaders = this.$container.find("thead tr").not(":last-of-type").find("th");
      for(var i = 0, colHeadersCount = colGroupHeaders.length; i < colHeadersCount; i++) {
        expect(Handsontable.Dom.hasClass(colGroupHeaders[i], 'htGroupIndicatorContainer')).toBe(true);
      }

    });

    it('should add a div element with "htHorizontalGroup" class to every th element responsible for indicating a column group', function () {
      var groupConfig = [
        { cols: [5, 9] },
        { cols: [6, 7] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      var rowHeaders = this.$container.find(".ht_master thead tr:first-child .htGroupIndicatorContainer").slice(6);
      for(var i = 0, rowHeadersCount = rowHeaders.length; i < rowHeadersCount; i++) {
        expect($(rowHeaders[i]) .find("div.htHorizontalGroup").length).toEqual(1);
      }

      rowHeaders = this.$container.find(".ht_master thead tr:nth-child(2) .htGroupIndicatorContainer").slice(7, 9);
      for(var i = 0, rowHeadersCount = rowHeaders.length; i < rowHeadersCount; i++) {
        expect($(rowHeaders[i]) .find("div.htHorizontalGroup").length).toEqual(1);
      }

    });

    it("should add a 'htGroupStart' class to a div in every first th of the horizontal 'group line'", function () {
      var groupConfig = [
        { cols: [5, 9] },
        { cols: [6, 7] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      var rowHeaders = this.$container.find(".ht_master thead tr:first-child .htGroupIndicatorContainer").slice(6,7);
        expect($(rowHeaders[0]) .find("div.htGroupStart").length).toEqual(1);

      rowHeaders = this.$container.find(".ht_master thead tr:nth-child(2) .htGroupIndicatorContainer").slice(7, 8);
        expect($(rowHeaders[0]) .find("div.htGroupStart").length).toEqual(1);
    });

    it("should add a htCollapseButton class to a div in every last th of the horizontal 'group line'", function () {
      var groupConfig = [
        { cols: [5, 9] },
        { cols: [6, 7] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      var rowHeaders = this.$container.find(".ht_master thead tr:first-child .htGroupIndicatorContainer").slice(10,11);
      expect($(rowHeaders[0]) .find("div.htCollapseButton").length).toEqual(1);

      rowHeaders = this.$container.find(".ht_master thead tr:nth-child(2) .htGroupIndicatorContainer").slice(8, 9);
      expect($(rowHeaders[0]) .find("div.htCollapseButton").length).toEqual(1);
    });

    it('should add a div element with "htVerticalGroup" class to every th element responsible for indicating a row group', function () {
      var groupConfig = [
        { rows: [5, 9] },
        { rows: [6, 7] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      var rowHeaders = this.$container.find(".ht_master tbody tr th:first-child.htGroupIndicatorContainer").slice(6);
      for(var i = 0, rowHeadersCount = rowHeaders.length; i < rowHeadersCount; i++) {
        expect($(rowHeaders[i]) .find("div.htVerticalGroup").length).toEqual(1);
      }

      rowHeaders = this.$container.find(".ht_master tbody tr th:nth-child(2).htGroupIndicatorContainer").slice(6, 8);
      for(var i = 0, rowHeadersCount = rowHeaders.length; i < rowHeadersCount; i++) {
        expect($(rowHeaders[i]) .find("div.htVerticalGroup").length).toEqual(1);
      }

    });

    it("should add a 'htGroupStart' class to a div in every first th of the horizontal 'group line'", function () {
      var groupConfig = [
        { rows: [5, 9] },
        { rows: [6, 7] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      var rowHeaders = this.$container.find(".ht_master tbody tr th:first-child.htGroupIndicatorContainer").slice(5,6);
      expect($(rowHeaders[0]) .find("div.htGroupStart").length).toEqual(1);

      rowHeaders = this.$container.find(".ht_master tbody tr th:nth-child(2).htGroupIndicatorContainer").slice(6, 7);
      expect($(rowHeaders[0]) .find("div.htGroupStart").length).toEqual(1);
    });

    it("should add a htCollapseButton class to a div in every last th of the horizontal 'group line'", function () {
      var groupConfig = [
        { rows: [5, 9] },
        { rows: [6, 7] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      var rowHeaders = this.$container.find(".ht_master tbody tr th:first-child.htGroupIndicatorContainer").slice(9,10);
      expect($(rowHeaders[0]) .find("div.htCollapseButton").length).toEqual(1);

      rowHeaders = this.$container.find(".ht_master tbody tr th:nth-child(2).htGroupIndicatorContainer").slice(7, 8);
      expect($(rowHeaders[0]) .find("div.htCollapseButton").length).toEqual(1);
    });

    it("should add a div with class 'htExpandButton' to every th following the last group indicator", function () {

      var groupConfig = [
        { rows: [4, 8] },
        { rows: [5, 6] },
        { cols: [4, 8] },
        { cols: [5, 6] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      var rowHeaders = this.$container.find(".ht_master tbody tr th:first-child.htGroupIndicatorContainer").slice(9,10);
      if(rowHeaders.length > 0) { // if needed row header is rendered - depends on viewportColumnRenderingOffset and window size
        expect($(rowHeaders[0]).find("div.htExpandButton").length).toEqual(1);
      }

      rowHeaders = this.$container.find(".ht_master tbody tr th:nth-child(2).htGroupIndicatorContainer").slice(7, 8);
      if(rowHeaders.length > 0) { // if needed row header is rendered - depends on viewportColumnRenderingOffset and window size
        expect($(rowHeaders[0]).find("div.htExpandButton").length).toEqual(1);
      }

      rowHeaders = this.$container.find(".ht_master thead tr:first-child .htGroupIndicatorContainer").slice(13,14);
      if(rowHeaders.length > 0) { // if needed row header is rendered - depends on viewportColumnRenderingOffset and window size
        expect($(rowHeaders[0]) .find("div.htExpandButton").length).toEqual(1);
      }

      rowHeaders = this.$container.find(".ht_master thead tr:nth-child(2) .htGroupIndicatorContainer").slice(11, 12);
      if(rowHeaders.length > 0) { // if needed row header is rendered - depends on viewportColumnRenderingOffset and window size
        expect($(rowHeaders[0]).find("div.htExpandButton ").length).toEqual(1);
      }
    });

  });

  describe("Events:", function() {

    it("should add 'hidden' class to appropriate rows after a collapse button (-) is clicked", function () {
      var groupConfig = [
        { rows: [4, 8] },
        { rows: [5, 6] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      for(var i = 5; i < 9; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master tbody tr:nth-child("+ i +")")[0],"hidden")).toBe(false);
      }

      mouseDown($("#htCollapse-r1")[0]);

      for(var i = 5; i < 9; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master tbody tr:nth-child("+ i +")")[0],"hidden")).toBe(true);
      }
    });

    it("should add 'hidden' class to appropriate col element after a collapse button (-) is clicked", function () {
      var groupConfig = [
        { cols: [4, 8] },
        { cols: [5, 6] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      for(var i = 7; i < 11; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master colgroup col:nth-child("+ i +")")[0],"hidden")).toBe(false);
      }

      mouseDown($("#htCollapse-c1")[0]);

      for(var i = 7; i < 11; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master colgroup col:nth-child("+ i +")")[0],"hidden")).toBe(true);
      }
    });

    it("should remove the 'hidden' class from the appropriate rows after an expand button (+) is clicked", function () {
      var groupConfig = [
        { rows: [4, 8] },
        { rows: [5, 6] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      mouseDown($("#htCollapse-r1")[0]);

      for(var i = 5; i < 9; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master tbody tr:nth-child("+ i +")")[0],"hidden")).toBe(true);
      }

      mouseDown($("#htExpand-r1")[0]);

      for(var i = 5; i < 9; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master tbody tr:nth-child("+ i +")")[0],"hidden")).toBe(false);
      }
    });

    it("should remove the 'hidden' class from the appropriate col elements after an expand button (+) is clicked", function () {
      var groupConfig = [
        { cols: [4, 8] },
        { cols: [5, 6] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        groups: groupConfig
      });

      mouseDown($("#htCollapse-c1")[0]);

      for(var i = 7; i < 11; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master colgroup col:nth-child("+ i +")")[0],"hidden")).toBe(true);
      }

      mouseDown($("#htExpand-c1")[0]);

      for(var i = 7; i < 11; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master colgroup col:nth-child("+ i +")")[0],"hidden")).toBe(false);
      }

    });


    it("should hide all levels above the level connected to the clicked level trigger, after clicking it", function () {
      var groupConfig = [
        { rows: [2, 5] },
        { rows: [3, 4] },
        { rows: [6, 8] },
        { cols: [2, 5] },
        { cols: [3, 4] },
        { cols: [6, 8] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(11, 11),
        groups: groupConfig
      });

      // rows
      for(var i = 3; i < 9; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master tbody tr:nth-child("+ i +")")[0],"hidden")).toBe(false);
      }
      mouseDown($("#htCollapseRowsFromLevel-1")[0]);

      for(var i = 3; i < 9; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master tbody tr:nth-child("+ i +")")[0],"hidden")).toBe(true);
      }

      mouseDown($("#htCollapseRowsFromLevel-3")[0]);
      for(var i = 3; i < 9; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master tbody tr:nth-child("+ i +")")[0],"hidden")).toBe(false);
      }

      mouseDown($("#htCollapseRowsFromLevel-2")[0]);
      for(var i = 4; i < 5; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master tbody tr:nth-child("+ i +")")[0],"hidden")).toBe(true);
      }

      mouseDown($("#htCollapseRowsFromLevel-3")[0]);
      for(var i = 4; i < 5; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master tbody tr:nth-child("+ i +")")[0],"hidden")).toBe(false);
      }

      //cols
      for(var i = 7; i < 13; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master colgroup col:nth-child("+ i +")")[0],"hidden")).toBe(false);
      }

      mouseDown($("#htCollapseColsFromLevel-1")[0]);
      for(var i = 7; i < 13; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master colgroup col:nth-child("+ i +")")[0],"hidden")).toBe(true);
      }

      mouseDown($("#htCollapseColsFromLevel-3")[0]);
      for(var i = 7; i < 13; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master colgroup col:nth-child("+ i +")")[0],"hidden")).toBe(false);
      }

      mouseDown($("#htCollapseColsFromLevel-2")[0]);
      for(var i = 8; i < 9; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master colgroup col:nth-child("+ i +")")[0],"hidden")).toBe(true);
      }

      mouseDown($("#htCollapseColsFromLevel-3")[0]);
      for(var i = 8; i < 9; i++) {
        expect(Handsontable.Dom.hasClass(this.$container.find(".ht_master colgroup col:nth-child("+ i +")")[0],"hidden")).toBe(false);
      }


    });


    it("should add a dummy row/col if all rows are collapsed", function () {
      var groupConfig = [
        { rows: [0, 4] }
      ];
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        groups: groupConfig
      });

      // rows
      mouseDown($("#htCollapse-r1")[0]);

      expect(this.$container.find(".ht_master tbody tr").not(".hidden").length).toEqual(1);

      mouseDown($("#htExpand-r1")[0]);

      expect(this.$container.find(".ht_master tbody tr").not(".hidden").length).toEqual(5);

      // cols

      groupConfig = [
        { cols: [0, 4] }
      ];

      hot.updateSettings({ groups: groupConfig });

      mouseDown($("#htCollapse-c1")[0]);

      expect(this.$container.find(".ht_master colgroup col").not(".hidden, .rowHeader").length).toEqual(1);

      mouseDown($("#htExpand-c1")[0]);

      expect(this.$container.find(".ht_master colgroup col").not(".hidden, .rowHeader").length).toEqual(5);


    });

  });
});

