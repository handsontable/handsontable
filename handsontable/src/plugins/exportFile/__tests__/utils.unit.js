import { buildExportDialogContent, expandNestedHeaderLayers } from '../utils';

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

describe('expandNestedHeaderLayers', () => {
  it('should repeat a group label once per column it spans, top layer first', () => {
    const layers = [
      [{ label: '2024', colspan: 2 }, { label: '2025', colspan: 2 }],
      [
        { label: 'Q1', colspan: 1 },
        { label: 'Q2', colspan: 1 },
        { label: 'Q1', colspan: 1 },
        { label: 'Q2', colspan: 1 },
      ],
    ];

    expect(expandNestedHeaderLayers(layers)).toEqual([
      ['2024', '2024', '2025', '2025'],
      ['Q1', 'Q2', 'Q1', 'Q2'],
    ]);
  });

  it('should keep an empty placeholder label as one empty cell', () => {
    // A range that starts inside a span yields `{ label: '', colspan: 1 }` for that column
    // (see DataProvider#_appendNestedHeaderWithoutHidden). The column must stay in the row so
    // the header lines keep the same column count as the data lines.
    const layers = [
      [{ label: '', colspan: 1 }, { label: '2025', colspan: 1 }],
      [{ label: 'Q2', colspan: 1 }, { label: 'Q1', colspan: 1 }],
    ];

    expect(expandNestedHeaderLayers(layers)).toEqual([
      ['', '2025'],
      ['Q2', 'Q1'],
    ]);
  });

  it('should return an empty array for no layers', () => {
    expect(expandNestedHeaderLayers([])).toEqual([]);
  });

  it('should not mutate the input', () => {
    const layers = [[{ label: 'A', colspan: 2 }]];
    const snapshot = JSON.stringify(layers);

    expandNestedHeaderLayers(layers);

    expect(JSON.stringify(layers)).toBe(snapshot);
  });
});
