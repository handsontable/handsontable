describe('WalkontableRowStrategy', function () {
  var source;

  function allCells25(i) {
    if (source[i] !== void 0) {
      return 25;
    }
  }

  function allCellsPlus100(i) {
    if (source[i] !== void 0) {
      return i + 100;
    }
  }

  it("cell strategy should be 25", function () {
    source = [0, 1, 2, 5, 6, 7, 8, 9, 10];
    var strategy = new WalkontableRowStrategy(100, allCells25);
    for (var i = 0; i < source.length; i++) {
      strategy.add(i);
    }
    expect(strategy.cellSizes).toEqual([25, 25, 25, 25]);
  });

  it("should show all cells if containerSize is Infinity", function () {
    source = [0, 1, 2, 5, 6, 7, 8, 9, 10];
    var strategy = new WalkontableRowStrategy(Infinity, allCells25);
    for (var i = 0; i < source.length; i++) {
      strategy.add(i);
    }
    expect(strategy.cellCount).toEqual(source.length);
  });

//getSize

  it("getSize should return cell size at given index", function () {
    source = [0, 1, 2, 3, 4];
    var strategy = new WalkontableRowStrategy(Infinity, allCellsPlus100);
    for (var i = 0; i < source.length; i++) {
      strategy.add(i);
    }
    expect(strategy.cellSizes).toEqual([100, 101, 102, 103, 104]);
    expect(strategy.getSize(0)).toEqual(100);
    expect(strategy.getSize(4)).toEqual(104);
  });
})
;
