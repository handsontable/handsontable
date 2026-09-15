import {
  getSpreaderOffset,
  setSpreaderOffset,
  applySpreaderTransform,
  clearSpreaderTransform,
} from '../../../src/overlay/spreaderOffset';

describe('spreaderOffset', () => {
  let spreader: HTMLElement;

  beforeEach(() => {
    spreader = document.createElement('div');
  });

  it('should report a zero offset and no transform for an untouched element', () => {
    expect(getSpreaderOffset(spreader)).toEqual({ x: 0, y: 0 });
    expect(spreader.style.transform).toBe('');
  });

  it('should write the offset as a transform, never as an inset', () => {
    setSpreaderOffset(spreader, 'y', 754);

    expect(spreader.style.transform).toBe('translate(0px, 754px)');
    expect(spreader.style.top).toBe('');
    expect(spreader.style.left).toBe('');
  });

  it('should keep the other axis when one axis is written', () => {
    // The two axes are written by different overlays (top owns `y`, inline-start owns `x`), so a
    // write to one must not reset the other.
    setSpreaderOffset(spreader, 'y', 754);
    setSpreaderOffset(spreader, 'x', 320);

    expect(getSpreaderOffset(spreader)).toEqual({ x: 320, y: 754 });
    expect(spreader.style.transform).toBe('translate(320px, 754px)');

    setSpreaderOffset(spreader, 'y', 1566);

    expect(getSpreaderOffset(spreader)).toEqual({ x: 320, y: 1566 });
    expect(spreader.style.transform).toBe('translate(320px, 1566px)');
  });

  it('should accept a negative horizontal offset (RTL moves away from the right edge)', () => {
    setSpreaderOffset(spreader, 'x', -120);

    expect(getSpreaderOffset(spreader)).toEqual({ x: -120, y: 0 });
    expect(spreader.style.transform).toBe('translate(-120px, 0px)');
  });

  it('should clear the transform when both axes return to zero', () => {
    setSpreaderOffset(spreader, 'y', 754);
    setSpreaderOffset(spreader, 'y', 0);

    expect(spreader.style.transform).toBe('');
    expect(getSpreaderOffset(spreader)).toEqual({ x: 0, y: 0 });
  });

  it('should not touch the element when the value is unchanged', () => {
    // The master's `y` is written by the top AND the bottom overlay on every draw, same value.
    setSpreaderOffset(spreader, 'y', 754);
    spreader.style.transform = 'translate(1px, 1px)';

    setSpreaderOffset(spreader, 'y', 754);

    expect(spreader.style.transform).toBe('translate(1px, 1px)');
  });

  it('should only record the offset while the write is suspended', () => {
    // During a native scrollbar drag the sticky-scroll strategy owns the element's position.
    setSpreaderOffset(spreader, 'y', 754, true);

    expect(spreader.style.transform).toBe('');

    applySpreaderTransform(spreader);

    expect(spreader.style.transform).toBe('translate(0px, 754px)');
    expect(getSpreaderOffset(spreader)).toEqual({ x: 0, y: 754 });
  });

  it('should report zero while the transform is lifted, and the recorded offset again once re-applied', () => {
    // Lifted means the insets position the element, which the offset chain sees by itself - so a
    // reader adding this offset on top would count it twice.
    setSpreaderOffset(spreader, 'y', 754);
    clearSpreaderTransform(spreader);

    expect(spreader.style.transform).toBe('');
    expect(getSpreaderOffset(spreader)).toEqual({ x: 0, y: 0 });

    // A write made while lifted still lands in the record.
    setSpreaderOffset(spreader, 'y', 1566, true);

    expect(spreader.style.transform).toBe('');
    expect(getSpreaderOffset(spreader)).toEqual({ x: 0, y: 0 });

    applySpreaderTransform(spreader);

    expect(spreader.style.transform).toBe('translate(0px, 1566px)');
    expect(getSpreaderOffset(spreader)).toEqual({ x: 0, y: 1566 });
  });

  it('should hand out a copy of the record, not the record itself', () => {
    setSpreaderOffset(spreader, 'y', 754);

    const offset = getSpreaderOffset(spreader);

    offset.y = 1;

    expect(getSpreaderOffset(spreader)).toEqual({ x: 0, y: 754 });
  });

  it('should track each element separately', () => {
    const other = document.createElement('div');

    setSpreaderOffset(spreader, 'y', 754);
    setSpreaderOffset(other, 'x', 40);

    expect(getSpreaderOffset(spreader)).toEqual({ x: 0, y: 754 });
    expect(getSpreaderOffset(other)).toEqual({ x: 40, y: 0 });
  });
});
