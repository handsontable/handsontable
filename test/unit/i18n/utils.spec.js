import {extendNotExistingKeys, createCellHeadersRange} from 'handsontable/i18n/utils';

describe('i18n helpers', () => {
  describe('extendNotExistingKeys', () => {
    it('should add extra key to object', () => {
      const extendedOject = {
        hello: 'world',
        lorem: 'ipsum'
      };

      const extension = {anotherKey: true};

      extendNotExistingKeys(extendedOject, extension);

      expect(extendedOject.anotherKey).toEqual(true);
    });

    it('should not overwrite existing keys', () => {
      const extendedOject = {
        hello: 'world',
        lorem: 'ipsum'
      };

      const extension = {hello: 'kitty'};

      extendNotExistingKeys(extendedOject, extension);

      expect(extendedOject.hello).toEqual('world');
    });

    it('should return extended object without creating copy of it', () => {
      const extendedOject = {
        hello: 'world',
        lorem: 'ipsum'
      };

      const extension = {anotherKey: true};

      const newReference = extendNotExistingKeys(extendedOject, extension);

      expect(newReference).toBe(extendedOject);
    });
  });

  describe('createCellHeadersRange', () => {
    /**
     * Create range of values basing on cell indexes. For example, it will create below ranges for specified function arguments:
     *
     * createCellHeadersRange(2, 7) => `2-7`
     * createCellHeadersRange(7, 2) => `2-7`
     * createCellHeadersRange(0, 4, 'A', 'D') => `A-D`
     * createCellHeadersRange(4, 0, 'D', 'A') => `A-D`
     *
     * @param {number} firstRowIndex Index of "first" cell
     * @param {number} nextRowIndex Index of "next" cell
     * @param {*} fromValue Value which will represent "first" cell
     * @param {*} toValue Value which will represent "next" cell
     * @returns {string} Value representing range i.e. A-Z, 11-15.
     */

    it('should create range of values basing on cell indexes 1', () => {
      expect(createCellHeadersRange(2, 7)).toEqual('2-7');
    });

    it('should create range of values basing on cell indexes 2', () => {
      expect(createCellHeadersRange(7, 2)).toEqual('2-7');
    });

    it('should create range of values basing on cell indexes 3', () => {
      expect(createCellHeadersRange(0, 4, 'A', 'D')).toEqual('A-D');
    });

    it('should create range of values basing on cell indexes 4', () => {
      expect(createCellHeadersRange(4, 0, 'D', 'A')).toEqual('2-7');
    });
  });
});
