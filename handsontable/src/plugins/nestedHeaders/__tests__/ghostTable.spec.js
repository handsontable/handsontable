describe('NestedHeaders', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('GhostTable', () => {
    it('should be initialized and accessible from the plugin', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['a', { label: 'b', colspan: 3 }, 'c', 'd'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        ]
      });
      const ghostTable = getPlugin('nestedHeaders').ghostTable;

      expect(ghostTable).toBeDefined();
    });

    describe('DOM it measures', () => {
      /**
       * Captures the ghost table container while it is briefly in the document. It is created,
       * measured, and removed inside one synchronous call, so it cannot be read afterwards.
       *
       * @param {Function} build Builds the grid.
       * @returns {HTMLElement|null} The captured container.
       */
      function captureGhostContainer(build) {
        const originalAppendChild = document.body.appendChild;
        let captured = null;

        document.body.appendChild = function(node) {
          if (node.classList && node.classList.contains('htGhostTable')) {
            captured = node.cloneNode(true);
          }

          return originalAppendChild.call(this, node);
        };

        try {
          build();
        } finally {
          document.body.appendChild = originalAppendChild;
        }

        return captured;
      }

      it('should build the exact DOM the HTML-string version produced', async() => {
        // The ghost table drives column width measurement, and its styling is scoped to
        // `.htGhostTable > table` — a DIRECT child — with the row and cell rules scoped under
        // that. A structural difference from the markup this replaced would measure against
        // different CSS and silently size every column wrong, which no width assertion phrased as
        // "greater than zero" would catch. Compared against the old markup, parsed.
        const container = captureGhostContainer(() => {
          handsontable({
            data: createSpreadsheetData(4, 4),
            dropdownMenu: true,
            collapsibleColumns: true,
            nestedHeaders: [
              [{ label: 'group', colspan: 2 }, 'c', 'd'],
              ['a', 'b', 'c', 'd'],
            ],
          });
        });

        expect(container).not.toBe(null);

        const expected = document.createElement('div');

        expected.innerHTML = '<table data-ghost-table="rendered"><thead>' +
          '<tr>' +
            '<th data-column="0" colspan="2"><div class="relative"><span class="colHeader">group</span>' +
              '<button class="changeType"></button>' +
              '<div class="collapsibleIndicator expanded">-</div></div></th>' +
            '<th data-column="2" colspan="1"><div class="relative"><span class="colHeader">c</span>' +
              '<button class="changeType"></button></div></th>' +
            '<th data-column="3" colspan="1"><div class="relative"><span class="colHeader">d</span>' +
              '<button class="changeType"></button></div></th>' +
          '</tr>' +
          '<tr>' +
            '<th data-column="0" colspan="1"><div class="relative"><span class="colHeader">a</span>' +
              '<button class="changeType"></button></div></th>' +
            '<th data-column="1" colspan="1"><div class="relative"><span class="colHeader">b</span>' +
              '<button class="changeType"></button></div></th>' +
            '<th data-column="2" colspan="1"><div class="relative"><span class="colHeader">c</span>' +
              '<button class="changeType"></button></div></th>' +
            '<th data-column="3" colspan="1"><div class="relative"><span class="colHeader">d</span>' +
              '<button class="changeType"></button></div></th>' +
          '</tr>' +
          '</thead></table>';

        expect(container.innerHTML).toBe(expected.innerHTML);
      });

      it('should keep the measured table a direct child of the scoped container', async() => {
        // `.htGhostTable > table` is a child combinator: one extra wrapper and every row and cell
        // rule stops matching, so the table measures unstyled.
        const container = captureGhostContainer(() => {
          handsontable({
            data: createSpreadsheetData(3, 3),
            nestedHeaders: [[{ label: 'group', colspan: 2 }, 'c'], ['a', 'b', 'c']],
          });
        });

        expect(container.classList.contains('htGhostTable')).toBe(true);
        expect(container.firstElementChild.tagName).toBe('TABLE');
        expect(container.children.length).toBe(1);
      });

      it('should render a header label carrying markup as markup, as the string form did', async() => {
        const container = captureGhostContainer(() => {
          handsontable({
            data: createSpreadsheetData(2, 2),
            nestedHeaders: [['<b>bold</b>', 'plain']],
          });
        });

        expect(container.querySelector('.colHeader').innerHTML).toBe('<b>bold</b>');
      });
    });

    describe('widthsCache', () => {
      it('should contain cached widths after initialization', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['a', { label: 'b', colspan: 3 }, 'c', 'd'],
            ['a', 'b', 'c', 'd', 'e', 'f', 'g']
          ]
        });

        const ghostTable = getPlugin('nestedHeaders').ghostTable;

        expect(ghostTable.widthsMap.getLength()).toBe(10);
      });

      it('should properly prepare widths cache, even if container is smaller than needed', async() => {
        handsontable({
          data: createSpreadsheetData(7, 7),
          width: 300,
          nestedHeaders: [
            ['a', { label: 'b', colspan: 3 }, 'c', 'd', 'e'],
            ['Very Long Title', 'Very Long Title', 'Very Long Title', 'Very Long Title', 'Very Long Title',
              'Very Long Title', 'Very Long Title'],
          ]
        });

        const ghostTable = getPlugin('nestedHeaders').ghostTable;

        // All columns have the same header text, so their widths should be equal.
        const firstWidth = ghostTable.widthsMap.getValueAtIndex(0);

        expect(firstWidth).toBeGreaterThan(getDefaultColumnWidth());

        for (let col = 0; col < 7; col++) {
          expect(ghostTable.widthsMap.getValueAtIndex(col)).toBeAroundValue(firstWidth);
        }
      });

      it('should properly prepare widths cache, even if container is smaller than needed (different headers configuration #1)', async() => {
        handsontable({
          data: createSpreadsheetData(3, 10),
          width: 300,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 8 }, 'C'],
            ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
            ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
              { label: 'This is a very long header to test', colspan: 2 }, 'M'],
            ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
          ],
        });

        const ghostTable = getPlugin('nestedHeaders').ghostTable;

        // All columns should have positive widths cached.
        for (let col = 0; col < 10; col++) {
          expect(ghostTable.widthsMap.getValueAtIndex(col)).toBeGreaterThan(0);
        }

        // The columns under the long header "This is a very long header to test" (cols 6-7)
        // should be significantly wider than single-letter header columns.
        expect(ghostTable.widthsMap.getValueAtIndex(7)).toBeGreaterThan(
          ghostTable.widthsMap.getValueAtIndex(0) * 2
        );
      });

      it('should container be removed after initialization', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['a', { label: 'b', colspan: 3 }, 'c', 'd'],
            ['a', 'b', 'c', 'd', 'e', 'f', 'g']
          ]
        });

        const ghostTable = getPlugin('nestedHeaders').ghostTable;

        expect(ghostTable.container).toBeNull();
      });
    });

    describe('updateSettings', () => {
      it('should recreate the widths cache', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['a', 'b', 'c', 'd', 'e', 'f', 'g']
          ]
        });
        const widthBeforeUpdate = getPlugin('nestedHeaders').ghostTable.getWidth(1);

        await updateSettings({
          nestedHeaders: [
            ['a', 'bbbbbbbbbbbbbbbbb', 'c', 'd', 'e', 'f', 'g']
          ]
        });

        const widthAfterUpdate = getPlugin('nestedHeaders').ghostTable.getWidth(1);

        expect(widthAfterUpdate).not.toBe(widthBeforeUpdate);
        expect(widthAfterUpdate).toBeGreaterThan(widthBeforeUpdate);
      });
    });

    describe('with hidden columns', () => {
      it('should calculate the columns widths when some columns are hidden on table initialization', async() => {
        handsontable({
          data: createSpreadsheetData(3, 10),
          nestedHeaders: [
            ['A', { label: 'B', colspan: 8 }],
            ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }],
            ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
              { label: 'This is a very long header to test', colspan: 2 }],
            ['N', 'O', 'Longer text', 'Longer text', 'R', 'S', 'T', 'U', 'V'],
          ],
          hiddenColumns: {
            columns: [0, 2]
          }
        });

        const ghostTable = getPlugin('nestedHeaders').ghostTable;

        // Hidden columns should have null width in the cache.
        expect(ghostTable.widthsMap.getValueAtIndex(0)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(2)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(9)).toBe(null);

        // Visible columns should have positive widths.
        for (const col of [1, 3, 4, 5, 6, 7, 8]) {
          expect(ghostTable.widthsMap.getValueAtIndex(col)).toBeGreaterThan(0);
        }

        // The long header columns should be wider than short header columns.
        expect(ghostTable.widthsMap.getValueAtIndex(7)).toBeGreaterThan(
          ghostTable.widthsMap.getValueAtIndex(1)
        );
      });

      it('should recalculate the columns widths after hiding columns', async() => {
        handsontable({
          data: createSpreadsheetData(3, 10),
          nestedHeaders: [
            ['A', { label: 'B', colspan: 8 }],
            ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }],
            ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
              { label: 'This is a very long header to test', colspan: 2 }],
            ['N', 'O', 'Longer text', 'Longer text', 'R', 'S', 'T', 'U', 'V'],
          ],
          hiddenColumns: true,
        });

        getPlugin('hiddenColumns').hideColumns([1, 3, 7]);
        await render();

        const ghostTable = getPlugin('nestedHeaders').ghostTable;

        // Hidden columns should have null width.
        expect(ghostTable.widthsMap.getValueAtIndex(1)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(3)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(7)).toBe(null);
        expect(ghostTable.widthsMap.getValueAtIndex(9)).toBe(null);

        // Visible columns should have positive widths.
        for (const col of [0, 2, 4, 5, 6, 8]) {
          expect(ghostTable.widthsMap.getValueAtIndex(col)).toBeGreaterThan(0);
        }

        // Column 8 absorbs the long header text (after col 7 is hidden) and should be the widest.
        expect(ghostTable.widthsMap.getValueAtIndex(8)).toBeGreaterThan(
          ghostTable.widthsMap.getValueAtIndex(0)
        );
      });

      it('should recalculate the columns widths after showing columns', async() => {
        handsontable({
          data: createSpreadsheetData(3, 10),
          nestedHeaders: [
            ['A', { label: 'B', colspan: 8 }],
            ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }],
            ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
              { label: 'This is a very long header to test', colspan: 2 }],
            ['N', 'O', 'Longer text', 'Longer text', 'R', 'S', 'T', 'U', 'V'],
          ],
          hiddenColumns: {
            columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
          }
        });

        getPlugin('hiddenColumns').showColumns([2, 4, 7, 8]);
        await render();

        const ghostTable = getPlugin('nestedHeaders').ghostTable;

        // Still-hidden columns should have null width.
        for (const col of [0, 1, 3, 5, 6, 9]) {
          expect(ghostTable.widthsMap.getValueAtIndex(col)).toBe(null);
        }

        // Shown columns should have positive widths.
        for (const col of [2, 4, 7, 8]) {
          expect(ghostTable.widthsMap.getValueAtIndex(col)).toBeGreaterThan(0);
        }

        // The long header columns should be wider than short header columns.
        expect(ghostTable.widthsMap.getValueAtIndex(7)).toBeGreaterThan(
          ghostTable.widthsMap.getValueAtIndex(4)
        );
      });
    });

  });
});
