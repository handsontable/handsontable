import {
  applyHolderWidthCap,
  boundWorkspaceWidth,
  resolveHolderWidth,
} from 'walkontable/viewport/rootWidthBound';
import type { GeometryReader } from 'walkontable/domMeasure/geometryReader';

/**
 * One element's box as the stub geometry reader reports it. `probed` overrides the widths while the
 * probe of `measureAvailableWidths()` is laid out, which is how a container sized by its content, or
 * a flex share, would show the room it has.
 */
interface Box {
  clientWidth: number;
  offsetWidth?: number;
  scrollWidth?: number;
  paddingInline?: number;
  probed?: Partial<Omit<Box, 'probed'>>;
}

/**
 * The DOM the helpers read: the owner of the horizontal axis, the element the grid's root sits in,
 * the root, `.ht_master`, and the holder inside it.
 */
function createGrid() {
  const owner = document.createElement('div');
  const container = document.createElement('div');
  const root = document.createElement('div');
  const wtRootElement = document.createElement('div');
  const holder = document.createElement('div');

  owner.appendChild(container);
  container.appendChild(root);
  root.appendChild(wtRootElement);
  wtRootElement.appendChild(holder);
  document.body.appendChild(owner);

  return { owner, container, root, wtRootElement, holder };
}

/**
 * Builds a geometry reader that answers from `boxes`, switching to each box's `probed` widths while
 * the holder has no width and a probe sits in `.ht_master`. Every read records whether it saw the
 * probe.
 */
function createGeometryReader(
  grid: ReturnType<typeof createGrid>,
  boxes: Map<HTMLElement, Box>,
): GeometryReader & { reads: { element: HTMLElement, probed: boolean }[] } {
  const reads: { element: HTMLElement, probed: boolean }[] = [];
  const isProbing = () => grid.holder.style.width === '0px' && grid.wtRootElement.children.length > 1;
  const read = (element: HTMLElement): Box => {
    const box = boxes.get(element) ?? { clientWidth: 0 };
    const probed = isProbing();

    reads.push({ element, probed });

    return probed ? { ...box, ...box.probed } : box;
  };

  return {
    reads,
    clientWidth: (element: HTMLElement) => read(element).clientWidth,
    offsetWidth: (element: HTMLElement) => {
      const box = read(element);

      return box.offsetWidth ?? box.clientWidth;
    },
    scrollWidth: (element: HTMLElement) => {
      const box = read(element);

      return box.scrollWidth ?? box.offsetWidth ?? box.clientWidth;
    },
    getComputedStyle: (element: HTMLElement) => {
      const half = `${(read(element).paddingInline ?? 0) / 2}px`;

      return { paddingLeft: half, paddingRight: half } as CSSStyleDeclaration;
    },
  } as unknown as GeometryReader & { reads: { element: HTMLElement, probed: boolean }[] };
}

