import { getHeaderLabelText } from '../headerLabel';

/**
 * Builds a header cell the way the grid renders one, with the given markup as its label.
 *
 * @param {string} labelMarkup The markup of the label.
 * @returns {HTMLElement}
 */
function headerWith(labelMarkup: string): HTMLElement {
  const TH = document.createElement('th');

  TH.innerHTML = `<div class="relative"><span class="colHeader">${labelMarkup}</span><i>+</i></div>`;

  return TH;
}

describe('getHeaderLabelText', () => {
  it('should read the text of the rendered label and nothing else in the header', () => {
    expect(getHeaderLabelText(headerWith('Sales'), 'declared')).toBe('Sales');
  });

  it('should leave markup out and decode character references of a rendered label', () => {
    expect(getHeaderLabelText(headerWith('<b>Q1</b> &amp; <i>Q2</i>'), '')).toBe('Q1 & Q2');
  });

  it('should read a line break as a space and collapse whitespace', () => {
    expect(getHeaderLabelText(headerWith('First<br>second\n   third'), '')).toBe('First second third');
  });

  it('should fall back to the declared label when the header is not rendered', () => {
    expect(getHeaderLabelText(null, ' Group 1 ')).toBe('Group 1');
  });

  it('should fall back to the declared label when the rendered label is empty', () => {
    expect(getHeaderLabelText(headerWith('  '), 'Group 1')).toBe('Group 1');
  });

  it('should reduce a declared label with markup to its text', () => {
    expect(getHeaderLabelText(null, '<b>Q1</b><br/>&amp; Q2')).toBe('Q1 & Q2');
  });

  it('should read every line break form of a declared label as one space and trim the result', () => {
    expect(getHeaderLabelText(null, 'Q1<br>Q2<br />Q3  Q4<br>')).toBe('Q1 Q2 Q3 Q4');
  });

  it('should keep a declared label that only looks like prose as it is', () => {
    expect(getHeaderLabelText(null, 'Smith & Sons; est. 1920')).toBe('Smith & Sons; est. 1920');
  });

  it('should return an empty string for a header without any label', () => {
    expect(getHeaderLabelText(null, undefined)).toBe('');
    expect(getHeaderLabelText(null, null)).toBe('');
  });

  it('should stringify a declared label that is not a string', () => {
    expect(getHeaderLabelText(null, 2024)).toBe('2024');
  });
});
