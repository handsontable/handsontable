import RowsRenderer from 'walkontable/renderer/rows';
import OrderView from 'walkontable/utils/orderView/view';

jest.mock('walkontable/utils/orderView/view');

function createRenderer() {
  const rootNode = document.createElement('tbody');
  const renderer = new RowsRenderer(rootNode);

  return { renderer, rootNode };
}

describe('RowsRenderer', () => {
  beforeEach(() => {
    OrderView.mockClear();
  });

  it('should be correctly setup', () => {
    const { renderer, rootNode } = createRenderer();

    expect(renderer.nodeType).toBe('TR');
    expect(renderer.orderView.constructor).toHaveBeenCalledWith(rootNode, jasmine.any(Function), 'TR');
  });

  it('should get rendered node through orderView method', () => {
    const { renderer } = createRenderer();

    renderer.orderView.getNode.mockReturnValue('x');

    expect(renderer.getRenderedNode(0)).toBe('x');
    expect(renderer.orderView.getNode).toHaveBeenCalledWith(0);

    renderer.getRenderedNode(2);

    expect(renderer.orderView.getNode).toHaveBeenCalledWith(2);

    renderer.getRenderedNode(99);

    expect(renderer.orderView.getNode).toHaveBeenCalledWith(99);
  });
});
