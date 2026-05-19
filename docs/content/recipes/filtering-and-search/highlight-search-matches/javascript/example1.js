import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { rendererFactory } from 'handsontable/renderers';
registerAllModules();
const data = [
    { id: 101, title: 'Search API docs', owner: 'Alex', status: 'In progress' },
    { id: 102, title: 'Renderer refactor', owner: 'Mia', status: 'Review' },
    { id: 103, title: 'Fix keyboard shortcut', owner: 'Noah', status: 'Done' },
    { id: 104, title: 'Search UX tests', owner: 'Ava', status: 'In progress' },
];
let currentSearchTerm = '';
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
const highlightRenderer = rendererFactory(({ td, value, cellProperties }) => {
    const cellText = value === null || value === undefined ? '' : String(value);
    const query = currentSearchTerm.trim();
    if (!query || !cellProperties.isSearchResult) {
        td.textContent = cellText;
        return;
    }
    const splitter = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const highlighted = cellText
        .split(splitter)
        .map(fragment => (fragment.toLocaleLowerCase() === query.toLocaleLowerCase()
        ? `<mark>${escapeHtml(fragment)}</mark>`
        : escapeHtml(fragment)))
        .join('');
    td.innerHTML = highlighted;
});
const container = document.querySelector('#example1');
const searchField = document.querySelector('#search_field');
const hot = new Handsontable(container, {
    data,
    colHeaders: ['ID', 'Title', 'Owner', 'Status'],
    rowHeaders: true,
    height: 'auto',
    search: true,
    columns: [
        { data: 'id', type: 'numeric' },
        { data: 'title', renderer: highlightRenderer },
        { data: 'owner', renderer: highlightRenderer },
        { data: 'status', renderer: highlightRenderer },
    ],
    licenseKey: 'non-commercial-and-evaluation',
});
const searchPlugin = hot.getPlugin('search');
searchField.addEventListener('input', (event) => {
    currentSearchTerm = event.target.value;
    searchPlugin.query(currentSearchTerm);
    hot.render();
});
