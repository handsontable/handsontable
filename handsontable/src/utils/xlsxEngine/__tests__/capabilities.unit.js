import { CAPABILITIES, DroppedFeatures } from '../capabilities';
import * as consoleHelpers from '../../../helpers/console';

describe('CAPABILITIES', () => {
  it('should declare ExcelJS as a full-fidelity xlsx-only engine', () => {
    expect(CAPABILITIES.exceljs).toEqual({
      styles: true,
      conditionalFormatting: true,
      dataValidation: true,
      perCellProtection: true,
      comments: true,
      freezePanes: true,
      rtl: true,
      compressionLevel: true,
      readFormats: ['xlsx'],
    });
  });

  it('should declare the native engine as full-fidelity except for the DEFLATE level', () => {
    expect(CAPABILITIES.native).toEqual({
      styles: true,
      conditionalFormatting: true,
      dataValidation: true,
      perCellProtection: true,
      comments: true,
      freezePanes: true,
      rtl: true,
      compressionLevel: false,
      readFormats: ['xlsx'],
    });
  });
});

describe('DroppedFeatures', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should count repeated features once in the list', () => {
    const dropped = new DroppedFeatures();

    dropped.record('cellStyles');
    dropped.record('cellStyles');
    dropped.record('dataValidation');

    expect(dropped.list()).toEqual(['cellStyles', 'dataValidation']);
    expect(dropped.count('cellStyles')).toBe(2);
  });

  it('should emit exactly one warning naming the engine and the features', () => {
    const dropped = new DroppedFeatures();

    dropped.record('cellStyles');
    dropped.record('conditionalFormatting');
    dropped.warn('exceljs');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toBe(
      'The "exceljs" xlsx engine dropped features it cannot write or read: cellStyles, conditionalFormatting.'
    );
  });

  it('should stay silent when nothing was dropped', () => {
    new DroppedFeatures().warn('exceljs');

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should cut a file-driven value to 64 characters and replace its control characters', () => {
    // `value` is a raw attribute the workbook wrote, so one `<cfRule type="…10 MB…"/>` used to put
    // ten megabytes into the map key, into `ImportResult.dropped` and into the console warning.
    const dropped = new DroppedFeatures();

    dropped.recordUnsupported('numFmt', 'x'.repeat(10_000));
    dropped.recordUnsupported('dataValidation', `a\u0000b\u001fc\u007fd${'y'.repeat(200)}`);

    const [numFmt, validation] = dropped.list();

    expect(numFmt).toBe(`numFmt:${'x'.repeat(63)}\u2026`);
    expect(numFmt.length).toBe('numFmt:'.length + 64);
    expect(validation).toBe(`dataValidation:a\uFFFDb\uFFFDc\uFFFDd${'y'.repeat(56)}\u2026`);
    expect(validation.length).toBe('dataValidation:'.length + 64);
  });

  it('should cut a file-driven value on a code point boundary, never inside a surrogate pair', () => {
    // An astral character straddling the cut used to leave a lone surrogate in `dropped` and in the
    // console warning — the same unpaired code unit the tokenizer refuses to produce.
    const dropped = new DroppedFeatures();

    dropped.recordUnsupported('numFmt', `${'x'.repeat(62)}\u{1F600}${'y'.repeat(20)}`);

    const [numFmt] = dropped.list();
    const tail = numFmt.slice('numFmt:'.length);

    expect(tail).toBe(`${'x'.repeat(62)}\u{1F600}…`);
    expect(Array.from(tail).length).toBe(64);

    for (let index = 0; index < tail.length; index++) {
      const code = tail.charCodeAt(index);
      const isHighSurrogate = code >= 0xD800 && code <= 0xDBFF;
      const isLowSurrogate = code >= 0xDC00 && code <= 0xDFFF;

      if (isHighSurrogate) {
        expect(tail.charCodeAt(index + 1) >= 0xDC00 && tail.charCodeAt(index + 1) <= 0xDFFF).toBe(true);
      }

      if (isLowSurrogate) {
        expect(tail.charCodeAt(index - 1) >= 0xD800 && tail.charCodeAt(index - 1) <= 0xDBFF).toBe(true);
      }
    }
  });

  it('should stop adding distinct file-driven names at the cap and bucket the rest', () => {
    // The other unbounded direction: N rules with N distinct types produced N map entries and N
    // segments of one warning string, where every other file-driven quantity here has a cap.
    const dropped = new DroppedFeatures();

    dropped.record('cellStyles');

    for (let i = 0; i < 40; i++) {
      dropped.recordUnsupported('numFmt', `pattern-${i}`);
    }

    const names = dropped.list();

    // One declared name, 32 file-driven names, and the bucket the last eight counted into.
    expect(names.length).toBe(34);
    expect(names.filter(name => name.startsWith('numFmt:pattern-')).length).toBe(32);
    expect(dropped.count('numFmt:other')).toBe(8);
    expect(dropped.count('numFmt:pattern-39')).toBe(0);
  });

  it('should keep counting a file-driven name it already holds once the cap is reached', () => {
    const dropped = new DroppedFeatures();

    for (let i = 0; i < 40; i++) {
      dropped.recordUnsupported('numFmt', `pattern-${i}`);
    }

    dropped.recordUnsupported('numFmt', 'pattern-0');

    expect(dropped.count('numFmt:pattern-0')).toBe(2);
    expect(dropped.count('numFmt:other')).toBe(8);
  });
});
