import {addClass, removeClass} from './../../helpers/dom/element';

export default function SearchCellDecorator(instance, TD, row, col, prop, value, cellProperties) {
  const search = instance.getPlugin('search');
  let searchResultClass = search.getSearchResultClass();

  if (cellProperties.isSearchResult) {
    addClass(TD, searchResultClass);

  } else {
    removeClass(TD, searchResultClass);
  }
};
