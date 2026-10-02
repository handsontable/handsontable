import { PasteClipboardSnapshot } from '../pasteClipboardData';

const PRIVATE_FLAVOR = 'application/ht-source-data-json-html';

/**
 * Builds a stand-in for a `DataTransfer` that answers `''` for a missing flavor, as the browser does.
 *
 * @param {object} flavors The flavors the clipboard holds.
 * @param {string[]} [types] What `types` reports. Defaults to the keys of `flavors`.
 * @returns {object} The stand-in, with a spy on `getData`.
 */
function createSource(flavors: Record<string, string>, types: string[] = Object.keys(flavors)) {
  return {
    types,
    getData: jest.fn((type: string) => flavors[type] ?? ''),
  };
}

describe('PasteClipboardSnapshot', () => {
  it('should list the string flavors of the source as its types', () => {
    const snapshot = new PasteClipboardSnapshot(createSource({
      'text/plain': 'a',
      'text/html': '<b>a</b>',
      'text/rtf': '{\\rtf a}',
    }));

    expect(snapshot.types).toEqual(['text/plain', 'text/html', 'text/rtf']);
  });

  it('should return an empty string for a flavor the clipboard does not carry', () => {
    const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a' }));

    expect(snapshot.getData('text/html')).toBe('');
    expect(snapshot.getData('image/png')).toBe('');
  });

  it('should not copy the file entries', () => {
    const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a' }, ['text/plain', 'Files']));

    expect(snapshot.types).toEqual(['text/plain']);
  });

  it('should read the known flavors even when the source leaves them out of types', () => {
    const snapshot = new PasteClipboardSnapshot(createSource({
      'text/plain': 'a',
      'text/html': '<table></table>',
      [PRIVATE_FLAVOR]: '<table></table>',
    }, []));

    expect(snapshot.getData('text/plain')).toBe('a');
    expect(snapshot.getData('text/html')).toBe('<table></table>');
    expect(snapshot.getData(PRIVATE_FLAVOR)).toBe('<table></table>');
    expect(snapshot.types).toEqual(['text/plain', 'text/html', PRIVATE_FLAVOR]);
  });

  it('should not list an empty known flavor that the source does not report', () => {
    const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a' }));

    expect(snapshot.types).toEqual(['text/plain']);
  });

  it('should set a flavor', () => {
    const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a' }));

    snapshot.setData('text/plain', 'b');
    snapshot.setData('text/x-custom', 'c');

    expect(snapshot.getData('text/plain')).toBe('b');
    expect(snapshot.getData('text/x-custom')).toBe('c');
    expect(snapshot.types).toEqual(['text/plain', 'text/x-custom']);
  });

  it('should clear one flavor when called with a type', () => {
    const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a', 'text/html': '<b>a</b>' }));

    snapshot.clearData('text/html');

    expect(snapshot.getData('text/html')).toBe('');
    expect(snapshot.getData('text/plain')).toBe('a');
    expect(snapshot.types).toEqual(['text/plain']);
  });

  it('should clear every flavor when called without a type', () => {
    const snapshot = new PasteClipboardSnapshot(createSource({
      'text/plain': 'a',
      'text/html': '<b>a</b>',
      'text/rtf': '{\\rtf a}',
    }));

    snapshot.clearData();

    expect(snapshot.types).toEqual([]);
    expect(snapshot.getData('text/plain')).toBe('');
    expect(snapshot.getData('text/rtf')).toBe('');
  });

  it('should not mutate the source', () => {
    const flavors = { 'text/plain': 'a', 'text/html': '<b>a</b>' };
    const source = createSource(flavors);
    const snapshot = new PasteClipboardSnapshot(source);

    snapshot.setData('text/plain', 'b');
    snapshot.clearData('text/html');
    snapshot.clearData();

    expect(flavors).toEqual({ 'text/plain': 'a', 'text/html': '<b>a</b>' });
    expect(source.types).toEqual(['text/plain', 'text/html']);
  });

  it('should return a fresh array from types', () => {
    const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a' }));

    snapshot.types.push('text/html');

    expect(snapshot.types).toEqual(['text/plain']);
  });

  it('should report a flavor as changed only when its string differs from the initial one', () => {
    const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a', 'text/html': '<b>a</b>' }));

    snapshot.setData('text/plain', 'a');
    snapshot.setData('text/html', '<b>b</b>');

    expect(snapshot.isChanged('text/plain')).toBe(false);
    expect(snapshot.isChanged('text/html')).toBe(true);
  });

  it('should report a cleared flavor with content as changed', () => {
    const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a' }));

    snapshot.clearData('text/plain');

    expect(snapshot.isChanged('text/plain')).toBe(true);
  });

  it('should report a set flavor that was absent as changed', () => {
    const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a' }));

    snapshot.setData('text/html', '<b>a</b>');

    expect(snapshot.isChanged('text/html')).toBe(true);
  });

  it('should read each flavor from the source once when it is built', () => {
    const source = createSource({ 'text/plain': 'a', 'text/html': '<b>a</b>' });

    // eslint-disable-next-line no-new
    new PasteClipboardSnapshot(source);

    expect(source.getData.mock.calls.filter(([type]) => type === 'text/plain')).toHaveLength(1);
    expect(source.getData.mock.calls.filter(([type]) => type === 'text/html')).toHaveLength(1);
  });

  it('should not read the source at all when it copies nothing', () => {
    const source = createSource({ 'text/plain': 'a', 'text/html': '<b>a</b>' });
    const snapshot = new PasteClipboardSnapshot(source, false);

    expect(source.getData).not.toHaveBeenCalled();
    expect(snapshot.resolve('text/plain')).toBe('a');
    expect(source.getData).toHaveBeenCalledTimes(1);
  });

  describe('type names, as DataTransfer maps them', () => {
    it('should read "text" and "Text" as text/plain', () => {
      const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a' }));

      expect(snapshot.getData('text')).toBe('a');
      expect(snapshot.getData('Text')).toBe('a');
    });

    it('should write "Text" to text/plain', () => {
      const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a' }));

      snapshot.setData('Text', 'b');

      expect(snapshot.getData('text/plain')).toBe('b');
      expect(snapshot.types).toEqual(['text/plain']);
      expect(snapshot.resolve('text/plain')).toBe('b');
    });

    it('should clear "TEXT/HTML" as text/html', () => {
      const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a', 'text/html': '<b>a</b>' }));

      snapshot.clearData('TEXT/HTML');

      expect(snapshot.types).toEqual(['text/plain']);
    });

    it('should map "url" to text/uri-list', () => {
      const snapshot = new PasteClipboardSnapshot(createSource({ 'text/uri-list': 'https://example.com' }));

      expect(snapshot.getData('URL')).toBe('https://example.com');
    });
  });

  describe('resolve', () => {
    it('should answer what the source answered for a flavor nobody touched', () => {
      const real = new PasteClipboardSnapshot(createSource({}, []));
      const programmatic = new PasteClipboardSnapshot({
        types: [],
        getData: () => undefined,
      });

      // A real `DataTransfer` answers `''`, which `parse()` turns into a blank cell. The
      // programmatic `paste()` answers `undefined`, which the plugin treats as nothing to paste.
      expect(real.resolve('text/plain')).toBe('');
      expect(programmatic.resolve('text/plain')).toBeUndefined();
    });

    it('should answer what a callback set', () => {
      const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a' }));

      snapshot.setData('text/plain', 'b');

      expect(snapshot.resolve('text/plain')).toBe('b');
    });

    it('should answer undefined for a flavor a callback cleared', () => {
      const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a', 'text/html': '<b>a</b>' }));

      snapshot.clearData('text/html');

      expect(snapshot.resolve('text/html')).toBeUndefined();
      expect(snapshot.resolve('text/plain')).toBe('a');
    });

    it('should answer undefined for every known flavor after clearData without a type', () => {
      const snapshot = new PasteClipboardSnapshot(createSource({ 'text/plain': 'a' }));

      snapshot.clearData();

      expect(snapshot.resolve('text/plain')).toBeUndefined();
      expect(snapshot.resolve('text/html')).toBeUndefined();
      expect(snapshot.resolve(PRIVATE_FLAVOR)).toBeUndefined();
    });
  });
});
