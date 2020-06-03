import {
  arrayAvg,
  arrayEach,
  arrayFilter,
  arrayFlatten,
  arrayMap,
  arrayMax,
  arrayMin,
  arrayReduce,
  arraySum,
  stringToArray,
  getDifferenceOfArrays,
  getIntersectionOfArrays,
  getUnionOfArrays
} from 'handsontable/helpers/array';

describe('Array helper', () => {
  const iterableObject = {
    _myArray: [2, 6, 3, 1],
    [Symbol.iterator]() {
      return this._myArray[Symbol.iterator]();
    }
  };

  //
  // Handsontable.helper.arrayAvg
  //
  describe('arrayAvg', () => {
    it('should returns the average value', () => {
      expect(arrayAvg([1])).toBe(1);
      expect(arrayAvg([1, 1, 2, 3, 4])).toBe(2.2);
    });
  });

  //
  // Handsontable.helper.arrayEach
  //
  describe('arrayEach', () => {
    it('should call callback with proper arguments for input data passed as an array', () => {
      const cb = jasmine.createSpy('cb');

      cb.and.callFake(() => true);

      arrayEach([4, 5, 2, 15], cb);

      expect(cb.calls.count()).toBe(4);
      expect(cb.calls.argsFor(0)).toEqual([4, 0, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(1)).toEqual([5, 1, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(2)).toEqual([2, 2, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(3)).toEqual([15, 3, [4, 5, 2, 15]]);
    });

    it('should call callback with proper arguments for input data passed as an object with implemented iterator protocol', () => {
      const cb = jasmine.createSpy('cb');

      cb.and.callFake(() => true);

      arrayEach(iterableObject, cb);

      expect(cb.calls.count()).toBe(4);
      expect(cb.calls.argsFor(0)).toEqual([2, 0, [2, 6, 3, 1]]);
      expect(cb.calls.argsFor(1)).toEqual([6, 1, [2, 6, 3, 1]]);
      expect(cb.calls.argsFor(2)).toEqual([3, 2, [2, 6, 3, 1]]);
      expect(cb.calls.argsFor(3)).toEqual([1, 3, [2, 6, 3, 1]]);
    });

    it('should break the loop on first invocation when the callback returns `false`', () => {
      const cb = jasmine.createSpy('cb');

      cb.and.callFake(() => false);

      arrayEach([4, 5, 2, 15], cb);

      expect(cb.calls.count()).toBe(1);
      expect(cb.calls.argsFor(0)).toEqual([4, 0, [4, 5, 2, 15]]);
    });

    it('should break the loop on when callback returns `false`', () => {
      const cb = jasmine.createSpy('cb');

      cb.and.callFake(value => value !== 2);

      arrayEach([4, 5, 2, 15], cb);

      expect(cb.calls.count()).toBe(3);
      expect(cb.calls.argsFor(0)).toEqual([4, 0, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(1)).toEqual([5, 1, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(2)).toEqual([2, 2, [4, 5, 2, 15]]);
    });
  });

  //
  // Handsontable.helper.arrayFilter
  //
  describe('arrayFilter', () => {
    it('should call callback with proper arguments for input data passed as an array', () => {
      const cb = jasmine.createSpy('cb');

      cb.and.callFake(() => true);

      arrayFilter([4, 5, 2, 15], cb);

      expect(cb.calls.count()).toBe(4);
      expect(cb.calls.argsFor(0)).toEqual([4, 0, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(1)).toEqual([5, 1, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(2)).toEqual([2, 2, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(3)).toEqual([15, 3, [4, 5, 2, 15]]);
    });

    it('should call callback with proper arguments for input data passed as an object with implemented iterator protocol', () => {
      const cb = jasmine.createSpy('cb');

      cb.and.callFake(() => true);

      arrayFilter(iterableObject, cb);

      expect(cb.calls.count()).toBe(4);
      expect(cb.calls.argsFor(0)).toEqual([2, 0, [2, 6, 3, 1]]);
      expect(cb.calls.argsFor(1)).toEqual([6, 1, [2, 6, 3, 1]]);
      expect(cb.calls.argsFor(2)).toEqual([3, 2, [2, 6, 3, 1]]);
      expect(cb.calls.argsFor(3)).toEqual([1, 3, [2, 6, 3, 1]]);
    });

    it('should return new an array with filtered values', () => {
      const cb = jasmine.createSpy('cb');
      const data = [4, 5, 2, 15];

      cb.and.callFake(value => value % 2);

      arrayFilter(data, cb);

      expect(arrayFilter(data, cb)).not.toBe(data);
      expect(data).toEqual([4, 5, 2, 15]);
      expect(arrayFilter(data, cb)).toEqual([5, 15]);
    });
  });

  //
  // Handsontable.helper.arrayFlatten
  //
  describe('arrayFlatten', () => {
    it('should returns the flattened array', () => {
      expect(arrayFlatten([1])).toEqual([1]);
      expect(arrayFlatten([1, 2, 3, [4, 5, 6]])).toEqual([1, 2, 3, 4, 5, 6]);
      expect(arrayFlatten([1, [[[2]]], 3, [[4], [5], [6]]])).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  //
  // Handsontable.helper.arrayMap
  //
  describe('arrayMap', () => {
    it('should returns the mapped array', () => {
      expect(arrayMap([1], a => a + 1)).toEqual([2]);
      expect(arrayMap([1, 2, 3], () => '')).toEqual(['', '', '']);
    });

    it('should call callback with proper arguments for input data passed as an array', () => {
      const cb = jasmine.createSpy('cb');

      cb.and.callFake(value => value);

      arrayMap([4, 5, 2, 15], cb);

      expect(cb.calls.count()).toBe(4);
      expect(cb.calls.argsFor(0)).toEqual([4, 0, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(1)).toEqual([5, 1, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(2)).toEqual([2, 2, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(3)).toEqual([15, 3, [4, 5, 2, 15]]);
    });

    it('should call callback with proper arguments for input data passed as an object with implemented iterator protocol', () => {
      const cb = jasmine.createSpy('cb');

      cb.and.callFake(value => value);

      arrayMap(iterableObject, cb);

      expect(cb.calls.count()).toBe(4);
      expect(cb.calls.argsFor(0)).toEqual([2, 0, [2, 6, 3, 1]]);
      expect(cb.calls.argsFor(1)).toEqual([6, 1, [2, 6, 3, 1]]);
      expect(cb.calls.argsFor(2)).toEqual([3, 2, [2, 6, 3, 1]]);
      expect(cb.calls.argsFor(3)).toEqual([1, 3, [2, 6, 3, 1]]);
    });
  });

  //
  // Handsontable.helper.arrayMax
  //
  describe('arrayMax', () => {
    it('should returns the highest number from an array (array of numbers)', () => {
      expect(arrayMax([])).toBeUndefined();
      expect(arrayMax([0])).toBe(0);
      expect(arrayMax([0, 0, 0, -1, 3, 2])).toBe(3);
      expect(arrayMax(iterableObject)).toBe(6);
    });

    it('should returns the highest string from an array (array of strings)', () => {
      expect(arrayMax(['b', 'a', 'A', 'z', 'Z', '1'])).toBe('z');
      expect(arrayMax(['b', 'a', 'A', 'Z', '1'])).toBe('b');
      expect(arrayMax(['a', 'A', 'Z', '1'])).toBe('a');
    });
  });

  //
  // Handsontable.helper.arrayMin
  //
  describe('arrayMin', () => {
    it('should returns the lowest number from an array (array of numbers)', () => {
      expect(arrayMin([])).toBeUndefined();
      expect(arrayMin([0])).toBe(0);
      expect(arrayMin([0, 0, 0, -1, 3, 2])).toBe(-1);
      expect(arrayMin(iterableObject)).toBe(1);
    });

    it('should returns the lowest string from an array (array of strings)', () => {
      expect(arrayMin(['b', 'a', 'A', 'z', '1'])).toBe('1');
      expect(arrayMin(['b', 'a', 'A', 'z'])).toBe('A');
      expect(arrayMin(['b', 'a', 'z'])).toBe('a');
    });
  });

  //
  // Handsontable.helper.arrayReduce
  //
  describe('arrayReduce', () => {
    it('should call callback with proper arguments for input data passed as an array', () => {
      const cb = jasmine.createSpy('cb');

      cb.and.callFake((acc, value) => acc + value);

      arrayReduce([4, 5, 2, 15], cb, 0);

      expect(cb.calls.count()).toBe(4);
      expect(cb.calls.argsFor(0)).toEqual([0, 4, 0, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(1)).toEqual([4, 5, 1, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(2)).toEqual([9, 2, 2, [4, 5, 2, 15]]);
      expect(cb.calls.argsFor(3)).toEqual([11, 15, 3, [4, 5, 2, 15]]);
    });

    it('should return sum of all values', () => {
      const data = [4, 5, 2, 15];

      expect(arrayReduce(data, (acc, value) => acc + value, 0)).toBe(26);
    });

    it('should return an array with multipled values', () => {
      const data = [4, 5, 2, 15];

      expect(arrayReduce(data, (acc, value) => {
        acc.push(value * value);

        return acc;
      }, [])).toEqual([16, 25, 4, 225]);
    });

    it('should call callback with proper arguments for input data passed as an object with implemented iterator protocol', () => {
      const cb = jasmine.createSpy('cb');

      cb.and.callFake((acc, value) => acc + value);

      arrayReduce(iterableObject, cb, 0);

      expect(cb.calls.count()).toBe(4);
      expect(cb.calls.argsFor(0)).toEqual([0, 2, 0, [2, 6, 3, 1]]);
      expect(cb.calls.argsFor(1)).toEqual([2, 6, 1, [2, 6, 3, 1]]);
      expect(cb.calls.argsFor(2)).toEqual([8, 3, 2, [2, 6, 3, 1]]);
      expect(cb.calls.argsFor(3)).toEqual([11, 1, 3, [2, 6, 3, 1]]);
    });
  });

  //
  // Handsontable.helper.arraySum
  //
  describe('arraySum', () => {
    it('should returns the cumulative value', () => {
      expect(arraySum([1])).toBe(1);
      expect(arraySum([1, 1, 2, 3, 4])).toBe(11);
      expect(arraySum([1, 1, 0, 3.1, 4.2])).toBe(9.3);
      expect(arraySum(iterableObject)).toBe(12);
    });
  });

  //
  // Handsontable.helper.getDifferenceOfArrays
  //
  describe('getDifferenceOfArrays', () => {
    describe('works with parameters as array of number', () => {
      it('should return the difference between two arrays.', () => {

        expect(getDifferenceOfArrays([1, 2, 3], [2, 3, 4])).toStrictEqual([1]);
      });

      it('should return the difference between more than two arrays.', () => {

        expect(getDifferenceOfArrays([1, 2, 3], [3, 4], [3, 4, 5, 6, 7])).toStrictEqual([1, 2]);
      });
    });

    describe('works with parameters as array of string', () => {
      it('should return the difference between two arrays.', () => {
        expect(getDifferenceOfArrays(
          ['class-1', 'class-2', 'class-3'],
          ['class-2', 'class-3', 'class-4']
        )).toStrictEqual(['class-1']);
      });

      it('should return the difference between more than two arrays.', () => {
        expect(getDifferenceOfArrays(
          ['class-1', 'class-2', 'class-3'],
          ['class-3', 'class-4'],
          ['class-3', 'class-4', 'class-5']
        )).toStrictEqual(['class-1', 'class-2']);
      });
    });
  });

  //
  // Handsontable.helper.getIntersectionOfArrays
  //
  describe('getIntersectionOfArrays', () => {
    describe('works with parameters as array of number', () => {
      it('should return elements that exists in two arrays.', () => {
        expect(getIntersectionOfArrays([1, 2, 3], [2, 3, 4])).toStrictEqual([2, 3]);
      });

      it('should return elements that exists in more than two arrays.', () => {
        expect(getIntersectionOfArrays([1, 2, 3], [3, 4], [3, 4, 5, 6, 7])).toStrictEqual([3]);
      });
    });

    describe('works with parameters as array of string', () => {
      it('should return elements that exists in two arrays.', () => {
        expect(getIntersectionOfArrays(
          ['class-1', 'class-2', 'class-3'],
          ['class-2', 'class-3', 'class-4']
        )).toStrictEqual(['class-2', 'class-3']);
      });

      it('should return elements that exists in more than two arrays.', () => {
        expect(getIntersectionOfArrays(
          ['class-1', 'class-2', 'class-3'],
          ['class-3', 'class-4'],
          ['class-3', 'class-4', 'class-5']
        )).toStrictEqual(['class-3']);
      });
    });
  });

  //
  // Handsontable.helper.getUnionOfArrays
  //
  describe('getUnionOfArrays', () => {
    describe('works with parameters as array of number', () => {
      it('should return elements exists in any of the two arrays.', () => {
        expect(getUnionOfArrays([1, 2, 3], [2, 3, 4])).toStrictEqual([1, 2, 3, 4]);
      });

      it('should return elements that exists in any of the arrays.', () => {
        expect(getUnionOfArrays([1, 2, 3], [3, 4], [3, 4, 5, 6, 7])).toStrictEqual([1, 2, 3, 4, 5, 6, 7]);
      });
    });

    describe('works with parameters as array of string', () => {
      it('should return elements exists in any of the two arrays.', () => {
        expect(getUnionOfArrays(
          ['class-1', 'class-2', 'class-3'],
          ['class-2', 'class-3', 'class-4']
        )).toStrictEqual(['class-1', 'class-2', 'class-3', 'class-4']);
      });

      it('should return elements that exists in any of the arrays.', () => {
        expect(getUnionOfArrays(
          ['class-1', 'class-2', 'class-3'],
          ['class-3', 'class-4'],
          ['class-3', 'class-4', 'class-5']
        )).toStrictEqual(['class-1', 'class-2', 'class-3', 'class-4', 'class-5']);
      });
    });
  });

  //
  // Handsontable.helper.stringToArray
  //
  describe('stringToArray', () => {
    describe('works with parameter as string without the specified second parameter', () => {
      it('should return array of strings.', () => {

        expect(stringToArray('class-1 class-2 class-3')).toStrictEqual(['class-1', 'class-2', 'class-3']);
      });
    });

    describe('works with parameter as a string with the specified second parameter', () => {
      it('should return array of strings.', () => {
        expect(stringToArray('class-1,class-2,class-3', ',')).toStrictEqual(['class-1', 'class-2', 'class-3']);
      });
    });
  });
});
