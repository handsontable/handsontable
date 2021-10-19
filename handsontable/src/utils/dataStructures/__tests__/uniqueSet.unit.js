import { createUniqueSet } from '../uniqueSet';

describe('createUniqueSet', () => {
  describe('interface', () => {
    const uniqueSet = createUniqueSet();

    expect(uniqueSet.addItem).toBeInstanceOf(Function);
    expect(uniqueSet.getItems).toBeInstanceOf(Function);
  });

  describe('operations', () => {
    it('should be possible to add items', () => {
      const uniqueSet = createUniqueSet();

      uniqueSet.addItem('A');
      uniqueSet.addItem('B');

      expect(uniqueSet.getItems()).toEqual(['A', 'B']);
    });

    it('should throw error if item is already in set', () => {
      const uniqueSet = createUniqueSet();

      uniqueSet.addItem('A');

      expect(() => {
        uniqueSet.addItem('A');
      }).toThrowError('\'A\' value is already declared in a unique set.');
    });

    it('should throw the custom error message if item is already in set', () => {
      const uniqueSet = createUniqueSet({
        errorItemExists: item => `"${item}" is already registered`,
      });

      uniqueSet.addItem('A');

      expect(() => {
        uniqueSet.addItem('A');
      }).toThrowError('"A" is already registered');
    });

    it('should get items in the registering order', () => {
      const uniqueSet = createUniqueSet();

      uniqueSet.addItem('D');
      uniqueSet.addItem('A');
      uniqueSet.addItem('C');
      uniqueSet.addItem('B');

      expect(uniqueSet.getItems()).toEqual(['D', 'A', 'C', 'B']);
    });
  });
});
