import { isSameCellPaint, readCellPaintStamp, writeCellPaintStamp } from '../cellPaintStamps';

function stamp(overrides = {}) {
  return {
    renderedRow: 1,
    renderedColumn: 2,
    visualRow: 1,
    visualColumn: 2,
    band: 'master,0,20,0,10',
    epoch: 0,
    version: 0,
    value: 'A1',
    renderer: () => {},
    ...overrides,
  };
}

describe('cell paint stamps', () => {
  it('should read `undefined` for an element that was never stamped', () => {
    expect(readCellPaintStamp(document.createElement('td'))).toBeUndefined();
  });

  it('should read back what was written, per element', () => {
    const first = document.createElement('td');
    const second = document.createElement('td');
    const firstStamp = stamp();

    writeCellPaintStamp(first, firstStamp);

    expect(readCellPaintStamp(first)).toBe(firstStamp);
    expect(readCellPaintStamp(second)).toBeUndefined();
  });

  it('should treat a missing previous stamp as a different paint', () => {
    expect(isSameCellPaint(undefined, stamp())).toBe(false);
  });

  it('should treat identical stamps as the same paint', () => {
    const renderer = () => {};

    expect(isSameCellPaint(stamp({ renderer }), stamp({ renderer }))).toBe(true);
  });

  it.each([
    ['renderedRow', { renderedRow: 5 }],
    ['renderedColumn', { renderedColumn: 5 }],
    ['visualRow', { visualRow: 5 }],
    ['visualColumn', { visualColumn: 5 }],
    ['band', { band: 'master,3,20,0,10' }],
    ['epoch', { epoch: 1 }],
    ['version', { version: 1 }],
    ['value', { value: 'B1' }],
    ['renderer', { renderer: () => {} }],
  ])('should treat a changed `%s` as a different paint', (_, change) => {
    const renderer = () => {};

    expect(isSameCellPaint(stamp({ renderer }), stamp({ renderer, ...change }))).toBe(false);
  });

  it('should compare values by identity, so an object mutated in place reads as unchanged', () => {
    const value = { checked: false };
    const renderer = () => {};
    const previous = stamp({ value, renderer });

    value.checked = true;

    expect(isSameCellPaint(previous, stamp({ value, renderer }))).toBe(true);
  });
});
