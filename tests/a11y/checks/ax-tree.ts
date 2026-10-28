import { type CDPSession, type Page } from '@playwright/test';
import { PORTAL } from '../harness';

/**
 * One node of Chromium's accessibility tree, flattened in reading order: its role and name, the
 * nearest non-ignored ancestor (`parent`), whether it sits in the grid's root container or its portal,
 * and the tag and attributes of its DOM element.
 */
export interface FlatAxNode {
  id: string;
  role: string;
  name: string;
  parent: string | null;
  region: 'grid' | 'portal';
  tag: string;
  attrs: Record<string, string>;
  focusable: boolean;
}

/**
 * The backend DOM node ids of every element a selector matches, in document order. The portal mark can
 * sit on more than one element: a page whose popups mount in a portal of their own (hyperformula-ui's
 * `.hfe-popup-portal`) marks that one next to the grid's `rootPortalElement`.
 *
 * @param cdp The session.
 * @param selector The selector.
 * @returns The ids.
 */
async function backendIdsOf(cdp: CDPSession, selector: string): Promise<number[]> {
  const ids: number[] = [];

  for (let index = 0; ; index++) {
    const { result } = await cdp.send('Runtime.evaluate', {
      expression: `document.querySelectorAll(${JSON.stringify(selector)})[${index}]`, objectGroup: 'a11y-tree',
    });

    if (!result.objectId) {
      return ids;
    }

    const { node } = await cdp.send('DOM.describeNode', { objectId: result.objectId });

    ids.push(node.backendNodeId);
  }
}

/**
 * Chromium's accessibility tree of the grid's root container and of its portal, in reading order:
 * `Accessibility.getFullAXTree` for the roles, names and order, joined by backend node id with one
 * `DOMSnapshot.captureSnapshot` for each node's tag and attributes (`aria-rowindex`, `tabindex`, the
 * class). An ignored node is dropped and its children are read in its place, as a screen reader reads
 * them.
 *
 * @param page The page.
 * @param cdp A session with `DOM` and `Accessibility` enabled.
 * @param root The root container selector.
 * @returns The nodes.
 */
export async function flattenAxTree(page: Page, cdp: CDPSession, root: string): Promise<FlatAxNode[]> {
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const snapshot = await cdp.send('DOMSnapshot.captureSnapshot', { computedStyles: [] });
  const strings = snapshot.strings;
  const dom = new Map<number, { tag: string; attrs: Record<string, string> }>();

  for (const document of snapshot.documents) {
    const { backendNodeId = [], nodeName = [], attributes = [] } = document.nodes;

    backendNodeId.forEach((id, index) => {
      const pairs = attributes[index] ?? [];
      const attrs: Record<string, string> = {};

      for (let at = 0; at < pairs.length; at += 2) {
        attrs[strings[pairs[at]]] = strings[pairs[at + 1]];
      }
      dom.set(id, { tag: String(strings[nodeName[index]] ?? '').toLowerCase(), attrs });
    });
  }

  const byId = new Map(nodes.map(item => [item.nodeId, item]));
  const byBackend = new Map(nodes.filter(item => item.backendDOMNodeId !== undefined).map(item => [item.backendDOMNodeId!, item]));
  const flat: FlatAxNode[] = [];
  const visit = (nodeId: string, parent: string | null, region: 'grid' | 'portal') => {
    const item = byId.get(nodeId);

    if (!item) {
      return;
    }

    let next = parent;

    if (!item.ignored) {
      const element = item.backendDOMNodeId !== undefined ? dom.get(item.backendDOMNodeId) : undefined;
      const focusable = (item.properties ?? []).find(property => property.name === 'focusable')?.value?.value === true;

      flat.push({
        id: item.nodeId,
        role: String(item.role?.value ?? ''),
        name: String(item.name?.value ?? ''),
        parent,
        region,
        tag: element?.tag ?? '',
        attrs: element?.attrs ?? {},
        focusable,
      });
      next = item.nodeId;
    }
    for (const child of item.childIds ?? []) {
      visit(child, next, region);
    }
  };

  // The grid is the first element its selector matches; every marked portal is read, in document order.
  for (const [selector, region] of [[root, 'grid'], [PORTAL, 'portal']] as const) {
    const backends = await backendIdsOf(cdp, selector);

    for (const backend of region === 'grid' ? backends.slice(0, 1) : backends) {
      const start = byBackend.get(backend);

      if (start) {
        visit(start.nodeId, null, region);
      }
    }
  }
  await cdp.send('Runtime.releaseObjectGroup', { objectGroup: 'a11y-tree' });

  return flat;
}

/**
 * The accessibility snapshot of the grid and of every marked portal, as Playwright writes it
 * (`ariaSnapshot()`), in one text: what the goldens keep. A page with one portal reads as before.
 *
 * @param page The page.
 * @param root The root container selector.
 * @returns The snapshot.
 */
export async function treeSnapshot(page: Page, root: string): Promise<string> {
  const grid = await page.locator(root).first().ariaSnapshot();
  const portals = await Promise.all((await page.locator(PORTAL).all()).map(portal => portal.ariaSnapshot()));

  return `# grid\n${grid.trim()}\n# portal\n${portals.map(portal => portal.trim()).join('\n')}\n`;
}
