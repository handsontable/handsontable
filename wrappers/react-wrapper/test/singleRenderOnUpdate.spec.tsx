import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { renderHotTableWithProps, sleep } from './_helpers';
import { TEST_LICENSE_KEY } from './licenseKey';

registerAllModules();

describe('HotTable re-render', () => {
  it('should paint the grid once when the parent re-renders with no prop change', async() => {
    const afterRender = jest.fn();
    const data = [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']];
    const props = {
      licenseKey: TEST_LICENSE_KEY,
      data,
      width: 400,
      height: 200,
      afterRender,
    };

    const hotTableRef = renderHotTableWithProps(props, false);

    await act(async() => {
      await sleep(50);
    });

    afterRender.mockClear();

    renderHotTableWithProps(props, false, hotTableRef);

    await act(async() => {
      await sleep(50);
    });

    expect(afterRender).toHaveBeenCalledTimes(1);
  });

  it('should paint the grid once when a column setting changes', async() => {
    const afterRender = jest.fn();
    const data = [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']];
    const hotTableRef = renderHotTableWithProps({
      licenseKey: TEST_LICENSE_KEY,
      data,
      width: 400,
      height: 200,
      columns: [{ data: 0 }, { data: 1 }],
      afterRender,
    }, false);

    await act(async() => {
      await sleep(50);
    });

    afterRender.mockClear();

    renderHotTableWithProps({
      licenseKey: TEST_LICENSE_KEY,
      data,
      width: 400,
      height: 200,
      columns: [{ data: 0 }, { data: 1, className: 'changed' }],
      afterRender,
    }, false, hotTableRef);

    await act(async() => {
      await sleep(50);
    });

    expect(afterRender).toHaveBeenCalledTimes(1);
    const hotInstance = hotTableRef.current?.hotInstance;

    expect(hotInstance?.getCell(0, 1)?.className).toContain('changed');
  });
});
