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

  it('should call the `selectRows` method of the Selection module internally', () => {
    const hot = handsontable({
      data: createSpreadsheetObjectData(5, 5),
    });

    spyOn(hot.selection, 'selectRows').and.returnValue('return value');

    expect(selectRows()).toBe('return value');
    expect(hot.selection.selectRows).toHaveBeenCalledWith(undefined, undefined, undefined);
    expect(hot.selection.selectRows).toHaveBeenCalledTimes(1);

    hot.selection.selectRows.calls.reset();

    expect(selectRows(4)).toBe('return value');
    expect(hot.selection.selectRows).toHaveBeenCalledWith(4, 4, undefined);
    expect(hot.selection.selectRows).toHaveBeenCalledTimes(1);

    hot.selection.selectRows.calls.reset();

    expect(selectRows(2, 3)).toBe('return value');
    expect(hot.selection.selectRows).toHaveBeenCalledWith(2, 3, undefined);
    expect(hot.selection.selectRows).toHaveBeenCalledTimes(1);

    hot.selection.selectRows.calls.reset();

    expect(selectRows(2, 3, -1)).toBe('return value');
    expect(hot.selection.selectRows).toHaveBeenCalledWith(2, 3, -1);
    expect(hot.selection.selectRows).toHaveBeenCalledTimes(1);

    hot.selection.selectRows.calls.reset();

    expect(selectRows(2, 3, -1, 1)).toBe('return value');
    expect(hot.selection.selectRows).toHaveBeenCalledWith(2, 3, -1);
    expect(hot.selection.selectRows).toHaveBeenCalledTimes(1);
  });
});