describe('rootWidthBound', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  describe('resolveHolderWidth()', () => {
    it('should return null for a root that sits in no element', () => {
      const grid = createGrid();
      const geometryReader = createGeometryReader(grid, new Map());

      grid.root.remove();

      expect(resolveHolderWidth(geometryReader, grid.wtRootElement, grid.holder, grid.owner, grid.root))
        .toBe(null);
    });

    it('should size a hidden grid to nothing', () => {
      // Inside a `display: none` ancestor every box reads 0, the owner's too.
      const grid = createGrid();
      const geometryReader = createGeometryReader(grid, new Map());

      expect(resolveHolderWidth(geometryReader, grid.wtRootElement, grid.holder, grid.owner, grid.root))
        .toBe(0);
    });

    it('should take the room the container has, not the owner\'s box', () => {
      // A flex share, 588px of a 688px owner, next to a 100px column.
      const grid = createGrid();
      const geometryReader = createGeometryReader(grid, new Map<HTMLElement, Box>([
        [grid.owner, { clientWidth: 688 }],
        [grid.container, { clientWidth: 588 }],
        [grid.root, { clientWidth: 588 }],
      ]));

      expect(resolveHolderWidth(geometryReader, grid.wtRootElement, grid.holder, grid.owner, grid.root))
        .toBe(588);
    });

    it('should take the room a container sized by its content shows under the probe', () => {
      // An inline block the grid held at 480px: under the probe it grows to the owner's 688px.
      const grid = createGrid();
      const geometryReader = createGeometryReader(grid, new Map<HTMLElement, Box>([
        [grid.owner, { clientWidth: 688 }],
        [grid.container, { clientWidth: 480, probed: { clientWidth: 688 } }],
        [grid.root, { clientWidth: 480 }],
      ]));

      expect(resolveHolderWidth(geometryReader, grid.wtRootElement, grid.holder, grid.owner, grid.root))
        .toBe(688);
    });

    it('should stay inside the owner\'s padding', () => {
      // The edge slots still hold an inline block at 656px after its owner shrank to 448px of content.
      const grid = createGrid();
      const geometryReader = createGeometryReader(grid, new Map<HTMLElement, Box>([
        [grid.owner, { clientWidth: 480, paddingInline: 32 }],
        [grid.container, { clientWidth: 656 }],
        [grid.root, { clientWidth: 656 }],
      ]));

      expect(resolveHolderWidth(geometryReader, grid.wtRootElement, grid.holder, grid.owner, grid.root))
        .toBe(448);
    });

    it('should measure the container\'s content box', () => {
      const grid = createGrid();
      const geometryReader = createGeometryReader(grid, new Map<HTMLElement, Box>([
        [grid.owner, { clientWidth: 688 }],
        [grid.container, { clientWidth: 688, paddingInline: 16 }],
        [grid.root, { clientWidth: 672 }],
      ]));

      expect(resolveHolderWidth(geometryReader, grid.wtRootElement, grid.holder, grid.owner, grid.root))
        .toBe(672);
    });

    it('should fill a root wider than its container, as far as the owner\'s box reaches', () => {
      const grid = createGrid();
      const boxes = new Map<HTMLElement, Box>([
        [grid.owner, { clientWidth: 720, offsetWidth: 720, paddingInline: 32 }],
        [grid.container, { clientWidth: 688 }],
        [grid.root, { clientWidth: 720 }],
      ]);
      const geometryReader = createGeometryReader(grid, boxes);

      expect(resolveHolderWidth(geometryReader, grid.wtRootElement, grid.holder, grid.owner, grid.root))
        .toBe(720);

      boxes.set(grid.owner, { clientWidth: 700, offsetWidth: 700, paddingInline: 32 });

      expect(resolveHolderWidth(geometryReader, grid.wtRootElement, grid.holder, grid.owner, grid.root))
        .toBe(700);
    });

    it('should round a fractional room down', () => {
      const grid = createGrid();
      const geometryReader = createGeometryReader(grid, new Map<HTMLElement, Box>([
        [grid.owner, { clientWidth: 688 }],
        [grid.container, { clientWidth: 601, paddingInline: 0.8 }],
        [grid.root, { clientWidth: 600 }],
      ]));

      expect(resolveHolderWidth(geometryReader, grid.wtRootElement, grid.holder, grid.owner, grid.root))
        .toBe(600);
    });

    it('should read the container and the owner under the probe, and read the root before it', () => {
      const grid = createGrid();
      const geometryReader = createGeometryReader(grid, new Map<HTMLElement, Box>([
        [grid.owner, { clientWidth: 688 }],
        [grid.container, { clientWidth: 688 }],
        [grid.root, { clientWidth: 688 }],
      ]));

      resolveHolderWidth(geometryReader, grid.wtRootElement, grid.holder, grid.owner, grid.root);

      const probedElements = new Set(geometryReader.reads.filter(read => read.probed).map(read => read.element));

      expect(geometryReader.reads.find(read => read.element === grid.root)?.probed).toBe(false);
      expect(probedElements.has(grid.container)).toBe(true);
      expect(probedElements.has(grid.owner)).toBe(true);
    });

    it('should put the holder width back and take the probe out after the reads', () => {
      const grid = createGrid();
      const geometryReader = createGeometryReader(grid, new Map<HTMLElement, Box>([
        [grid.owner, { clientWidth: 688 }],
        [grid.container, { clientWidth: 588 }],
        [grid.root, { clientWidth: 588 }],
      ]));

      grid.holder.style.width = '688px';

      resolveHolderWidth(geometryReader, grid.wtRootElement, grid.holder, grid.owner, grid.root);

      expect(grid.holder.style.width).toBe('688px');
      expect(Array.from(grid.wtRootElement.children)).toEqual([grid.holder]);
    });

    it('should put the holder width back and take the probe out when a read throws', () => {
      const grid = createGrid();
      const geometryReader = createGeometryReader(grid, new Map<HTMLElement, Box>([
        [grid.owner, { clientWidth: 688 }],
        [grid.root, { clientWidth: 588 }],
      ]));

      geometryReader.getComputedStyle = () => {
        throw new Error('read failed');
      };
      grid.holder.style.width = '688px';

      expect(() => resolveHolderWidth(geometryReader, grid.wtRootElement, grid.holder, grid.owner, grid.root))
        .toThrow('read failed');
      expect(grid.holder.style.width).toBe('688px');
      expect(Array.from(grid.wtRootElement.children)).toEqual([grid.holder]);
    });
  });

  describe('boundWorkspaceWidth()', () => {
    it('should bound the width by `.ht_master` and by the room inside the owner\'s padding', () => {
      const grid = createGrid();
      const boxes = new Map<HTMLElement, Box>([
        [grid.owner, { clientWidth: 720, paddingInline: 32 }],
        [grid.container, { clientWidth: 688 }],
        [grid.wtRootElement, { clientWidth: 344 }],
      ]);
      const geometryReader = createGeometryReader(grid, boxes);

      expect(boundWorkspaceWidth(geometryReader, grid.wtRootElement, grid.owner, grid.root, 720)).toBe(344);

      // Core's edge slots hold a content-sized chain at 480px after the owner shrank to 448px of room.
      boxes.set(grid.owner, { clientWidth: 480, paddingInline: 32 });
      boxes.set(grid.container, { clientWidth: 480 });
      boxes.set(grid.wtRootElement, { clientWidth: 480 });

      expect(boundWorkspaceWidth(geometryReader, grid.wtRootElement, grid.owner, grid.root, 480)).toBe(448);
    });

    it('should not bound the width by a `.ht_master` that has no width yet', () => {
      const grid = createGrid();
      const geometryReader = createGeometryReader(grid, new Map<HTMLElement, Box>([
        [grid.owner, { clientWidth: 688 }],
        [grid.container, { clientWidth: 0 }],
        [grid.wtRootElement, { clientWidth: 0 }],
      ]));

      expect(boundWorkspaceWidth(geometryReader, grid.wtRootElement, grid.owner, grid.root, 688)).toBe(688);
    });

    it('should not bound the width by an owner with no room of its own yet', () => {
      // A modal `<dialog>` with no width, before the grid's first draw.
      const grid = createGrid();
      const geometryReader = createGeometryReader(grid, new Map<HTMLElement, Box>([
        [grid.owner, { clientWidth: 32, paddingInline: 32 }],
        [grid.container, { clientWidth: 0 }],
        [grid.wtRootElement, { clientWidth: 0 }],
      ]));

      expect(boundWorkspaceWidth(geometryReader, grid.wtRootElement, grid.owner, grid.root, 32)).toBe(32);
    });

    it('should let a root that spills past its container reach the owner\'s box', () => {
      const grid = createGrid();
      const geometryReader = createGeometryReader(grid, new Map<HTMLElement, Box>([
        [grid.owner, { clientWidth: 720, paddingInline: 32 }],
        [grid.container, { clientWidth: 688 }],
        [grid.wtRootElement, { clientWidth: 720 }],
      ]));

      expect(boundWorkspaceWidth(geometryReader, grid.wtRootElement, grid.owner, grid.root, 720)).toBe(720);
    });
  });

  describe('applyHolderWidthCap()', () => {
    it('should cap the holder at `.ht_master` and clear the cap again', () => {
      const { holder } = createGrid();

      applyHolderWidthCap(holder, true);

      expect(holder.style.maxWidth).toBe('100%');

      applyHolderWidthCap(holder, true);

      expect(holder.style.maxWidth).toBe('100%');

      applyHolderWidthCap(holder, false);

      expect(holder.style.maxWidth).toBe('');
    });
  });
});
