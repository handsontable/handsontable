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
});
