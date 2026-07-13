describe('WalkontableSelectionHandles', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable');
    this.$container = $('<div></div>');
    this.$wrapper.width(200).height(200);
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray();
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should create four adjust-handle elements', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'blue',
        // On desktop data-view instances, handle elements are always created regardless of
        // `adjustHandlesVisible` — this setting only gates their VISIBILITY during positioning.
        // The positioning / visibility behaviour is exercised by the tests added in the next task.
        // Keep `adjustHandlesVisible` in place: later tests rely on it to opt in to the feature.
        adjustHandlesVisible() {
          return true;
        }
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections,
    });

    selections.getFocus()
      .add(new Walkontable.CellCoords(1, 1))
      .add(new Walkontable.CellCoords(3, 3));

    wt.draw();

    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const handles = focusBorder.main.querySelectorAll('.wtSelectionHandle');

    expect(handles.length).toBe(4);
  });
});
