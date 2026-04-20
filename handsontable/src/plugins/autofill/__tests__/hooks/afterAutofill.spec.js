describe('AutoFill afterAutofill hook', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  /**
   * Finds the visible fill handle element in the container. When a range of cells
   * is selected, the visible handle may be on the `.area.corner` border instead of
   * the `.current.corner` border.
   *
   * @returns {HTMLElement} The visible fill handle element.
   */
  function getVisibleFillHandle() {
    const corners = spec().$container.find('.wtBorder.current.corner').toArray();
    const areaCorners = spec().$container.find('.wtBorder.area.corner').toArray();

    return [...corners, ...areaCorners].find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
  }

  /**
   * Simulates a fill handle drag for range selections where the visible handle
   * might be `.area.corner` instead of `.current.corner`.
   *
   * @param {HTMLElement} targetCell The target cell element to drag to.
   */
  function simulateRangeFillHandleDrag(targetCell) {
    const fillHandle = getVisibleFillHandle();
    const handleRect = fillHandle.getBoundingClientRect();
    const $target = $(targetCell);
    const targetRect = targetCell.getBoundingClientRect();

    $(fillHandle).simulate('mousedown', {
      clientX: handleRect.left + (handleRect.width / 2),
      clientY: handleRect.top + (handleRect.height / 2),
    });
    $(document.documentElement).simulate('mousemove', {
      clientX: targetRect.left + (targetRect.width / 2),
      clientY: targetRect.top + (targetRect.height / 2),
    });
    $target.simulate('mouseover', {
      clientX: targetRect.left + (targetRect.width / 2),
      clientY: targetRect.top + (targetRect.height / 2),
    });
    $(document.documentElement).simulate('mouseup');
  }

  it('should pass correct arguments to `afterAutofill`', async() => {
    const afterAutofill = jasmine.createSpy();

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      afterAutofill
    });

    await selectCell(0, 0, 0, 1);

    simulateRangeFillHandleDrag(getCell(2, 1));

    expect(afterAutofill).toHaveBeenCalledWith(
      [[1, 2]],
      cellRange(0, 0, 0, 1),
      cellRange(1, 0, 2, 1),
      'down',
    );
  });

  it('should run afterAutofill once after each set of autofill changes have been applied', async() => {
    const afterAutofill = jasmine.createSpy('afterAutofill');

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 1, 2, 3],
        [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ],
      afterAutofill
    });

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(0, 1));

    expect(afterAutofill).toHaveBeenCalledTimes(1);

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(1, 0));

    expect(getDataAtCell(1, 0)).toEqual(1);

    expect(afterAutofill).toHaveBeenCalledTimes(2);
  });

  it('should not call afterAutofill if beforeAutofill returns false', async() => {
    const afterAutofill = jasmine.createSpy('afterAutofill');

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      beforeAutofill() {
        return false;
      },
      afterAutofill,
    });

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(0, 1));

    expect(afterAutofill).toHaveBeenCalledTimes(0);

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(1, 0));

    expect(afterAutofill).toHaveBeenCalledTimes(0);
  });

  it('should not call afterAutofill if we return to the cell from where we start', async() => {
    const afterAutofill = jasmine.createSpy('afterAutofill');

    handsontable({
      data: [
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6]
      ],
      afterAutofill,
      fillHandle: {
        direction: 'vertical'
      }
    });

    await selectCell(0, 0);

    simulateFillHandleDrag(getCell(0, 0));

    expect(afterAutofill).toHaveBeenCalledTimes(0);
  });
});
