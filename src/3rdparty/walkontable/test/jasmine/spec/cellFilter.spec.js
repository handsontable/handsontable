describe('WalkontableCellFilter', function () {
  describe('source', function () {
    it("should return n", function () {
      var filter = new WalkontableCellFilter();
      expect(filter.source(0)).toEqual(0);
    });
  });

  describe('offsetted', function () {
    it("should return n, when offset == 0 && n == 0", function () {
      var filter = new WalkontableCellFilter();
      filter.offset = 0;
      filter.total = 100;
      expect(filter.offsetted(0)).toEqual(0);
    });

    it("should return n, when offset == 0 && n == 5", function () {
      var filter = new WalkontableCellFilter();
      filter.offset = 0;
      filter.total = 100;
      expect(filter.offsetted(5)).toEqual(5);
    });

    it("should return n + 1, when offset == 1 && n == 0", function () {
      var filter = new WalkontableCellFilter();
      filter.offset = 1;
      filter.total = 100;
      expect(filter.offsetted(0)).toEqual(1);
    });

    it("should return n + 5, when offset == 5 && n == 0", function () {
      var filter = new WalkontableCellFilter();
      filter.offset = 5;
      filter.total = 100;
      expect(filter.offsetted(0)).toEqual(5);
    });
  });

  describe('unOffsetted', function () {
    it("should return n, when offset == 0 && n == 0", function () {
      var filter = new WalkontableCellFilter();
      filter.offset = 0;
      filter.total = 100;
      expect(filter.unOffsetted(0)).toEqual(0);
    });

    it("should return n, when offset == 0 && n == 5", function () {
      var filter = new WalkontableCellFilter();
      filter.offset = 0;
      filter.total = 100;
      expect(filter.unOffsetted(5)).toEqual(5);
    });

    it("should return n - 1, when offset == 1 && n == 0", function () {
      var filter = new WalkontableCellFilter();
      filter.offset = 1;
      filter.total = 100;
      expect(filter.unOffsetted(1)).toEqual(0);
    });

    it("should return n - 5, when offset == 5 && n == 0", function () {
      var filter = new WalkontableCellFilter();
      filter.offset = 5;
      filter.total = 100;
      expect(filter.unOffsetted(5)).toEqual(0);
    });
  });

  describe('fixed', function () {
    it("should ignore column offset for fixed cells", function () {
      var filter = new WalkontableCellFilter();
      filter.fixedCount = 1; //only cell index 0 falls into this
      filter.offset = 5;
      expect(filter.fixed(0)).toEqual(-5);
    });

    it("should call column offset for cells outside fixed range", function () {
      var filter = new WalkontableCellFilter();
      filter.fixedCount = 1; //only cell index 0 falls into this
      filter.offset = 5;
      expect(filter.fixed(1)).toEqual(1);
    })
  });

  describe('unFixed', function () {
    it("should ignore column offset for fixed cells", function () {
      var filter = new WalkontableCellFilter();
      filter.fixedCount = 1; //only cell index 0 falls into this
      filter.offset = 5;
      expect(filter.unFixed(0)).toEqual(5);
    });

    it("should call column offset for cells outside fixed range", function () {
      var filter = new WalkontableCellFilter();
      filter.fixedCount = 1; //only cell index 0 falls into this
      filter.total = 100;
      expect(filter.unFixed(1)).toEqual(1);
    })
  });

  describe('visibleToSource', function () {
    it("should translate visible column to source", function () {
      var filter = new WalkontableCellFilter();
      filter.fixedCount = 1; //only cell index 0 falls into this
      filter.offset = 4;
      expect(filter.visibleToSource(0)).toEqual(0);
      expect(filter.visibleToSource(1)).toEqual(5);
      expect(filter.visibleToSource(2)).toEqual(6);
    })
  });
});
