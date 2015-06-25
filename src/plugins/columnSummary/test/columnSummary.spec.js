describe("ColumnSummarySpec", function() {
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

  describe('parseSettings', function() {
    it('should parse the settings from the Handsontable instance', function() {
      var customFunction = function() {
        var hi = null;
      };

      var hot = new Handsontable(this.$container[0], {
        data: Handsontable.helper.createSpreadsheetData(15, 15),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: false,
            destinationRow: 4,
            sourceColumn: 4,
            ranges: [
              [0, 4], [6], [8, 9]
            ],
            type: 'custom',
            customFunction: customFunction,
            forceNumeric: true,
            suppressDataTypeErrors: true,
            readOnly: true
          },
          {
            destinationColumn: 2,
            reversedRowCoords: true,
            destinationRow: 5,
            sourceColumn: 6,
            type: 'sum',
            forceNumeric: false,
            readOnly: false
          }
        ]
      });

      var plugin = hot.getPlugin('ColumnSummary');
      var endpoints = [
        plugin.endpoints[0],
        plugin.endpoints[1]
      ];

      expect(endpoints[0].destinationColumn).toEqual(0);
      expect(endpoints[0].reversedRowCoords).toBe(false);
      expect(endpoints[0].destinationRow).toEqual(4);
      expect(endpoints[0].sourceColumn).toEqual(4);
      expect(endpoints[0].ranges).toEqual([[0, 4], [6], [8, 9]]);
      expect(endpoints[0].type).toEqual('custom');
      expect(endpoints[0].customFunction).toEqual(customFunction);
      expect(endpoints[0].forceNumeric).toBe(true);
      expect(endpoints[0].suppressDataTypeErrors).toBe(true);
      expect(endpoints[0].readOnly).toBe(true);

      expect(endpoints[1].destinationColumn).toEqual(2);
      expect(endpoints[1].reversedRowCoords).toBe(true);
      expect(endpoints[1].destinationRow).toEqual(9);
      expect(endpoints[1].sourceColumn).toEqual(6);
      expect(endpoints[1].ranges).toEqual([[0, 14]]);
      expect(endpoints[1].type).toEqual('sum');
      expect(endpoints[1].forceNumeric).toBe(false);
      expect(endpoints[1].suppressDataTypeErrors).toBe(true);
      expect(endpoints[1].readOnly).toBe(false);
    });
  });

  describe('calculateSum', function () {
    it('should calculate sum  of values from the provided range', function () {
      var hot = handsontable({
        data: createNumericData(15, 15),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 3], [5,6], [8], [10, 13]
            ],
            type: 'sum'
          }
        ]
      });

      expect(getDataAtCell(14,0)).toEqual(82);
    });
  });

  describe('calculateMinMax', function () {
    it('should calculate the minimum from the provided range', function () {
      var hot = handsontable({
        data: createNumericData(15, 15),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [5,6], [8], [10, 13]
            ],
            type: 'min'
          }
        ]
      });

      expect(getDataAtCell(14,0)).toEqual(6);
    });

    it('should calculate the minimum from the provided range', function () {
      var hot = handsontable({
        data: createNumericData(15, 15),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [5,6], [8], [10, 13]
            ],
            type: 'max'
          }
        ]
      });

      expect(getDataAtCell(14,0)).toEqual(14);
    });

  });

  describe('countEntries', function () {
    it('should count non-empty entries from the provided range', function () {
      var hot = handsontable({
        data: createNumericData(15, 15),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 3], [5,6], [8], [10, 13]
            ],
            type: 'count'
          }
        ]
      });

      expect(getDataAtCell(14,0)).toEqual(11);
    });
  });

  describe('calculateAverage', function () {
    it('should get average value from entries in the provided range', function () {
      var hot = handsontable({
        data: createNumericData(15, 15),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 3], [5,6], [8], [10, 13]
            ],
            type: 'average'
          }
        ]
      });

      expect(getDataAtCell(14,0).toFixed(4)).toEqual(7.45454545454545.toFixed(4));
    });
  });

  describe('customFunction', function () {
    it('should apply a custom function to the entries in the provided range', function () {
      var hot = handsontable({
        data: createNumericData(15, 15),
        height: 200,
        width: 200,
        columnSummary: [
          {
            sourceColumn: 4,
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 13]
            ],
            type: 'custom',
            customFunction: function(endpoint) {
              var hotInstance = this.hot;
              var counter = 0;

              // helper function
              function checkRange(rowRange) {
                var i = rowRange[1] || rowRange[0];
                var counter = 0;

                do {

                  if (hotInstance.getCellMeta(i, endpoint.sourceColumn).extraProperty === true) {
                    counter++;
                  }

                  i--;
                } while (i >= rowRange[0]);
                return counter;
              }

              // go through all declared ranges
              for (var r in endpoint.ranges) {
                if (endpoint.ranges.hasOwnProperty(r)) {
                  counter += checkRange(endpoint.ranges[r]);
                }
              }

              return counter;
            }
          }
        ],
        afterInit: function() {
          // set the extra property to certain cells
          this.setCellMeta(4, 4, 'extraProperty', true);
          this.setCellMeta(6, 4, 'extraProperty', true);
          this.setCellMeta(10, 4, 'extraProperty', false);
          this.setCellMeta(11, 4, 'extraProperty', true);
          this.setCellMeta(12, 4, 'extraProperty', 'different value');

          // ensure the summary values are up to date:
          this.getPlugin('ColumnSummary').refreshAllEndpoints();
        }
      });

        expect(getDataAtCell(14,0)).toEqual(3);

    });
  });

});