import Storage from 'handsontable/plugins/persistentState/storage';

describe('persistentState', () => {
  describe('storage', () => {
    const localStorageMock = (() => {
      let store = {};

      return {
        setItem: (key, value) => { store[key] = value.toString(); },
        getItem: (key) => store[key],
        removeItem: (key) => { delete store[key]; },
      };
    })();

    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    it('should create new storage object with prefix and empty array', () => {
      const storage = new Storage('example');

      expect(storage.prefix).toEqual('example');
      expect(storage.savedKeys).toEqual([]);
    });

    it('should have saveValue method', () => {
      const storage = new Storage('example');

      expect(storage.saveValue).toBeDefined();
    });

    it('should have loadValue method', () => {
      const storage = new Storage('example');

      expect(storage.loadValue).toBeDefined();
    });

    it('should have reset method', () => {
      const storage = new Storage('example');

      expect(storage.reset).toBeDefined();
    });

    it('should have resetAll method', () => {
      const storage = new Storage('example');

      expect(storage.resetAll).toBeDefined();
    });

    it('should save data when call saveValue method', () => {
      const storage = new Storage('example');

      storage.saveValue(1, 'one');

      expect(storage.savedKeys).toContain(1);
    });

    it('should load data from localStorage when call loadValue method', () => {
      const storage = new Storage('example');

      localStorage.setItem(1, 'one');

      const value = storage.loadValue(1);

      expect(value).toEqual('one');
    });

    it('should remove data from localStorage when call reset method', () => {
      const storage = new Storage('example');

      storage.saveValue(1, 'one');

      expect(localStorage.getItem('example_1')).toContain('one');

      storage.reset(1);

      expect(localStorage.getItem('example_1')).toBeUndefined();
    });

    it('should remove all data from savedKeys array when call resetAll method', () => {
      const storage = new Storage('example');

      storage.saveValue(1, 'one');
      storage.saveValue(2, 'two');
      storage.saveValue(3, 'three');

      expect(storage.savedKeys.length).toEqual(3);

      storage.resetAll();

      expect(storage.savedKeys).toEqual([]);
    });
  });
});
