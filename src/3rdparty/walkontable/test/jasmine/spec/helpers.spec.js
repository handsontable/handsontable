describe('Helpers', function () {
  describe('walkontableRangesIntersect', function () {

    //positive

    it("0..0 should intersect with 0..1", function () {
      expect(walkontableRangesIntersect(0, 0, 0, 1)).toEqual(true);
    });

    it("1..10 should intersect with 0..1", function () {
      expect(walkontableRangesIntersect(1, 10, 0, 1)).toEqual(true);
    });

    it("0..10 should intersect with 10..10", function () {
      expect(walkontableRangesIntersect(0, 10, 10, 10)).toEqual(true);
    });

    it("0..10 should intersect with 10..11", function () {
      expect(walkontableRangesIntersect(0, 10, 10, 11)).toEqual(true);
    });

    it("10..10 should intersect with 0..5, 10..10", function () {
      expect(walkontableRangesIntersect(10, 10, 0, 5, 10, 10)).toEqual(true);
    });

    //negative

    it("0..10 should not intersect with 11..11", function () {
      expect(walkontableRangesIntersect(0, 10, 11, 11)).toEqual(false);
    });

    it("11..11 should not intersect with 0..10", function () {
      expect(walkontableRangesIntersect(11, 11, 0, 10)).toEqual(false);
    });

    it("10..10 should not intersect with 0..5, 11..15", function () {
      expect(walkontableRangesIntersect(10, 10, 0, 5, 11, 15)).toEqual(false);
    });
  });
});