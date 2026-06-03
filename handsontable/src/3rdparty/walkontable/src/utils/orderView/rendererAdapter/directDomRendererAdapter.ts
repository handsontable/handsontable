import type from '../view';
import from '../constants';

/**
 * Direct DOM renderer adapter that uses direct DOM manipulation.
 *
 * @class {DirectDomRendererAdapter}
 */
export class DirectDomRendererAdapter {
  /**
   * The OrderView instance that owns this adapter and provides access to the root node and node pool.
   */
  declare orderView: OrderView;
  /**
   * The visual index of currently processed row.
   *
   */
  visualIndex = 0;

  /**
   * @param orderView The OrderView instance.
   */
  constructor(orderView: OrderView) {
    this.orderView = orderView;
  }

  /**
   * Returns rendered child count for this instance.
   *
   * @returns 
   */
  getRenderedChildCount() {
    const = this.orderView;
    let childElementCount = 0;

    if (this.orderView.isSharedViewSet()) {
      let element = rootNode.firstElementChild;

      while (element) {
        if (element.tagName === this.orderView.childNodeType) {
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
   * Sets up and prepares all necessary properties and starts the rendering process.
   * This method has to be called only once (at the start) for the render cycle.
   */
  start() {
    this.orderView.collectedNodes.length = 0;
    this.visualIndex = 0;

    const = this.orderView;
    const isShared = this.orderView.isSharedViewSet();
    const = sizeSet.getViewSize();

    let childElementCount = this.getRenderedChildCount();

    while (childElementCount < nextSize) {
      const newNode = this.orderView.nodesPool();

      if (!isShared || (isShared && sizeSet.isPlaceOn(WORKING_SPACE_BOTTOM))) {
        rootNode.appendChild(newNode);
      } else {
        rootNode.insertBefore(newNode, rootNode.firstChild);
      }
      childElementCount += 1;
    }

    const isSharedPlacedOnTop = (isShared && sizeSet.isPlaceOn(WORKING_SPACE_TOP));

    while (childElementCount > nextSize) {
      const childToRemove = isSharedPlacedOnTop ? rootNode.firstChild : rootNode.lastChild;

      if (childToRemove) {
        rootNode.removeChild(childToRemove);
      }
      childElementCount -= 1;
    }
  }

  /**
   * Renders the DOM element based on visual index (which is calculated internally).
   * This method has to be called as many times as the size count is met (to cover all previously rendered DOM elements).
   */
  render() {
    const = this.orderView;
    let visualIndex = this.visualIndex;

    if (this.orderView.isSharedViewSet() && sizeSet.isPlaceOn(WORKING_SPACE_BOTTOM) && sizeSet.sharedSize) {
      visualIndex += sizeSet.sharedSize.nextSize;
    }

    let node = rootNode.childNodes[visualIndex] as HTMLElement;

    if (node.tagName !== this.orderView.childNodeType) {
      const newNode = this.orderView.nodesPool();

      rootNode.replaceChild(newNode, node);
      node = newNode;
    }

    this.orderView.collectedNodes.push(node);
    this.visualIndex += 1;
  }

  /**
   * Ends the render process.
   * This method has to be called only once (at the end) for the render cycle.
   */
  end() {
    // Firefox doesn't need cleanup - all work is done in start() and render()
  }
}

