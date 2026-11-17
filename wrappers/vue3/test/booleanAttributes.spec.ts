import { config, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { registerAllCellTypes } from 'handsontable/registry';
import HotTable from '../src/HotTable.vue';
import HotColumn from '../src/HotColumn.vue';
import { createSampleData, mockClientDimensions } from './_helpers';

config.renderStubDefaultSlot = true;

registerAllCellTypes();

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

/**
 * Mount a grid with the given template, wait for the column settings to reach it, and return its instance.
 *
 * @param {string} template The template of the grid.
 * @param {object} extraData The values the template reads.
 * @returns {Promise<object>} The mounted wrapper and the `Handsontable` instance.
 */
async function mountGrid(template: string, extraData: Record<string, unknown> = {}) {
  const wrapper = mount({
    components: { HotTable, HotColumn },
    data() {
      return {
        data: createSampleData(2, 2),
        init() {
          mockClientDimensions(this.rootElement, 400, 400);
        },
        ...extraData,
      };
    },
    template,
  }, { attachTo: document.getElementById('app') as HTMLElement });

  await nextTick();
  await nextTick();

  return { wrapper, hot: (wrapper.findComponent(HotTable).vm as any).hotInstance };
}

describe('boolean attributes without a value', () => {
  it('should enable the options a bare attribute names on `HotTable`', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey" readOnly rowHeaders contextMenu />
    `);

    expect(hot.getSettings().readOnly).toBe(true);
    expect(hot.getSettings().rowHeaders).toBe(true);
    expect(hot.getSettings().contextMenu).toBe(true);

    wrapper.unmount();
  });

  it('should enable the options a bare kebab-case attribute names on `HotTable`', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey" read-only row-headers />
    `);

    expect(hot.getSettings().readOnly).toBe(true);
    expect(hot.getSettings().rowHeaders).toBe(true);

    wrapper.unmount();
  });

  it('should enable the option a bare attribute names on `HotColumn`', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey">
        <HotColumn readOnly />
        <HotColumn />
      </HotTable>
    `);

    expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
    expect(hot.getCellMeta(0, 1).readOnly).toBe(false);

    wrapper.unmount();
  });

  it('should enable the option a bare kebab-case attribute names on `HotColumn`', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey">
        <HotColumn read-only />
      </HotTable>
    `);

    expect(hot.getCellMeta(0, 0).readOnly).toBe(true);

    wrapper.unmount();
  });

  it('should leave the options of absent props at their defaults', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey" />
    `);

    expect(hot.getSettings().readOnly).toBe(false);
    expect(hot.getSettings().rowHeaders).toBeUndefined();
    expect(hot.getSettings().contextMenu).toBeUndefined();

    wrapper.unmount();
  });

  it('should keep the value of a bound prop', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey"
                :readOnly="true" :allowInvalid="false" :rowHeaders="['a', 'b']" :colHeaders="false" />
    `);

    expect(hot.getSettings().readOnly).toBe(true);
    expect(hot.getSettings().allowInvalid).toBe(false);
    expect(hot.getSettings().rowHeaders).toEqual(['a', 'b']);
    expect(hot.getSettings().colHeaders).toBe(false);

    wrapper.unmount();
  });

  it('should leave the empty string of an option that also takes a string as it is', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey" fillHandle />
    `);

    expect(hot.getSettings().fillHandle).toBe('');

    wrapper.unmount();
  });

  it('should leave the empty string of an option that is not a boolean as it is', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey" placeholder />
    `);

    expect(hot.getSettings().placeholder).toBe('');

    wrapper.unmount();
  });

  it('should not cast the values of the `settings` prop', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey" :settings="settings" />
    `, { settings: { readOnly: '' } });

    expect(hot.getSettings().readOnly).toBe('');

    wrapper.unmount();
  });

  it('should read a bound empty string as a bare attribute', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey" :rowHeaders="''" />
    `);

    expect(hot.getSettings().rowHeaders).toBe(true);

    wrapper.unmount();
  });

  it('should let a bare attribute win over the same option in the `settings` prop', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey" :settings="settings" readOnly />
    `, { settings: { readOnly: false } });

    expect(hot.getSettings().readOnly).toBe(true);

    wrapper.unmount();
  });

  it('should not cast the values of the `settings` prop of a `HotColumn`', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey">
        <HotColumn :settings="settings" />
      </HotTable>
    `, { settings: { readOnly: '' } });

    expect(hot.getCellMeta(0, 0).readOnly).toBe('');

    wrapper.unmount();
  });

  it('should keep the option on when another prop changes', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey" :colHeaders="colHeaders" readOnly />
    `, { colHeaders: false });

    expect(hot.getSettings().readOnly).toBe(true);

    await wrapper.setData({ colHeaders: true });
    await nextTick();

    expect(hot.getSettings().colHeaders).toBe(true);
    expect(hot.getSettings().readOnly).toBe(true);

    wrapper.unmount();
  });

  it('should turn an option off again when the prop changes to `false`', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :licenseKey="testLicenseKey" :readOnly="readOnly" />
    `, { readOnly: true });

    expect(hot.getSettings().readOnly).toBe(true);

    await wrapper.setData({ readOnly: false });
    await nextTick();

    expect(hot.getSettings().readOnly).toBe(false);

    wrapper.unmount();
  });
});
