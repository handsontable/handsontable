import { RecordTranslator, registerIdentity, getTranslator } from 'handsontable/utils/recordTranslator';
import Handsontable from 'handsontable';

describe('RecordTranslator', () => {
  it('should translate to visual row using hook system', () => {
    const hotMock = {
      runHooks: jasmine.createSpy().and.returnValue(54),
    };
    const t = new RecordTranslator(hotMock);

    expect(t.toVisualRow(12)).toBe(54);
    expect(hotMock.runHooks).toHaveBeenCalledWith('unmodifyRow', 12);
  });

  it('should translate to visual column using hook system', () => {
    const hotMock = {
      runHooks: jasmine.createSpy().and.returnValue(54),
    };
    const t = new RecordTranslator(hotMock);

    expect(t.toVisualColumn(12)).toBe(54);
    expect(hotMock.runHooks).toHaveBeenCalledWith('unmodifyCol', 12);
  });

  it('should translate to visual coordinates (as an object)', () => {
    const t = new RecordTranslator();

    spyOn(t, 'toVisualRow').and.returnValue(6);
    spyOn(t, 'toVisualColumn').and.returnValue(12);

    expect(t.toVisual({ row: 3, column: 4 })).toEqual({ row: 6, column: 12 });
  });

  it('should translate to visual coordinates (as an array)', () => {
    const t = new RecordTranslator();

    spyOn(t, 'toVisualRow').and.returnValue(6);
    spyOn(t, 'toVisualColumn').and.returnValue(12);

    expect(t.toVisual(3, 4)).toEqual([6, 12]);
  });

  it('should translate to physical row using hook system', () => {
    const hotMock = {
      runHooks: jasmine.createSpy().and.returnValue(54),
    };
    const t = new RecordTranslator(hotMock);

    expect(t.toPhysicalRow(12)).toBe(54);
    expect(hotMock.runHooks).toHaveBeenCalledWith('modifyRow', 12);
  });

  it('should translate to physical column using hook system', () => {
    const hotMock = {
      runHooks: jasmine.createSpy().and.returnValue(54),
    };
    const t = new RecordTranslator(hotMock);

    expect(t.toPhysicalColumn(12)).toBe(54);
    expect(hotMock.runHooks).toHaveBeenCalledWith('modifyCol', 12);
  });

  it('should translate to physical coordinates (as an object)', () => {
    const t = new RecordTranslator();

    spyOn(t, 'toPhysicalRow').and.returnValue(6);
    spyOn(t, 'toPhysicalColumn').and.returnValue(12);

    expect(t.toPhysical({ row: 3, column: 4 })).toEqual({ row: 6, column: 12 });
  });

  it('should translate to physical coordinates (as an array)', () => {
    const t = new RecordTranslator();

    spyOn(t, 'toPhysicalRow').and.returnValue(6);
    spyOn(t, 'toPhysicalColumn').and.returnValue(12);

    expect(t.toPhysical(3, 4)).toEqual([6, 12]);
  });

  it('should always return the same instance of RecordTranslator for Handsontable instance', () => {
    const hot = new Handsontable(document.createElement('div'));

    const translator = getTranslator(hot);

    expect(translator === getTranslator(hot)).toBe(true);
  });

  it('should throw error when identifier was not registered while retrieving translator', () => {
    expect(() => {
      getTranslator({});
    }).toThrow();
  });

  it('should always return the same instance of RecordTranslator for custom identifier', () => {
    const hot = new Handsontable(document.createElement('div'));
    const customIdentifier = {};

    registerIdentity(customIdentifier, hot);
    const translator = getTranslator(customIdentifier);

    expect(translator === getTranslator(customIdentifier)).toBe(true);
  });
});
