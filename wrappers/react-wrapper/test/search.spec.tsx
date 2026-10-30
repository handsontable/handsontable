import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { renderHotTableWithProps } from './_helpers';
import { HotTableProps } from '../src/types';

registerAllModules();

describe('HotTable `search` options across re-renders', () => {
  const baseProps: HotTableProps = {
    licenseKey: 'non-commercial-and-evaluation',
    id: 'hot',
    data: [['apple'], ['plum']],
    height: 200,
    autoRowSize: false,
    autoColumnSize: false,
  };

  it('keeps a query method set through the plugin API when an unrelated prop changes', () => {
    const queryMethod = jest.fn(() => false);
    const hotTableRef = renderHotTableWithProps({ ...baseProps, search: true }, false);
    const plugin = hotTableRef.current!.hotInstance!.getPlugin('search');

    plugin.setQueryMethod(queryMethod);

    act(() => {
      renderHotTableWithProps({ ...baseProps, search: true, height: 300 }, false, hotTableRef);
    });

    expect(hotTableRef.current!.hotInstance!.getSettings().height).toBe(300);
    expect(plugin.getQueryMethod()).toBe(queryMethod);
  });

  it('drops the object options once the `search` prop changes to `true`', () => {
    const queryMethod = jest.fn(() => true);
    const hotTableRef = renderHotTableWithProps({
      ...baseProps,
      search: { queryMethod, searchResultClass: 'my-hit' },
    }, false);
    const plugin = hotTableRef.current!.hotInstance!.getPlugin('search');

    act(() => {
      renderHotTableWithProps({ ...baseProps, search: true }, false, hotTableRef);
    });

    expect(plugin.getQueryMethod()).not.toBe(queryMethod);
    expect(plugin.getSearchResultClass()).toBe('htSearchResult');
  });
});
