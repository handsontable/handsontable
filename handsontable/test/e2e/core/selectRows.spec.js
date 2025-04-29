describe('Core.selectRows', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call the `selectRows` method of the Selection module internally', async() => {
    handsontable({
      data: createSpreadsheetObjectData(5, 5),
    });

    spyOn(selection(), 'selectRows').and.returnValue('return value');

    expect(await selectRows()).toBe('return value');
    expect(selection().selectRows).toHaveBeenCalledWith(undefined, undefined, undefined);
    expect(selection().selectRows).toHaveBeenCalledTimes(1);

    selection().selectRows.calls.reset();

    expect(await selectRows(4)).toBe('return value');
    expect(selection().selectRows).toHaveBeenCalledWith(4, 4, undefined);
    expect(selection().selectRows).toHaveBeenCalledTimes(1);

    selection().selectRows.calls.reset();

    expect(await selectRows(2, 3)).toBe('return value');
    expect(selection().selectRows).toHaveBeenCalledWith(2, 3, undefined);
    expect(selection().selectRows).toHaveBeenCalledTimes(1);

    selection().selectRows.calls.reset();

    expect(await selectRows(2, 3, -1)).toBe('return value');
    expect(selection().selectRows).toHaveBeenCalledWith(2, 3, -1);
    expect(selection().selectRows).toHaveBeenCalledTimes(1);

    selection().selectRows.calls.reset();

    expect(await selectRows(2, 3, -1, 1)).toBe('return value');
    expect(selection().selectRows).toHaveBeenCalledWith(2, 3, -1);
    expect(selection().selectRows).toHaveBeenCalledTimes(1);
  });
});
