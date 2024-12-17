import { RowHeadersRenderer } from 'walkontable/renderer/rowHeaders';

function createRenderer() {
  const renderer = new RowHeadersRenderer();

  return { renderer };
}

describe('RowHeadersRenderer', () => {
  it('should be correctly setup', () => {
    const { renderer } = createRenderer();

    expect(renderer.nodeType).toBe('TH');
    expect(renderer.sourceRowIndex).toBe(0);
  });
});
