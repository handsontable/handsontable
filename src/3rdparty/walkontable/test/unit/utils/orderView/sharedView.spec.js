import SharedOrderView from 'walkontable/utils/orderView/sharedView';
import ViewSizeSet from 'walkontable/utils/orderView/viewSizeSet';

function createOrderView() {
  const rootNode = document.createElement('tr');
  const nodeFactoryFunction = () => {};
  const orderView = new SharedOrderView(rootNode, nodeFactoryFunction, 'td');

  return { orderView, nodeFactoryFunction, rootNode };
}

describe('SharedOrderView', () => {
  it('should be correctly constructed', () => {
    const { orderView, nodeFactoryFunction, rootNode } = createOrderView();

    expect(orderView.rootNode).toBe(rootNode);
    expect(orderView.nodesPool).toBe(nodeFactoryFunction);
    expect(orderView.sizeSet).toBeInstanceOf(ViewSizeSet);
    expect(orderView.childNodeType).toBe('TD');
    expect(orderView.visualIndex).toBe(0);
    expect(orderView.collectedNodes).toEqual([]);
  });

  it('should correctly prepend another OrderView to this instance', () => {
    const { orderView } = createOrderView();
    const { orderView: anotherOrderView } = createOrderView();

    spyOn(orderView.sizeSet, 'append');
    spyOn(orderView.sizeSet, 'prepend');
    spyOn(anotherOrderView.sizeSet, 'append');
    spyOn(anotherOrderView.sizeSet, 'prepend');

    const result = orderView.prependView(anotherOrderView);

    expect(result).toBe(orderView);
    expect(orderView.sizeSet.prepend).toHaveBeenCalledWith(anotherOrderView.sizeSet);
    expect(orderView.sizeSet.append).not.toHaveBeenCalled();
    expect(anotherOrderView.sizeSet.prepend).not.toHaveBeenCalled();
    expect(anotherOrderView.sizeSet.append).toHaveBeenCalledWith(orderView.sizeSet);
  });

  it('should correctly append another OrderView to this instance', () => {
    const { orderView } = createOrderView();
    const { orderView: anotherOrderView } = createOrderView();

    spyOn(orderView.sizeSet, 'append');
    spyOn(orderView.sizeSet, 'prepend');
    spyOn(anotherOrderView.sizeSet, 'append');
    spyOn(anotherOrderView.sizeSet, 'prepend');

    const result = orderView.appendView(anotherOrderView);

    expect(result).toBe(orderView);
    expect(orderView.sizeSet.prepend).not.toHaveBeenCalled();
    expect(orderView.sizeSet.append).toHaveBeenCalledWith(anotherOrderView.sizeSet);
    expect(anotherOrderView.sizeSet.prepend).toHaveBeenCalledWith(orderView.sizeSet);
    expect(anotherOrderView.sizeSet.append).not.toHaveBeenCalled();
  });
});
