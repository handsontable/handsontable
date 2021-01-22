import {
  TableRenderer,
  Renderer,
} from 'walkontable/renderer';

function createRenderer() {
  const TABLE = document.createElement('table');
  const THEAD = document.createElement('thead');
  const COLGROUP = document.createElement('colgroup');
  const TBODY = document.createElement('tbody');
  const rowUtils = new (class RowUtils {})();
  const columnUtils = new (class ColumnUtils {})();
  const cellRenderer = function() {};
  const renderer = new Renderer({ TABLE, THEAD, COLGROUP, TBODY, rowUtils, columnUtils, cellRenderer });

  return { renderer, TABLE, THEAD, COLGROUP, TBODY, rowUtils, columnUtils, cellRenderer };
}

describe('TableRenderer', () => {
  it('should be correctly setup', () => {
    const { renderer } = createRenderer();

    expect(renderer.renderer).toBeInstanceOf(TableRenderer);
  });

  it('should set `rowFilter` and `columnFilter` properties through TableRenderer `setFilters` method', () => {
    const { renderer } = createRenderer();

    spyOn(renderer.renderer, 'setFilters');

    const rowFilter = new (class RowFilter {})();
    const columnFilter = new (class ColumnFilter {})();

    const result = renderer.setFilters(rowFilter, columnFilter);

    expect(result).toBe(renderer);
    expect(renderer.renderer.setFilters).toHaveBeenCalledWith(rowFilter, columnFilter);
  });

  it('should set `rowsCount` and `columnsCount` properties through TableRenderer `setViewportSize` method', () => {
    const { renderer } = createRenderer();

    spyOn(renderer.renderer, 'setViewportSize');

    const result = renderer.setViewportSize(3, 6);

    expect(result).toBe(renderer);
    expect(renderer.renderer.setViewportSize).toHaveBeenCalledWith(3, 6);
  });

  it('should set `rowHeaders` and `columnsHeaders` properties through TableRenderer `setHeaderContentRenderers` method', () => {
    const { renderer } = createRenderer();

    spyOn(renderer.renderer, 'setHeaderContentRenderers');

    const rowHeaders = [() => {}];
    const columnsHeaders = [() => {}];

    const result = renderer.setHeaderContentRenderers(rowHeaders, columnsHeaders);

    expect(result).toBe(renderer);
    expect(renderer.renderer.setHeaderContentRenderers).toHaveBeenCalledWith(rowHeaders, columnsHeaders);
  });

  it('should call `render` method through TableRenderer module', () => {
    const { renderer } = createRenderer();

    spyOn(renderer.renderer, 'render');

    renderer.render();

    expect(renderer.renderer.render).toHaveBeenCalledTimes(1);
  });
});
