import { config, mount } from '@vue/test-utils';
import { registerAllCellTypes } from 'handsontable/registry';
import { getCellType } from 'handsontable/cellTypes';
import HotTable from '../src/HotTable.vue';
import HotColumn from '../src/HotColumn.vue';
import {
  createSampleData,
  mockClientDimensions,
} from './_helpers';

config.renderStubDefaultSlot = true;

beforeEach(() => {
  document.body.innerHTML = `
    <div id="app"></div>
  `;
});

registerAllCellTypes();

/**
 * Builds a test component that renders a grid with the passed `HotColumn` markup.
 *
 * @param {string} columnsTemplate The `HotColumn` elements to render inside the grid.
 * @param {string} [tableProps] Extra props for the `HotTable` element.
 * @returns {object} The component definition.
 */
function createApp(columnsTemplate: string, tableProps = '') {
  return {
    components: { HotTable, HotColumn },
    data() {
      return {
        data: createSampleData(3, 3),
        init() {
          mockClientDimensions(this.rootElement, 400, 400);
        },
      };
    },
    template: `
      <HotTable :data="data" licenseKey="non-commercial-and-evaluation"
                :autoRowSize="false" :autoColumnSize="false"
                :width="300" :height="300" :rowHeights="23" :colWidths="50"
                :init="init" ${tableProps}>
        ${columnsTemplate}
      </HotTable>
    `,
  };
}

describe('an `editor` prop of `true`', () => {
  // `true` names no editor, so it has to read as "not passed". Before the core normalization the
  // raw `true` reached `getEditorInstance()`, which threw
  // 'Only strings and functions can be passed as "editor" parameter' on the first cell selection.
  it('should fall back to the default editor when passed to `HotTable`', () => {
    const testWrapper = mount(createApp('<HotColumn></HotColumn>', ':editor="true"'));
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.getCellEditor(0, 0)).toBe(getCellType('text').editor);
    expect(() => hotInstance.selectCell(0, 0)).not.toThrow();

    testWrapper.unmount();
  });

  it('should fall back to the default editor when passed to `HotColumn`', () => {
    const testWrapper = mount(createApp(`
      <HotColumn :editor="true"></HotColumn>
      <HotColumn></HotColumn>
    `));
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.getCellEditor(0, 0)).toBe(getCellType('text').editor);
    expect(() => hotInstance.selectCell(0, 0)).not.toThrow();

    // Control column - it carries no `editor` prop, so a harness that resolves no editor at all
    // would fail here instead of quietly passing the assertions above.
    expect(hotInstance.getCellEditor(0, 1)).toBe(getCellType('text').editor);
    expect(() => hotInstance.selectCell(0, 1)).not.toThrow();

    testWrapper.unmount();
  });

  it('should keep the editor supplied by the column `type`', () => {
    const testWrapper = mount(createApp(`
      <HotColumn :type="'numeric'" :editor="true"></HotColumn>
      <HotColumn :type="'numeric'"></HotColumn>
    `));
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    // The numeric editor must survive - `editor: true` used to block the `type` expansion.
    expect(hotInstance.getCellEditor(0, 0)).toBe(getCellType('numeric').editor);
    expect(() => hotInstance.selectCell(0, 0)).not.toThrow();

    // Control column - the same `type` with no `editor` prop.
    expect(hotInstance.getCellEditor(0, 1)).toBe(getCellType('numeric').editor);

    testWrapper.unmount();
  });

  it('should keep the editor inherited from the `HotTable` level', () => {
    const testWrapper = mount(
      createApp('<HotColumn :editor="true"></HotColumn>', ':editor="\'password\'"')
    );
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.getCellEditor(0, 0)).toBe(getCellType('password').editor);

    testWrapper.unmount();
  });
});

describe('an `editor` prop of `false`', () => {
  it('should still disable editing when passed to `HotTable`', () => {
    const testWrapper = mount(createApp('<HotColumn></HotColumn>', ':editor="false"'));
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.getCellEditor(0, 0)).toBe(false);

    testWrapper.unmount();
  });

  it('should still disable editing when passed to `HotColumn`', () => {
    const testWrapper = mount(createApp(`
      <HotColumn :type="'numeric'" :editor="false"></HotColumn>
      <HotColumn :type="'numeric'"></HotColumn>
    `));
    const { hotInstance } = testWrapper.getComponent(HotTable).vm;

    expect(hotInstance.getCellEditor(0, 0)).toBe(false);
    // Control column - proves the grid resolves editors for the same `type`.
    expect(hotInstance.getCellEditor(0, 1)).toBe(getCellType('numeric').editor);

    testWrapper.unmount();
  });
});
