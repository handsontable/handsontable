import { createUniqueList } from '../uniqueList';

describe('createUniqueList', () => {
  describe('interface', () => {
    const list = createUniqueList();

    expect(list.addItem).toBeInstanceOf(Function);
    expect(list.clear).toBeInstanceOf(Function);
    expect(list.getId).toBeInstanceOf(Function);
    expect(list.getItem).toBeInstanceOf(Function);
    expect(list.getItems).toBeInstanceOf(Function);
    expect(list.hasItem).toBeInstanceOf(Function);
  });

  describe('operations', () => {
    it('should be possible to add items', () => {
      const list = createUniqueList();

      list.addItem('A', 'ItemA');

      expect(list.getItem('A')).toBe('ItemA');
    });

    it('should be possible to get ID by item', () => {
      const list = createUniqueList();

      list.addItem('A', 'ItemA');

      expect(list.getId('ItemA')).toBe('A');
    });

    it('should return null if an item is not registered', () => {
      const list = createUniqueList();

      list.addItem('A', 'ItemA');

      expect(list.getId('ItemB')).toBeNull();
    });

    it('should throw error if item is already in list', () => {
      const list = createUniqueList();

      list.addItem('A', 'ItemA');

      expect(() => {
        list.addItem('A', 'ItemA');
      }).toThrowError('The id \'A\' is already declared in a list.');
    });

    it('should throw the custom error message if item is already in list', () => {
      const list = createUniqueList({
        errorIdExists: item => `"${item}" is already registered`,
      });

      list.addItem('A', 'ItemA');

      expect(() => {
        list.addItem('A', 'ItemA');
      }).toThrowError('"A" is already registered');
    });

    it('should return "null" if the getting item is not registered in list', () => {
      const list = createUniqueList();

      expect(list.getItem('A')).toBeUndefined();
    });

    it('should be possible to get all items from the list', () => {
      const list = createUniqueList();

      list.addItem('A', 'ItemA');
      list.addItem('C', 'ItemC');
      list.addItem('B', 'ItemB');
      list.addItem('D', 'ItemD');

      expect(list.getItems()).toEqual([
        ['A', 'ItemA'],
        ['C', 'ItemC'],
        ['B', 'ItemB'],
        ['D', 'ItemD'],
      ]);
    });

    it('should be possible to clear saved items', () => {
      const list = createUniqueList();

      list.addItem('A', 'ItemA');
      list.addItem('C', 'ItemC');
      list.addItem('B', 'ItemB');
      list.addItem('D', 'ItemD');

      list.clear();

      expect(list.getItems()).toEqual([]);
    });

    it('should be possible to check if ID is registered', () => {
      const list = createUniqueList();

      list.addItem('A', 'ItemA');
      list.addItem('C', 'ItemC');

      expect(list.hasItem('A')).toBe(true);
      expect(list.hasItem('B')).toBe(false);
      expect(list.hasItem('C')).toBe(true);
    });
  });
});
