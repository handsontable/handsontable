import { buildExportDialogContent } from '../utils';

describe('buildExportDialogContent', () => {
  it('should render the passed title', () => {
    const fragment = buildExportDialogContent('Exporting…');

    expect(fragment.querySelector('.ht-loading__title').textContent).toBe('Exporting…');
  });

  it('should strip tags from the title', () => {
    const fragment = buildExportDialogContent('Exporting<img src="x">');

    expect(fragment.querySelector('.ht-loading__title').textContent).toBe('Exporting');
    expect(fragment.querySelectorAll('img').length).toBe(0);
  });
});
