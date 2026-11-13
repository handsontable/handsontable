import type { StampedMeta } from '../waitingMetaStamps';
import { createWaitingMetaStamps } from '../waitingMetaStamps';
import type { TrackedRecord } from '../recordTracker';

/**
 * Creates the stamps on an index mapper stub that accepts every hook.
 *
 * @returns {object}
 */
function createStamps() {
  const mapper = { addLocalHook: jest.fn(), removeLocalHook: jest.fn() };

  return createWaitingMetaStamps<StampedMeta>(() => mapper, () => null);
}

describe('waitingMetaStamps', () => {
  describe('findUnplaced()', () => {
    it('should find the shared meta while another call that held it is released', () => {
      const stamps = createStamps();
      const record: TrackedRecord = { id: 1, physicalRow: 4 };
      const meta: StampedMeta = { row: 4, visualRow: null, prop: 2 };
      const releaseFirst = stamps.add(record, meta);

      stamps.add(record, meta);
      releaseFirst();

      expect(stamps.findUnplaced(2, null)).toEqual({ record, meta });
    });

    it('should not find a released meta once no call holds it', () => {
      const stamps = createStamps();
      const record: TrackedRecord = { id: 1, physicalRow: 4 };
      const meta: StampedMeta = { row: 4, visualRow: null, prop: 2 };
      const release = stamps.add(record, meta);
      const otherRecord: TrackedRecord = { id: 2, physicalRow: 5 };
      const otherMeta: StampedMeta = { row: 5, visualRow: null, prop: 2 };

      stamps.add(otherRecord, otherMeta);
      release();

      expect(stamps.findUnplaced(2, null)).toBeNull();
    });
  });
});
