import { buildExportDialogContent } from '../utils';

describe('buildExportDialogContent', () => {
  it('should render the passed title', () => {
    const fragment = buildExportDialogContent('Exporting…', document);

    expect(fragment.querySelector('.ht-loading__title').textContent).toBe('Exporting…');
  });

  it('should render markup in the title as text', () => {
    const fragment = buildExportDialogContent('Exporting<img src="x">', document);
    const title = fragment.querySelector('.ht-loading__title');

    expect(title.children.length).toBe(0);
    expect(fragment.querySelectorAll('img').length).toBe(0);
    expect(title.textContent).toBe('Exporting<img src="x">');
  });

  it('should keep a title containing a less-than sign whole', () => {
    const fragment = buildExportDialogContent('Exporting < 10 rows', document);

    expect(fragment.querySelector('.ht-loading__title').textContent).toBe('Exporting < 10 rows');
  });

  // The rest of this fragment was retyped by hand from an HTML string and nothing read it, so a
  // dropped class or a missing SVG namespace would have shipped silently. The spinner in
  // particular is namespace-sensitive: an `<svg>` built through `createElement` without the SVG
  // namespace is an unknown HTML element and never renders.
  it('should build the documented element structure', () => {
    const fragment = buildExportDialogContent('Exporting…', document);
    const content = fragment.querySelector('.ht-loading__content');

    expect(content).not.toBe(null);
    expect(content.querySelectorAll('i.ht-loading__icon').length).toBe(1);
    expect(content.querySelectorAll('.ht-loading__text').length).toBe(1);
    expect(content.querySelectorAll('h2.ht-loading__title').length).toBe(1);
  });

  it('should build the spinner in the SVG namespace, so it renders', () => {
    const fragment = buildExportDialogContent('Exporting…', document);
    const svg = fragment.querySelector('.ht-loading__icon-svg');
    const path = svg.querySelector('path');

    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
    // inherited rather than set again on the child, which is the behavior that makes the
    // one-namespace-per-subtree template spec correct
    expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 16 16');
    expect(svg.getAttribute('fill')).toBe('none');
    expect(path.getAttribute('d')).toBe('M15 8a7 7 0 1 1-3.5-6.062');
    expect(path.getAttribute('stroke')).toBe('currentColor');
    expect(path.getAttribute('stroke-width')).toBe('2');
  });
});
