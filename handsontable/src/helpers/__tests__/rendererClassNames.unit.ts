import {
  recordRendererClassNames,
  adoptWrittenClassNames,
  stripRendererClassNames,
} from '../rendererClassNames';

describe('rendererClassNames', () => {
  describe('stripRendererClassNames()', () => {
    it('should return the value unchanged when nothing was recorded for the meta object', () => {
      expect(stripRendererClassNames({}, 'myMarker htRight htNumeric')).toBe('myMarker htRight htNumeric');
    });

    it('should drop only the recorded tokens', () => {
      const meta = {};

      recordRendererClassNames(meta, ['htRight', 'htNumeric']);

      expect(stripRendererClassNames(meta, 'myMarker htRight htNumeric')).toBe('myMarker');
    });

    it('should keep a token the renderer did not add', () => {
      const meta = {};

      recordRendererClassNames(meta, ['htNumeric']);

      expect(stripRendererClassNames(meta, 'htLeft htNumeric')).toBe('htLeft');
    });

    it('should drop a recorded token wherever it sits in the value', () => {
      const meta = {};

      recordRendererClassNames(meta, ['htRight', 'htNumeric']);

      expect(stripRendererClassNames(meta, 'htRight myMarker htNumeric other')).toBe('myMarker other');
    });

    it('should return an empty string when the value holds only recorded tokens', () => {
      const meta = {};

      recordRendererClassNames(meta, ['htRight', 'htNumeric']);

      expect(stripRendererClassNames(meta, 'htRight htNumeric')).toBe('');
    });

    it('should return a value that is not a string unchanged', () => {
      const meta = {};
      const value = ['myMarker', 'htRight'];

      recordRendererClassNames(meta, ['htRight']);

      expect(stripRendererClassNames(meta, value)).toBe(value);
      expect(stripRendererClassNames(meta, undefined)).toBeUndefined();
    });

    it('should not share records between meta objects', () => {
      const meta = {};
      const other = {};

      recordRendererClassNames(meta, ['htRight']);

      expect(stripRendererClassNames(other, 'htRight')).toBe('htRight');
    });
  });

  describe('recordRendererClassNames()', () => {
    it('should merge the tokens of a later record into the earlier one', () => {
      const meta = {};

      recordRendererClassNames(meta, ['htRight']);
      recordRendererClassNames(meta, ['htNumeric']);

      expect(stripRendererClassNames(meta, 'htRight htNumeric')).toBe('');
    });
  });

  describe('adoptWrittenClassNames()', () => {
    it('should keep every class name the user writes, the renderer marker included', () => {
      const meta = {};

      recordRendererClassNames(meta, ['htRight', 'htNumeric']);
      adoptWrittenClassNames(meta, 'htNumeric myMarker');

      expect(stripRendererClassNames(meta, 'htNumeric myMarker htRight')).toBe('htNumeric myMarker');
    });

    it('should keep recording a class name the written value does not carry', () => {
      const meta = {};

      recordRendererClassNames(meta, ['htRight', 'htNumeric']);
      adoptWrittenClassNames(meta, 'myMarker');

      expect(stripRendererClassNames(meta, 'myMarker htRight htNumeric')).toBe('myMarker');
    });

    it('should read an array value', () => {
      const meta = {};

      recordRendererClassNames(meta, ['htRight', 'htNumeric']);
      adoptWrittenClassNames(meta, ['htRight']);

      expect(stripRendererClassNames(meta, 'htRight htNumeric')).toBe('htRight');
    });

    it('should do nothing for a value that is not a class name list', () => {
      const meta = {};

      recordRendererClassNames(meta, ['htRight']);
      adoptWrittenClassNames(meta, undefined);
      adoptWrittenClassNames(meta, 5);

      expect(stripRendererClassNames(meta, 'htRight')).toBe('');
    });

    it('should do nothing for a meta object with no record', () => {
      expect(() => adoptWrittenClassNames({}, 'htRight')).not.toThrow();
    });
  });
});
