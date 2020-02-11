describe('Core_dataSchema', () => {
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

  it('should be equal to `hot.getSchema()` when dataSchema is defined in settings (as object)', () => {
    const schema = { id: null, name: { first: null, last: null }, cars: [{ brand: null }] };
    const hot = handsontable({
      data: [],
      dataSchema: schema,
      minRows: 5,
      minCols: 4,
      colHeaders: ['ID', 'First Name', 'Last Name'],
      columns: [
        { data: 'id' },
        { data: 'name.first' },
        { data: 'name.last' }
      ],
      minSpareRows: 1
    });

    expect(JSON.stringify(hot.getSchema())).toEqual(JSON.stringify(schema));
  });

  it('should be equal to `hot.getSchema()` when dataSchema is defined in settings (as object) when columns is a function', () => {
    const schema = { id: null, name: { first: null, last: null }, cars: [{ brand: null }] };
    const hot = handsontable({
      data: [],
      dataSchema: schema,
      minRows: 5,
      minCols: 4,
      colHeaders: ['ID', 'First Name', 'Last Name'],
      columns(column) {
        let colMeta = {};

        if (column === 0) {
          colMeta.data = 'id';

        } else if (column === 1) {
          colMeta.data = 'name.first';

        } else if (column === 2) {
          colMeta.data = 'name.last';

        } else {
          colMeta = null;
        }

        return colMeta;
      },
      minSpareRows: 1
    });

    expect(JSON.stringify(hot.getSchema())).toEqual(JSON.stringify(schema));
  });

  it('should be equal to `hot.getSchema()` when dataSchema is defined in settings (as function)', () => {
    const schema = { id: null, name: { first: null, last: null }, cars: [{ brand: null }] };
    const hot = handsontable({
      data: [],
      dataSchema() {
        return schema;
      },
      minRows: 5,
      minCols: 4,
      colHeaders: ['ID', 'First Name', 'Last Name'],
      columns: [
        { data: 'id' },
        { data: 'name.first' },
        { data: 'name.last' }
      ],
      minSpareRows: 1
    });

    expect(JSON.stringify(hot.getSchema())).toEqual(JSON.stringify(schema));
  });

  it('should be equal to `hot.getSchema()` when dataSchema is defined in settings (as function) when columns is a function', () => {
    const schema = { id: null, name: { first: null, last: null }, cars: [{ brand: null }] };
    const hot = handsontable({
      data: [],
      dataSchema() {
        return schema;
      },
      minRows: 5,
      minCols: 4,
      colHeaders: ['ID', 'First Name', 'Last Name'],
      columns(column) {
        let colMeta = {};

        if (column === 0) {
          colMeta.data = 'id';

        } else if (column === 1) {
          colMeta.data = 'name.first';

        } else if (column === 2) {
          colMeta.data = 'name.last';

        } else {
          colMeta = null;
        }

        return colMeta;
      },
      minSpareRows: 1
    });
    expect(JSON.stringify(hot.getSchema())).toEqual(JSON.stringify(schema));
  });

  it('should be equal to `hot.getSchema()` when dataSchema is generated based on data structure', () => {
    const hot = handsontable({
      data: [
        { id: 1, name: { first: 'Alan', last: 'Pakoli' }, cars: [{ brand: 'Ford' }] }
      ],
      minRows: 5,
      minCols: 4,
      colHeaders: ['ID', 'First Name', 'Last Name'],
      columns: [
        { data: 'id' },
        { data: 'name.first' },
        { data: 'name.last' }
      ],
      minSpareRows: 1
    });

    expect(JSON.stringify(hot.getSchema()))
      .toEqual(JSON.stringify({ id: null, name: { first: null, last: null }, cars: [{ brand: null }] }));
  });

  it('should be equal to `hot.getSchema()` when dataSchema is generated based on data structure when columns is a function', () => {
    const hot = handsontable({
      data: [
        { id: 1, name: { first: 'Alan', last: 'Pakoli' }, cars: [{ brand: 'Ford' }] }
      ],
      minRows: 5,
      minCols: 4,
      colHeaders: ['ID', 'First Name', 'Last Name'],
      columns(column) {
        let colMeta = {};

        if (column === 0) {
          colMeta.data = 'id';

        } else if (column === 1) {
          colMeta.data = 'name.first';

        } else if (column === 2) {
          colMeta.data = 'name.last';

        } else {
          colMeta = null;
        }

        return colMeta;
      },
      minSpareRows: 1
    });

    expect(JSON.stringify(hot.getSchema()))
      .toEqual(JSON.stringify({ id: null, name: { first: null, last: null }, cars: [{ brand: null }] }));
  });

  it('should create new row from dataSchema', () => {
    handsontable({
      data: [],
      dataSchema: { id: null, name: { first: null, last: null }, address: null },
      minRows: 5,
      minCols: 4,
      colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
      columns: [
        { data: 'id' },
        { data: 'name.first' },
        { data: 'name.last' },
        { data: 'address' }
      ],
      minSpareRows: 1
    });
    selectCell(0, 1);

    keyDownUp('enter');
    keyProxy().val('Ted');
    keyDownUp('enter');
    expect(getData()[0][1]).toEqual('Ted');
    expect(getSourceData()[0].name.first).toEqual('Ted');
  });

  it('should create new row from dataSchema when columns is a function', () => {
    handsontable({
      data: [],
      dataSchema: { id: null, name: { first: null, last: null }, address: null },
      minRows: 5,
      minCols: 4,
      colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
      columns(column) {
        let colMeta = {};

        if (column === 0) {
          colMeta.data = 'id';

        } else if (column === 1) {
          colMeta.data = 'name.first';

        } else if (column === 2) {
          colMeta.data = 'name.last';

        } else if (column === 3) {
          colMeta.data = 'address';

        } else {
          colMeta = null;
        }

        return colMeta;
      },
      minSpareRows: 1
    });
    selectCell(0, 1);

    keyDownUp('enter');
    keyProxy().val('Ted');
    keyDownUp('enter');
    expect(getData()[0][1]).toEqual('Ted');
    expect(getSourceData()[0].name.first).toEqual('Ted');
  });

  it('should create new row from dataSchema (functional)', () => {
    handsontable({
      data: [],
      dataSchema(index) {
        return { id: 1000 + index, name: { first: null, last: null }, address: null };
      },
      isEmptyRow(r) {
        const row = this.getSourceData()[r];

        return (row.name.first === null || row.name.first === '') &&
          (row.name.last === null || row.name.last === '') &&
          (row.address === null || row.address === '');
      },
      minRows: 5,
      minCols: 4,
      colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
      columns: [
        { data: 'id' },
        { data: 'name.first' },
        { data: 'name.last' },
        { data: 'address' }
      ],
      minSpareRows: 1
    });
    selectCell(4, 1);

    expect(countRows()).toEqual(5);
    keyDownUp('enter');
    keyProxy().val('Ted');

    // need it in next frame as long as HT is rendered in async
    keyDownUp('enter');
    // need it in next frame as long as HT is rendered in async
    keyDownUp('enter');

    expect(getSourceData()[4].name.first).toEqual('Ted');
    expect(getSourceData()[4].id).toEqual(1004);
    expect(getData()[4][1]).toEqual('Ted');
    expect(getData()[4][0]).toEqual(1004);
    expect(countRows()).toEqual(6); // row should be added by keepEmptyRows
  });

  it('should create new row from dataSchema (functional) when columns is a function', () => {
    handsontable({
      data: [],
      dataSchema(index) {
        return { id: 1000 + index, name: { first: null, last: null }, address: null };
      },
      isEmptyRow(r) {
        const row = this.getSourceData()[r];

        return (row.name.first === null || row.name.first === '') &&
          (row.name.last === null || row.name.last === '') &&
          (row.address === null || row.address === '');
      },
      minRows: 5,
      minCols: 4,
      colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
      columns(column) {
        let colMeta = {};

        if (column === 0) {
          colMeta.data = 'id';

        } else if (column === 1) {
          colMeta.data = 'name.first';

        } else if (column === 2) {
          colMeta.data = 'name.last';

        } else if (column === 3) {
          colMeta.data = 'address';

        } else {
          colMeta = null;
        }

        return colMeta;
      },
      minSpareRows: 1
    });
    selectCell(4, 1);

    expect(countRows()).toEqual(5);
    keyDownUp('enter');
    keyProxy().val('Ted');

    // need it in next frame as long as HT is rendered in async
    keyDownUp('enter');
    // need it in next frame as long as HT is rendered in async
    keyDownUp('enter');

    expect(getSourceData()[4].name.first).toEqual('Ted');
    expect(getSourceData()[4].id).toEqual(1004);
    expect(getData()[4][1]).toEqual('Ted');
    expect(getData()[4][0]).toEqual(1004);
    expect(countRows()).toEqual(6); // row should be added by keepEmptyRows
  });

  it('should translate prop to col, when prop is a function', () => {
    const idAccessor = createAccessorForProperty('id');
    const nameAccessor = createAccessorForProperty('name');

    const hot = handsontable({
      data: [
        Model({
          id: 1,
          name: 'Tom'
        }),
        Model({
          id: 2,
          name: 'Hanna'
        }),
        Model({
          id: 3,
          name: 'Jerry'
        })
      ],
      dataSchema: Model,
      columns: [
        {
          data: idAccessor
        },
        {
          data: nameAccessor
        }
      ]
    });

    expect(hot.propToCol(idAccessor)).toEqual(0);
    expect(hot.propToCol(nameAccessor)).toEqual(1);
  });

  it('should translate prop to col, when prop and columns is a function', () => {
    const idAccessor = createAccessorForProperty('id');
    const nameAccessor = createAccessorForProperty('name');

    const hot = handsontable({
      data: [
        Model({
          id: 1,
          name: 'Tom'
        }),
        Model({
          id: 2,
          name: 'Hanna'
        }),
        Model({
          id: 3,
          name: 'Jerry'
        })
      ],
      dataSchema: Model,
      columns(column) {
        let colMeta = {};

        if (column === 0) {
          colMeta.data = idAccessor;

        } else if (column === 1) {
          colMeta.data = nameAccessor;

        } else {
          colMeta = null;
        }

        return colMeta;
      }
    });

    expect(hot.propToCol(idAccessor)).toEqual(0);
    expect(hot.propToCol(nameAccessor)).toEqual(1);
  });

  it('should create new row data matched to dataSchema (data type as `array`)', () => {
    const spy = jasmine.createSpy();
    const hot = handsontable({
      data: [[{ id: 1 }]],
      dataSchema: [{ id: null }],
      columns: [
        { data: '0', renderer: spy }
      ],
      autoColumnSize: false,
      autoRowSize: false,
    });

    expect(spy.calls.count()).toBe(1);
    expect(spy.calls.argsFor(0)[5]).toEqual({ id: 1 });

    spy.calls.reset();
    hot.alter('insert_row', 0);

    expect(spy.calls.count()).toBe(2);
    expect(spy.calls.argsFor(0)[5]).toEqual({ id: null });
    expect(spy.calls.argsFor(1)[5]).toEqual({ id: 1 });
  });

  it('should create new row data matched to dataSchema (data type as `array`) when columns is a function', () => {
    const spy = jasmine.createSpy();
    const hot = handsontable({
      data: [[{ id: 1 }]],
      dataSchema: [{ id: null }],
      columns(column) {
        let colMeta = {};

        if (column === 0) {
          colMeta.data = '0';
          colMeta.renderer = spy;

        } else {
          colMeta = null;
        }

        return colMeta;
      },
      autoColumnSize: false,
      autoRowSize: false
    });

    expect(spy.calls.count()).toBe(1);
    expect(spy.calls.argsFor(0)[5]).toEqual({ id: 1 });

    spy.calls.reset();
    hot.alter('insert_row', 0);

    expect(spy.calls.count()).toBe(2);
    expect(spy.calls.argsFor(0)[5]).toEqual({ id: null });
    expect(spy.calls.argsFor(1)[5]).toEqual({ id: 1 });
  });

  it('should create an array of objects as the source structure, when dataSchema is defined (as an object) but no data is provided', () => {
    const hot = handsontable({
      startCols: 2,
      minSpareRows: 4,
      dataSchema: { id: null, name: null, surname: null },
    });

    const dataAtRow = hot.getSourceDataAtRow(0);

    expect(Array.isArray(dataAtRow)).toBe(false);
    expect(dataAtRow.id).toEqual(null);
    expect(dataAtRow.name).toEqual(null);
    expect(dataAtRow.surname).toEqual(null);
  });

  it('should create an array of objects as the source structure, when dataSchema is defined (as a function) but no data is provided', () => {
    const hot = handsontable({
      startCols: 2,
      minSpareRows: 4,
      dataSchema() {
        return { id: null, name: null, surname: null };
      },
    });

    const dataAtRow = hot.getSourceDataAtRow(0);

    expect(Array.isArray(dataAtRow)).toBe(false);
    expect(dataAtRow.id).toEqual(null);
    expect(dataAtRow.name).toEqual(null);
    expect(dataAtRow.surname).toEqual(null);
  });

  it('should create an array of objects as the source structure, when dataSchema is defined (as an array with an object) but no data is provided', () => {
    const hot = handsontable({
      startCols: 2,
      minSpareRows: 4,
      dataSchema: [{ id: null, name: null, surname: null }],
    });

    const dataAtRow = hot.getSourceDataAtRow(0);

    expect(Array.isArray(dataAtRow)).toBe(false);
    expect(dataAtRow.id).toEqual(null);
    expect(dataAtRow.name).toEqual(null);
    expect(dataAtRow.surname).toEqual(null);
  });

});
