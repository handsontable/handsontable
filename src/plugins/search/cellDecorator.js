import {addClass, removeClass} from './../../helpers/dom/element';

export default function SearchCellDecorator(instance, TD, row, col, prop, value, cellProperties) {
  let search = instance.getPlugin('search');
  let searchClass = search.getDefaultSearchResultClass();

  if (cellProperties.isSearchResult) {
    addClass(TD, searchClass);

  } else {
    removeClass(TD, searchClass);
  }
};
