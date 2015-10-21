describe('Number helper', function () {
  //
  // Handsontable.helper.rangeEach
  //
  describe('rangeEach', function() {
    it("should iterate increasingly, when `from` and `to` arguments are passed and `from` number is lower then `to`", function () {
      var rangeEach = Handsontable.helper.rangeEach;
      var spy = jasmine.createSpy();

      rangeEach(-1, 2, spy);

      expect(spy.calls.length).toBe(4);
      expect(spy.calls[0].args).toEqual([-1]);
      expect(spy.calls[1].args).toEqual([0]);
      expect(spy.calls[2].args).toEqual([1]);
      expect(spy.calls[3].args).toEqual([2]);
    });

    it("should iterate only once, when `from` and `to` arguments are equal", function () {
      var rangeEach = Handsontable.helper.rangeEach;
      var spy = jasmine.createSpy();

      rangeEach(10, 10, spy);

      expect(spy.calls.length).toBe(1);
      expect(spy.calls[0].args).toEqual([10]);
    });

    it("should iterate only once, when `from` and `to` arguments are equal and from value is zero", function () {
      var rangeEach = Handsontable.helper.rangeEach;
      var spy = jasmine.createSpy();

      rangeEach(0, spy);

      expect(spy.calls.length).toBe(1);
      expect(spy.calls[0].args).toEqual([0]);
    });

    it("should iterate increasingly from 0, when only `from` argument is passed", function () {
      var rangeEach = Handsontable.helper.rangeEach;
      var spy = jasmine.createSpy();

      rangeEach(4, spy);

      expect(spy.calls.length).toBe(5);
      expect(spy.calls[0].args).toEqual([0]);
      expect(spy.calls[4].args).toEqual([4]);
    });

    it("shouldn\'t iterate decreasingly, when `from` and `to` arguments are passed and `from` number is higher then `to`", function () {
      var rangeEach = Handsontable.helper.rangeEach;
      var spy = jasmine.createSpy();

      rangeEach(1, -3, spy);

      expect(spy.calls.length).toBe(0);
    });
  });

  //
  // Handsontable.helper.rangeEachReverse
  //
  describe('rangeEachReverse', function() {
    it("should iterate decreasingly, when `from` and `to` arguments are passed and `from` number is higher then `to`", function () {
      var rangeEachReverse = Handsontable.helper.rangeEachReverse;
      var spy = jasmine.createSpy();

      rangeEachReverse(2, -1, spy);

      expect(spy.calls.length).toBe(4);
      expect(spy.calls[0].args).toEqual([2]);
      expect(spy.calls[1].args).toEqual([1]);
      expect(spy.calls[2].args).toEqual([0]);
      expect(spy.calls[3].args).toEqual([-1]);
    });

    it("should iterate only once, when `from` and `to` arguments are equal", function () {
      var rangeEachReverse = Handsontable.helper.rangeEachReverse;
      var spy = jasmine.createSpy();

      rangeEachReverse(10, 10, spy);

      expect(spy.calls.length).toBe(1);
      expect(spy.calls[0].args).toEqual([10]);
    });

    it("should iterate only once, when `from` and `to` arguments are equal and from value is zero", function () {
      var rangeEachReverse = Handsontable.helper.rangeEachReverse;
      var spy = jasmine.createSpy();

      rangeEachReverse(0, spy);

      expect(spy.calls.length).toBe(1);
      expect(spy.calls[0].args).toEqual([0]);
    });

    it("should iterate decreasingly to 0, when only `from` argument is passed", function () {
      var rangeEachReverse = Handsontable.helper.rangeEachReverse;
      var spy = jasmine.createSpy();

      rangeEachReverse(4, spy);

      expect(spy.calls.length).toBe(5);
      expect(spy.calls[0].args).toEqual([4]);
      expect(spy.calls[4].args).toEqual([0]);
    });

    it("shouldn\'t iterate increasingly, when `from` and `to` arguments are passed and `from` number is higher then `to`", function () {
      var rangeEachReverse = Handsontable.helper.rangeEachReverse;
      var spy = jasmine.createSpy();

      rangeEachReverse(1, 5, spy);

      expect(spy.calls.length).toBe(0);
    });
  });
});
