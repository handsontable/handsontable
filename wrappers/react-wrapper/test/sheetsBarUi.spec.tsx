import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { renderHotTableWithProps } from './_helpers';
import { HotTableProps } from '../src/types';
import { TEST_LICENSE_KEY } from './licenseKey';

registerAllModules();

describe('HotTable sheets bar UI', () => {
  const sheets = [
    { name: 'Budget', data: [[1]] },
    { name: 'Forecast', data: [[2]] },
    { name: 'Notes', data: [[3]] },
  ];
  const sheetsBar = { sheets };
  const props = (height = 200): HotTableProps => ({ licenseKey: TEST_LICENSE_KEY, height, sheetsBar });

  it('renders the tab strip as a labeled group with the active tab marked', () => {
    const ref = renderHotTableWithProps(props(), false);
    const root = ref.current!.hotInstance!.rootWrapperElement;
    const strip = root.querySelector('.ht-sheets-bar__tabs')!;
    const tabs = strip.querySelectorAll('.ht-sheets-bar__tab');

    expect(strip.getAttribute('role')).toBe('group');
    expect(strip.getAttribute('aria-label')).toBe('Sheets');
    expect(tabs.length).toBe(3);
    expect(tabs[0].getAttribute('role')).toBe('button');
    expect(tabs[0].getAttribute('aria-current')).toBe('true');
    expect(tabs[1].getAttribute('aria-current')).toBe(null);
  });

  it('keeps the keyboard focus and the roving Tab stop on the same tab through a parent re-render', () => {
    const ref = renderHotTableWithProps(props(), false);
    const hot = ref.current!.hotInstance!;
    const tabs = () => hot.rootWrapperElement.querySelectorAll<HTMLElement>('.ht-sheets-bar__tab');

    act(() => {
      hot.listen();
      hot.getFocusScopeManager().activateScope('sheetsBar');
      tabs()[0].focus();
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });

    const focused = tabs()[1];

    expect(document.activeElement).toBe(focused);
    expect(focused.tabIndex).toBe(0);
    expect(tabs()[0].tabIndex).toBe(-1);

    renderHotTableWithProps(props(300), false, ref);

    expect(hot.getSettings().height).toBe(300);
    expect(tabs()[1]).toBe(focused);
    expect(document.activeElement).toBe(focused);
    expect(focused.tabIndex).toBe(0);
    expect(hot.getPlugin('sheetsBar').getSheets()[0].isActive).toBe(true);
  });
});
