import { defineGetter } from '../../../../../helpers/object';

const MIXIN_NAME = 'stickyColumnsLeft';

/**
 * @type {Object}
 */
const stickyColumnsLeft = {
  getFirstRenderedColumn() {
    const totalColumns = this.wot.getSetting('totalColumns');
    if (totalColumns === 0) {
      return -1;
    }
    return 0;
  },

  getFirstVisibleColumn() {
    return this.getFirstRenderedColumn();
  },

  getLastRenderedColumn() {
    return this.getRenderedColumnsCount() - 1;
  },

  getLastVisibleColumn() {
    return this.getLastRenderedColumn();
  },

  getRenderedColumnsCount() {
    const totalColumns = this.wot.getSetting('totalColumns');
    return Math.min(this.wot.getSetting('fixedColumnsLeft'), totalColumns);
  },

  getVisibleColumnsCount() {
    return this.getRenderedColumnsCount();
  }
};

defineGetter(stickyColumnsLeft, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default stickyColumnsLeft;
