import { createUniqueList } from '../uniqueList';

describe('createUniqueList', () => {
  describe('interface', () => {
    const list = createUniqueList();

    expect(list.addItem).toBeInstanceOf(Function);
    expect(list.getItem).toBeInstanceOf(Function);
  });

  describe('operations', () => {
    it('should be possible to add items', () => {
      const queue = createUniqueList();

      queue.addItem('A', 'ItemA');

      expect(queue.getItem('A')).toBe('ItemA');
    });
    it('should throw error if item is already in queue', () => {
      const queue = createUniqueList();

      queue.addItem('A', 'ItemA');

      expect(() => {
        queue.addItem('A', 'ItemA');
      }).toThrowError('The id \'A\' is already declared in a list.');
    });
    it('should throw the custom error message if item is already in queue', () => {
      const queue = createUniqueList({
        errorIdExists: item => `"${item}" is already registered`,
      });

      queue.addItem('A', 'ItemA');

      expect(() => {
        queue.addItem('A', 'ItemA');
      }).toThrowError('"A" is already registered');
    });
    it('should throw error if the getting item is not registered in queue', () => {
      const queue = createUniqueList();

      expect(() => {
        queue.getItem('A');
      }).toThrowError('The id \'A\' is not declared in a list.');
    });
    it('should throw the custom error message if item is already in queue', () => {
      const queue = createUniqueList({
        errorIdNotExists: item => `"${item}" is not registered`,
      });

      expect(() => {
        queue.getItem('A');
      }).toThrowError('"A" is not registered');
    });
  });
});
