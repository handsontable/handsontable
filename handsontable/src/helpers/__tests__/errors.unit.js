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

    it('should set the cause on engines that ignore the `new Error(message, options)` options bag', () => {
      // The options-bag overload is ES2022 (Chrome 94 / Firefox 91 / Safari 15.0), inside the floor
      // declared in browser-targets.js. An engine that accepts the second argument and drops it
      // fails silently, so the cause is assigned after construction regardless. This stub
      // reproduces that engine: passing the options bag through it leaves `cause` undefined.
      const NativeError = global.Error;

      global.Error = function OptionsIgnoringError(message) {
        return new NativeError(message);
      };

      try {
        throwWithCause('test');
      } catch (error) {
        expect(error.message).toBe('test');
        expect(error.cause).toEqual({ handsontable: true });
      } finally {
        global.Error = NativeError;
      }
    });
  });
});
