import { getEndOverlayHeaders } from '../endOverlayHeaders';
import type { HotInstance } from '../../core/types';

describe('getEndOverlayHeaders', () => {
  const createThead = () => document.createElement('thead');

  const createHot = (overlays: Record<string, unknown>) => ({
    view: { _wt: { wtOverlays: overlays } },
  }) as unknown as HotInstance;

  it('should return the THEAD of the inline-end clone and of its top corner, in that order', () => {
    const endThead = createThead();
    const cornerThead = createThead();
    const hot = createHot({
      inlineEndOverlay: { clone: { wtTable: { THEAD: endThead } } },
      topInlineEndCornerOverlay: { clone: { wtTable: { THEAD: cornerThead } } },
    });

    expect(getEndOverlayHeaders(hot)).toEqual([endThead, cornerThead]);
  });

  it('should skip an overlay that is not created', () => {
    const cornerThead = createThead();
    const hot = createHot({
      inlineEndOverlay: undefined,
      topInlineEndCornerOverlay: { clone: { wtTable: { THEAD: cornerThead } } },
    });

    expect(getEndOverlayHeaders(hot)).toEqual([cornerThead]);
  });

  it('should skip a clone that has no header section', () => {
    const hot = createHot({
      inlineEndOverlay: { clone: { wtTable: { THEAD: undefined } } },
      topInlineEndCornerOverlay: { clone: undefined },
    });

    expect(getEndOverlayHeaders(hot)).toEqual([]);
  });
});
