import { ASC, DESC, createPriorityMap } from '../priorityMap';

describe('createPriorityMap', () => {
  describe('interface', () => {
    it('should create a priority map', () => {
      const priorityMap = createPriorityMap();

      expect(priorityMap.addItem).toBeInstanceOf(Function);
      expect(priorityMap.getItems).toBeInstanceOf(Function);
    });
  });

  describe('operations', () => {
    it('should add items to the map', () => {
      const priorityMap = createPriorityMap();

      priorityMap.addItem(1, 'A');
      priorityMap.addItem(2, 'B');

      expect(priorityMap.getItems()).toEqual(['A', 'B']);
    });

    it('should throw an error if priority is not a number', () => {
      const priorityMap = createPriorityMap();

      expect(() => {
        priorityMap.addItem('a', 'A');
      }).toThrowWithCause('The priority \'a\' is not a number.', { handsontable: true });
    });

    it('should be possible to throw a custom error message if priority is not a number', () => {
      const priorityMap = createPriorityMap({
        errorPriorityNaN: priority => `"${priority}" is not a valid priority key.`,
      });

      expect(() => {
        priorityMap.addItem('a', 'A');
      }).toThrowWithCause('"a" is not a valid priority key.', { handsontable: true });
    });

    it('should throw an error if priority is already registered', () => {
      const priorityMap = createPriorityMap();

      priorityMap.addItem(1, 'A');

      expect(() => {
        priorityMap.addItem(1, 'A');
      }).toThrowWithCause('The priority \'1\' is already declared in a map.', { handsontable: true });
    });

    it('should throw an error if priority is already registered', () => {
      const priorityMap = createPriorityMap({
        errorPriorityExists: priority => `Choose other priority than "${priority}"`,
      });

      priorityMap.addItem(1, 'A');

      expect(() => {
        priorityMap.addItem(1, 'A');
      }).toThrowWithCause('Choose other priority than "1"', { handsontable: true });
    });

    it('should be possible to get items in ASC order', () => {
      const priorityMap = createPriorityMap();

      priorityMap.addItem(3, 'A');
      priorityMap.addItem(4, 'B');
      priorityMap.addItem(2, 'C');
      priorityMap.addItem(1, 'D');

      expect(priorityMap.getItems()).toEqual(['D', 'C', 'A', 'B']);
      expect(priorityMap.getItems(ASC)).toEqual(['D', 'C', 'A', 'B']);
    });

    it('should be possible to get items in DESC order', () => {
      const priorityMap = createPriorityMap();

      priorityMap.addItem(3, 'A');
      priorityMap.addItem(4, 'B');
      priorityMap.addItem(2, 'C');
      priorityMap.addItem(1, 'D');

      expect(priorityMap.getItems(DESC)).toEqual(['B', 'A', 'C', 'D']);
    });

    it('should use ASC order if cannot recognize the passed one in an argument', () => {
      const priorityMap = createPriorityMap();

      priorityMap.addItem(3, 'A');
      priorityMap.addItem(4, 'B');
      priorityMap.addItem(2, 'C');
      priorityMap.addItem(1, 'D');

      expect(priorityMap.getItems('incorrectKey')).toEqual(['D', 'C', 'A', 'B']);
    });
  });
});
