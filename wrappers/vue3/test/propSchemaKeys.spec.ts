import * as ts from 'typescript';
import { config, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { registerAllCellTypes } from 'handsontable/registry';
import HotTable from '../src/HotTable.vue';
import HotColumn from '../src/HotColumn.vue';
import { propFactory } from '../src/helpers';
import { createSampleData, mockClientDimensions } from './_helpers';

declare const __dirname: string;

config.renderStubDefaultSlot = true;

registerAllCellTypes();

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

/**
 * Hook names the settings types list, but core neither registers nor fires: `ObserveChanges` is gone.
 * The props schema leaves them out of the types too, so no prop is typed that cannot work.
 */
const DEAD_HOOKS = ['afterChangesObserved'];

/**
 * The option names of a type the settings types export, read the way the type checker sees them, which
 * leaves out the index signature. The program covers core's whole `.d.ts` graph, so it is built once.
 */
let settingsTypeNames: (typeName: string) => string[];

beforeAll(() => {
  const settingsFile = `${__dirname}/../node_modules/handsontable/settings.d.ts`;
  const program = ts.createProgram([settingsFile], {
    moduleResolution: ts.ModuleResolutionKind.Node10,
    skipLibCheck: true,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(settingsFile) as ts.SourceFile) as ts.Symbol;
  const exportedSymbols = checker.getExportsOfModule(moduleSymbol);

  settingsTypeNames = (typeName) => {
    const typeSymbol = exportedSymbols.find(symbol => symbol.name === typeName) as ts.Symbol;

    return checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(typeSymbol)).map(symbol => symbol.name);
  };
}, 30000);

/**
 * Mount a grid with the given template, wait for the column settings to reach it, and return its instance.
 *
 * @param {string} template The template of the `HotTable`.
 * @param {object} extraData The values the template reads.
 * @returns {Promise<object>} The mounted wrapper and the `Handsontable` instance.
 */
async function mountGrid(template: string, extraData: Record<string, unknown>) {
  const wrapper = mount({
    components: { HotTable, HotColumn },
    data() {
      return {
        data: createSampleData(1, 1),
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

describe('props schema', () => {
  it.each([
    ['HotTable', 'SettingsUpdate', []],
    // Core reads `getValue` from the table meta only, so a column does not declare it.
    ['HotColumn', 'ColumnSettings', ['getValue']],
  ] as const)('should declare a runtime prop for every option the `%s` props are typed with', (
    source,
    typeName,
    notProps
  ) => {
    const runtimeProps = Object.keys(source === 'HotTable' ? propFactory('HotTable') : propFactory('HotColumn'));
    const typedOptions = settingsTypeNames(typeName)
      .filter(name => !DEAD_HOOKS.includes(name) && !(notProps as readonly string[]).includes(name));

    expect(typedOptions.length).toBeGreaterThan(400);
    expect(typedOptions.filter(name => !runtimeProps.includes(name))).toEqual([]);
  });

  it('should pass the `handsontable` option of a column to the grid', async() => {
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" licenseKey="non-commercial-and-evaluation">
        <HotColumn title="A" :handsontable="nested" />
      </HotTable>
    `, { nested: { colHeaders: true } });

    expect(hot.getCellMeta(0, 0).handsontable).toEqual({ colHeaders: true });

    wrapper.unmount();
  });

  it('should pass the `handsontable` and `getValue` options of `HotTable` to the grid, not to the root element', async() => {
    const getValue = () => 'value';
    const { wrapper, hot } = await mountGrid(`
      <HotTable :data="data" :init="init" :handsontable="nested" :getValue="getValue"
                licenseKey="non-commercial-and-evaluation" />
    `, { nested: { colHeaders: true }, getValue });

    expect(hot.getSettings().handsontable).toEqual({ colHeaders: true });
    expect(hot.getSettings().getValue).toBe(getValue);
    expect(wrapper.findComponent(HotTable).element.hasAttribute('handsontable')).toBe(false);
    expect(wrapper.findComponent(HotTable).element.hasAttribute('getvalue')).toBe(false);

    wrapper.unmount();
  });
});
