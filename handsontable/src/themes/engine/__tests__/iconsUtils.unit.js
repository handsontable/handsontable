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
