import { ViewSizeSet } from './viewSizeSet';
import { ViewDiffer } from './viewDiffer';
import { createRendererAdapter } from './rendererAdapter';

/**
 * Executive model for each table renderer. It's responsible for injecting DOM nodes in a
 * specified order and adjusting the number of elements in the root node.
 *
 * Only this class have rights to juggling DOM elements within the root node (see render method).
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
  collectedNodes = [];
  /**
   * The differ which calculates the differences between current and next view. It generates
   * commands that are processed by the OrderView (see `applyCommand` method).
   *
   * @type {ViewDiffer}
   */
  viewDiffer = new ViewDiffer(this.sizeSet);
  /**
   * Node type which the order view will manage while rendering the DOM elements.
   *
   * @type {string}
   */
  childNodeType;
  /**
   * The renderer adapter that handles browser-specific rendering logic.
   *
   * @type {StandardRendererAdapter|FirefoxRendererAdapter}
   */
  rendererAdapter;

  constructor(rootNode, nodesPool, childNodeType) {
    this.rootNode = rootNode;
    this.nodesPool = nodesPool;
    this.childNodeType = childNodeType;
    this.rendererAdapter = createRendererAdapter(this);
  }

  /**
   * Sets the size for rendered elements. It can be a size for rows, cells or size for row
   * headers etc. It depends for what table renderer this instance was created.
   *
   * @param {number} size The size.
   * @returns {OrderView}
   */
  setSize(size) {
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
  setOffset(offset) {
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
  getNode(visualIndex) {
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
   * Setups and prepares all necessary properties and start the rendering process.
   * This method has to be called only once (at the start) for the render cycle.
   */
  start() {
    this.rendererAdapter.start();
  }

  /**
   * Renders the DOM element based on visual index (which is calculated internally).
   * This method has to be called as many times as the size count is met (to cover all previously rendered DOM elements).
   */
  render() {
    this.rendererAdapter.render();
  }

  /**
   * Ends the render process.
   * This method has to be called only once (at the end) for the render cycle.
   */
  end() {
    this.rendererAdapter.end();
  }
}
