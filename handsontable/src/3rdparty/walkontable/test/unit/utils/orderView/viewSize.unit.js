import { ViewSize } from 'walkontable/utils/orderView/viewSize';

describe('ViewSize', () => {
  it('should be correctly constructed', () => {
    const viewSize = new ViewSize();

    expect(viewSize.currentSize).toBe(0);
    expect(viewSize.nextSize).toBe(0);
    expect(viewSize.currentOffset).toBe(0);
    expect(viewSize.nextOffset).toBe(0);
  });

  it('should save previous size after setting a new size', () => {
    const viewSize = new ViewSize();

    viewSize.setSize(5);

    expect(viewSize.currentSize).toBe(0);
    expect(viewSize.nextSize).toBe(5);

    viewSize.setSize(9);

    expect(viewSize.currentSize).toBe(5);
    expect(viewSize.nextSize).toBe(9);

    viewSize.setSize(19);

    expect(viewSize.currentSize).toBe(9);
    expect(viewSize.nextSize).toBe(19);
  });

  it('should save previous offset after setting a new offset', () => {
    const viewSize = new ViewSize();

    viewSize.setOffset(5);

    expect(viewSize.currentOffset).toBe(0);
    expect(viewSize.nextOffset).toBe(5);

    viewSize.setOffset(9);

    expect(viewSize.currentOffset).toBe(5);
    expect(viewSize.nextOffset).toBe(9);

    viewSize.setOffset(19);

    expect(viewSize.currentOffset).toBe(9);
    expect(viewSize.nextOffset).toBe(19);
  });
});
