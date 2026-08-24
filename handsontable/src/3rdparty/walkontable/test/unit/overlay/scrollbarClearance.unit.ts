import {
  applyOverlayScrollbarClearance,
  clearanceClipPath,
  insetCssSize,
  isPointInScrollbarBand,
  overlayScrollbarClearance,
  reservedScrollbarSpace,
  syncScrollbarTrackBands,
  toggleScrollbarClearance,
} from '../../../src/overlay/scrollbarClearance';
import {
  OVERLAY_SCROLLBAR_CLEARANCE,
  OVERLAY_SCROLLBAR_CLEARANCE_CLASS,
  OVERLAY_SCROLLBAR_FILLER_CLASS,
  OVERLAY_SCROLLBAR_FILLER_HOST_CLASS,
  OVERLAY_SCROLLBAR_FILLER_OPEN_CLASS,
} from '../../../src/overlay/constants';

describe('overlay scrollbar clearance', () => {
  describe('reservedScrollbarSpace', () => {
    const reader = (box: { ow: number; cw: number; oh: number; ch: number }) => ({
      offsetWidth: () => box.ow,
      clientWidth: () => box.cw,
      offsetHeight: () => box.oh,
      clientHeight: () => box.ch,
    }) as never;
    const holder = {} as HTMLElement;

    it('should report a vertical scrollbar as lost width', () => {
      expect(reservedScrollbarSpace(reader({ ow: 700, cw: 685, oh: 340, ch: 340 }), holder, 'vertical'))
        .toBe(15);
    });

    it('should report a horizontal scrollbar as lost height', () => {
      expect(reservedScrollbarSpace(reader({ ow: 700, cw: 700, oh: 340, ch: 325 }), holder, 'horizontal'))
        .toBe(15);
    });

    it('should report nothing for an overlay scrollbar, which takes no space on either axis', () => {
      const r = reader({ ow: 700, cw: 700, oh: 340, ch: 340 });

      expect(reservedScrollbarSpace(r, holder, 'vertical')).toBe(0);
      expect(reservedScrollbarSpace(r, holder, 'horizontal')).toBe(0);
    });

    it('should not read one axis\'s gutter off the other', () => {
      // A horizontal scrollbar must not make the vertical band think it has a gutter.
      const r = reader({ ow: 700, cw: 700, oh: 340, ch: 325 });

      expect(reservedScrollbarSpace(r, holder, 'vertical')).toBe(0);
    });

    it('should never report a negative gutter', () => {
      expect(reservedScrollbarSpace(reader({ ow: 100, cw: 120, oh: 100, ch: 100 }), holder, 'vertical'))
        .toBe(0);
    });

    it('should report nothing when there is no holder yet', () => {
      expect(reservedScrollbarSpace(reader({ ow: 700, cw: 685, oh: 340, ch: 340 }), null as never, 'vertical'))
        .toBe(0);
    });
  });

  describe('overlayScrollbarClearance', () => {
    it('should reserve a band when the scrollbar takes no layout space', () => {
      expect(overlayScrollbarClearance(0, true)).toBe(OVERLAY_SCROLLBAR_CLEARANCE);
    });

    it('should reserve nothing when the axis does not scroll', () => {
      expect(overlayScrollbarClearance(0, false)).toBe(0);
    });

    it('should reserve nothing when the scrollbar has real width', () => {
      // A real gutter means the browser already shrank the holder; the classic path handles it.
      expect(overlayScrollbarClearance(15, true)).toBe(0);
    });

    it('should reserve nothing when the holder itself reserves space, whatever the probe says', () => {
      // The reported Firefox case: the synthetic probe the gate measures says the engine gives
      // scrollbars no space, but THIS scroller has a real gutter with a real scrollbar in it. Drawing
      // a strip beside that is a second scrollbar, which is what the user sees.
      expect(overlayScrollbarClearance(0, true, 15)).toBe(0);
    });

    it('should still reserve a band when neither the probe nor the holder gives space', () => {
      expect(overlayScrollbarClearance(0, true, 0)).toBe(OVERLAY_SCROLLBAR_CLEARANCE);
    });

    it('should not depend on the engine, since every engine stacks the clones above the master', () => {
      // Firefox everywhere, Chrome/Safari on macOS set to "Automatically", Chrome on Windows 11 and
      // GTK all report 0 and all paint the scrollbar under the clones (#10370).
      expect(overlayScrollbarClearance(0, true)).toBe(OVERLAY_SCROLLBAR_CLEARANCE);
    });

    it('should treat a fractional measured width as a real scrollbar', () => {
      // Fractional browser zoom can report e.g. 14.4; that is still a space-taking scrollbar.
      expect(overlayScrollbarClearance(14.4, true)).toBe(0);
    });
  });

  describe('insetCssSize', () => {
    it('should subtract the clearance and keep the unit', () => {
      expect(insetCssSize('340px', 12)).toBe('328px');
    });

    it('should keep sub-pixel sizes', () => {
      expect(insetCssSize('324.5px', 12)).toBe('312.5px');
    });

    it('should return the size untouched when there is no clearance', () => {
      expect(insetCssSize('340px', 0)).toBe('340px');
    });

    it('should leave an empty size empty, so automatic sizing is preserved', () => {
      expect(insetCssSize('', 12)).toBe('');
    });

    it('should never return a negative size', () => {
      expect(insetCssSize('8px', 12)).toBe('0px');
    });
  });

  describe('clearanceClipPath', () => {
    it('should clip the bottom band away', () => {
      expect(clearanceClipPath({ bottom: 12 })).toBe('inset(0px 0px 12px 0px)');
    });

    it('should clip the inline-end band off the right in LTR', () => {
      expect(clearanceClipPath({ inlineEnd: 12 })).toBe('inset(0px 12px 0px 0px)');
    });

    it('should clip the inline-end band off the left in RTL', () => {
      // `inset()` takes physical sides, so this is the one place direction has to be resolved.
      expect(clearanceClipPath({ inlineEnd: 12, rtl: true })).toBe('inset(0px 0px 0px 12px)');
    });

    it('should clip both bands at once', () => {
      expect(clearanceClipPath({ bottom: 12, inlineEnd: 12 })).toBe('inset(0px 12px 12px 0px)');
    });

    it('should keep the shape with zeroed sides while closed', () => {
      // The property then only ever changes value, never switches to and from `none`.
      expect(clearanceClipPath({ bottom: 12, inlineEnd: 12 }, { bottom: false, inlineEnd: false }))
        .toBe('inset(0px 0px 0px 0px)');
    });

    it('should emit no shape at all when this overlay never needs clipping', () => {
      expect(clearanceClipPath({})).toBe('');
      expect(clearanceClipPath({ bottom: 0, inlineEnd: 0 })).toBe('');
      expect(clearanceClipPath({ bottom: 0, inlineEnd: 0 }, { bottom: false, inlineEnd: false })).toBe('');
    });
  });

  describe('applyOverlayScrollbarClearance', () => {
    const buildOverlay = () => {
      const overlayRoot = document.createElement('div');

      overlayRoot.className = 'ht_clone_inline_start ht_clone_left';

      return overlayRoot;
    };

    it('should stamp the class for the regime, not for the open state', () => {
      const overlayRoot = buildOverlay();

      // Closed, but still in the overlay-scrollbar regime: the class has to be on already or the
      // transition would not be in place for the first open.
      applyOverlayScrollbarClearance(overlayRoot, { bottom: 12 }, { bottom: false, inlineEnd: false });
      expect(overlayRoot.classList.contains(OVERLAY_SCROLLBAR_CLEARANCE_CLASS)).toBe(true);

      applyOverlayScrollbarClearance(overlayRoot, {});
      expect(overlayRoot.classList.contains(OVERLAY_SCROLLBAR_CLEARANCE_CLASS)).toBe(false);
    });

    it('should clip the band open when the scrollbar is showing', () => {
      const overlayRoot = buildOverlay();

      applyOverlayScrollbarClearance(overlayRoot, { bottom: 12 }, { bottom: true, inlineEnd: true });

      expect(overlayRoot.style.clipPath).toBe('inset(0px 0px 12px 0px)');
    });

    it('should zero the clip while the scrollbar is hidden, leaving no gap', () => {
      const overlayRoot = buildOverlay();

      applyOverlayScrollbarClearance(overlayRoot, { bottom: 12 }, { bottom: false, inlineEnd: false });

      expect(overlayRoot.style.clipPath).toBe('inset(0px 0px 0px 0px)');
    });

    it('should drop the clip entirely outside the overlay-scrollbar regime', () => {
      const overlayRoot = buildOverlay();

      applyOverlayScrollbarClearance(overlayRoot, { bottom: 12 }, { bottom: true, inlineEnd: true });
      applyOverlayScrollbarClearance(overlayRoot, {});

      expect(overlayRoot.style.clipPath).toBe('');
    });
  });

  describe('syncScrollbarTrackBands', () => {
    const buildHolder = () => {
      const holder = document.createElement('div');

      holder.className = 'wtHolder';

      const hider = document.createElement('div');

      holder.appendChild(hider);

      return holder;
    };
    const bands = (holder: HTMLElement) => Array.from(
      holder.querySelectorAll(`.${OVERLAY_SCROLLBAR_FILLER_CLASS}`)
    ).map(el => ({
      edge: el.getAttribute('data-ht-clearance-edge'),
      blockStart: (el as HTMLElement).style.insetBlockStart,
      inlineStart: (el as HTMLElement).style.insetInlineStart,
      blockSize: (el as HTMLElement).style.blockSize,
      inlineSize: (el as HTMLElement).style.inlineSize,
    }));

    it('should span the bottom band across the whole scrollport, master included', () => {
      const holder = buildHolder();

      syncScrollbarTrackBands(holder, {
        bottom: 12, inlineEnd: 0, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: true, inlineEnd: true });

      expect(bands(holder)).toEqual([
        { edge: 'bottom', blockStart: '328px', inlineStart: '0px', blockSize: '12px', inlineSize: '700px' },
      ]);
    });

    it('should span the inline-end band down the whole scrollport', () => {
      const holder = buildHolder();

      syncScrollbarTrackBands(holder, {
        bottom: 0, inlineEnd: 12, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: true, inlineEnd: true });

      expect(bands(holder)).toEqual([
        { edge: 'inline-end', blockStart: '0px', inlineStart: '688px', blockSize: '340px', inlineSize: '12px' },
      ]);
    });

    it('should draw both bands when both axes scroll', () => {
      const holder = buildHolder();

      syncScrollbarTrackBands(holder, {
        bottom: 12, inlineEnd: 12, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: true, inlineEnd: true });

      expect(bands(holder)).toHaveLength(2);
    });

    it('should put the host first in the holder, so the sticky box stays pinned', () => {
      const holder = buildHolder();

      syncScrollbarTrackBands(holder, {
        bottom: 12, inlineEnd: 0, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: true, inlineEnd: true });

      const host = holder.querySelector(`.${OVERLAY_SCROLLBAR_FILLER_HOST_CLASS}`);

      expect(holder.firstChild).toBe(host);
    });

    it('should mark the host open while the scrollbar is showing', () => {
      const holder = buildHolder();

      syncScrollbarTrackBands(holder, {
        bottom: 16, inlineEnd: 0, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: true, inlineEnd: true });

      const host = holder.querySelector(`.${OVERLAY_SCROLLBAR_FILLER_HOST_CLASS}`) as HTMLElement;

      // The class is what the fade keys off, so it has to be on for an open band.
      expect(host.classList.contains(OVERLAY_SCROLLBAR_FILLER_OPEN_CLASS)).toBe(true);
    });

    it('should drop a closing band in the same frame rather than fading it out', () => {
      const holder = buildHolder();
      const sizes = { bottom: 16, inlineEnd: 0, scrollportWidth: 700, scrollportHeight: 340 };

      syncScrollbarTrackBands(holder, sizes, { bottom: true, inlineEnd: true });
      syncScrollbarTrackBands(holder, sizes, { bottom: false, inlineEnd: false });

      // The clone's clip reopens on this same signal. A band left behind to fade would be drawn only
      // over the master's segment of the strip (a seam beside the frozen overlays), and holding the
      // clip closed to cover the fade instead shows the master's cell where the frozen content
      // belongs - a column header cut short along its last 16px. Both were measured; going in the
      // same frame is the only state that shows neither.
      expect(holder.querySelector(`.${OVERLAY_SCROLLBAR_FILLER_HOST_CLASS}`)).toBeNull();
      expect(bands(holder)).toHaveLength(0);
    });

    it('should drop a closing band outright once the regime ends, with nothing left to fade', () => {
      const holder = buildHolder();

      syncScrollbarTrackBands(holder, {
        bottom: 16, inlineEnd: 0, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: true, inlineEnd: true });
      // Classic scrollbars, or neither axis scrolling: no band is wanted at all.
      syncScrollbarTrackBands(holder, {
        bottom: 0, inlineEnd: 0, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: false, inlineEnd: false });

      expect(bands(holder)).toHaveLength(0);
      expect(holder.querySelector(`.${OVERLAY_SCROLLBAR_FILLER_HOST_CLASS}`)).toBeNull();
    });

    it('should reuse the same elements across updates instead of piling them up', () => {
      const holder = buildHolder();

      syncScrollbarTrackBands(holder, {
        bottom: 12, inlineEnd: 0, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: true, inlineEnd: true });
      syncScrollbarTrackBands(holder, {
        bottom: 12, inlineEnd: 0, scrollportWidth: 900, scrollportHeight: 400,
      }, { bottom: true, inlineEnd: true });

      expect(bands(holder)).toEqual([
        { edge: 'bottom', blockStart: '388px', inlineStart: '0px', blockSize: '12px', inlineSize: '900px' },
      ]);
    });

    it('should drop an axis band once that axis stops scrolling', () => {
      const holder = buildHolder();

      syncScrollbarTrackBands(holder, {
        bottom: 12, inlineEnd: 12, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: true, inlineEnd: true });
      syncScrollbarTrackBands(holder, {
        bottom: 12, inlineEnd: 0, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: true, inlineEnd: true });

      expect(bands(holder).map(b => b.edge)).toEqual(['bottom']);
    });

    it('should draw only the axis being scrolled, not every axis that could scroll', () => {
      const holder = buildHolder();
      const sizes = { bottom: 16, inlineEnd: 16, scrollportWidth: 700, scrollportHeight: 340 };

      // Both axes can scroll, but only the horizontal one is showing its scrollbar.
      syncScrollbarTrackBands(holder, sizes, { bottom: true, inlineEnd: false });
      expect(bands(holder).map(b => b.edge)).toEqual(['bottom']);

      // Now the vertical one instead.
      syncScrollbarTrackBands(holder, sizes, { bottom: false, inlineEnd: true });
      expect(bands(holder).map(b => b.edge)).toEqual(['inline-end']);

      // And both, for a gesture that moved on both axes.
      syncScrollbarTrackBands(holder, sizes, { bottom: true, inlineEnd: true });
      expect(bands(holder).map(b => b.edge).sort()).toEqual(['bottom', 'inline-end']);
    });

    it('should remove the host entirely outside the overlay-scrollbar regime', () => {
      const holder = buildHolder();

      syncScrollbarTrackBands(holder, {
        bottom: 12, inlineEnd: 12, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: true, inlineEnd: true });
      syncScrollbarTrackBands(holder, {
        bottom: 0, inlineEnd: 0, scrollportWidth: 0, scrollportHeight: 0,
      }, { bottom: false, inlineEnd: false });

      expect(holder.querySelector(`.${OVERLAY_SCROLLBAR_FILLER_HOST_CLASS}`)).toBeNull();
    });
  });

  describe('isPointInScrollbarBand', () => {
    // A 700x340 scrollport at (100, 100), with a 16px band on each edge.
    const port = { top: 100, right: 800, bottom: 440, left: 100 };
    const inBand = (x: number, y: number, bottom = 16, inlineEnd = 16, rtl = false) =>
      isPointInScrollbarBand(port, bottom, inlineEnd, rtl, x, y);

    it('should catch a point in the bottom band', () => {
      expect(inBand(400, 430)).toBe(true);
    });

    it('should catch a point in the inline-end band', () => {
      expect(inBand(790, 200)).toBe(true);
    });

    it('should put the inline-end band on the other side in RTL', () => {
      expect(inBand(110, 200, 16, 16, true)).toBe(true);
      expect(inBand(790, 200, 16, 16, true)).toBe(false);
    });

    it('should ignore a point in the middle of the grid', () => {
      expect(inBand(400, 200)).toBe(false);
    });

    it('should ignore a point outside the scrollport', () => {
      expect(inBand(50, 200)).toBe(false);
      expect(inBand(400, 50)).toBe(false);
      expect(inBand(900, 200)).toBe(false);
      expect(inBand(400, 500)).toBe(false);
    });

    it('should ignore the band of an axis that is not scrolling', () => {
      // Vertical only: the bottom strip is ordinary grid again.
      expect(inBand(400, 430, 0, 16)).toBe(false);
      expect(inBand(790, 200, 0, 16)).toBe(true);
      // Horizontal only.
      expect(inBand(790, 200, 16, 0)).toBe(false);
      expect(inBand(400, 430, 16, 0)).toBe(true);
    });

    it('should catch nothing at all when no band is drawn', () => {
      expect(inBand(400, 430, 0, 0)).toBe(false);
      expect(inBand(790, 200, 0, 0)).toBe(false);
    });
  });

  describe('toggleScrollbarClearance', () => {
    it('should add and remove the class that drives the clearance styles', () => {
      const el = document.createElement('div');

      toggleScrollbarClearance(el, true);
      expect(el.classList.contains(OVERLAY_SCROLLBAR_CLEARANCE_CLASS)).toBe(true);

      toggleScrollbarClearance(el, false);
      expect(el.classList.contains(OVERLAY_SCROLLBAR_CLEARANCE_CLASS)).toBe(false);
    });
  });
});
