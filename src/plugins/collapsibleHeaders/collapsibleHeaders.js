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

    this.hiddenColumnsPlugin = this.hot.getPlugin('hiddenColumns');

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
    this.hot.addHook('afterGetColHeader', (col, TH) => this.onAfterGetColHeader(col, TH));
    this.hot.addHook('beforeOnCellMouseDown', (event) => this.onBeforeOnCellMouseDown(event));
  }

  bindListeners() {
    //this.eventManager.addEventListener(document, 'mousedown', (event) => this.onIndicatorMouseDown(event));
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


  onBeforeOnCellMouseDown(event, coords, TD, wt) {
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

    //console.log(this);
    //this.hiddenColu
  }

  expandSection(coords, TD) {
    //console.log('expand section');
  }
}

export {CollapsibleHeaders};

registerPlugin('collapsibleHeaders', CollapsibleHeaders);