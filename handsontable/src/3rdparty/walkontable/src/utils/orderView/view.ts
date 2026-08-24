import { ViewSizeSet } from './viewSizeSet';
import { WORKING_SPACE_TOP, WORKING_SPACE_BOTTOM } from './constants';

/**
 * Executive model for each table renderer. It's responsible for injecting DOM nodes in a
 * specified order and adjusting the number of elements in the root node.
 *
 * Rendering writes directly to the DOM: the root node keeps exactly `viewSize` children, and on
 * each render cycle the existing children are reused in place (their content is overwritten by the
 * cell renderer). There is no node pool keyed by source coordinate and no diffing strategy — those
 * were removed because keeping a fixed, viewport-sized set of nodes is simpler and bounds memory to
 * the viewport regardless of dataset size.
 *
 * Only this class has rights to juggle DOM elements within the root node (see render method).
 *
 * @class {OrderView}
 */
export class OrderView {
  /**
   * The root node to manage with.
   *
   * @type {HTMLElement}
   */
  rootNode;
  /**
   * Factory for newly created DOM elements.
   *
   * @type {function(number): HTMLElement}
   */
  nodesPool;
  /**
   * Holder for sizing and positioning of the view.
   *
   * @type {ViewSizeSet}
   */
  sizeSet = new ViewSizeSet();
  /**
   * The list of DOM elements which are rendered for this render cycle.
   *
   * @type {HTMLElement[]}
   */
  collectedNodes: HTMLElement[] = [];
  /**
   * Node type which the order view will manage while rendering the DOM elements (uppercased to
   * match `Element.tagName`).
   *
   * @type {string}
   */
  childNodeType;
  /**
   * The visual index of the currently processed child within a render cycle.
   *
   * @type {number}
   */
  visualIndex = 0;

  /**
   * Creates a new OrderView instance.
   *
   * @param {HTMLElement} rootNode The root node to manage.
   * @param {function(): HTMLElement} nodesPool Factory for creating new DOM elements.
   * @param {string} childNodeType The type of child nodes to manage.
   */
  constructor(rootNode: HTMLElement, nodesPool: () => HTMLElement, childNodeType: string) {
    this.rootNode = rootNode;
    this.nodesPool = nodesPool;
    this.childNodeType = typeof childNodeType === 'string' ? childNodeType.toUpperCase() : childNodeType;
  }

  /**
   * Sets the size for rendered elements. It can be a size for rows, cells or size for row
   * headers etc. It depends for what table renderer this instance was created.
   *
   * @param {number} size The size.
   * @returns {OrderView}
   */
  setSize(size: number) {
    this.sizeSet.setSize(size);

    return this;
  }

  /**
   * Sets the offset for rendered elements. The offset describes the shift between 0 and
   * the first rendered element according to the scroll position.
   *
   * @param {number} offset The offset.
   * @returns {OrderView}
   */
  setOffset(offset: number) {
    this.sizeSet.setOffset(offset);

    return this;
  }

  /**
   * Checks if this instance of the view shares the root node with another instance. This happens only once when
   * a row (TR) as a root node is managed by two OrderView instances. If this happens another DOM injection
   * algorithm is performed to achieve consistent order.
   *
   * @returns {boolean}
   */
  isSharedViewSet() {
    return this.sizeSet.isShared();
  }

  /**
   * Returns rendered DOM element based on visual index.
   *
   * @param {number} visualIndex The visual index.
   * @returns {HTMLElement}
   */
  getNode(visualIndex: number) {
    return visualIndex < this.collectedNodes.length ? this.collectedNodes[visualIndex] : null;
  }

  /**
   * Returns currently processed DOM element.
   *
   * @returns {HTMLElement}
   */
  getCurrentNode() {
    const length = this.collectedNodes.length;

    return length > 0 ? this.collectedNodes[length - 1] : null;
  }

  /**
   * Returns the count of children in the root node that belong to this view (for shared root nodes
   * only the children matching this view's node type and working space are counted).
   *
   * @returns {number}
   */
  getRenderedChildCount() {
    const { rootNode, sizeSet } = this;
    let childElementCount = 0;

    if (this.isSharedViewSet()) {
      let element = rootNode.firstElementChild;

      while (element) {
        if (element.tagName === this.childNodeType) {
          childElementCount += 1;

        } else if (sizeSet.isPlaceOn(WORKING_SPACE_TOP)) {
          break;
        }
        element = element.nextElementSibling;
      }
    } else {
      childElementCount = rootNode.childElementCount;
    }

    return childElementCount;
  }

  /**
   * Setups and prepares all necessary properties and starts the rendering process. It adjusts the
   * number of children in the root node to the next view size, creating or removing nodes as needed.
   * This method has to be called only once (at the start) for the render cycle.
   */
  start() {
    this.collectedNodes.length = 0;
    this.visualIndex = 0;

    const { rootNode, sizeSet } = this;
    const isShared = this.isSharedViewSet();
    const { nextSize } = sizeSet.getViewSize();

    let childElementCount = this.getRenderedChildCount();

    while (childElementCount < nextSize) {
      const newNode = this.nodesPool();

      if (!isShared || sizeSet.isPlaceOn(WORKING_SPACE_BOTTOM)) {
        rootNode.appendChild(newNode);
      } else {
        rootNode.insertBefore(newNode, rootNode.firstChild);
      }
      childElementCount += 1;
    }

    const isSharedPlacedOnTop = isShared && sizeSet.isPlaceOn(WORKING_SPACE_TOP);

    while (childElementCount > nextSize) {
      const childToRemove = isSharedPlacedOnTop ? rootNode.firstChild : rootNode.lastChild;

      if (childToRemove) {
        rootNode.removeChild(childToRemove);
      }
      childElementCount -= 1;
    }
  }

  /**
   * Renders the DOM element for the current visual index by reusing the child already in place.
   * If a child of the wrong node type occupies the slot, it is replaced with a freshly created one.
   * This method has to be called as many times as the size count is met (to cover all previously rendered DOM elements).
   */
  render() {
    const { rootNode, sizeSet } = this;
    let visualIndex = this.visualIndex;

    if (this.isSharedViewSet() && sizeSet.isPlaceOn(WORKING_SPACE_BOTTOM) && sizeSet.sharedSize) {
      visualIndex += sizeSet.sharedSize.nextSize;
    }

    // Index by element children only (`children`, not `childNodes`) to stay consistent with the
    // element-based counting in `start()` and `getRenderedChildCount()`; a stray text/comment node
    // in the root would otherwise shift the slot.
    let node = rootNode.children[visualIndex] as HTMLElement;

    if (!node) {
      // Defensive guard: `start()` always provisions enough children for this render cycle, so the
      // slot should exist. Recreate it rather than dereferencing `undefined` if that ever breaks.
      node = this.nodesPool();
      rootNode.appendChild(node);
    } else if (node.tagName !== this.childNodeType) {
      const newNode = this.nodesPool();

      node.replaceWith(newNode);
      node = newNode;
    }

    this.collectedNodes.push(node);
    this.visualIndex += 1;
  }

  /**
   * Ends the render process. No cleanup is required — all work is done in `start()` and `render()`.
   */
  end() {
    // intentionally empty
  }
}
