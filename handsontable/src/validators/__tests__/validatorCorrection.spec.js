describe('Validator correction via setDataAtCell', () => {
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

  it('should preserve value corrected by a custom validator when batch-setting data alongside cells with async validators', async() => {
    // Custom validator that normalises values to uppercase. It follows the convention of
    // passing a source name ending in 'Validator' to setDataAtCell so that validateChanges()
    // captures the correction and does not overwrite it when the deferred applyChanges() runs
    // after async validators (e.g. autocomplete with setTimeout source) resolve.
    const uppercaseValidator = function(value, callback) {
      if (typeof value === 'string' && value !== value.toUpperCase()) {
        this.instance.setDataAtCell(this.visualRow, this.visualCol, value.toUpperCase(), 'uppercaseValidator');
      }

      callback(true);
    };

    handsontable({
      data: [
        ['hello', '1'],
        ['world', '1'],
        ['foo', ''],
      ],
      columns: [
        { validator: uppercaseValidator },
        {
          type: 'autocomplete',
          allowInvalid: false,
          strict: true,
          source: (query, callback) => {
            setTimeout(() => {
              callback(['1', '2', '3']);
            }, 100);
          }
        },
      ],
    });

    await setDataAtCell([
      [0, 0, 'hello'],
      [0, 1, '1'],
      [1, 0, 'world'],
      [1, 1, '1'],
      [2, 0, 'foo'],
      [2, 1, ''],
    ]);

    await sleep(300);

    expect(getDataAtCell(0, 0)).toEqual('HELLO');
    expect(getDataAtCell(1, 0)).toEqual('WORLD');
    expect(getDataAtCell(2, 0)).toEqual('FOO');
  });

  it('should apply a correction written with a source that does not end with "Validator" as a write of its own', async() => {
    // When the source does not follow the 'Validator' suffix convention, validateChanges()
    // does not fold the correction into the change that triggered it. The correction is a write
    // made after that change, so it wins and the triggering change is dropped.
    const lowercaseCorrector = function(value, callback) {
      if (typeof value === 'string' && value !== value.toLowerCase()) {
        this.instance.setDataAtCell(this.visualRow, this.visualCol, value.toLowerCase(), 'lowercaseCorrector');
      }

      callback(true);
    };

    handsontable({
      data: [
        ['HELLO', '1'],
        ['WORLD', '1'],
      ],
      columns: [
        { validator: lowercaseCorrector },
        {
          type: 'autocomplete',
          allowInvalid: false,
          strict: true,
          source: (query, callback) => {
            setTimeout(() => {
              callback(['1', '2', '3']);
            }, 100);
          }
        },
      ],
    });

    await setDataAtCell([
      [0, 0, 'HELLO'],
      [0, 1, '1'],
      [1, 0, 'WORLD'],
      [1, 1, '1'],
    ]);

    await sleep(300);

    // The correction is the last write made to the cell, so it is not overwritten when the
    // batch drains after the async validators.
    expect(getDataAtCell(0, 0)).toEqual('hello');
    expect(getDataAtCell(1, 0)).toEqual('world');
  });
});
