describe('WalkontableColumnStrategy', function () {
  var source;

  function allCells25(i) {
    if (source[i] !== void 0) {
      return 25;
    }
  }

  //STRATEGY none

  it("default - cell sizes should be 25", function () {
    source = [0, 1, 2, 5, 6, 7, 8, 9, 10];
    var strategy = new WalkontableColumnStrategy(100, allCells25, 'none');
    expect(strategy.cellSizes).toEqual([25, 25, 25, 25]);
  });

  //STRATEGY none - unlimited width

  it("default - should show all cells if containerSize is null", function () {
    source = [0, 1, 2, 5, 6, 7, 8, 9, 10];
    var strategy = new WalkontableColumnStrategy(null, allCells25, 'none');
    expect(strategy.cellCount).toEqual(source.length);
  });

  it("default - should show all cells if containerSize is undefined", function () {
    source = [0, 1, 2, 5, 6, 7, 8, 9, 10];
    var strategy = new WalkontableColumnStrategy(void 0, allCells25, 'none');
    expect(strategy.cellCount).toEqual(source.length);
  });

  it("default - should show all cells if containerSize is 0", function () {
    source = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var strategy = new WalkontableColumnStrategy(0, allCells25, 'none');
    expect(strategy.cellCount).toEqual(source.length);
  });

  it("default - should show all cells if containerSize is < 0", function () {
    source = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var strategy = new WalkontableColumnStrategy(-10, allCells25, 'none');
    expect(strategy.cellCount).toEqual(source.length);
  });

  //STRATEGY all

  it("all - should show 4 cells and stretch their size to 28", function () {
    source = [0, 1, 2, 3, 4];
    var strategy = new WalkontableColumnStrategy(140, allCells25, 'all');
    expect(strategy.cellSizes).toEqual([28, 28, 28, 28, 28]);
  });
  it("all - should show 4 cells and stretch their size to 28 (except last one which is stretched to remaining 29)", function () {
    source = [0, 1, 2, 3, 4];
    var strategy = new WalkontableColumnStrategy(141, allCells25, 'all');
    expect(strategy.cellSizes).toEqual([28, 28, 28, 28, 29]);
  });
  it("all - should not strech if not all cells are fully visible", function () {
    source = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var strategy = new WalkontableColumnStrategy(140, allCells25, 'all');
    expect(strategy.cellSizes).toEqual([25, 25, 25, 25, 25, 25]); //actually visible size of last column is 15 but here goes full value
  });

  //STRATEGY last

  it("last - should show 4 cells and stretch last one to 41", function () {
    source = [0, 1, 2, 3, 4];
    var strategy = new WalkontableColumnStrategy(141, allCells25, 'last');
    expect(strategy.cellSizes).toEqual([25, 25, 25, 25, 41]);
  });
  it("last - should not strech if not all cells are fully visible", function () {
    source = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var strategy = new WalkontableColumnStrategy(140, allCells25, 'last');
    expect(strategy.cellSizes).toEqual([25, 25, 25, 25, 25, 25]); //actually visible size of last column is 15 but here goes full value
  });

  //getSize

  it("getSize should return cell size at given index", function () {
    source = [0, 1, 2, 3, 4];
    var strategy = new WalkontableColumnStrategy(141, allCells25, 'last');
    expect(strategy.cellSizes).toEqual([25, 25, 25, 25, 41]);
    expect(strategy.getSize(0)).toEqual(25);
    expect(strategy.getSize(4)).toEqual(41);
  });
});
