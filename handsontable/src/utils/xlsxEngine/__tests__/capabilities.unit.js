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
});
