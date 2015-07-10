import * as dom from './../../dom.js';
import {EventManager} from './../../eventManager.js';
import {registerPlugin, getPlugin} from './../../plugins.js';
import BasePlugin from './../_base.js';

/**
 * @class CollapsibleHeaders
 * @plugin CollapsibleHeaders
 * @dependencies NestedHeaders HiddenColumns
 *
 * @description
 * Allows collapsing of headers with a defined colspan
 */
class CollapsibleHeaders extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);

    if (!this.hot.getSettings().collapsibleHeaders) {
      return;
    }

    this.settings = this.hot.getSettings().collapsibleHeaders;

    /**
     * Instance of {@link EventManager}
     *
     * @private
     * @type {EventManager}
     */
    this.eventManager = new EventManager(this);
    this.hiddenColumnsPlugin = null;

    this.bindHooks();
    this.bindListeners();
  }

  //checkDependencies() {
  //  if (!this.hot.nestedHeaders) {
  //    console.warn('You need to configure the Nested Headers plugin in order to use collapsible headers.');
  //
  //    return false;
  //  }
  //
  //  if (!this.hot.hiddenColumns) {
  //    console.warn('You need to configure the Nested Headers plugin in order to use collapsible headers.');
  //
  //    return false;
  //  }
  //}

  bindHooks() {
    this.hot.addHook('afterInit', () => this.onAfterInit());
    this.hot.addHook('afterGetColHeader', (col, TH) => this.onAfterGetColHeader(col, TH));
    this.hot.addHook('beforeOnCellMouseDown', (event, coords, TD) => this.onBeforeOnCellMouseDown(event, coords, TD));
  }

  bindListeners() {
    //this.eventManager.addEventListener(document, 'mousedown', (event) => this.onIndicatorMouseDown(event));
  }

  onAfterInit() {
    this.hiddenColumnsPlugin = this.hot.getPlugin('hiddenColumns');
  }

  toggleIndicator(button, state) {
    switch (state) {
      case 'expanded':
        dom.removeClass(button, 'expanded');
        dom.addClass(button, 'collapsed');

        dom.fastInnerText(button, '+');

        break;
      case 'collapsed':
        dom.removeClass(button, 'collapsed');
        dom.addClass(button, 'expanded');

        dom.fastInnerText(button, '-');

        break;
    }
  }

  generateIndicator() {
    let divEl = document.createElement('DIV');
    dom.addClass(divEl, 'collapsibleIndicator expanded');
    dom.fastInnerText(divEl, '-');

    return divEl;
  }

  onAfterGetColHeader(col, TH) {
    if (TH.hasAttribute('colspan') && TH.getAttribute('colspan') > 1) {
      TH.querySelector('div:first-child').appendChild(this.generateIndicator());
    }
  }


  onBeforeOnCellMouseDown(event, coords, TD) {
    if (dom.hasClass(event.target, 'collapsibleIndicator')) {

      if (dom.hasClass(event.target, 'expanded')) {
        this.toggleIndicator(event.target, 'expanded');

        this.collapseSection(coords, TD);

      } else if (dom.hasClass(event.target, 'collapsed')) {
        this.toggleIndicator(event.target, 'collapsed');

        this.expandSection(coords, TD);
      }

      event.stopImmediatePropagation();
    }
  }

  collapseSection(coords, TD) {
    let columnArray = [];
    let currentlyHiddenColumns = this.hiddenColumnsPlugin.settings;
    let TR = TD.parentNode;
    let THEAD = TR.parentNode;
    let headerLevel = THEAD.childNodes.length - Array.prototype.indexOf.call(THEAD.childNodes, TR) - 1;
    let colspanOffset = this.hot.getColspanOffset(coords.col, headerLevel);

    if (currentlyHiddenColumns === true) {
      currentlyHiddenColumns = [];
    } else {
      currentlyHiddenColumns = currentlyHiddenColumns.columns;
    }

    for (var i = 1, colspan = TD.getAttribute('colspan'); i < colspan; i++) {
      let colToHide = coords.col + colspanOffset + i;

      if (currentlyHiddenColumns.indexOf(colToHide) === -1) {
        columnArray.push(colToHide);
      }

    }

    //this.hiddenColumnsPlugin.hideColumns(columnArray);
    this.hot.updateSettings({
      hiddenColumns: {
        columns: columnArray
      }
    });
  }

  expandSection(coords, TD) {
    //console.log('expand section');
  }
}

export {CollapsibleHeaders};

registerPlugin('collapsibleHeaders', CollapsibleHeaders);