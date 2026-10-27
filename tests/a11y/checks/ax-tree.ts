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
 * The backend DOM node id of the first element a selector matches, or `null`.
 *
 * @param cdp The session.
 * @param selector The selector.
 * @returns The id.
 */
async function backendIdOf(cdp: CDPSession, selector: string): Promise<number | null> {
  const { result } = await cdp.send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(selector)})`, objectGroup: 'a11y-tree' });

  if (!result.objectId) {
    return null;
  }

  const { node } = await cdp.send('DOM.describeNode', { objectId: result.objectId });

  return node.backendNodeId;
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

  for (const [selector, region] of [[root, 'grid'], [PORTAL, 'portal']] as const) {
    const backend = await backendIdOf(cdp, selector);
    const start = backend === null ? undefined : byBackend.get(backend);

    if (start) {
      visit(start.nodeId, null, region);
    }
  }
  await cdp.send('Runtime.releaseObjectGroup', { objectGroup: 'a11y-tree' });

  return flat;
}

/**
 * The accessibility snapshot of the grid and of its portal, as Playwright writes it (`ariaSnapshot()`),
 * in one text: what the goldens keep.
 *
 * @param page The page.
 * @param root The root container selector.
 * @returns The snapshot.
 */
export async function treeSnapshot(page: Page, root: string): Promise<string> {
  const grid = await page.locator(root).ariaSnapshot();
  const portal = await page.locator(PORTAL).ariaSnapshot();

  return `# grid\n${grid.trim()}\n# portal\n${portal.trim()}\n`;
}
