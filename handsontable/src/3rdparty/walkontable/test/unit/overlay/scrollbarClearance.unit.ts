import {
  applyOverlayScrollbarClearance,
  axisScrollbarClearance,
  canGrabScrollbar,
  clearanceClipPath,
  isPointInScrollbarBand,
  overlayExtentBesideScrollbar,
  reservedScrollbarSpace,
  syncScrollbarTrackBands,
} from '../../../src/overlay/scrollbarClearance';
import {
  OVERLAY_SCROLLBAR_CLEARANCE,
  OVERLAY_SCROLLBAR_FILLER_CLASS,
  OVERLAY_SCROLLBAR_FILLER_HOST_CLASS,
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

  describe('axisScrollbarClearance', () => {
    // Counts the layout-forcing reads, which is the whole point of the wrapper.
    const countingReader = (box = { ow: 700, cw: 700, oh: 340, ch: 340 }) => {
      const reads = { count: 0 };

      return {
        reads,
        reader: {
          offsetWidth: () => {
            reads.count += 1;

            return box.ow;
          },
          clientWidth: () => {
            reads.count += 1;

            return box.cw;
          },
          offsetHeight: () => {
            reads.count += 1;

            return box.oh;
          },
          clientHeight: () => {
            reads.count += 1;

            return box.ch;
          },
        } as never,
      };
    };
    const holder = {} as HTMLElement;

    it('should not touch the DOM when the axis does not scroll', () => {
      const { reader, reads } = countingReader();

      expect(axisScrollbarClearance(reader, holder, 0, false, 'vertical')).toBe(0);
      expect(reads.count).toBe(0);
    });

    it('should not touch the DOM on a classic-scrollbar system', () => {
      // The common case on Windows and Linux, and on macOS set to "Always". The cheap check settles
      // it, so the gutter reads must not run - they were costing a forced layout per draw per overlay.
      const { reader, reads } = countingReader();

      expect(axisScrollbarClearance(reader, holder, 15, true, 'vertical')).toBe(0);
      expect(reads.count).toBe(0);
    });

    it('should read the gutter only when the cheap checks cannot settle it', () => {
      const { reader, reads } = countingReader();

      expect(axisScrollbarClearance(reader, holder, 0, true, 'vertical'))
        .toBe(OVERLAY_SCROLLBAR_CLEARANCE);
      // One pair of reads for the one axis asked about.
      expect(reads.count).toBe(2);
    });

    it('should still defer to the holder when it reserves space despite a 0 probe', () => {
      const { reader } = countingReader({ ow: 700, cw: 685, oh: 340, ch: 340 });

      expect(axisScrollbarClearance(reader, holder, 0, true, 'vertical')).toBe(0);
    });

    it('should read the matching axis, so a horizontal gutter cannot settle the vertical one', () => {
      // Only the height differs here: a horizontal scrollbar. The vertical axis must ignore it.
      const { reader } = countingReader({ ow: 700, cw: 700, oh: 340, ch: 325 });

      expect(axisScrollbarClearance(reader, holder, 0, true, 'vertical'))
        .toBe(OVERLAY_SCROLLBAR_CLEARANCE);
      expect(axisScrollbarClearance(reader, holder, 0, true, 'horizontal')).toBe(0);
    });
  });

  describe('canGrabScrollbar', () => {
    const windowWith = (matches: boolean, seen: string[] = []) => ({
      matchMedia: (query: string) => {
        seen.push(query);

        return { matches } as MediaQueryList;
      },
    } as unknown as Window);

    it('should report yes when a fine pointer is available', () => {
      expect(canGrabScrollbar(windowWith(true))).toBe(true);
    });

    it('should report no on a touch-only device', () => {
      // A phone reports a 0 scrollbar width for the same reason a floating scrollbar does, so this is
      // the only thing that tells them apart. Reserving a strip there swallows the tap (#10370).
      expect(canGrabScrollbar(windowWith(false))).toBe(false);
    });

    it('should ask about any pointer, not just the primary one', () => {
      // A touchscreen laptop's primary pointer is coarse, but its mouse can still grab a thumb.
      const seen: string[] = [];

      canGrabScrollbar(windowWith(true, seen));

      expect(seen[0]).toBe('(any-pointer: fine)');
    });

    it('should assume yes where the query cannot be asked, leaving behavior unchanged', () => {
      expect(canGrabScrollbar({} as Window)).toBe(true);
      expect(canGrabScrollbar(null as unknown as Window)).toBe(true);
    });

    it('should ask the window only once and keep reading the live result', () => {
      // The list keeps `matches` current by itself, so caching it cannot go stale - and this runs on
      // every draw.
      const seen: string[] = [];
      const rootWindow = windowWith(true, seen);

      canGrabScrollbar(rootWindow);
      canGrabScrollbar(rootWindow);
      canGrabScrollbar(rootWindow);

      expect(seen).toHaveLength(1);
    });
  });

  describe('overlayExtentBesideScrollbar', () => {
    it('should stop at the holder inner width when the probe disagrees with the holder', () => {
      // The reported case: the engine-wide probe reports no gutter while this scroller reserves 15.
      // Trusting the probe left the overlay 15px too wide, running under the scrollbar (#10370).
      expect(overlayExtentBesideScrollbar(700, 685, 0)).toBe(685);
    });

    it('should stop at the holder inner width when the two agree', () => {
      // Classic scrollbars: both report 15, so this is the answer the old arithmetic gave too.
      expect(overlayExtentBesideScrollbar(700, 685, 15)).toBe(685);
    });

    it('should take the full width when the scrollbar reserves nothing', () => {
      // A floating scrollbar leaves no gutter to avoid; the clearance strip handles that case.
      expect(overlayExtentBesideScrollbar(700, 700, 0)).toBe(700);
    });

    it('should fall back to the probe when the holder cannot be measured', () => {
      // A detached or hidden grid reports 0, which is not an answer - subtract the probe instead.
      expect(overlayExtentBesideScrollbar(700, 0, 15)).toBe(685);
    });

    it('should clamp at zero when the workspace is narrower than the scrollbar', () => {
      // The arithmetic gives -5 here, and a negative width is never meaningful.
      expect(overlayExtentBesideScrollbar(10, 0, 15)).toBe(0);
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

    it('should render the band opaque, with no separate open marker', () => {
      const holder = buildHolder();

      syncScrollbarTrackBands(holder, {
        bottom: 16, inlineEnd: 0, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: true, inlineEnd: true });

      // There is no open/closed marker: a closed band is removed outright rather than faded, so a
      // filler that exists is always one that should be fully visible. The host carries its own class
      // and nothing else.
      const host = holder.querySelector(`.${OVERLAY_SCROLLBAR_FILLER_HOST_CLASS}`) as HTMLElement;

      expect(bands(holder)).toHaveLength(1);
      expect(host.className).toBe(OVERLAY_SCROLLBAR_FILLER_HOST_CLASS);
    });

    it('should leave a nested grid\'s own host alone', () => {
      // A grid rendered inside a cell puts its whole DOM, holder included, inside the outer grid's
      // master holder. A subtree search from the outer holder finds the INNER host first, so the outer
      // grid deleted the inner grid's bands as its own, or adopted its host and sized outer-scrollport
      // fillers into a small nested grid.
      const outer = buildHolder();
      const innerHolder = document.createElement('div');
      const innerHost = document.createElement('div');

      innerHost.className = OVERLAY_SCROLLBAR_FILLER_HOST_CLASS;
      innerHolder.appendChild(innerHost);
      outer.appendChild(innerHolder);

      syncScrollbarTrackBands(outer, {
        bottom: 16, inlineEnd: 0, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: true, inlineEnd: false });

      // The outer grid builds its own host as a direct child, and the nested one is untouched.
      const outerHost = [...outer.children].find(c => c.classList.contains(OVERLAY_SCROLLBAR_FILLER_HOST_CLASS));

      expect(outerHost).toBeDefined();
      expect(outerHost).not.toBe(innerHost);
      expect(innerHost.children).toHaveLength(0);
      // Still where it was: the test holder is detached, so `isConnected` cannot answer this.
      expect(innerHost.parentNode).toBe(innerHolder);
    });

    it('should not delete a nested grid\'s host when the outer grid has none', () => {
      // The resting state: with no bands of its own, the outer grid used to find the inner host and
      // remove it outright.
      const outer = buildHolder();
      const innerHolder = document.createElement('div');
      const innerHost = document.createElement('div');
      const innerBand = document.createElement('div');

      innerHost.className = OVERLAY_SCROLLBAR_FILLER_HOST_CLASS;
      innerBand.className = OVERLAY_SCROLLBAR_FILLER_CLASS;
      innerBand.setAttribute('data-ht-clearance-owner', 'track');
      innerHost.appendChild(innerBand);
      innerHolder.appendChild(innerHost);
      outer.appendChild(innerHolder);

      // Classic scrollbars on the outer grid: nothing wanted, so it clears its own bands.
      syncScrollbarTrackBands(outer, {
        bottom: 0, inlineEnd: 0, scrollportWidth: 700, scrollportHeight: 340,
      }, { bottom: false, inlineEnd: false });

      // Still where it was: the test holder is detached, so `isConnected` cannot answer this.
      expect(innerHost.parentNode).toBe(innerHolder);
      expect(innerHost.children).toHaveLength(1);
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
});
