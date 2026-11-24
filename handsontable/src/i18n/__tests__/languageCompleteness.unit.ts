import * as allLanguages from 'handsontable/i18n/languages';
import enUS from 'handsontable/i18n/languages/en-US';

type Phrase = string | string[];
type Dictionary = Record<string, Phrase> & { languageCode: string };

/**
 * A phrase a language file lacks falls back to English, so a translated grid reads part of its
 * menus, labels, and screen reader messages in another language than the content around them
 * (WCAG 3.1.2, DEV-2967). Every language file therefore holds every phrase `en-US` holds.
 */
describe('i18n: every language file holds every phrase', () => {
  const english = enUS as unknown as Dictionary;
  const phraseKeys = Object.keys(english).filter(key => key !== 'languageCode');
  const dictionaries = Object.getOwnPropertyNames(allLanguages)
    .map(exportName => (allLanguages as unknown as Record<string, Dictionary>)[exportName])
    .filter(dictionary => typeof dictionary?.languageCode === 'string' && dictionary.languageCode !== 'en-US');

  /**
   * The placeholders a phrase holds, such as `[label]`, in every one of its forms.
   *
   * @param {string|string[]} phrase The phrase, or its plural forms.
   * @returns {string[]} The placeholders, sorted, each once.
   */
  function placeholdersOf(phrase: Phrase): string[] {
    const text = Array.isArray(phrase) ? phrase.join(' ') : phrase;

    return [...new Set(text.match(/\[[a-zA-Z]+\]/g) ?? [])].sort();
  }

  it('should have the English phrases and the other dictionaries to check', () => {
    expect(phraseKeys.length).toBeGreaterThan(150);
    expect(dictionaries.length).toBeGreaterThan(15);
  });

  it.each(dictionaries.map(dictionary => [dictionary.languageCode, dictionary] as const))(
    'should hold every phrase of en-US in %s',
    (languageCode, dictionary) => {
      expect(phraseKeys.filter(key => dictionary[key] === undefined)).toEqual([]);
    }
  );

  it.each(dictionaries.map(dictionary => [dictionary.languageCode, dictionary] as const))(
    'should hold no empty phrase in %s',
    (languageCode, dictionary) => {
      const empty = phraseKeys.filter((key) => {
        const phrase = dictionary[key];
        const forms = Array.isArray(phrase) ? phrase : [phrase];

        return phrase !== undefined && (forms.length === 0 || forms.some(form => `${form}`.trim() === ''));
      });

      expect(empty).toEqual([]);
    }
  );

  // A form may leave a placeholder out (the Arabic singular of a count says "another cell"), so only a
  // placeholder the English phrase does not have is an error: nothing fills it, and it is read as text.
  it.each(dictionaries.map(dictionary => [dictionary.languageCode, dictionary] as const))(
    'should use no placeholder the en-US phrase lacks in %s',
    (languageCode, dictionary) => {
      const unknown = phraseKeys.filter((key) => {
        const phrase = dictionary[key];
        const known = placeholdersOf(english[key]);

        return phrase !== undefined && placeholdersOf(phrase).some(placeholder => !known.includes(placeholder));
      });

      expect(unknown).toEqual([]);
    }
  );
});
