import Storage from 'handsontable/plugins/persistentState/storage';

describe('persistentState', () => {
  describe('storage', () => {
    const localStorageMock = (() => {
      let store = {};

      return {
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; }
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
