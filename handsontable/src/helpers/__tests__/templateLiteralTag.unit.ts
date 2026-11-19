import { toSingleLine } from 'handsontable/helpers/templateLiteralTag';

describe('Helpers for template literals', () => {
  describe('toSingleLine', () => {
    it('should strip two line string (string with whitespace in both lines)', () => {
      const text = toSingleLine`Hello world\x20
        Hello world`;

      expect(text).toEqual('Hello world Hello world');
    });

    it('should strip two line string (string with whitespace only in the second line)', () => {
      const text = toSingleLine`Hello world
        Hello world`;

      expect(text).toEqual('Hello worldHello world');
    });

    it('should strip two line string (string without whitespace in both lines)', () => {
      const text = toSingleLine`Hello world
Hello world`;

      expect(text).toEqual('Hello worldHello world');
    });

    it('should include literals and not remove whitespaces between them without necessary', () => {
      const a = 'Hello';
      const b = 'world';
      const text = toSingleLine`${a}   ${b}`;

      expect(text).toEqual('Hello   world');
    });

    it('should remove whitespaces from both sides of a string.', () => {
      const a = '   Hello';
      const b = 'world   ';
      const text = toSingleLine`${a} ${b}`;

      expect(text).toEqual('Hello world');
    });

    it('should print the number 0', () => {
      const row = 1;
      const column = 0;

      expect(toSingleLine`declared at [${row}, ${column}]`).toEqual('declared at [1, 0]');
      expect(toSingleLine`${0}`).toEqual('0');
    });

    it('should print nothing for `null`, `undefined` and `false`', () => {
      expect(toSingleLine`[${null}|${undefined}|${false}]`).toEqual('[||]');
    });
  });
});
