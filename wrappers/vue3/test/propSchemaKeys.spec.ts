import * as ts from 'typescript';
import { config, mount } from '@vue/test-utils';
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
 * Read the option names of an exported type of core's `settings.d.ts`, the way the type checker sees them,
 * which leaves out the index signature.
 *
 * @param {string} typeName The exported interface or type alias.
 * @returns {string[]} The names of the declared options.
 */
function getTypedOptionNames(typeName: string): string[] {
  const settingsFile = `${__dirname}/../node_modules/handsontable/settings.d.ts`;
  const program = ts.createProgram([settingsFile], {
    moduleResolution: ts.ModuleResolutionKind.Node10,
    skipLibCheck: true,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(settingsFile) as ts.SourceFile) as ts.Symbol;
  const typeSymbol = checker.getExportsOfModule(moduleSymbol).find(symbol => symbol.name === typeName) as ts.Symbol;

  return checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(typeSymbol)).map(symbol => symbol.name);
}

describe('props schema', () => {
  it.each([
    ['HotTable', 'SettingsUpdate'],
    ['HotColumn', 'ColumnSettings'],
  ] as const)('should declare a runtime prop for every option the `%s` props are typed with', (source, typeName) => {
    const runtimeProps = Object.keys(source === 'HotTable' ? propFactory('HotTable') : propFactory('HotColumn'));
    const typedOptions = getTypedOptionNames(typeName).filter(name => !DEAD_HOOKS.includes(name));

    expect(typedOptions.length).toBeGreaterThan(400);
    expect(typedOptions.filter(name => !runtimeProps.includes(name))).toEqual([]);
  });

  it('should pass the `handsontable` and `getValue` options of a column to its settings', () => {
    const getValue = () => 'value';
    const hot = mount({
      components: { HotTable, HotColumn },
      data() {
        return {
          data: createSampleData(1, 1),
          init() {
            mockClientDimensions(this.rootElement, 400, 400);
          },
          nested: { colHeaders: true },
          getValue,
        };
      },
      template: `
        <HotTable :data="data" :init="init" licenseKey="non-commercial-and-evaluation">
          <HotColumn title="A" :handsontable="nested" :getValue="getValue" />
        </HotTable>
      `,
    }, { attachTo: document.getElementById('app') as HTMLElement });
    const columnSettings = (hot.findComponent(HotTable).vm as any).columnSettings[0];

    expect(columnSettings.handsontable).toEqual({ colHeaders: true });
    expect(columnSettings.getValue).toBe(getValue);
  });
});
