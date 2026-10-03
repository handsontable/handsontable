import { RowIdSelection } from '../rowIdSelection';

describe('RowIdSelection', () => {
  it('should select and deselect rows by id', () => {
    const selection = new RowIdSelection();

    selection.set('a', true);
    selection.set(2, true);

    expect(selection.isSelected('a')).toBe(true);
    expect(selection.isSelected(2)).toBe(true);
    expect(selection.isSelected('2')).toBe(false);

    selection.set('a', false);

    expect(selection.isSelected('a')).toBe(false);
    expect(selection.export()).toEqual({ selectAll: false, toggledRowIds: [2] });
  });

  it('should keep deselected rows as exclusions after "select all"', () => {
    const selection = new RowIdSelection();

    selection.set('a', true);
    selection.setAll(true);

    // "Select all" starts from a clean exclusion list.
    expect(selection.export()).toEqual({ selectAll: true, toggledRowIds: [] });
    expect(selection.isSelected('never-loaded')).toBe(true);

    selection.set('b', false);

    expect(selection.isSelected('b')).toBe(false);
    expect(selection.export()).toEqual({ selectAll: true, toggledRowIds: ['b'] });

    selection.set('b', true);

    expect(selection.export()).toEqual({ selectAll: true, toggledRowIds: [] });
  });

  it('should summarize against the number of rows matching the query', () => {
    const selection = new RowIdSelection();

    expect(selection.summarize(0)).toEqual({ state: 'disabled', selected: 0, total: 0 });
    expect(selection.summarize(25)).toEqual({ state: 'unchecked', selected: 0, total: 25 });

    selection.set(1, true);

    expect(selection.summarize(25)).toEqual({ state: 'mixed', selected: 1, total: 25 });

    selection.setAll(true);

    expect(selection.summarize(25)).toEqual({ state: 'checked', selected: 25, total: 25 });

    selection.set(3, false);
    selection.set(4, false);

    expect(selection.summarize(25)).toEqual({ state: 'mixed', selected: 23, total: 25 });
  });

  it('should never count more selected rows than there are, or fewer than none', () => {
    const selection = new RowIdSelection();

    selection.set(1, true);
    selection.set(2, true);
    selection.set(3, true);

    // The server now matches fewer rows than the ids kept (a filter changed).
    expect(selection.summarize(2)).toEqual({ state: 'checked', selected: 2, total: 2 });

    selection.setAll(true);
    selection.set(1, false);
    selection.set(2, false);
    selection.set(3, false);

    expect(selection.summarize(2)).toEqual({ state: 'unchecked', selected: 0, total: 2 });
  });

  it('should round-trip through export and import', () => {
    const selection = new RowIdSelection();

    selection.import({ selectAll: true, toggledRowIds: ['x', 'y'] });

    expect(selection.isSelected('x')).toBe(false);
    expect(selection.isSelected('z')).toBe(true);
    expect(selection.export()).toEqual({ selectAll: true, toggledRowIds: ['x', 'y'] });
    expect(selection.isEmpty()).toBe(false);

    selection.setAll(false);

    expect(selection.isEmpty()).toBe(true);
  });
});
