import CellsRenderer from 'walkontable/renderer/cells';

function createRenderer() {
  const renderer = new CellsRenderer();

  return { renderer };
}

describe('CellsRenderer', () => {
  it('should be correctly setup', () => {
    const { renderer } = createRenderer();

    expect(renderer.nodeType).toBe('TD');
    expect(renderer.sourceRowIndex).toBe(0);
  });
});
