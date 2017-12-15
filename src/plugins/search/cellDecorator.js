import {addClass, removeClass} from './../../helpers/dom/element';

export default function SearchCellDecorator(instance, TD, row, col, prop, value, cellProperties) {
  let search = instance.getPlugin('search');
  let elementClass = search.getElementClass();

  if (cellProperties.isSearchResult) {
    addClass(TD, elementClass);

  } else {
    removeClass(TD, elementClass);
  }
};
