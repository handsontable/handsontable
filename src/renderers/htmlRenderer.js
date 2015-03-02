
import * as dom from './../dom.js';
import {getRenderer, registerRenderer} from './../renderers.js';

export {htmlRenderer};

registerRenderer('html', htmlRenderer);

function htmlRenderer(instance, TD, row, col, prop, value, cellProperties) {
  getRenderer('base').apply(this, arguments);
  dom.fastInnerHTML(TD, value);
}
