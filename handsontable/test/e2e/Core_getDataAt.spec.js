describe('Core_getDataAt*', () => {
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

  const arrayOfArrays = function() {
    return [
      ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
      ['2008', 10, 11, 12, 13],
      ['2009', 20, 11, 14, 13],
      ['2010', 30, 15, 12, 13]
    ];
  };

  const arrayOfObjects = function() {
    return [
      {
        'id.a.b.c': 1,
        id: 1,
        name: 'Nannie Patel',
        address: 'Jenkin ville',
        details: {
          city: 'Chicago'
        },
      },
      {
        'id.a.b.c': 2,
        id: 2,
        name: 'Łucja Grożny and Środeńczak',
        address: 'Gardiner',
        details: {
          city: 'New York'
        },
      },
    ];
  };

  it('should return data at specified row', async() => {
    handsontable({
      data: arrayOfArrays()
    });

    expect(getDataAtRow(0)).toEqual(['', 'Kia', 'Nissan', 'Toyota', 'Honda']);
  });

  it('should return data at specified col', async() => {
    handsontable({
      data: arrayOfArrays()
    });

    expect(getDataAtCol(1)).toEqual(['Kia', 10, 20, 30]);
  });

  it('should not throw an exception while getting data for column by its index (big dataset)', async() => {
    handsontable({
      data: createSpreadsheetData(130000, 5),
    });

    expect(() => {
      getDataAtCol(0);
    }).not.toThrowError();
  });

  it('should not throw an exception while getting data for column by its property (big dataset)', async() => {
    handsontable({
      data: createSpreadsheetData(130000, 5),
    });

    expect(() => {
      getDataAtProp(0);
    }).not.toThrowError();
  });

  describe('Core_getDataAtRowProp', () => {
    it('should return data at specified column', async() => {
      handsontable({
        data: arrayOfObjects()
      });

      expect(getDataAtRowProp(1, 'id.a.b.c')).toBe(2);
      expect(getDataAtRowProp(1, 'id')).toBe(2);
      expect(getDataAtRowProp(1, 'id')).toBe(2);
      expect(getDataAtRowProp(1, 'details.city')).toBe('New York');
    });
  });

  describe('`modifyData` hook', () => {
    it('should be fired with specified arguments on every `set`, `get` operation (array of arrays)', async() => {
      const spy = jasmine.createSpy();

      handsontable({
        data: arrayOfArrays(),
        autoColumnSize: false,
        modifyData: spy,
      });

      expect(spy.calls.count()).toBe(20); // call for all cells
      expect(spy.calls.argsFor(1)[0]).toBe(0);
      expect(spy.calls.argsFor(1)[1]).toBe(1);
      expect(spy.calls.argsFor(1)[2].value).toBe('Kia');
      expect(spy.calls.argsFor(1)[3]).toBe('get');

      spy.calls.reset();
      await setDataAtCell(2, 3, 'foo');

      expect(spy.calls.count()).toBe(21); // call for all cells + 1 from setDataAtCell
      expect(spy.calls.argsFor(0)[0]).toBe(2);
      expect(spy.calls.argsFor(0)[1]).toBe(3);
      expect(spy.calls.argsFor(0)[2].value).toBe('foo');
      expect(spy.calls.argsFor(0)[3]).toBe('set');
    });

    it('should be fired with specified arguments on every `set`, `get` operation (array of objects)', async() => {
      const spy = jasmine.createSpy();

      handsontable({
        data: arrayOfObjects(),
        autoColumnSize: false,
        modifyData: spy,
      });

      expect(spy.calls.count()).toBe(10); // call for all cells
      expect(spy.calls.argsFor(2)[0]).toBe(0);
      expect(spy.calls.argsFor(2)[1]).toBe(2);
      expect(spy.calls.argsFor(2)[2].value).toBe('Nannie Patel');
      expect(spy.calls.argsFor(2)[3]).toBe('get');

      spy.calls.reset();

      await setDataAtRowProp(2, 'name', 'foo');

      expect(spy.calls.count()).toBe(16);
      expect(spy.calls.argsFor(0)[0]).toBe(2);
      expect(spy.calls.argsFor(0)[1]).toBe(2);
      expect(spy.calls.argsFor(0)[2].value).toBe('foo');
      expect(spy.calls.argsFor(0)[3]).toBe('set');
    });

    it('should overwrite value while loading data', async() => {
      handsontable({
        data: arrayOfArrays(),
        modifyData(row, column, valueHolder, ioMode) {
          if (ioMode === 'get' && row === 1 && column === 2) {
            valueHolder.value = 'foo';
          }
        },
      });

      expect(getDataAtCell(1, 2)).toBe('foo');
      expect(getSourceDataAtCell(1, 2)).toBe(11);
    });

    it('should overwrite value while saving data', async() => {
      handsontable({
        data: arrayOfArrays(),
        modifyData(row, column, valueHolder, ioMode) {
          if (ioMode === 'set' && row === 1 && column === 2) {
            valueHolder.value = 'foo';
          }
        },
      });

      await setDataAtCell(1, 2, 'bar');

      expect(getDataAtCell(1, 2)).toBe('foo');
      expect(getSourceDataAtCell(1, 2)).toBe('foo');
    });
  });
});
