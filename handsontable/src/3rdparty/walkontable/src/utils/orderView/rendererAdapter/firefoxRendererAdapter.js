import { WORKING_SPACE_TOP, WORKING_SPACE_BOTTOM } from '../constants';

/**
 * Firefox-specific renderer adapter that uses direct DOM manipulation.
 * Firefox requires a different approach due to browser-specific DOM behavior.
 *
 * @class {FirefoxRendererAdapter}
 */
export class FirefoxRendererAdapter {
  /**
   * The visual index of currently processed row.
   *
   * @type {number}
   */
  visualIndex = 0;

  /**
   * @param {OrderView} orderView The OrderView instance.
   */
  constructor(orderView) {
    this.orderView = orderView;
  }

  /**
   * Returns rendered child count for this instance.
   *
   * @returns {number}
   */
  getRenderedChildCount() {
    const { rootNode, sizeSet } = this.orderView;
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

    const { rootNode, sizeSet } = this.orderView;
    const isShared = this.orderView.isSharedViewSet();
    const { nextSize } = sizeSet.getViewSize();

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
      rootNode.removeChild(isSharedPlacedOnTop ? rootNode.firstChild : rootNode.lastChild);
      childElementCount -= 1;
    }
  }

  /**
   * Renders the DOM element based on visual index (which is calculated internally).
   * This method has to be called as many times as the size count is met (to cover all previously rendered DOM elements).
   */
  render() {
    const { rootNode, sizeSet } = this.orderView;
    let visualIndex = this.visualIndex;

    if (this.orderView.isSharedViewSet() && sizeSet.isPlaceOn(WORKING_SPACE_BOTTOM)) {
      visualIndex += sizeSet.sharedSize.nextSize;
    }

    let node = rootNode.childNodes[visualIndex];

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

