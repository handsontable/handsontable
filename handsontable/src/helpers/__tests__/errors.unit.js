import { throwWithCause } from '../errors';

describe('Errors helper', () => {
  describe('throwWithCause', () => {
    it('should throw an error with a Handsontable-specific cause', () => {
      expect(() => {
        throwWithCause('test');
      }).toThrowWithCause('test', { handsontable: true });

      try {
        throwWithCause('test');
      } catch (error) {
        expect(error.cause).toEqual({ handsontable: true });
      }
    });
  });
});
