import OrderView from 'walkontable/utils/orderView/view';
import ViewSizeSet from 'walkontable/utils/orderView/viewSizeSet';

function createOrderView() {
  const rootNode = document.createElement('tr');
  const nodeFactoryFunction = () => {};
  const orderView = new OrderView(rootNode, nodeFactoryFunction, 'td');

  return { orderView, nodeFactoryFunction, rootNode };
}

describe('OrderView', () => {
  it('should be correctly constructed', () => {
    const { orderView, nodeFactoryFunction, rootNode } = createOrderView();

    expect(orderView.rootNode).toBe(rootNode);
    expect(orderView.nodesPool).toBe(nodeFactoryFunction);
    expect(orderView.sizeSet).toBeInstanceOf(ViewSizeSet);
    expect(orderView.childNodeType).toBe('TD');
    expect(orderView.visualIndex).toBe(0);
    expect(orderView.collectedNodes).toEqual([]);
  });

  it('should set a new size through ViewSizeSet method', () => {
    const { orderView } = createOrderView();

    spyOn(orderView.sizeSet, 'setSize');

    orderView.setSize(5);

    expect(orderView.sizeSet.setSize).toHaveBeenCalledWith(5);

    orderView.setSize(9);

    expect(orderView.sizeSet.setSize).toHaveBeenCalledWith(9);
  });

  it('should set a new offset through ViewSizeSet method', () => {
    const { orderView } = createOrderView();

    spyOn(orderView.sizeSet, 'setOffset');

    orderView.setOffset(5);

    expect(orderView.sizeSet.setOffset).toHaveBeenCalledWith(5);

    orderView.setOffset(9);

    expect(orderView.sizeSet.setOffset).toHaveBeenCalledWith(9);
  });

  it('should check shared mode through ViewSizeSet method', () => {
    const { orderView } = createOrderView();

    spyOn(orderView.sizeSet, 'isShared').and.returnValue(true);

    expect(orderView.isSharedViewSet()).toBe(true);
    expect(orderView.sizeSet.isShared).toHaveBeenCalledTimes(1);
  });

  it('should return array item based on visual index of `collectedNodes` property', () => {
    const { orderView } = createOrderView();

    orderView.collectedNodes = [1, 2, 3];

    expect(orderView.getNode(0)).toBe(1);
    expect(orderView.getNode(1)).toBe(2);
    expect(orderView.getNode(2)).toBe(3);
    expect(orderView.getNode(3)).toBe(null);
  });

  it('should return always last item of the `collectedNodes` array', () => {
    const { orderView } = createOrderView();

    orderView.collectedNodes = [1, 2, 3];

    expect(orderView.getCurrentNode()).toBe(3);

    orderView.collectedNodes = [1, 2, 3, 8];

    expect(orderView.getCurrentNode()).toBe(8);
  });
});
