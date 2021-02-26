import VisualSelection from '../visualSelection';

/**
 * Creates the new instance of Selection, responsible for highlighting row and column headers. This type of selection
 * can occur multiple times.
 *
 * @returns {Selection}
 */
function createHighlight({
  headerClassName,
  rowClassName,
  columnClassName,
  ...restOptions
}) {
  const s = new VisualSelection({
    className: 'highlight',
    highlightHeaderClassName: headerClassName,
    highlightRowClassName: rowClassName,
    highlightColumnClassName: columnClassName,
    ...restOptions,
  });

  return s;
}

export default createHighlight;
