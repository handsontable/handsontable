describe('HandsontableEditor positioning (RTL mode)', () => {
  function createEditorSettings() {
    return {
      type: 'handsontable',
      handsontable: {
        colHeaders: ['Marque', 'Country', 'Parent company'],
        colWidths: [85, 85, 220],
        data: [
          { name: 'BMW', country: 'Germany', owner: 'Bayerische Motoren Werke AG' },
          { name: 'Chrysler', country: 'USA', owner: 'Chrysler Group LLC' },
          { name: 'Nissan', country: 'Japan', owner: 'Nissan Motor Company Ltd' },
          { name: 'Suzuki', country: 'Japan', owner: 'Suzuki Motor Corporation' },
          { name: 'Toyota', country: 'Japan', owner: 'Toyota Motor Corporation' },
          { name: 'Volvo', country: 'Sweden', owner: 'Zhejiang Geely Holding Group' }
        ],
      }
    };
  }

  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $('<div id="testContainer"></div>').appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    // all other E2E tests are moved to visual tests. See ./visual-tests/tests/js-only/editors/handsontable/

    it('should render the editors dropdown on the right edited cell when there is no space left on the left', async() => {
      handsontable({
        data: createSpreadsheetData(25, 25),
        layoutDirection,
        colWidths: 80,
        rowHeights: 38,
        width: 800,
        height: 300,
        ...createEditorSettings(),
      });

      const scrollEdgePositions = {
        horizon: 149,
        main: 151,
        classic: 151,
      };

      const scrollPositionBase = scrollEdgePositions[spec().loadedTheme];

      if (scrollPositionBase === undefined) {
        throw new Error('Missing scroll position base for the current theme');
      }

      // scroll the viewport to the point where the editor may be rendered on the right (there is enough space)
      await scrollViewportHorizontally(scrollPositionBase);

      await selectCell(1, 7);
      await keyDownUp('enter');

      const relativeRect = getCell(2, 7).getBoundingClientRect();

      {
        const containerRect = getActiveEditor().htContainer.getBoundingClientRect();

        expect({
          top: containerRect.top,
          right: containerRect.right,
        }).toEqual({
          top: relativeRect.top,
          right: relativeRect.right + 1,
        });
      }

      await keyDownUp('escape');
      // scroll the viewport to the point where the editor may not be rendered on the right (there is not enough space)
      // so it should be rendered on the left
      await scrollViewportHorizontally(scrollPositionBase - 1);
      await keyDownUp('enter');

      {
        const containerRect = getActiveEditor().htContainer.getBoundingClientRect();

        expect({
          top: containerRect.top,
          left: containerRect.left,
        }).toEqual({
          top: relativeRect.top,
          left: relativeRect.left - 1,
        });
      }
    });
  });
});
