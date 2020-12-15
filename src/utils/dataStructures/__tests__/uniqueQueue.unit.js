import { createUniqueQueue } from '../uniqueQueue';

describe('createUniqueQueue', () => {
  describe('interface', () => {
    const queue = createUniqueQueue();

    expect(queue.addItem).toBeInstanceOf(Function);
    expect(queue.getItems).toBeInstanceOf(Function);
  });

  describe('operations', () => {
    it('should be possible to add items', () => {
      const queue = createUniqueQueue();

      queue.addItem('A');
      queue.addItem('B');

      expect(queue.getItems()).toEqual(['A', 'B']);
    });
    it('should throw error if item is already in queue', () => {
      const queue = createUniqueQueue();

      queue.addItem('A');

      expect(() => {
        queue.addItem('A');
      }).toThrowError('\'A\' value is already declared in a unique queue.');
    });
    it('should throw the custom error message if item is already in queue', () => {
      const queue = createUniqueQueue({
        errorItemExists: item => `"${item}" is already registered`,
      });

      queue.addItem('A');

      expect(() => {
        queue.addItem('A');
      }).toThrowError('"A" is already registered');
    });
    it('should get items in the registering order', () => {
      const queue = createUniqueQueue();

      queue.addItem('D');
      queue.addItem('A');
      queue.addItem('C');
      queue.addItem('B');

      expect(queue.getItems()).toEqual(['D', 'A', 'C', 'B']);
    });
  });
});
