import { resolveWheelDeltas } from '../../../src/overlay/scroll/nativeScrollInput';

/**
 * Builds a wheel event with the given deltas and modifier state.
 *
 * @param {object} init The wheel event init dictionary.
 * @returns {WheelEvent}
 */
function wheel(init: WheelEventInit): WheelEvent {
  return new WheelEvent('wheel', init);
}

describe('resolveWheelDeltas', () => {
  it('should keep a plain vertical wheel vertical', () => {
    expect(resolveWheelDeltas(wheel({ deltaY: 100 }), 20)).toEqual({ deltaX: 0, deltaY: 100 });
  });

  it('should keep a plain horizontal wheel horizontal', () => {
    expect(resolveWheelDeltas(wheel({ deltaX: 100 }), 20)).toEqual({ deltaX: 100, deltaY: 0 });
  });

  it('should turn a vertical wheel into a horizontal one while Shift is held', () => {
    expect(resolveWheelDeltas(wheel({ deltaY: 100, shiftKey: true }), 20)).toEqual({ deltaX: 100, deltaY: 0 });
    expect(resolveWheelDeltas(wheel({ deltaY: -40, shiftKey: true }), 20)).toEqual({ deltaX: -40, deltaY: 0 });
  });

  it('should not swap again when the browser already moved the delta to the horizontal axis', () => {
    expect(resolveWheelDeltas(wheel({ deltaX: 100, shiftKey: true }), 20)).toEqual({ deltaX: 100, deltaY: 0 });
  });

  it('should report no scroll for an empty wheel while Shift is held', () => {
    expect(resolveWheelDeltas(wheel({ shiftKey: true }), 20)).toEqual({ deltaX: 0, deltaY: 0 });
  });

  it('should leave a diagonal wheel alone while Shift is held', () => {
    expect(resolveWheelDeltas(wheel({ deltaX: 30, deltaY: 100, shiftKey: true }), 20))
      .toEqual({ deltaX: 30, deltaY: 100 });
  });

  it('should convert a line-mode delta before it swaps the axes', () => {
    expect(resolveWheelDeltas(wheel({ deltaY: 3, deltaMode: 1, shiftKey: true }), 20))
      .toEqual({ deltaX: 3 + (3 * 20), deltaY: 0 });
  });

  it('should read the legacy delta of an event that reports none before it swaps the axes', () => {
    const legacy = { deltaX: NaN, deltaY: NaN, wheelDeltaX: 0, wheelDeltaY: -100, deltaMode: 0, shiftKey: true };

    expect(resolveWheelDeltas(legacy as unknown as WheelEvent, 20)).toEqual({ deltaX: 100, deltaY: 0 });
  });
});
