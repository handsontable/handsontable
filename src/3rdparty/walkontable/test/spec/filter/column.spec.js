describe('WalkontableColumnFilter', function () {
  describe('offsettedTH', function () {
    it("should do nothing if row header is not visible", function () {
      var filter = new WalkontableColumnFilter();
      filter.countTH = 0;
      expect(filter.offsettedTH(1)).toEqual(1);
    });

    it("should decrease n by 1 if row header is visible", function () {
      var filter = new WalkontableColumnFilter();
      filter.countTH = 1;
      expect(filter.offsettedTH(1)).toEqual(0);
    })
  });

  describe('unOffsettedTH', function () {
    it("should do nothing if row header is not visible", function () {
      var filter = new WalkontableColumnFilter();
      filter.countTH = 0;
      expect(filter.unOffsettedTH(1)).toEqual(1);
    });

    it("should increase n by 1 if row header is visible", function () {
      var filter = new WalkontableColumnFilter();
      filter.countTH = 1;
      expect(filter.unOffsettedTH(0)).toEqual(1);
    })
  });
});
