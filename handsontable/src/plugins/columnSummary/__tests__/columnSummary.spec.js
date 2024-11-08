describe('ColumnSummarySpec', () => {
  const id = 'testContainer';
  const warnMessage = 'One of the Column Summary plugins\' destination points you ' +
    'provided is beyond the table boundaries!';
  const columnSummaryFunction = function() {
    // We're assuming there are two levels, and the upper level has the summary results, while its children contain the calculation data.
    const endpoints = [];
    const nestedRowsPlugin = this.hot.getPlugin('nestedRows');
    const getRowIndex = nestedRowsPlugin.dataManager.getRowIndex.bind(nestedRowsPlugin.dataManager);
    let nestedRowsCache = null;
    let tempEndpoint = null;
    const resultColumn = 1;

    if (nestedRowsPlugin.isEnabled()) {
      nestedRowsCache = this.hot.getPlugin('nestedRows').dataManager.cache;
    } else {
      return;
    }

    for (let i = 0; i < nestedRowsCache.levels[0].length; i++) {
      tempEndpoint = {};

      if (!nestedRowsCache.levels[0][i].__children || nestedRowsCache.levels[0][i].__children.length === 0) {
        /* eslint-disable no-continue */
        continue;
      }

      tempEndpoint.destinationColumn = resultColumn;
      tempEndpoint.destinationRow = getRowIndex(nestedRowsCache.levels[0][i]);
      tempEndpoint.type = 'sum';
      tempEndpoint.forceNumeric = true;
      tempEndpoint.ranges = [];

      tempEndpoint.ranges.push([
        getRowIndex(nestedRowsCache.levels[0][i].__children[0]),
        getRowIndex(nestedRowsCache.levels[0][i].__children[nestedRowsCache.levels[0][i].__children.length - 1])
      ]);

      endpoints.push(tempEndpoint);
      tempEndpoint = null;
    }

    return endpoints;
  };

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('parseSettings', () => {
    it('should parse the settings from the Handsontable instance', () => {
      const customFunction = function() {};
      const hot = handsontable({
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
            customFunction,
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

      const plugin = hot.getPlugin('ColumnSummary');
      const endpoints = [
        plugin.endpoints.getEndpoint(0),
        plugin.endpoints.getEndpoint(1)
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

  describe('calculateSum', () => {
    it('should calculate sum of values from the provided range', () => {
      handsontable({
        data: createNumericData(15, 15),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 3], [5, 6], [8], [10, 13]
            ],
            type: 'sum'
          }
        ]
      });

      expect(getDataAtCell(14, 0)).toEqual(82);
    });
  });

  describe('calculateMinMax', () => {
    it('should calculate the minimum from the provided range', () => {
      const dataset = createNumericData(15, 15);

      dataset[0][1] = 0;
      dataset[0][2] = 0;

      handsontable({
        data: dataset,
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [5, 6], [8], [10, 13]
            ],
            type: 'min'
          },
          {
            destinationColumn: 1,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 13]
            ],
            type: 'min'
          }
        ]
      });

      expect(getDataAtCell(14, 0)).toEqual(6);
      expect(getDataAtCell(14, 1)).toEqual(0);
    });

    it('should calculate the minimum from the column when the destination row is empty and `forceNumeric` is enabled', () => {
      handsontable({
        data: [
          [0],
          [1],
          [5],
          [],
        ],
        columnSummary: [
          {
            sourceColumn: 0,
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            forceNumeric: true,
            type: 'min'
          },
        ]
      });

      expect(getDataAtCell(3, 0)).toBe(0);
    });

    it('should calculate the maximum from the provided range', () => {
      const dataset = createNumericData(15, 15);

      dataset.forEach((rowArr) => {
        rowArr[1] = 0;
      });

      handsontable({
        data: dataset,
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [5, 6], [8], [10, 13]
            ],
            type: 'max'
          },
          {
            destinationColumn: 1,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 13]
            ],
            type: 'max'
          }
        ]
      });

      expect(getDataAtCell(14, 0)).toEqual(14);
      expect(getDataAtCell(14, 1)).toEqual(0);
    });

    it('should calculate the maximum from the column when the destination row is empty and `forceNumeric` is enabled', () => {
      handsontable({
        data: [
          [0],
          [1],
          [5],
          [],
        ],
        columnSummary: [
          {
            sourceColumn: 0,
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            forceNumeric: true,
            type: 'max'
          },
        ]
      });

      expect(getDataAtCell(3, 0)).toBe(5);
    });
  });

  describe('countEntries', () => {
    it('should count non-empty entries from the provided range', () => {
      const dataset = createNumericData(15, 15);

      dataset.forEach((rowArr) => {
        rowArr[1] = 0;
      });

      handsontable({
        data: dataset,
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 3], [5, 6], [8], [10, 13]
            ],
            type: 'count'
          },
          {
            destinationColumn: 1,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 13]
            ],
            type: 'count'
          }
        ]
      });

      expect(getDataAtCell(14, 0)).toEqual(11);
      expect(getDataAtCell(14, 1)).toEqual(14);
    });

    it('should count non-empty entries from the column when the destination row is empty and `forceNumeric` is enabled', () => {
      handsontable({
        data: [
          [4],
          [1],
          [5],
          [],
        ],
        columnSummary: [
          {
            sourceColumn: 0,
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            forceNumeric: true,
            type: 'count'
          },
        ]
      });

      expect(getDataAtCell(3, 0)).toBe(3);
    });
  });

  describe('calculateAverage', () => {
    it('should get average value from entries in the provided range', () => {
      handsontable({
        data: createNumericData(15, 15),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 3], [5, 6], [8], [10, 13]
            ],
            type: 'average'
          }
        ]
      });

      expect(getDataAtCell(14, 0).toFixed(4)).toEqual((7.45454545454545).toFixed(4));
    });

    it('should count average value from the column when the destination row is empty and `forceNumeric` is enabled', () => {
      handsontable({
        data: [
          [4],
          [2],
          [5],
          [],
        ],
        columnSummary: [
          {
            sourceColumn: 0,
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            forceNumeric: true,
            type: 'average'
          },
        ]
      });

      expect(getDataAtCell(3, 0)).toBe(3.6666666666666665);
    });
  });

  describe('customFunction', () => {
    it('should apply a custom function to the entries in the provided range', () => {
      handsontable({
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
            customFunction(endpoint) {
              const hotInstance = this.hot;

              // helper function
              /**
               * @param rowRange
               */
              function checkRange(rowRange) {
                let i = rowRange[1] || rowRange[0];
                let counter = 0;

                do {

                  if (hotInstance.getCellMeta(i, endpoint.sourceColumn).extraProperty === true) {
                    counter += 1;
                  }

                  i -= 1;
                } while (i >= rowRange[0]);

                return counter;
              }

              let counter = 0;

              // go through all declared ranges
              Handsontable.helper.objectEach(endpoint.ranges, (range) => {
                counter += checkRange(range);
              });

              return counter;
            }
          }
        ],
        afterInit() {
          // set the extra property to certain cells
          this.setCellMeta(4, 4, 'extraProperty', true);
          this.setCellMeta(6, 4, 'extraProperty', true);
          this.setCellMeta(10, 4, 'extraProperty', false);
          this.setCellMeta(11, 4, 'extraProperty', true);
          this.setCellMeta(12, 4, 'extraProperty', 'different value');

          // ensure the summary values are up to date:
          this.getPlugin('ColumnSummary').endpoints.refreshAllEndpoints();
        }
      });

      expect(getDataAtCell(14, 0)).toEqual(3);

    });
  });

  describe('complex setups', () => {
    it('should properly calculate values when many endpoints are declared', () => {
      handsontable({
        data: createNumericData(40, 40),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            destinationRow: 0,
            ranges: [
              [5, 6], [8], [10, 13]
            ],
            type: 'max'
          },
          {
            destinationColumn: 0,
            destinationRow: 14,
            ranges: [
              [15, 19]
            ],
            type: 'max'
          },
          {
            destinationColumn: 0,
            destinationRow: 20,
            ranges: [
              [0, 19]
            ],
            type: 'sum'
          },
          {
            destinationColumn: 1,
            destinationRow: 0,
            reverseCoords: true,
            type: 'sum'
          }
        ]
      });

      expect(getDataAtCell(0, 0)).toEqual(14);
      expect(getDataAtCell(14, 0)).toEqual(20);
      expect(getDataAtCell(20, 0)).toEqual(194);
      expect(getDataAtCell(0, 1)).toEqual(820);
    });

    it('should accept endpoints configuration provided as a function', () => {
      const hot = handsontable({
        data: createNumericData(40, 40),
        height: 200,
        width: 200,
        columnSummary() {
          const config = [];

          config.push({
            destinationColumn: 1,
            destinationRow: parseInt(this.hot.countRows() / 2, 10),
            type: 'sum'
          });

          return config;
        }
      });

      const plugin = hot.getPlugin('columnSummary');

      expect(plugin.endpoints.getEndpoint(0).destinationRow).toEqual(parseInt(hot.countRows() / 2, 10));
      expect(hot.getDataAtCell(parseInt(hot.countRows() / 2, 10), 1)).toEqual(820);

      hot.alter('remove_row', 10, 3);

      expect(plugin.endpoints.getEndpoint(0).destinationRow).toEqual(parseInt(hot.countRows() / 2, 10));
      expect(hot.getDataAtCell(parseInt(hot.countRows() / 2, 10), 1)).toEqual(763);
    });
  });

  describe('structure alteration', () => {
    it('should shift the endpoint coordinates when a new row was added above an endpoint', () => {
      const hot = handsontable({
        data: createNumericData(40, 40),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            destinationRow: 0,
            ranges: [
              [5, 6], [8], [10, 13]
            ],
            type: 'max'
          }]
      });

      hot.alter('insert_row_above', 0, 1);
      expect(getDataAtCell(0, 0)).toEqual(null);
      expect(getCellMeta(0, 0).className).toEqual(undefined);
      expect(getCellMeta(0, 0).readOnly).toEqual(false);
      expect(getDataAtCell(1, 0)).toEqual(14);
      expect(getCellMeta(1, 0).className).toEqual('columnSummaryResult');
      expect(getCellMeta(1, 0).readOnly).toEqual(true);
    });

    it('should shift the endpoint coordinates when a new column was added on the left of an endpoint', () => {
      const hot = handsontable({
        data: createNumericData(40, 40),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            destinationRow: 0,
            ranges: [
              [5, 6], [8], [10, 13]
            ],
            type: 'max'
          }]
      });

      hot.alter('insert_col_start', 0, 1);
      expect(getDataAtCell(0, 0)).toEqual(null);
      expect(getCellMeta(0, 0).className).toEqual(undefined);
      expect(getCellMeta(0, 0).readOnly).toEqual(false);
      expect(getDataAtCell(0, 1)).toEqual(14);
      expect(getCellMeta(0, 1).className).toEqual('columnSummaryResult');
      expect(getCellMeta(0, 1).readOnly).toEqual(true);
    });

    it('should shift the endpoint coordinates when a row was removed above an endpoint', () => {
      const hot = handsontable({
        data: createNumericData(40, 40),
        height: 520,
        rowHeaders: true,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            destinationRow: 14,
            ranges: [
              [5, 6], [8], [10, 13]
            ],
            type: 'max'
          }]
      });

      hot.alter('remove_row', 0, 1);
      expect(getDataAtCell(14, 0)).toEqual(16);
      expect(getCellMeta(14, 0).className).toEqual(undefined);
      expect(getCellMeta(14, 0).readOnly).toEqual(false);
      expect(getDataAtCell(13, 0)).toEqual(14);
      expect(getCellMeta(13, 0).className).toEqual('columnSummaryResult');
      expect(getCellMeta(13, 0).readOnly).toEqual(true);
    });

    it('should shift the endpoint coordinates when a column was removed on the left of an endpoint', () => {
      const hot = handsontable({
        data: createNumericData(40, 40),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 3,
            destinationRow: 0,
            ranges: [
              [5, 6], [8], [10, 13]
            ],
            type: 'max'
          }]
      });

      hot.alter('remove_col', 0, 1);
      expect(getDataAtCell(0, 3)).toEqual(1);
      expect(getCellMeta(0, 3).className).toEqual(undefined);
      expect(getCellMeta(0, 3).readOnly).toEqual(false);
      expect(getDataAtCell(0, 2)).toEqual(14);
      expect(getCellMeta(0, 2).className).toEqual('columnSummaryResult');
      expect(getCellMeta(0, 2).readOnly).toEqual(true);
    });

    describe('if range is undefined', () => {
      it('should not throw an error if removing column', () => {
        const hot = handsontable({
          data: createNumericData(3, 3),
          height: 200,
          width: 200,
          columnSummary: [{
            destinationRow: 2,
            destinationColumn: 2,
            type: 'sum'
          }],
        });

        expect(() => {
          hot.alter('remove_col', 0, 1);
        }).not.toThrow();
      });

      it('should not throw an error if removing row', () => {
        const hot = handsontable({
          data: createNumericData(3, 3),
          height: 200,
          width: 200,
          columnSummary: [{
            destinationRow: 2,
            destinationColumn: 2,
            type: 'sum'
          }],
        });

        expect(() => {
          hot.alter('remove_row', 0, 1);
        }).not.toThrow();
      });
    });

    it('should modify the calculation row range when a row was moved outside the range', () => {
      const hot = handsontable({
        data: createNumericData(40, 40),
        height: 200,
        width: 200,
        manualRowMove: true,
        columnSummary: [
          {
            destinationColumn: 3,
            destinationRow: 7,
            ranges: [
              [0, 6]
            ],
            type: 'sum'
          }]
      });

      expect(JSON.stringify(hot.getPlugin('columnSummary').endpoints.getEndpoint(0).ranges)).toEqual('[[0,6]]');
      hot.getPlugin('manualRowMove').moveRow(3, 10);
      expect(JSON.stringify(hot.getPlugin('columnSummary').endpoints.getEndpoint(0).ranges)).toEqual('[[0,2],[4,6]]');
    });

    it('should modify the calculation row range when a row was moved into the range', () => {
      const hot = handsontable({
        data: createNumericData(40, 40),
        height: 200,
        width: 200,
        manualRowMove: true,
        columnSummary: [
          {
            destinationColumn: 3,
            destinationRow: 7,
            ranges: [
              [0, 6]
            ],
            type: 'sum'
          }]
      });

      expect(JSON.stringify(hot.getPlugin('columnSummary').endpoints.getEndpoint(0).ranges))
        .toEqual('[[0,6]]');

      hot.getPlugin('manualRowMove').moveRow(10, 3);

      expect(JSON.stringify(hot.getPlugin('columnSummary').endpoints.getEndpoint(0).ranges))
        .toEqual('[[0,2],[10,10],[3,6]]');
    });

    it('should shift the visual calculation result position when a row was moved outside the endpoint range', function() {
      const hot = handsontable({
        data: createNumericData(40, 40),
        height: 200,
        width: 200,
        manualRowMove: true,
        columnSummary: [
          {
            destinationColumn: 3,
            destinationRow: 7,
            ranges: [
              [0, 6]
            ],
            type: 'sum'
          }]
      });

      expect(this.$container.find('.columnSummaryResult').size()).toEqual(1);
      expect(this.$container.find('.htDimmed').size()).toEqual(1);
      expect($(hot.getCell(7, 3)).hasClass('columnSummaryResult')).toBe(true);
      expect($(hot.getCell(7, 3)).hasClass('htDimmed')).toBe(true);

      hot.getPlugin('manualRowMove').moveRow(3, 10);

      expect(this.$container.find('.columnSummaryResult').size()).toEqual(1);
      expect(this.$container.find('.htDimmed').size()).toEqual(1);
      expect($(hot.getCell(6, 3)).hasClass('columnSummaryResult')).toBe(true);
      expect($(hot.getCell(6, 3)).hasClass('htDimmed')).toBe(true);
    });

    it('should shift the visual calculation result position when a row was moved inside the endpoint range', function() {
      const hot = handsontable({
        data: createNumericData(40, 40),
        height: 200,
        width: 200,
        manualRowMove: true,
        columnSummary: [
          {
            destinationColumn: 3,
            destinationRow: 7,
            ranges: [
              [0, 6]
            ],
            type: 'sum'
          }]
      });

      expect(this.$container.find('.columnSummaryResult').size()).toEqual(1);
      expect(this.$container.find('.htDimmed').size()).toEqual(1);
      expect($(hot.getCell(7, 3)).hasClass('columnSummaryResult')).toBe(true);
      expect($(hot.getCell(7, 3)).hasClass('htDimmed')).toBe(true);

      hot.getPlugin('manualRowMove').moveRow(10, 3);

      expect(this.$container.find('.columnSummaryResult').size()).toEqual(1);
      expect(this.$container.find('.htDimmed').size()).toEqual(1);
      expect($(hot.getCell(8, 3)).hasClass('columnSummaryResult')).toBe(true);
      expect($(hot.getCell(8, 3)).hasClass('htDimmed')).toBe(true);
    });
  });

  describe('compatibility with other plugins', () => {
    describe('nestedRows', () => {
      it('should work properly with the nestedRows plugin', (done) => {
        const hot = handsontable({
          data: getDataForColumnSummary(),
          height: 200,
          width: 200,
          rowHeaders: true,
          nestedRows: true,
          columnSummary: columnSummaryFunction
        });

        const nestedRowsPlugin = hot.getPlugin('nestedRows');

        /**
         * @param row
         */
        function toggle(row) {
          const rowIndex = parseInt(row, 10);

          if (isNaN(rowIndex)) {
            return false;
          }

          if (nestedRowsPlugin.dataManager.hasChildren(rowIndex)) {
            if (nestedRowsPlugin.collapsingUI.areChildrenCollapsed(rowIndex)) {
              nestedRowsPlugin.collapsingUI.expandChildren(rowIndex);
            } else {
              nestedRowsPlugin.collapsingUI.collapseChildren(rowIndex);
            }
          }
        }

        setTimeout(() => {
          toggle(0);

          expect(getDataAtCell(0, 1)).toEqual(106);
          expect(getDataAtCell(1, 1)).toEqual(3996);
          setDataAtCell(2, 1, 0);
          expect(getDataAtCell(0, 1)).toEqual(106);
          expect(getDataAtCell(1, 1)).toEqual(3633);
          expect(getCellMeta(0, 1).readOnly).toEqual(true);
          expect(getCellMeta(1, 1).readOnly).toEqual(true);

          done();
        }, 300);
      });
    });

    it('should calculate the endpoints properly after moving rows between groups', function() {
      const hot = handsontable({
        data: getDataForColumnSummary(),
        height: 200,
        width: 200,
        rowHeaders: true,
        nestedRows: true,
        columnSummary: columnSummaryFunction
      });

      expect(hot.getDataAtCell(0, 1)).toEqual(106);
      expect(hot.getDataAtCell(4, 1)).toEqual(3996);
      expect(this.$container.find('.columnSummaryResult').size()).toEqual(3);
      expect(this.$container.find('.htDimmed').size()).toEqual(3);

      hot.getPlugin('manualRowMove').dragRow(2, 6);

      expect(hot.getDataAtCell(0, 1)).toEqual(70);
      expect(hot.getDataAtCell(3, 1)).toEqual(4032);
      expect(this.$container.find('.columnSummaryResult').size()).toEqual(3);
      expect(this.$container.find('.htDimmed').size()).toEqual(3);
    });
  });

  describe('maxRows options set', () => {
    it('should apply summary operation only on rows which are < maxRows', () => {
      const rows = 9;
      const columns = 5;

      const summaryTypes = ['sum', 'min', 'max', 'count', 'average'];

      handsontable({
        data: createNumericData(rows, columns),
        rowHeaders: true,
        colHeaders: summaryTypes,
        maxRows: 5,
        columnSummary() {
          const configArray = [];

          for (let i = 0; i < columns; i++) {
            configArray.push({
              sourceColumn: i,
              destinationRow: 0,
              destinationColumn: i,
              type: summaryTypes[i],
              forceNumeric: true
            });
          }

          return configArray;
        }
      });

      expect(getDataAtCell(0, 0)).toEqual(15);
      expect(getDataAtCell(0, 1)).toEqual(1);
      expect(getDataAtCell(0, 2)).toEqual(5);
      expect(getDataAtCell(0, 3)).toEqual(5);
      expect(getDataAtCell(0, 4)).toEqual(3);
    });
  });

  describe('`roundFloat` option', () => {
    it('should not round the resultif `roundFloat` is set to `false`', () => {
      handsontable({
        data: createNumericData(15, 15),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 3], [5, 6], [8], [10, 13]
            ],
            roundFloat: false,
            type: 'average'
          }
        ]
      });

      expect(getDataAtCell(14, 0)).toEqual(7.454545454545454);
    });

    it('should round the result to the provided number of decimal places', () => {
      handsontable({
        data: createNumericData(15, 15),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 3], [5, 6], [8], [10, 13]
            ],
            roundFloat: 2,
            type: 'average'
          }
        ]
      });

      expect(getDataAtCell(14, 0)).toEqual('7.45');

      updateSettings({
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 3], [5, 6], [8], [10, 13]
            ],
            roundFloat: 0,
            type: 'average'
          }
        ]
      });

      expect(getDataAtCell(14, 0)).toEqual('7');
    });

    it('should round the `roundFloat` value to range <0, 100> if its value is an integer outside of that range', () => {
      handsontable({
        data: createNumericData(15, 15),
        height: 200,
        width: 200,
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 3], [5, 6], [8], [10, 13]
            ],
            roundFloat: -50,
            type: 'average'
          }
        ]
      });

      expect(getDataAtCell(14, 0)).toEqual('7');

      updateSettings({
        columnSummary: [
          {
            destinationColumn: 0,
            reversedRowCoords: true,
            destinationRow: 0,
            ranges: [
              [0, 3], [5, 6], [8], [10, 13]
            ],
            roundFloat: 150,
            type: 'average'
          }
        ]
      });

      expect(getDataAtCell(14, 0)).toEqual('7.45454545454545414173708195448853075504302978515625' +
      '00000000000000000000000000000000000000000000000000');
    });
  });

  it('should warn user that provided destination points are beyond the table boundaries', () => {
    const warnSpy = spyOn(console, 'warn');

    handsontable({
      startRows: 3,
      startCols: 3,
      columnSummary: [{
        destinationRow: 3,
        destinationColumn: 1,
        type: 'sum'
      }]
    });

    expect(warnSpy).toHaveBeenCalledWith(warnMessage);
  });

  it('should not show endpoint when it\'s destination point is proper just after new row insertion', () => {
    const warnSpy = spyOn(console, 'warn');
    let warnFirstArgs;

    handsontable({
      startRows: 3,
      startCols: 3,
      columnSummary: [{
        destinationRow: 3,
        destinationColumn: 1,
        type: 'sum'
      }]
    });

    warnFirstArgs = warnSpy.calls.allArgs().map(args => args[0]);

    expect(warnFirstArgs.filter(arg => arg === warnMessage).length).toBe(1);

    alter('insert_row_above', 0);

    warnFirstArgs = warnSpy.calls.allArgs().map(args => args[0]);

    expect(warnFirstArgs.filter(arg => arg === warnMessage).length).toBe(2);
    expect(getData()).toEqual([
      [null, null, null],
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);
  });

  it('should not reset the cell meta information after `updateSettings` call', () => {
    handsontable({
      data: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [null, null, null],
      ],
      columnSummary: [{
        destinationRow: 3,
        destinationColumn: 1,
        type: 'sum'
      }]
    });

    expect(getCellMeta(3, 1).readOnly).toBe(true);
    expect(getCellMeta(3, 1).className).toBe('columnSummaryResult');

    updateSettings({});

    expect(getCellMeta(3, 1).readOnly).toBe(true);
    expect(getCellMeta(3, 1).className).toBe('columnSummaryResult');

    updateSettings({ columns: [{}, {}, {}, {}] });

    expect(getCellMeta(3, 1).readOnly).toBe(true);
    expect(getCellMeta(3, 1).className).toBe('columnSummaryResult');
  });
});
