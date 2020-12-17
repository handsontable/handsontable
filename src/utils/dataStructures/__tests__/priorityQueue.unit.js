import { ASC, DESC, createPriorityQueue } from '../priorityQueue';

describe('createPriorityQueue', () => {
  describe('interface', () => {
    it('should create a priority queue', () => {
      const queue = createPriorityQueue();

      expect(queue.addItem).toBeInstanceOf(Function);
      expect(queue.getItems).toBeInstanceOf(Function);
    });
  });

  describe('operations', () => {
    it('should add items to the queue', () => {
      const queue = createPriorityQueue();

      queue.addItem(1, 'A');
      queue.addItem(2, 'B');

      expect(queue.getItems()).toEqual(['A', 'B']);
    });

    it('should throw an error if priority is not a number', () => {
      const queue = createPriorityQueue();

      expect(() => {
        queue.addItem('a', 'A');
      }).toThrowError('The priority \'a\' is not a number.');
    });

    it('should be possible to throw a custom error message if priority is not a number', () => {
      const queue = createPriorityQueue({
        errorPriorityNaN: priority => `"${priority}" is not a valid priority key.`,
      });

      expect(() => {
        queue.addItem('a', 'A');
      }).toThrowError('"a" is not a valid priority key.');
    });

    it('should throw an error if priority is already registered', () => {
      const queue = createPriorityQueue();

      queue.addItem(1, 'A');

      expect(() => {
        queue.addItem(1, 'A');
      }).toThrowError('The priority \'1\' is already declared in a queue.');
    });

    it('should throw an error if priority is already registered', () => {
      const queue = createPriorityQueue({
        errorPriorityExists: priority => `Choose other priority than "${priority}"`,
      });

      queue.addItem(1, 'A');

      expect(() => {
        queue.addItem(1, 'A');
      }).toThrowError('Choose other priority than "1"');
    });

    it('should be possible to get items in ASC order', () => {
      const queue = createPriorityQueue();

      queue.addItem(3, 'A');
      queue.addItem(4, 'B');
      queue.addItem(2, 'C');
      queue.addItem(1, 'D');

      expect(queue.getItems()).toEqual(['D', 'C', 'A', 'B']);
      expect(queue.getItems(ASC)).toEqual(['D', 'C', 'A', 'B']);
    });

    it('should be possible to get items in DESC order', () => {
      const queue = createPriorityQueue();

      queue.addItem(3, 'A');
      queue.addItem(4, 'B');
      queue.addItem(2, 'C');
      queue.addItem(1, 'D');

      expect(queue.getItems(DESC)).toEqual(['B', 'A', 'C', 'D']);
    });

    it('should use ASC order if cannot recognize the passed one in an argument', () => {
      const queue = createPriorityQueue();

      queue.addItem(3, 'A');
      queue.addItem(4, 'B');
      queue.addItem(2, 'C');
      queue.addItem(1, 'D');

      expect(queue.getItems('incorrectKey')).toEqual(['D', 'C', 'A', 'B']);
    });
  });
});
