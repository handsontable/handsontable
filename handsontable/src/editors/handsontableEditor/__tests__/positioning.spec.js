describe('HandsontableEditor positioning', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

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

  // all other E2E tests are moved to visual tests. See ./visual-tests/tests/js-only/editors/handsontable/

  it('should render the editors dropdown on the left edited cell when there is no space left on the right', async() => {
    handsontable({
      data: createSpreadsheetData(25, 25),
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
        left: containerRect.left,
      }).toEqual({
        top: relativeRect.top,
        left: relativeRect.left - 1,
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
        right: containerRect.right,
      }).toEqual({
        top: relativeRect.top,
        right: relativeRect.right + 1,
      });
    }
  });

  it('should render the editors dropdown above the cell when there is no space left below', async() => {
    handsontable({
      data: createSpreadsheetData(25, 25),
      colWidths: 80,
      rowHeights: 38,
      width: 600,
      height: 600,
      ...createEditorSettings(),
    });

    const scrollEdgePositions = {
      horizon: 132,
      main: 70,
      classic: 25,
    };

    const scrollPositionBase = scrollEdgePositions[spec().loadedTheme];

    if (scrollPositionBase === undefined) {
      throw new Error('Missing scroll position base for the current theme');
    }

    // scroll the viewport to the point where the editor may be rendered on the bottom (there is enough space)
    await scrollViewportVertically(scrollPositionBase);

    await selectCell(11, 1);
    await keyDownUp('enter');

    {
      const relativeRect = getCell(12, 1).getBoundingClientRect();
      const containerRect = getActiveEditor().htContainer.getBoundingClientRect();

      console.log(relativeRect, containerRect);

      await sleep(5000);

      expect({
        top: containerRect.top,
        left: containerRect.left,
      }).toEqual({
        top: relativeRect.top,
        left: relativeRect.left - 1,
      });
    }

    await keyDownUp('escape');
    // scroll the viewport to the point where the editor may not be rendered on the bottom (there is not enough space)
    // so it should be rendered above the edited cell
    await scrollViewportVertically(scrollPositionBase - 1);
    await keyDownUp('enter');

    {
      const relativeRect = getCell(11, 1).getBoundingClientRect();
      const containerRect = getActiveEditor().htContainer.getBoundingClientRect();

      expect({
        top: containerRect.top,
        left: containerRect.left,
      }).toEqual({
        top: relativeRect.top - containerRect.height - 1,
        left: relativeRect.left - 1,
      });
    }
  });
});
