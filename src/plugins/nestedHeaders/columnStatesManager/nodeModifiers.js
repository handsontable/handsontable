import { arrayEach, arrayReduce } from '../../../helpers/array';
import TreeNode, { TRAVERSAL_BF } from '../../../utils/dataStructures/tree';

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @type {NodeModifiers}
 */
/* eslint-enable jsdoc/require-description-complete-sentence */
export default class NodeModifiers {
  static AVAILABLE_ACTIONS = ['collapse', 'expand'];

  /**
   *
   */
  collapseNode(nodeToProcess) {
    const { data: nodeData, childs: nodeChilds } = nodeToProcess;

    if (nodeData.isCollapsed === true) {
      return;
    }

    nodeData.isCollapsed = true;
    // Detach all leaves except the first one to which the collapsed column will be adjusted.
    nodeData.detachedNodes = nodeChilds.splice(1);

    const firstChildColpspan = nodeChilds.length > 0 ? nodeChilds[0].data.colspan : 1;
    // Calculate by how many colspan it needs to reduce the headings to match them to the
    // first child colspan width.
    const colspanCorrection = nodeData.colspan - firstChildColpspan;

    // When the "colspanCorrection" is equal to 0, then it means that the first child and
    // collapsed node have the same colspan. In that case, the child has to be also collapsed.
    if (colspanCorrection === 0) {
      nodeToProcess.walkDown((node) => {
        // Ignore checking node from which we start traversing.
        if (nodeToProcess === node) {
          return;
        }

        // When the child node has the same colspan as the parent node, collapse the node.
        if (nodeToProcess.data.colspan === node.data.colspan) {
          this.collapseNode(node);
        }

        return false;
      }, TRAVERSAL_BF);

    } else {
      nodeToProcess.walkUp(({ data }) => {
        data.colspan -= colspanCorrection;

        if (data.colspan === 1) {
          data.isCollapsed = true;
        }
      });
    }
  }

  /**
   *
   */
  expandNode(nodeToProcess) {
    const { data: nodeData, childs: nodeChilds } = nodeToProcess;

    if (nodeData.isCollapsed === false) {
      return;
    }

    nodeData.isCollapsed = false;

    // Calculate by how many colspan it needs to increase the headings to match them to their
    // original colspan (origColspan).
    let colspanCorrection = nodeData.origColspan - nodeData.colspan;

    if (nodeChilds.length > 0 && nodeChilds[0].data.origColspan === nodeData.origColspan) {
      nodeToProcess.walkDown((node) => {
        // Ignore checking node from which we start traversing.
        if (nodeToProcess === node) {
          return;
        }

        // When the child node has the same colspan as the parent node, collapse the node.
        if (nodeToProcess.data.origColspan === node.data.origColspan) {
          this.expandNode(node);
        }

        return false;
      }, TRAVERSAL_BF);

      return;
    }

    if (Array.isArray(nodeData.detachedNodes) && nodeData.detachedNodes.length > 0) {
      // Attach the nodes. It restores a tree state to the state before "collapsing".
      nodeChilds.push(...nodeData.detachedNodes);
      // Calculate by how many colspan you need to increase the headings to match them to
      // the colspan width of all children.
      colspanCorrection = arrayReduce(nodeData.detachedNodes, (acc, { data }) => acc + data.colspan, 0);
    }

    console.log('colspanCorrection', colspanCorrection);

    nodeData.detachedNodes = [];

    nodeToProcess.walkUp(({ data }) => {
      data.colspan += colspanCorrection;

      if (data.colspan === data.origColspan) {
        data.isCollapsed = false;
      }
    });
  }

  /**
   *
   */
  triggerAction(actionName, nodeToProcess) {
    if (!NodeModifiers.AVAILABLE_ACTIONS.includes(actionName)) {
      throw new Error(`The node modifier action ("${actionName}") does not exist.`);
    }

    this[`${actionName}Node`](nodeToProcess);
  }
}
