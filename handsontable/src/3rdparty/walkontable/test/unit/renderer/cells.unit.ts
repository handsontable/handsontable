import { CellsRenderer } from 'walkontable/render/cells';

/**
 *
 */
function createRenderer() {
  const renderer = new CellsRenderer();

  return { renderer };
}

describe('CellsRenderer', () => {
  it('should be correctly setup', () => {
    const { renderer } = createRenderer();

    expect(renderer.nodeType).toBe('TD');
  });
});
