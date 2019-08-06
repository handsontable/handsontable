import { registerIdentity, getTranslator } from 'handsontable/translations/recordTranslator';
import Handsontable from 'handsontable';

describe('RecordTranslator', () => {
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
