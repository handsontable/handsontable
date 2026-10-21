import {
  subtractReservedHeight,
  MIN_RESERVED_LAYOUT_HEIGHT,
} from 'walkontable/viewport/layoutReservation';

/**
 * Both engine sizing paths (`measureWorkspaceHeight` and the master table's holder height) hand
 * the table what is left of the axis owner's box after the host's layout slots, through this one
 * helper, so they cannot floor differently once a bar is taller than the box (DEV-2848).
 */
describe('subtractReservedHeight', () => {
  it('should hand the table the owner box minus the reservation', () => {
    expect(subtractReservedHeight(300, 38)).toBe(262);
  });

  it('should leave the box alone when nothing is reserved', () => {
    expect(subtractReservedHeight(300, 0)).toBe(300);
    // Including a box with no defined size: `0` is the master table's "no defined size" signal.
    expect(subtractReservedHeight(0, 0)).toBe(0);
  });

  it('should leave a zero-height owner at zero even with a reservation', () => {
    // A slot cannot take room from a box that has none, and flooring it to 1px would turn "no
    // defined size" into a 1px table (`hasDefinedSize()` and the `#3119` fallback both read the 0).
    expect(subtractReservedHeight(0, 38)).toBe(0);
  });

  it('should floor at one pixel, never at zero', () => {
    // At zero the holder collapses and `hasTableHeight` reads false, which stops the overlays
    // repositioning: a container briefly shorter than its bar would blank the grid.
    expect(MIN_RESERVED_LAYOUT_HEIGHT).toBe(1);
    expect(subtractReservedHeight(30, 38)).toBe(1);
    expect(subtractReservedHeight(38, 38)).toBe(1);
  });
});
