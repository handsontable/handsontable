describe('WalkontableColumnStrategy', function () {
  var source;

  var fakeWalkontableInstance = {
    getSetting : function(){},
    wtTable: {
      allRowsInViewport: function () {}
    }
  };

  function allCells25(i) {
    if (source[i] !== void 0) {
      return 25;
    }
  }

  //STRATEGY none

  it("default - cell sizes should be 25", function () {
    source = [0, 1, 2, 5, 6, 7, 8, 9, 10];
    var strategy = new WalkontableColumnStrategy(fakeWalkontableInstance, 100, allCells25, 'none');
    strategy.stretch();
    expect(strategy.getSize(0)).toEqual(25);
    expect(strategy.getSize(1)).toEqual(25);
    expect(strategy.getSize(2)).toEqual(25);
    expect(strategy.getSize(3)).toEqual(25);
    expect(strategy.cellCount).toEqual(source.length);
  });

  //STRATEGY none - unlimited width

  it("default - should show all cells if containerSize is Infinity", function () {
    source = [0, 1, 2, 5, 6, 7, 8, 9, 10];
    var strategy = new WalkontableColumnStrategy(fakeWalkontableInstance, Infinity, allCells25, 'none');
    strategy.stretch();
    expect(strategy.cellCount).toEqual(source.length);
  });

  //STRATEGY all

  it("all - should show 4 cells and stretch their size to 28", function () {
    source = [0, 1, 2, 3, 4];
    var strategy = new WalkontableColumnStrategy(fakeWalkontableInstance, 140, allCells25, 'all');
    strategy.stretch();
    expect(strategy.getSize(0)).toEqual(28);
    expect(strategy.getSize(1)).toEqual(28);
    expect(strategy.getSize(2)).toEqual(28);
    expect(strategy.getSize(3)).toEqual(28);
    expect(strategy.getSize(4)).toEqual(28);
    expect(strategy.cellCount).toEqual(source.length);
  });
  it("all - should show 4 cells and stretch their size to 28 (except last one which is stretched to remaining 29)", function () {
    source = [0, 1, 2, 3, 4];
    var strategy = new WalkontableColumnStrategy(fakeWalkontableInstance, 141, allCells25, 'all');
    strategy.stretch();
    expect(strategy.getSize(0)).toEqual(28);
    expect(strategy.getSize(1)).toEqual(28);
    expect(strategy.getSize(2)).toEqual(28);
    expect(strategy.getSize(3)).toEqual(28);
    expect(strategy.getSize(4)).toEqual(29);
    expect(strategy.cellCount).toEqual(source.length);
  });
  it("all - should not strech if not all cells are fully visible", function () {
    source = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var strategy = new WalkontableColumnStrategy(fakeWalkontableInstance, 140, allCells25, 'all');
    strategy.stretch();
    expect(strategy.getSize(0)).toEqual(25);
    expect(strategy.getSize(1)).toEqual(25);
    expect(strategy.getSize(2)).toEqual(25);
    expect(strategy.getSize(3)).toEqual(25);
    expect(strategy.getSize(4)).toEqual(25);
    expect(strategy.getSize(5)).toEqual(25); //actually visible size of last column is 15 but here goes full value
    expect(strategy.cellCount).toEqual(source.length);
  });

  //STRATEGY last

  it("last - should show 4 cells and stretch last one to 41", function () {
    source = [0, 1, 2, 3, 4];
    var strategy = new WalkontableColumnStrategy(fakeWalkontableInstance, 141, allCells25, 'last');
    strategy.stretch();
    expect(strategy.getSize(0)).toEqual(25);
    expect(strategy.getSize(1)).toEqual(25);
    expect(strategy.getSize(2)).toEqual(25);
    expect(strategy.getSize(3)).toEqual(25);
    expect(strategy.getSize(4)).toEqual(41);
    expect(strategy.cellCount).toEqual(source.length);
  });
  it("last - should not strech if not all cells are fully visible", function () {
    source = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var strategy = new WalkontableColumnStrategy(fakeWalkontableInstance, 140, allCells25, 'last');
    strategy.stretch();
    expect(strategy.getSize(0)).toEqual(25);
    expect(strategy.getSize(1)).toEqual(25);
    expect(strategy.getSize(2)).toEqual(25);
    expect(strategy.getSize(3)).toEqual(25);
    expect(strategy.getSize(4)).toEqual(25);
    expect(strategy.getSize(5)).toEqual(25); //actually visible size of last column is 15 but here goes full value
    expect(strategy.cellCount).toEqual(source.length);
  });

  //getSize

  it("getSize should return cell size at given index", function () {
    source = [0, 1, 2, 3, 4];
    var strategy = new WalkontableColumnStrategy(fakeWalkontableInstance, 141, allCells25, 'last');
    strategy.stretch();
    expect(strategy.getSize(0)).toEqual(25);
    expect(strategy.getSize(1)).toEqual(25);
    expect(strategy.getSize(2)).toEqual(25);
    expect(strategy.getSize(3)).toEqual(25);
    expect(strategy.getSize(4)).toEqual(41);
    expect(strategy.cellCount).toEqual(5);
  });
});
