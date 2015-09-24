describe('Array helper', function () {
  //
  // Handsontable.helper.arrayFlatten
  //
  describe('arrayFlatten', function() {
    it("should returns the flattened array", function () {
      var arrayFlatten = Handsontable.helper.arrayFlatten;

      expect(arrayFlatten([1])).toEqual([1]);
      expect(arrayFlatten([1, 2, 3, [4, 5, 6]])).toEqual([1, 2, 3, 4, 5, 6]);
      expect(arrayFlatten([1, [[[2]]], 3, [[4], [5], [6]]])).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  //
  // Handsontable.helper.arrayAvg
  //
  describe('arrayAvg', function() {
    it("should returns the average value", function () {
      var arrayAvg = Handsontable.helper.arrayAvg;

      expect(arrayAvg([1])).toBe(1);
      expect(arrayAvg([1, 1, 2, 3, 4])).toBe(2.2);
    });
  });

  //
  // Handsontable.helper.arrayAvg
  //
  describe('arraySum', function() {
    it("should returns the cumulative value", function () {
      var arraySum = Handsontable.helper.arraySum;

      expect(arraySum([1])).toBe(1);
      expect(arraySum([1, 1, 2, 3, 4])).toBe(11);
      expect(arraySum([1, 1, 0, 3.1, 4.2])).toBe(9.3);
    });
  });
});
