describe('Core.countEmptyCols', () => {
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

  it('should count empty columns (empty string, `null` or `undefined`)', async() => {
    handsontable({
      data: [
        ['', 'a', 'b', null, 'c', 0, undefined],
        ['', 'a', 'b', null, 'c', 0, undefined],
        ['', 'a', 'b', null, 'c', 0, undefined],
      ],
    });

    expect(countEmptyCols()).toBe(3);
  });

  it('should count empty columns only that which sticks to the right edge of the table (empty string, `null` or `undefined`)', async() => {
    handsontable({
      data: [
        ['', 'a', 'b', null, 'c', '', undefined],
        ['', 'a', 'b', null, 'c', '', undefined],
        ['', 'a', 'b', null, 'c', '', undefined],
      ],
    });

    expect(countEmptyCols(true)).toBe(2);
  });

  it('should count empty columns using custom logic implemented in `isEmptyCol` option', async() => {
    handsontable({
      data: [
        [null, 'a', 'b', null, 'c', '', undefined, null],
        ['', null, 'b', null, 'c', '', undefined, ''],
        ['', 'a', null, null, 'c', '', undefined, ''],
      ],
      isEmptyCol(column) {
        return this.getDataAtCell(0, column) === null;
      }
    });

    expect(countEmptyCols()).toBe(3);
    expect(countEmptyCols(true)).toBe(1);
  });

  it('should return all visible columns when all rows are trimmed', async() => {
    handsontable({
      data: [
        ['', 'a', 'b', null, 'c', 0, undefined],
        ['', 'a', 'b', null, 'c', 0, undefined],
        ['', 'a', 'b', null, 'c', 0, undefined],
      ],
    });

    const trimmingMap = rowIndexMapper().createAndRegisterIndexMap('map', 'trimming');

    trimmingMap.setValueAtIndex(0, true);
    trimmingMap.setValueAtIndex(1, true);
    trimmingMap.setValueAtIndex(2, true);
    await render();

    expect(countEmptyCols()).toBe(7);
    expect(countEmptyCols(true)).toBe(7);
  });

  it('should count only empty columns when all rows are hidden', async() => {
    handsontable({
      data: [
        ['', 'a', 'b', null, 'c', 0, undefined],
        ['', 'a', 'b', null, 'c', 0, undefined],
        ['', 'a', 'b', null, 'c', 0, undefined],
      ],
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    await render();

    expect(countEmptyCols()).toBe(3);
    expect(countEmptyCols(true)).toBe(1);
  });

  it('should count all columns that have `null`', async() => {
    handsontable({
      data: [
        [null, null, 'b', null, 'c'],
        [null, 'a', null, null, 'c'],
        [null, 'a', 'b', null, null],
      ],
    });

    expect(countEmptyCols()).toBe(2);
    expect(countEmptyCols(true)).toBe(0);
  });

  it('should count all columns that have `undefined`', async() => {
    handsontable({
      data: [
        [undefined, undefined, 'b', undefined, 'c'],
        [undefined, 'a', undefined, undefined, 'c'],
        [undefined, 'a', 'b', undefined, undefined],
      ],
    });

    expect(countEmptyCols()).toBe(2);
    expect(countEmptyCols(true)).toBe(0);
  });

  it('should count all columns that have an empty string', async() => {
    handsontable({
      data: [
        ['', '', 'b', '', 'c'],
        ['', 'a', '', '', 'c'],
        ['', 'a', 'b', '', ''],
      ],
    });

    expect(countEmptyCols()).toBe(2);
    expect(countEmptyCols(true)).toBe(0);
  });

  it('should not count all columns as empty when the all rows are hidden', async() => {
    handsontable({
      data: [
        ['a', 'b', 'c', 'd', 'e'],
        ['a', 'b', 'c', 'd', 'e'],
        ['a', 'b', 'c', 'd', 'e'],
      ],
    });

    rowIndexMapper().createAndRegisterIndexMap('hide', 'hiding', true); // hide all rows
    await render();

    expect(countEmptyCols()).toBe(0);
    expect(countEmptyCols(true)).toBe(0);
  });

  it('should count all columns as empty when the all rows are trimmed', async() => {
    handsontable({
      data: [
        ['a', 'b', 'c', 'd', 'e'],
        ['a', 'b', 'c', 'd', 'e'],
        ['a', 'b', 'c', 'd', 'e'],
      ],
    });

    rowIndexMapper().createAndRegisterIndexMap('trim', 'trimming', true); // trim all rows
    await render();

    expect(countEmptyCols()).toBe(5);
    expect(countEmptyCols(true)).toBe(5);
  });

  it('should count all empty columns when there is some columns index translation', async() => {
    handsontable({
      data: [
        ['', 'a', 'b', '', 'd'],
      ],
    });

    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    expect(countEmptyCols()).toBe(2);
    expect(countEmptyCols(true)).toBe(1);
  });
});
