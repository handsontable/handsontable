import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { registerAllModules } from 'handsontable/registry';
import HotTable from '../src/HotTable.vue';

registerAllModules();

beforeEach(() => {
  document.body.innerHTML = `
    <div id="app"></div>
  `;
});

describe('copyPaste', () => {
  it('should keep the pasted value, validation state, and settings correct across a paste-triggered re-render', async() => {
    // Mirrors the React wrapper's `hotTable.spec.tsx` paste-triggered re-render coverage
    // (Vue 3 has no wrapper-level clipboard test): a paste writes an invalid value, the
    // resulting `afterChange` mutates parent state bound to a Handsontable setting, and the
    // wrapper's `updateSettings` must not clobber the unchanged `columns`/`dataSchema`
    // (they are diffed out by `prepareSettings`) nor drop the invalid state.
    const App = {
      components: { HotTable },
      template: `
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          :dataSchema="dataSchema"
          :columns="columns"
          :data="tableData"
          :rowHeaders="true"
          :rowHeaderWidth="dynamicRowHeaderWidth"
          :afterValidate="onAfterValidate"
          :afterChange="onAfterChange"
          :afterUpdateSettings="(newSettings) => { this.sentSettings.push(newSettings); }"
          ></HotTable>`,
      data() {
        return {
          dataSchema: {
            paymentDivision: '',
            unitQuantity: 0,
            unitPrice: 0,
          },
          columns: [
            {
              data: 'paymentDivision',
              type: 'autocomplete',
              source: ['Development (D)', 'EPC (C)', 'SPV CAPEX (S)'],
              strict: true,
              allowInvalid: true,
            },
            {
              data: 'unitQuantity',
              type: 'numeric',
            },
            {
              data: 'unitPrice',
              type: 'numeric',
            },
          ],
          tableData: [{ paymentDivision: '', unitQuantity: 0, unitPrice: 0 }],
          // Parent state that flows into a Handsontable setting; bumping it on paste forces
          // the wrapper's `$props` watcher to fire `updateSettings` during the re-render.
          // `rowHeaderWidth` is deliberately outside the cell-meta cascade, so the re-render
          // instrument stays decoupled from the `htInvalid` cell state the test asserts.
          rerenderTick: 0,
          afterValidateCalls: [] as unknown[][],
          sentSettings: [] as Record<string, unknown>[],
        };
      },
      computed: {
        dynamicRowHeaderWidth(this: any): number {
          return 50 + this.rerenderTick;
        },
      },
      methods: {
        onAfterValidate(this: any, ...args: unknown[]) {
          // Block body on purpose: `afterValidate` is a filtering hook whose return value
          // overwrites `valid` in core. An expression-body arrow would return `Array#push`'s
          // length (truthy), flipping the cell to valid and silently killing the `htInvalid`
          // assertion. Keep the braces.
          this.afterValidateCalls.push(args);
        },
        onAfterChange(this: any, changes: unknown, source: string) {
          if (source !== 'CopyPaste.paste') {
            return;
          }

          this.rerenderTick += 1;
        },
      },
    };

    const testWrapper = mount(App, {
      attachTo: document.getElementById('app') as HTMLElement,
    });
    const hotInstance = testWrapper.getComponent(HotTable).vm.hotInstance;

    hotInstance.populateFromArray(
      0,
      0,
      [['INVALID DIVISION', '2', '10']],
      undefined,
      undefined,
      'CopyPaste.paste'
    );

    // Wait on the exact conditions asserted below, so the poll and the assertions cannot
    // disagree: the validator has run, and the re-render pushed its `rowHeaderWidth` update.
    const rerenderUpdateCaptured = () => testWrapper.vm.sentSettings.some(
      (settings: Record<string, unknown>) => Object.prototype.hasOwnProperty.call(settings, 'rowHeaderWidth')
    );

    for (let i = 0; i < 20 && (!rerenderUpdateCaptured() ||
      testWrapper.vm.afterValidateCalls.length === 0); i++) {
      // eslint-disable-next-line no-await-in-loop
      await nextTick();
    }

    // The paste value survives, is validated against the strict `autocomplete` source, and
    // is flagged invalid.
    expect(hotInstance.getDataAtCell(0, 0)).toBe('INVALID DIVISION');
    expect(testWrapper.vm.afterValidateCalls).toContainEqual(
      [false, 'INVALID DIVISION', 0, 'paymentDivision', 'CopyPaste.paste']
    );
    expect(hotInstance.getCell(0, 0).classList.contains('htInvalid')).toBe(true);

    // The re-render actually pushed an `updateSettings` through the wrapper (guards against a
    // vacuous test), and that update carried only the changed setting -- never the unchanged
    // `columns`/`dataSchema`, which would reset the grid mid-paste.
    expect(rerenderUpdateCaptured()).toBe(true);
    testWrapper.vm.sentSettings.forEach((settings) => {
      expect(Object.prototype.hasOwnProperty.call(settings, 'columns')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(settings, 'dataSchema')).toBe(false);
    });

    testWrapper.unmount();
  });
});
