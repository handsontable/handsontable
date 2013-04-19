describe('WalkontableColumnStrategy', function () {
  function allCells25() {
    return 25;
  }

  //STRATEGY none

  it("default - should work when no cell ranges provided", function () {
    var widths = new WalkontableColumnStrategy(100, null, allCells25, 'none');
    expect(widths.cells).toEqual([]);
  });

  it("default - should show 4 cells", function () {
    var widths = new WalkontableColumnStrategy(100, [0, 10], allCells25, 'none');
    expect(widths.cells).toEqual([0, 1, 2, 3]);
  });

  it("default - should show 4 cells (with mixed range)", function () {
    var widths = new WalkontableColumnStrategy(100, [0, 2, 5, 10], allCells25, 'none');
    expect(widths.cells).toEqual([0, 1, 2, 5]);
  });

  it("default - cell widths should be 25", function () {
    var widths = new WalkontableColumnStrategy(100, [0, 2, 5, 10], allCells25, 'none');
    expect(widths.cellSizes).toEqual({0: 25, 1: 25, 2: 25, 5: 25});
  });

  //STRATEGY none - unlimited width

  it("default - should show all cells if containerSize is null", function () {
    var widths = new WalkontableColumnStrategy(null, [0, 10], allCells25, 'none');
    expect(widths.cells).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("default - should show all cells if containerSize is undefined", function () {
    var widths = new WalkontableColumnStrategy(void 0, [0, 10], allCells25, 'none');
    expect(widths.cells).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("default - should show all cells if containerSize is 0", function () {
    var widths = new WalkontableColumnStrategy(0, [0, 10], allCells25, 'none');
    expect(widths.cells).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("default - should show all cells if containerSize is < 0", function () {
    var widths = new WalkontableColumnStrategy(-10, [0, 10], allCells25, 'none');
    expect(widths.cells).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  //STRATEGY all

  it("all - should show 4 cells and stretch their size to 28", function () {
    var widths = new WalkontableColumnStrategy(140, [0, 4], allCells25, 'all');
    expect(widths.cellSizes).toEqual({0: 28, 1: 28, 2: 28, 3: 28, 4: 28});
  });
  it("all - should show 4 cells and stretch their size to 28 (except last one which is stretched to remaining 29)", function () {
    var widths = new WalkontableColumnStrategy(141, [0, 4], allCells25, 'all');
    expect(widths.cellSizes).toEqual({0: 28, 1: 28, 2: 28, 3: 28, 4: 29});
  });
  it("all - should not strech if not all cells are fully visible", function () {
    var widths = new WalkontableColumnStrategy(140, [0, 10], allCells25, 'all');
    expect(widths.cellSizes).toEqual({0: 25, 1: 25, 2: 25, 3: 25, 4: 25, 5: 25}); //actually visible size of last column is 15 but here goes full value
  });

  //STRATEGY last

  it("last - should show 4 cells and stretch last one to 41", function () {
    var widths = new WalkontableColumnStrategy(141, [0, 4], allCells25, 'last');
    expect(widths.cellSizes).toEqual({0: 25, 1: 25, 2: 25, 3: 25, 4: 41});
  });
  it("last - should not strech if not all cells are fully visible", function () {
    var widths = new WalkontableColumnStrategy(140, [0, 10], allCells25, 'last');
    expect(widths.cellSizes).toEqual({0: 25, 1: 25, 2: 25, 3: 25, 4: 25, 5: 25}); //actually visible size of last column is 15 but here goes full value
  });

  //getSize

  it("getSize should return cell size at given index", function () {
    var widths = new WalkontableColumnStrategy(141, [0, 4], allCells25, 'last');
    expect(widths.cellSizes).toEqual({0: 25, 1: 25, 2: 25, 3: 25, 4: 41});
    expect(widths.getSize(0)).toEqual(25);
    expect(widths.getSize(4)).toEqual(41);
  });
});
