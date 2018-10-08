import Storage from 'handsontable/plugins/persistentState/storage';

describe('persistentState', () => {
  describe('storage', () => {
    const localStorageMock = (() => {
      const store = {};

      return {
        setItem: (key, value) => { store[key] = value.toString(); },
        getItem: key => store[key],
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

    it('should load and save all keys from localStorage when call loadSavedKeys method', () => {
      const storage = new Storage('example');
      const testArray = [1, 2, 3];

      localStorage.setItem('example__persistentStateKeys', JSON.stringify(testArray));

      storage.loadSavedKeys();

      expect(storage.savedKeys).toEqual([1, 2, 3]);
      expect(storage.savedKeys.length).toEqual(3);
    });

    it('should save saved key in localStorage when call saveSavedKeys method', () => {
      const storage = new Storage('example');

      storage.saveValue(1, 'one');
      storage.saveValue(2, 'two');
      storage.saveValue(3, 'three');

      storage.saveSavedKeys();

      expect(localStorage.getItem('example__persistentStateKeys')).toEqual('[1,2,3]');
    });

    it('should clear saved key from localStorage when call clearSavedKeys method', () => {
      const storage = new Storage('example');

      storage.saveValue(1, 'one');
      storage.saveValue(2, 'two');
      storage.saveValue(3, 'three');

      expect(storage.savedKeys).toContain(1);
      expect(storage.savedKeys).toContain(2);
      expect(storage.savedKeys).toContain(3);
      expect(storage.savedKeys.length).toEqual(3);
      expect(localStorage.getItem('example__persistentStateKeys')).toEqual('[1,2,3]');

      storage.clearSavedKeys();

      expect(storage.savedKeys).not.toContain(1);
      expect(storage.savedKeys).not.toContain(2);
      expect(storage.savedKeys).not.toContain(3);
      expect(storage.savedKeys.length).toEqual(0);
      expect(localStorage.getItem('example__persistentStateKeys')).toEqual('[]');
    });
  });
});
