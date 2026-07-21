describe('WalkontableMoveZone', () => {
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

  it('creates four grab-cursor move bands along the selection edges when moveEnabled', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'blue',
        moveEnabled() {
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
    const bands = focusBorder.main.querySelectorAll('.wtMoveZone');

    expect(bands.length).toBe(4);
    bands.forEach(b => expect(b.style.cursor).toBe('grab'));
  });

  it('shows all four bands with display:block after draw when moveEnabled', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'blue',
        moveEnabled() {
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

    // Interior selection — no grid edge touched.
    selections.getFocus()
      .add(new Walkontable.CellCoords(1, 1))
      .add(new Walkontable.CellCoords(3, 3));

    wt.draw();

    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const { styles } = focusBorder.moveZone;

    expect(styles.top.display).toBe('block');
    expect(styles.bottom.display).toBe('block');
    expect(styles.start.display).toBe('block');
    expect(styles.end.display).toBe('block');
  });

  it('does not show move bands when moveEnabled is falsy', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'blue',
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
    const { styles } = focusBorder.moveZone;

    expect(styles.top.display).toBe('none');
    expect(styles.bottom.display).toBe('none');
    expect(styles.start.display).toBe('none');
    expect(styles.end.display).toBe('none');
  });

  it('does not show move bands when moveEnabled returns false', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'blue',
        moveEnabled() {
          return false;
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
    const { styles } = focusBorder.moveZone;

    expect(styles.top.display).toBe('none');
    expect(styles.bottom.display).toBe('none');
    expect(styles.start.display).toBe('none');
    expect(styles.end.display).toBe('none');
  });

  it('applies z-index 100 (below the resize pills at 200) to all bands', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'blue',
        moveEnabled() {
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
    const bands = focusBorder.main.querySelectorAll('.wtMoveZone');

    bands.forEach(b => expect(b.style.zIndex).toBe('100'));
  });

  it('calls onSelectionEdgeMouseDown with the correct edge on band mousedown', async() => {
    const onSelectionEdgeMouseDown = jasmine.createSpy('onSelectionEdgeMouseDown');
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'blue',
        moveEnabled() {
          return true;
        }
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections,
      onSelectionEdgeMouseDown,
    });

    selections.getFocus()
      .add(new Walkontable.CellCoords(1, 1))
      .add(new Walkontable.CellCoords(3, 3));

    wt.draw();

    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());

    focusBorder.moveZone.top.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onSelectionEdgeMouseDown.calls.mostRecent().args[0]).toEqual(jasmine.any(MouseEvent));
    expect(onSelectionEdgeMouseDown.calls.mostRecent().args[1]).toBe('top');

    focusBorder.moveZone.bottom.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onSelectionEdgeMouseDown.calls.mostRecent().args[0]).toEqual(jasmine.any(MouseEvent));
    expect(onSelectionEdgeMouseDown.calls.mostRecent().args[1]).toBe('bottom');

    focusBorder.moveZone.start.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onSelectionEdgeMouseDown.calls.mostRecent().args[0]).toEqual(jasmine.any(MouseEvent));
    expect(onSelectionEdgeMouseDown.calls.mostRecent().args[1]).toBe('start');

    focusBorder.moveZone.end.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onSelectionEdgeMouseDown.calls.mostRecent().args[0]).toEqual(jasmine.any(MouseEvent));
    expect(onSelectionEdgeMouseDown.calls.mostRecent().args[1]).toBe('end');

    expect(onSelectionEdgeMouseDown).toHaveBeenCalledTimes(4);
  });

  it('hides bands via disappear() when disappear is called', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'blue',
        moveEnabled() {
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

    // Bands are visible after draw.
    expect(focusBorder.moveZone.styles.top.display).toBe('block');

    focusBorder.disappear();

    // All bands must be hidden after disappear().
    expect(focusBorder.moveZone.styles.top.display).toBe('none');
    expect(focusBorder.moveZone.styles.bottom.display).toBe('none');
    expect(focusBorder.moveZone.styles.start.display).toBe('none');
    expect(focusBorder.moveZone.styles.end.display).toBe('none');
  });
});
