import { createUniqueMap } from '../uniqueMap';

describe('createUniqueMap', () => {
  describe('interface', () => {
    const uniqueMap = createUniqueMap();

    expect(uniqueMap.addItem).toBeInstanceOf(Function);
    expect(uniqueMap.clear).toBeInstanceOf(Function);
    expect(uniqueMap.getId).toBeInstanceOf(Function);
    expect(uniqueMap.getItem).toBeInstanceOf(Function);
    expect(uniqueMap.getItems).toBeInstanceOf(Function);
    expect(uniqueMap.hasItem).toBeInstanceOf(Function);
  });

  describe('operations', () => {
    it('should be possible to add items', () => {
      const uniqueMap = createUniqueMap();

      uniqueMap.addItem('A', 'ItemA');

      expect(uniqueMap.getItem('A')).toBe('ItemA');
    });

    it('should be possible to get ID by item', () => {
      const uniqueMap = createUniqueMap();

      uniqueMap.addItem('A', 'ItemA');

      expect(uniqueMap.getId('ItemA')).toBe('A');
    });

    it('should return null if an item is not registered', () => {
      const uniqueMap = createUniqueMap();

      uniqueMap.addItem('A', 'ItemA');

      expect(uniqueMap.getId('ItemB')).toBeNull();
    });

    it('should throw error if item is already in unique map', () => {
      const uniqueMap = createUniqueMap();

      uniqueMap.addItem('A', 'ItemA');

      expect(() => {
        uniqueMap.addItem('A', 'ItemA');
      }).toThrowError('The id \'A\' is already declared in a map.');
    });

    it('should throw the custom error message if item is already in unique map', () => {
      const uniqueMap = createUniqueMap({
        errorIdExists: item => `"${item}" is already registered`,
      });

      uniqueMap.addItem('A', 'ItemA');

      expect(() => {
        uniqueMap.addItem('A', 'ItemA');
      }).toThrowError('"A" is already registered');
    });

    it('should return "null" if the getting item is not registered in unique map', () => {
      const uniqueMap = createUniqueMap();

      expect(uniqueMap.getItem('A')).toBeUndefined();
    });

    it('should be possible to get all items from the unique map', () => {
      const uniqueMap = createUniqueMap();

      uniqueMap.addItem('A', 'ItemA');
      uniqueMap.addItem('C', 'ItemC');
      uniqueMap.addItem('B', 'ItemB');
      uniqueMap.addItem('D', 'ItemD');

      expect(uniqueMap.getItems()).toEqual([
        ['A', 'ItemA'],
        ['C', 'ItemC'],
        ['B', 'ItemB'],
        ['D', 'ItemD'],
      ]);
    });

    it('should be possible to clear saved items', () => {
      const uniqueMap = createUniqueMap();

      uniqueMap.addItem('A', 'ItemA');
      uniqueMap.addItem('C', 'ItemC');
      uniqueMap.addItem('B', 'ItemB');
      uniqueMap.addItem('D', 'ItemD');

      uniqueMap.clear();

      expect(uniqueMap.getItems()).toEqual([]);
    });

    it('should be possible to check if ID is registered', () => {
      const uniqueMap = createUniqueMap();

      uniqueMap.addItem('A', 'ItemA');
      uniqueMap.addItem('C', 'ItemC');

      expect(uniqueMap.hasItem('A')).toBe(true);
      expect(uniqueMap.hasItem('B')).toBe(false);
      expect(uniqueMap.hasItem('C')).toBe(true);
    });
  });
});
