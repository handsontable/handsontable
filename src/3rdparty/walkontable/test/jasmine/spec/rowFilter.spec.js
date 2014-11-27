describe('WalkontableRowFilter', function () {

  describe('offsetted', function () {
    it("should return n, when offset == 0 && n == 0", function () {
      var filter = new WalkontableRowFilter();
      filter.offset = 0;
      filter.total = 100;
      expect(filter.offsetted(0)).toEqual(0);
    });

    it("should return n, when offset == 0 && n == 5", function () {
      var filter = new WalkontableRowFilter();
      filter.offset = 0;
      filter.total = 100;
      expect(filter.offsetted(5)).toEqual(5);
    });

    it("should return n + 1, when offset == 1 && n == 0", function () {
      var filter = new WalkontableRowFilter();
      filter.offset = 1;
      filter.total = 100;
      expect(filter.offsetted(0)).toEqual(1);
    });

    it("should return n + 5, when offset == 5 && n == 0", function () {
      var filter = new WalkontableRowFilter();
      filter.offset = 5;
      filter.total = 100;
      expect(filter.offsetted(0)).toEqual(5);
    });
  });

  describe('unOffsetted', function () {
    it("should return n, when offset == 0 && n == 0", function () {
      var filter = new WalkontableRowFilter();
      filter.offset = 0;
      filter.total = 100;
      expect(filter.unOffsetted(0)).toEqual(0);
    });

    it("should return n, when offset == 0 && n == 5", function () {
      var filter = new WalkontableRowFilter();
      filter.offset = 0;
      filter.total = 100;
      expect(filter.unOffsetted(5)).toEqual(5);
    });

    it("should return n - 1, when offset == 1 && n == 0", function () {
      var filter = new WalkontableRowFilter();
      filter.offset = 1;
      filter.total = 100;
      expect(filter.unOffsetted(1)).toEqual(0);
    });

    it("should return n - 5, when offset == 5 && n == 0", function () {
      var filter = new WalkontableRowFilter();
      filter.offset = 5;
      filter.total = 100;
      expect(filter.unOffsetted(5)).toEqual(0);
    });
  });

  describe('renderedToSource', function () {
    it("should translate visible column to source", function () {
      var filter = new WalkontableRowFilter();
      filter.fixedCount = 1; //only cell index 0 falls into this
      filter.offset = 4;
      expect(filter.renderedToSource(0)).toEqual(4);
      expect(filter.renderedToSource(1)).toEqual(5);
      expect(filter.renderedToSource(2)).toEqual(6);
    })
  });
});
