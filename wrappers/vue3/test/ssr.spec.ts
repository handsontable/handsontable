/* eslint-disable no-console */
import * as vue from 'vue';
import { createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { mount } from '@vue/test-utils';
import HotTable from '../src/HotTable.vue';
import { createSampleData } from './_helpers';

const licenseKey = 'non-commercial-and-evaluation';

/**
 * Loads a separate copy of the `HotTable` component, the way the server and the browser
 * each load their own copy of the wrapper module.
 *
 * @returns {object} The component definition.
 */
function loadIsolatedHotTable() {
  let component;

  jest.isolateModules(() => {
    // Keep a single Vue copy: a component rendered by another copy has no current render instance.
    jest.doMock('vue', () => vue);
    component = jest.requireActual('../src/HotTable.vue').default;
  });

  return component;
}

describe('Server-side rendering', () => {
  it('should not render an auto-generated `id` attribute on the server', async() => {
    const html = await renderToString(createSSRApp({
      render: () => h(HotTable, { data: createSampleData(1, 1), licenseKey }),
    }));

    expect(html).not.toMatch(/\bid=/);
  });

  it('should render an explicitly passed `id` on the server', async() => {
    const html = await renderToString(createSSRApp({
      render: () => h(HotTable, { id: 'my-grid', data: createSampleData(1, 1), licenseKey }),
    }));

    expect(html).toMatch(/\bid="my-grid"/);
  });

  it('should hydrate the server-rendered markup without an attribute mismatch warning', async() => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const ServerHotTable = loadIsolatedHotTable();
    const ClientHotTable = loadIsolatedHotTable();
    const html = await renderToString(createSSRApp({
      render: () => h(ServerHotTable, { data: createSampleData(1, 1), licenseKey }),
    }));
    const container = document.createElement('div');

    container.innerHTML = html;
    document.body.appendChild(container);

    const app = createSSRApp({
      render: () => h(ClientHotTable, { data: createSampleData(1, 1), licenseKey }),
    });

    app.mount(container);

    const hydrationWarnings = warnSpy.mock.calls.filter(args => String(args[0]).includes('Hydration'));

    expect(hydrationWarnings).toEqual([]);

    app.unmount();
    container.remove();
    warnSpy.mockRestore();
  });
});

describe('Auto-generated container `id`', () => {
  it('should be set on the container after the component is mounted', async() => {
    const testWrapper = mount(HotTable, {
      props: {
        data: createSampleData(1, 1),
        licenseKey,
      },
    });

    await nextTick();

    expect(testWrapper.element.id).toMatch(/^hot-/);

    testWrapper.unmount();
  });

  it('should be unique for every `HotTable` instance', async() => {
    const first = mount(HotTable, { props: { data: createSampleData(1, 1), licenseKey } });
    const second = mount(HotTable, { props: { data: createSampleData(1, 1), licenseKey } });

    await nextTick();

    expect(first.element.id).toMatch(/^hot-/);
    expect(second.element.id).toMatch(/^hot-/);
    expect(first.element.id).not.toBe(second.element.id);

    first.unmount();
    second.unmount();
  });

  it('should not override an explicitly passed `id`', () => {
    const testWrapper = mount(HotTable, {
      props: {
        id: 'my-grid',
        data: createSampleData(1, 1),
        licenseKey,
      },
    });

    expect(testWrapper.element.id).toBe('my-grid');

    testWrapper.unmount();
  });
});
