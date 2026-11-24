import {
  hasCellChangedSinceAnnounced,
  readCellAnnouncementSignature,
  rebuildAccessibilityObject,
  rememberAnnouncedCell,
} from '../a11y';

/**
 * Builds a gridcell TD.
 *
 * @param {string} html The inner HTML.
 * @returns {HTMLTableCellElement}
 */
function createCell(html = ''): HTMLTableCellElement {
  const TD = document.createElement('td');

  TD.setAttribute('role', 'gridcell');
  TD.innerHTML = html;

  return TD;
}

describe('rebuildAccessibilityObject', () => {
  it('removes the role and writes the same one back, so the browser builds a new accessibility object', () => {
    const TD = createCell();
    const observer = new MutationObserver(() => {});

    observer.observe(TD, { attributes: true, attributeFilter: ['role'] });
    rebuildAccessibilityObject(TD);

    // Both writes land as separate attribute mutations on the element.
    expect(observer.takeRecords().map(record => record.attributeName)).toEqual(['role', 'role']);
    expect(TD.getAttribute('role')).toBe('gridcell');
    observer.disconnect();
  });

  it('keeps a role a renderer chose, not the gridcell default', () => {
    const TD = createCell();

    TD.setAttribute('role', 'checkbox');
    rebuildAccessibilityObject(TD);

    expect(TD.getAttribute('role')).toBe('checkbox');
  });

  it('writes nothing for an element with no role (ariaTags: false)', () => {
    const TD = document.createElement('td');
    const observer = new MutationObserver(() => {});

    observer.observe(TD, { attributes: true });
    rebuildAccessibilityObject(TD);

    expect(observer.takeRecords()).toEqual([]);
    expect(TD.hasAttribute('role')).toBe(false);
    observer.disconnect();
  });
});

describe('readCellAnnouncementSignature', () => {
  it('is the same for a cell that shows the same thing at the same coordinates', () => {
    expect(readCellAnnouncementSignature(createCell('a')))
      .toBe(readCellAnnouncementSignature(createCell('a')));
  });

  it('changes with the text and with the column the cell sits in', () => {
    const base = createCell('a');

    base.setAttribute('aria-colindex', '2');

    const moved = createCell('a');

    moved.setAttribute('aria-colindex', '4');

    expect(readCellAnnouncementSignature(createCell('b'))).not.toBe(readCellAnnouncementSignature(createCell('a')));
    expect(readCellAnnouncementSignature(moved)).not.toBe(readCellAnnouncementSignature(base));
  });

  it('changes with the checked state of a checkbox, which is a property and not markup', () => {
    const TD = createCell('<input type="checkbox">');
    const unchecked = readCellAnnouncementSignature(TD);

    (TD.firstChild as HTMLInputElement).checked = true;

    expect(readCellAnnouncementSignature(TD)).not.toBe(unchecked);
  });

  it('changes with the value of a text field inside the cell', () => {
    const TD = createCell('<input type="text">');
    const empty = readCellAnnouncementSignature(TD);

    (TD.firstChild as HTMLInputElement).value = 'typed';

    expect(readCellAnnouncementSignature(TD)).not.toBe(empty);
  });

  it('changes with an ARIA state the renderer sets, such as aria-checked', () => {
    const TD = createCell('x');
    const before = readCellAnnouncementSignature(TD);

    TD.setAttribute('aria-checked', 'true');

    expect(readCellAnnouncementSignature(TD)).not.toBe(before);
  });

  it('ignores aria-selected, which the selection writes and which is not a change of the cell', () => {
    const TD = createCell('x');
    const before = readCellAnnouncementSignature(TD);

    TD.setAttribute('aria-selected', 'true');

    expect(readCellAnnouncementSignature(TD)).toBe(before);
  });

  it('does not depend on the order the attributes were written in', () => {
    const first = createCell('x');
    const second = createCell('x');

    first.setAttribute('aria-checked', 'true');
    first.setAttribute('aria-readonly', 'true');
    second.setAttribute('aria-readonly', 'true');
    second.setAttribute('aria-checked', 'true');

    expect(readCellAnnouncementSignature(first)).toBe(readCellAnnouncementSignature(second));
  });
});

describe('hasCellChangedSinceAnnounced', () => {
  it('does not report a cell it has no record of, and records it', () => {
    const TD = createCell('a');

    expect(hasCellChangedSinceAnnounced(TD, 1, 1)).toBe(false);

    TD.innerHTML = 'b';

    expect(hasCellChangedSinceAnnounced(TD, 1, 1)).toBe(true);
  });

  it('reports a change of what the cell shows since the cell took the focus', () => {
    const TD = createCell('a');

    rememberAnnouncedCell(TD, 1, 1);
    TD.innerHTML = 'b';

    expect(hasCellChangedSinceAnnounced(TD, 1, 1)).toBe(true);
  });

  it('reports a checkbox that was toggled before the paint', () => {
    const TD = createCell('<input type="checkbox">');

    rememberAnnouncedCell(TD, 1, 1);
    (TD.firstChild as HTMLInputElement).checked = true;

    expect(hasCellChangedSinceAnnounced(TD, 1, 1)).toBe(true);
  });

  it('reports the same element drawn for another row or column, which is what a jump to a new row does', () => {
    const TD = createCell('a');

    rememberAnnouncedCell(TD, 1, 1);

    expect(hasCellChangedSinceAnnounced(TD, 199, 1)).toBe(true);

    expect(hasCellChangedSinceAnnounced(TD, 199, 3)).toBe(true);
  });

  it('reports a change once: the next paint of the same state is quiet', () => {
    const TD = createCell('a');

    rememberAnnouncedCell(TD, 1, 1);
    TD.innerHTML = 'b';
    hasCellChangedSinceAnnounced(TD, 1, 1);

    expect(hasCellChangedSinceAnnounced(TD, 1, 1)).toBe(false);
  });

  it('stays quiet for a cell that shows the same thing in the same place', () => {
    const TD = createCell('a');

    rememberAnnouncedCell(TD, 1, 1);

    expect(hasCellChangedSinceAnnounced(TD, 1, 1)).toBe(false);
  });

  it('keeps one cell: the focus moving to another element replaces the record', () => {
    const first = createCell('a');
    const second = createCell('b');

    rememberAnnouncedCell(first, 1, 1);
    rememberAnnouncedCell(second, 2, 2);
    first.innerHTML = 'changed';

    expect(hasCellChangedSinceAnnounced(first, 1, 1)).toBe(false);
  });

  it('keeps the record of the same element when asked to', () => {
    const TD = createCell('a');

    rememberAnnouncedCell(TD, 1, 1);
    TD.innerHTML = 'b';
    rememberAnnouncedCell(TD, 1, 1, true);

    expect(hasCellChangedSinceAnnounced(TD, 1, 1)).toBe(true);
  });
});
