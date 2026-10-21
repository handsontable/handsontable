import { SelectionScanCache } from '../../../src/selection/scanCache';

describe('SelectionScanCache', () => {
  const selection = {} as never;
  const wot = {} as never;
  const scan = { cells: new Map() };

  it('should return a stored scan for the same key only', () => {
    const cache = new SelectionScanCache();

    cache.set(selection, wot, 'k1', scan);

    expect(cache.get(selection, wot, 'k1')).toBe(scan);
    expect(cache.get(selection, wot, 'k2')).toBeUndefined();
    expect(cache.get({} as never, wot, 'k1')).toBeUndefined();
  });

  it('should forget a layer on delete', () => {
    const cache = new SelectionScanCache();

    cache.set(selection, wot, 'k1', scan);
    cache.delete(selection);

    expect(cache.get(selection, wot, 'k1')).toBeUndefined();
  });
});
