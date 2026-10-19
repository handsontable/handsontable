import Border from 'walkontable/selection/border/border';

describe('Border#measure', () => {
  const createBorder = () => {
    const border = Object.create(Border.prototype);

    border.disabled = false;
    border.disappear = jest.fn();

    return border as Border;
  };

  it('should answer null for a header-only selection without hiding the border', () => {
    // Hiding writes a style, and a write between two measurements brings back one layout per border.
    const border = createBorder();

    expect(border.measure([-1, 0, -1, 3])).toBeNull();
    expect(border.disappear).not.toHaveBeenCalled();
  });

  it('should answer null for a disabled border', () => {
    const border = createBorder();

    (border as unknown as { disabled: boolean }).disabled = true;

    expect(border.measure([0, 0, 1, 1])).toBeNull();
    expect(border.disappear).not.toHaveBeenCalled();
  });

  it('should hide the border in paint when the measurement is empty', () => {
    const border = createBorder();

    border.drawFrozenBoundaryEdge = jest.fn(() => false);
    border.paint([-1, 0, -1, 3], null);

    expect(border.disappear).toHaveBeenCalledTimes(1);
  });
});
