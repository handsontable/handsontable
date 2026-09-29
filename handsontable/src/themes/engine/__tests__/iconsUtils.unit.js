import {
  ICON_NAMES,
  getIconClassName,
  getIconCssVariable,
  isGlyphValue,
  toGlyphUrl,
  splitIcons,
} from '../utils/icons';
import mainIcons from '../../static/variables/icons/main';
import horizonIcons from '../../static/variables/icons/horizon';

describe('icon utils', () => {
  it('derives kebab-case class and variable names', () => {
    expect(getIconClassName('arrowRightWithBar')).toBe('ht-icon-arrow-right-with-bar');
    expect(getIconCssVariable('caretHiddenUp')).toBe('--ht-icon-caret-hidden-up');
  });

  it('classifies glyph strings', () => {
    expect(isGlyphValue('data:image/svg+xml,%3Csvg%3E')).toBe(true);
    expect(isGlyphValue('<svg viewBox="0 0 16 16"></svg>')).toBe(true);
    expect(isGlyphValue('  <svg></svg>')).toBe(true);
    expect(isGlyphValue('url("/icons/arrow.svg")')).toBe(true);
    expect(isGlyphValue('/static/arrow.svg')).toBe(true);
    expect(isGlyphValue('ti ti-chevron-right')).toBe(false);
    expect(isGlyphValue('material-symbols-outlined')).toBe(false);
  });

  // In 18.1 every string icon value was wrapped in `url(...)`. Each of these worked there and
  // must still be a glyph, not a class list that paints nothing.
  it('classifies every URL shape an 18.1 icons config held as a glyph', () => {
    expect(isGlyphValue('https://cdn.example.com/search.png')).toBe(true);
    expect(isGlyphValue('http://cdn.example.com/icons/search')).toBe(true);
    expect(isGlyphValue('//cdn.example.com/search.svg')).toBe(true);
    expect(isGlyphValue('/icons/check.svg?v=2')).toBe(true);
    expect(isGlyphValue('./icons/check.svg#dark')).toBe(true);
    expect(isGlyphValue('../icons/check')).toBe(true);
    expect(isGlyphValue('icons/check.png')).toBe(true);
    expect(isGlyphValue('arrow.webp?v=3')).toBe(true);
    expect(isGlyphValue('blob:https://example.com/0f1e')).toBe(true);
    expect(isGlyphValue('URL("/a.svg")')).toBe(true);
    expect(isGlyphValue('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>')).toBe(true);
  });

  it('keeps class lists that only look like paths as class lists', () => {
    // A Tailwind-style fraction and an icon-font class are not URLs.
    expect(isGlyphValue('size-4 w-1/2')).toBe(false);
    expect(isGlyphValue('fa-solid fa-image')).toBe(false);
    expect(isGlyphValue('i-mdi:check')).toBe(false);
  });

  it('encodes markup with an XML prolog as an SVG data URI', () => {
    const markup = '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>';

    expect(toGlyphUrl(markup)).toBe(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`);
    expect(toGlyphUrl('/icons/check.svg?v=2')).toBe('/icons/check.svg?v=2');
  });

  it('normalizes glyph values to a bare URL', () => {
    expect(toGlyphUrl('data:image/svg+xml,%3Csvg%3E')).toBe('data:image/svg+xml,%3Csvg%3E');
    expect(toGlyphUrl('url("/a.svg")')).toBe('/a.svg');
    expect(toGlyphUrl('url(\'/a.svg\')')).toBe('/a.svg');
    expect(toGlyphUrl('/a.svg')).toBe('/a.svg');
    expect(toGlyphUrl('<svg viewBox="0 0 1 1"/>'))
      .toBe(`data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg viewBox="0 0 1 1"/>')}`);
  });

  it('splits glyphs from external values', () => {
    const renderer = () => {};
    const { glyphs, external } = splitIcons({
      arrowRight: 'data:image/svg+xml,%3Csvg%3E',
      arrowLeft: 'ti ti-chevron-left',
      check: renderer,
    });

    expect(glyphs).toEqual({ arrowRight: 'data:image/svg+xml,%3Csvg%3E' });
    expect(external.get('arrowLeft')).toBe('ti ti-chevron-left');
    expect(external.get('check')).toBe(renderer);
    expect(external.has('arrowRight')).toBe(false);
  });

  it('drops keys that are not icon names, so they never reach the generated CSS', () => {
    const { glyphs, external } = splitIcons({
      arrowRight: 'data:image/svg+xml,%3Csvg%3E',
      'x} .handsontable{display:none': 'data:image/svg+xml,%3Csvg%3E',
      notAnIcon: 'ti ti-x',
    });

    expect(glyphs).toEqual({ arrowRight: 'data:image/svg+xml,%3Csvg%3E' });
    expect(external.size).toBe(0);
  });

  it('tolerates a url() without its closing paren and strips line breaks', () => {
    expect(toGlyphUrl('url(icons/check.svg')).toBe('icons/check.svg');
    expect(toGlyphUrl('url("icons/check.svg")')).toBe('icons/check.svg');
    expect(toGlyphUrl('data:image/svg+xml,%3Csvg%3E\r\n')).toBe('data:image/svg+xml,%3Csvg%3E');
    expect(toGlyphUrl('url(\n"icons/check.svg"\n)')).toBe('icons/check.svg');
  });

  it('keeps ICON_NAMES in sync with both generated icon sets', () => {
    const names = [...ICON_NAMES].sort();

    expect(Object.keys(mainIcons).sort()).toEqual(names);
    expect(Object.keys(horizonIcons).sort()).toEqual(names);
  });
});
