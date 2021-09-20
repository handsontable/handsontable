import HotTable from '../src/HotTable.vue';
import BaseEditorComponent from '../src/BaseEditorComponent.vue';
import { HOT_DESTROYED_WARNING } from '../src/helpers';
import { mount } from '@vue/test-utils';
import {
  createDomContainer,
  createSampleData,
  mockClientDimensions,
} from './_helpers';
import { LRUMap } from '../src/lib/lru/lru';
// @ts-ignore
import { createApp, defineComponent, h } from 'vue';

describe('hotInit', () => {
  it('should initialize Handsontable and assign it to the `hotInstace` property of the provided object', () => {
    const testWrapper = mount(HotTable, {
      propsData: {
        data: createSampleData(1, 1),
        licenseKey: 'non-commercial-and-evaluation',
      },
    });

    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;
    expect(typeof hotTableComponent.hotInstance).toEqual('object');
    expect(hotTableComponent.hotInstance.getDataAtCell(0, 0)).toEqual('0-0');
    
    testWrapper.unmount();
  });
});

describe('Updating the Handsontable settings', () => {
  it('should update the previously initialized Handsontable instance with a single changed property', async () => {
    let updateSettingsCalls = 0;
    const testWrapper = mount(HotTable, {
      propsData: {
        data: createSampleData(1, 1),
        licenseKey: 'non-commercial-and-evaluation',
        rowHeaders: true,
        afterUpdateSettings () {
          updateSettingsCalls++;
        },
      },
    });

    const hotTableComponent = testWrapper.getComponent(HotTable as any);
    expect(hotTableComponent.vm.hotInstance.getSettings().rowHeaders).toEqual(true);

    await testWrapper.setProps({
      rowHeaders: false,
    });

    expect(updateSettingsCalls).toEqual(1);
    expect(hotTableComponent.vm.hotInstance.getSettings().rowHeaders).toEqual(false);
    
    testWrapper.unmount();
  });

  it('should update the previously initialized Handsontable instance only once with multiple changed properties', async () => {
    let updateSettingsCalls = 0;
    const appComponent = {
      props: {},
      data () {
        return {
          rowHeaders: true,
          colHeaders: true,
          readOnly: true,
        };
      },
      methods: {
        updateData () {
          this.rowHeaders = false;
          this.colHeaders = false;
          this.readOnly = false;
        },
      },
      render () {
        // HotTable
        return h(HotTable, {
          ref: 'dataGrid',

          licenseKey: 'non-commercial-and-evaluation',
          rowHeaders: this.rowHeaders,
          colHeaders: this.colHeaders,
          readOnly: this.readOnly,
          afterUpdateSettings () {
            updateSettingsCalls++;
          },
        });
      },
    };

    let testWrapper = mount(appComponent);

    const hotTableComponent = testWrapper.vm.$refs.dataGrid;

    expect(hotTableComponent.hotInstance.getSettings().rowHeaders).toEqual(true);
    expect(hotTableComponent.hotInstance.getSettings().colHeaders).toEqual(true);
    expect(hotTableComponent.hotInstance.getSettings().readOnly).toEqual(true);

    await testWrapper.vm.updateData();

    expect(updateSettingsCalls).toEqual(1);
    expect(hotTableComponent.hotInstance.getSettings().rowHeaders).toEqual(false);
    expect(hotTableComponent.hotInstance.getSettings().colHeaders).toEqual(false);
    expect(hotTableComponent.hotInstance.getSettings().readOnly).toEqual(false);
  });

  it('should update the previously initialized Handsontable instance with only the options that are passed to the' +
    ' component as props and actually changed', async () => {
    let newHotSettings = [];
    const appComponent = {
      props: {},
      data () {
        return {
          rowHeaders: true,
          colHeaders: true,
          readOnly: true,
        };
      },
      methods: {
        updateData () {
          this.rowHeaders = false;
          this.colHeaders = false;
          this.readOnly = false;
        },
      },
      render () {
        // HotTable
        return h(HotTable, {
          ref: 'grid',

          licenseKey: 'non-commercial-and-evaluation',
          rowHeaders: this.rowHeaders,
          colHeaders: this.colHeaders,
          readOnly: this.readOnly,
          minSpareRows: 4,
          afterUpdateSettings (newSettings) {
            newHotSettings = newSettings;
          },

        });
      },
    };

    let testWrapper = mount(appComponent);

    testWrapper.vm.updateData();

    await testWrapper.vm.$nextTick();

    expect(Object.keys(newHotSettings).length).toBe(3);
    
    testWrapper.unmount();
  });

  it('should not call Handsontable\'s `updateSettings` method, when the table data was changed by reference, and the' +
    ' dataset is an array of arrays', async () => {
    let newHotSettings = null;
    const appComponent = {
      props: {},
      data () {
        return {
          data: [[1, 2, 3]],
        };
      },
      methods: {
        modifyFirstRow () {
          this.data[0] = [22, 32, 42];
        },
        addRow () {
          this.data.push([2, 3, 4]);
        },
        removeRow () {
          this.data.pop();

        },
      },
      render () {
        // HotTable
        return h(HotTable, {
          ref: 'grid',

          licenseKey: 'non-commercial-and-evaluation',
          data: this.data,
          afterUpdateSettings (newSettings) {
            newHotSettings = newSettings;
          },

        });
      },
    };

    let testWrapper = mount(appComponent);

    testWrapper.vm.addRow();

    await testWrapper.vm.$nextTick();

    expect(testWrapper.vm.$refs.grid.hotInstance.getData()).toEqual([[1, 2, 3], [2, 3, 4]]);
    expect(newHotSettings).toBe(null);

    testWrapper.vm.removeRow();

    await testWrapper.vm.$nextTick();

    expect(testWrapper.vm.$refs.grid.hotInstance.getData()).toEqual([[1, 2, 3]]);
    expect(newHotSettings).toBe(null);

    testWrapper.vm.modifyFirstRow();

    await testWrapper.vm.$nextTick();

    expect(testWrapper.vm.$refs.grid.hotInstance.getData()).toEqual([[22, 32, 42]]);
    expect(newHotSettings).toBe(null);

    testWrapper.vm.removeRow();

    await testWrapper.vm.$nextTick();

    expect(testWrapper.vm.$refs.grid.hotInstance.getData()).toEqual([]);
    expect(newHotSettings).toBe(null);
    
    testWrapper.unmount();
  });

  it('should call Handsontable\'s `updateSettings` method, when the table data was changed by reference while the' +
    ' dataset is an array of object and property number changed', async () => {
    let newHotSettings = null;
    const appComponent = {
      props: {},
      data () {
        return {
          data: [{ a: 1, b: 2, c: 3 }],
        };
      },
      methods: {
        updateData (changedRow) {
          this.data[0] = { ...changedRow };
        },
      },
      render () {
        // HotTable
        return h(HotTable, {
          ref: 'grid',

          licenseKey: 'non-commercial-and-evaluation',
          data: this.data,
          afterUpdateSettings (newSettings) {
            newHotSettings = newSettings;
          },

        });
      },
    };

    let testWrapper = mount(appComponent);

    testWrapper.vm.updateData({ a: 1, b: 2, c: 3, d: 4 });

    await testWrapper.vm.$nextTick();

    expect(testWrapper.vm.$refs.grid.hotInstance.getData()).toEqual([[1, 2, 3, 4]]);
    expect(JSON.stringify(newHotSettings)).toBe(JSON.stringify({
      data: [{ a: 1, b: 2, c: 3, d: 4 }],
    }));

    testWrapper.vm.updateData({ a: 1 });

    await testWrapper.vm.$nextTick();

    expect(testWrapper.vm.$refs.grid.hotInstance.getData()).toEqual([[1]]);
    expect(JSON.stringify(newHotSettings)).toBe(JSON.stringify({
      data: [{ a: 1 }],
    }));
    
    testWrapper.unmount();
  });

  it('should NOT call Handsontable\'s `updateSettings` method, when the table data was changed by reference while the' +
    ' dataset is an array of object and property number DID NOT change', async () => {
    let newHotSettings = null;
    const appComponent = {
      props: {},
      data () {
        return {
          data: [{ a: 1, b: 2, c: 3 }],
        };
      },
      methods: {
        addRow () {
          this.data.push({ a: 12, b: 22, c: 32 });
        },
        removeRow () {
          this.data.pop();
        },
      },
      render () {
        // HotTable
        return h(HotTable, {
          ref: 'grid',

          licenseKey: 'non-commercial-and-evaluation',
          data: this.data,
          afterUpdateSettings (newSettings) {
            newHotSettings = newSettings;
          },

        });
      },
    };

    let testWrapper = mount(appComponent);

    testWrapper.vm.addRow();

    await testWrapper.vm.$nextTick();

    expect(testWrapper.vm.$refs.grid.hotInstance.getData()).toEqual([[1, 2, 3], [12, 22, 32]]);
    expect(newHotSettings).toBe(null);

    testWrapper.vm.removeRow();

    await testWrapper.vm.$nextTick();

    expect(testWrapper.vm.$refs.grid.hotInstance.getData()).toEqual([[1, 2, 3]]);
    expect(newHotSettings).toBe(null);
    
    testWrapper.unmount();
  });
});

describe('getRendererWrapper', () => {
  it('should create the wrapper function for the provided renderer child component', () => {
    // mocks
    const mockVNode = { // todo: outdated VNode structure
      componentOptions: {
        Ctor: class {
          $mount () {
            return {
              $data: {},
              $el: document.createElement('TD'),
            };
          }
        },
      },
    };
    const mockComponent = {
      editorCache: new Map(),
      rendererCache: new LRUMap(100),
      $parent: {},
    };

    const getRendererWrapper = (HotTable as any).methods.getRendererWrapper;
    const mockTD = document.createElement('TD');

    expect(typeof getRendererWrapper.call(mockComponent, mockVNode, mockComponent)).toEqual('function');
    expect(getRendererWrapper.call(mockComponent, mockVNode, mockComponent)({}, mockTD, 0, 0, 0, '', {})).toEqual(mockTD);
  });
});

describe('getEditorClass', () => {
  it('should create a fresh class to be used as an editor, based on the editor component provided.', () => {
    // mocks
    const mockVNode = { // todo: outdated VNode structure
      componentOptions: {
        Ctor: class {
          static get options () {
            return {
              name: 'name',
            };
          }

          $mount () {
            return {
              $data: {
                hotCustomEditorClass: class B {
                  prepare () {
                    return 'not-undefined';
                  }
                },
              },
              $el: document.createElement('TD'),
            };
          }
        },
      },
    };
    const mockComponent = {
      editorCache: new Map(),
      rendererCache: new LRUMap(100),
      $parent: {},
    };

    const getEditorClass = (HotTable as any).methods.getEditorClass;
    const editorClass = getEditorClass.call(mockComponent, mockVNode, mockComponent);

    expect(editorClass.constructor).not.toEqual(void 0);
    expect(editorClass.prototype.prepare).not.toEqual(void 0);
  });
});

xdescribe('Global editors and renderers', () => {
  it('should allow defining renderer and editor components to work globally on the entire table', () => {
    const dummyHtmlElement = document.createElement('DIV');
    dummyHtmlElement.id = 'dummy';

    const App = {
      props: {},
      render() {
        // HotTable
        return h(HotTable, {
          data: createSampleData(50, 2),
          autoRowSize: false,
          autoColumnSize: false,
          licenseKey: 'non-commercial-and-evaluation',
          width: 400,
          height: 400,
          init() {
            mockClientDimensions(this.rootElement, 400, 400);
          }
        }, () => [
          h('editor-component', {
              'hot-renderer': true
          }),
          h('renderer-component', {
              'hot-editor': true
          })
        ])
      }
    }

    let testWrapper = mount(App, {
      attachTo: createDomContainer(),
      global: {
        components: {
          'editor-component': {
            // extends: BaseEditorComponent,
            render() {
              return h('div', {
                'id': 'dummy-editor'
              });
            }
          },
          'renderer-component': {
            render() {
              return h('div', {
                'id': 'dummy-renderer'
              });
            }
          }
        }
      }
    });
    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;
    const globalEditor = hotTableComponent.hotInstance.getSettings().editor;
    const globalEditorInstance = new globalEditor(hotTableComponent.hotInstance);

    expect(globalEditorInstance._fullEditMode).toEqual(false);
    expect(globalEditorInstance.hot).toEqual(hotTableComponent.hotInstance);
    expect(hotTableComponent.hotInstance.getSettings().renderer(hotTableComponent.hotInstance, document.createElement('DIV'), 555, 0, 0, '0', {}).childNodes[0].id).toEqual('dummy-renderer');

    testWrapper.unmount();
  });
});

xit('should inject an `isRenderer` and `isEditor` properties to renderer/editor components', () => {
  const dummyEditorComponent = {
    props: {},
    name: 'EditorComponent',
    // extends: BaseEditorComponent,
    render () {
      return h('div', {
        'attrs': {
          'id': 'dummy-editor',
        },
      });
    },
  };

  const dummyRendererComponent = {
    props: {},
    name: 'RendererComponent',
    render () {
      return h('div', {
        'attrs': {
          'id': 'dummy-renderer',
        },
      });
    },
  };

  const appComponent = {
    props: {},
    render () {
      // HotTable
      return h(HotTable, {
        data: createSampleData(50, 2),
        licenseKey: 'non-commercial-and-evaluation',
        autoRowSize: false,
        autoColumnSize: false,

      }, 
        () => [
        h(dummyRendererComponent, {
            'hot-renderer': true, // todo: hot-renderer is postponed for now
        }),
        h(dummyEditorComponent, {
            'hot-editor': true, // todo: hot-editor is postponed for now
        }),
      ]
      );
    },
  };

  const testWrapper = mount(appComponent);
  const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;

  expect(hotTableComponent.rendererCache.get('0-0').component.$data.isRenderer).toEqual(true);
  expect(hotTableComponent.editorCache.get('EditorComponent').$data.isEditor).toEqual(true);

  testWrapper.unmount();
});

it('should be possible to access the `hotInstance` property of the HotTable instance from a parent-component', () => {
  let hotInstanceFromRef = 'not-set';
  const appComponent = {
    props: {},
    data () {
      return {
        rowHeaders: true,
        colHeaders: true,
        readOnly: true,
      };
    },
    methods: {
      cellsCallback () {
        if (hotInstanceFromRef === 'not-set') {
          hotInstanceFromRef = this.$refs.hTable.hotInstance;
        }
      },
    },
    render: function () {
      // HotTable
      return h(HotTable, {
        ref: 'hTable',

        licenseKey: 'non-commercial-and-evaluation',
        rowHeaders: this.rowHeaders,
        colHeaders: this.colHeaders,
        readOnly: this.readOnly,
        cells: this.cellsCallback
      })
    }
  };

  let testWrapper = mount(appComponent, {
    attachTo: createDomContainer()
  });

  expect(['not-set', null].includes(hotInstanceFromRef)).toBe(false);

  testWrapper.unmount();
});

xit('should be possible to pass props to the editor and renderer components', () => {
  const dummyEditorComponent = {
    name: 'EditorComponent',
    // extends: BaseEditorComponent,
    props: ['test-prop'],
    render () {
      return h('div', {});
    },
  };

  const dummyRendererComponent = {
    name: 'RendererComponent',
    props: ['test-prop'],
    render () {
      return h('div', {});
    },
  };

  const appComponent = {
    props: {},
    render () {
      // HotTable
      return h(HotTable, {
        data: createSampleData(1, 1),
        licenseKey: 'non-commercial-and-evaluation',
      }, () => [
        h(dummyRendererComponent, {
            'hot-renderer': true, // todo: hot-renderer is postponed
            'test-prop': 'test-prop-value',
        }),
        h(dummyEditorComponent, {
            'hot-editor': true, // todo: hot-renderer is postponed
            'test-prop': 'test-prop-value',
        }),
      ]);
    },
  };

  let testWrapper = mount(appComponent, {
    attachTo: createDomContainer()
  });
  const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;

  expect(hotTableComponent.rendererCache.get('0-0').component.$props.testProp).toEqual('test-prop-value');
  expect(hotTableComponent.editorCache.get('EditorComponent').$props.testProp).toEqual('test-prop-value');

  testWrapper.unmount();
});

it('should display a warning and not throw any errors, when the underlying Handsontable instance ' +
  'has been destroyed', () => {
  const warnFunc = console.warn;
  const testWrapper = mount(HotTable, {
    propsData: {
      data: [[1]],
      licenseKey: 'non-commercial-and-evaluation',
    },
  });
  const warnCalls = [];

  console.warn = (warningMessage) => {
    warnCalls.push(warningMessage);
  };

  expect(testWrapper.vm.hotInstance.isDestroyed).toEqual(false);

  testWrapper.vm.hotInstance.destroy();

  expect(testWrapper.vm.hotInstance).toEqual(null);

  expect(warnCalls.length).toBeGreaterThan(0);
  warnCalls.forEach((message) => {
    expect(message).toEqual(HOT_DESTROYED_WARNING);
  });

  testWrapper.unmount();

  console.warn = warnFunc;
});

describe('HOT-based CRUD actions', () => {
  it('should should not add/remove any additional rows when calling `alter` on the HOT instance', async () => {
    const testWrapper = mount(HotTable, {
      propsData: {
        licenseKey: 'non-commercial-and-evaluation',
        data: createSampleData(4, 4),
        rowHeaders: true,
        colHeaders: true,
      },
    });
    const hotInstance = testWrapper.vm.hotInstance;

    hotInstance.alter('insert_row', 2, 2);
    hotInstance.alter('insert_col', 2, 2);

    await testWrapper.vm.$nextTick();

    expect(hotInstance.countRows()).toEqual(6);
    expect(hotInstance.countSourceRows()).toEqual(6);
    expect(hotInstance.countCols()).toEqual(6);
    expect(hotInstance.countSourceCols()).toEqual(6);
    expect(hotInstance.getSourceData().length).toEqual(6);
    expect(hotInstance.getSourceData()[0].length).toEqual(6);

    hotInstance.alter('remove_row', 2, 2);
    hotInstance.alter('remove_col', 2, 2);

    expect(hotInstance.countRows()).toEqual(4);
    expect(hotInstance.countSourceRows()).toEqual(4);
    expect(hotInstance.countCols()).toEqual(4);
    expect(hotInstance.countSourceCols()).toEqual(4);
    expect(hotInstance.getSourceData().length).toEqual(4);
    expect(hotInstance.getSourceData()[0].length).toEqual(4);
    
    testWrapper.unmount();
  });
});

xdescribe('Non-HOT based CRUD actions', () => {
  it('should not add/remove any additional rows when modifying a data array passed to the wrapper', async () => {
    const externalData = createSampleData(4, 4);
    const testWrapper = mount({
      props: {},
      render () {
        return h(HotTable, {
          licenseKey: 'non-commercial-and-evaluation',
          rowHeaders: true,
          colHeaders: true,
          data: externalData,
          ref: 'dataGrid',
        });
      },
      setup() {
        return {
          data: createSampleData(4, 4)
        }
      },
      methods: {
        add () {
          this.data.push(this.data[0], this.data[0]);
          this.data[0].push('test', 'test');
        },
        remove () {
          this.data.pop();
          this.data.pop();
          this.data[0].pop();
          this.data[0].pop();
        },
      },
    });

    const hotInstance = testWrapper.vm.$refs.dataGrid.hotInstance;


    externalData.push(externalData[0], externalData[0]);
    externalData[0].push('test', 'test');
    
    await testWrapper.vm.$nextTick();

    expect(hotInstance.countRows()).toEqual(6);
    expect(hotInstance.countSourceRows()).toEqual(6);
    expect(hotInstance.countCols()).toEqual(6);
    expect(hotInstance.countSourceCols()).toEqual(6);
    expect(hotInstance.getSourceData().length).toEqual(6);
    expect(hotInstance.getSourceData()[0].length).toEqual(6);
    
    externalData.pop();
    externalData.pop();
    externalData[0].pop();
    externalData[0].pop();
    await testWrapper.vm.$nextTick();

    expect(hotInstance.countRows()).toEqual(4);
    expect(hotInstance.countSourceRows()).toEqual(4);
    expect(hotInstance.countCols()).toEqual(4);
    expect(hotInstance.countSourceCols()).toEqual(4);
    expect(hotInstance.getSourceData().length).toEqual(4);
    expect(hotInstance.getSourceData()[0].length).toEqual(4);
    
    testWrapper.unmount()
  });
});

describe('cooperation with NestedRows plugin', () => {
  it('should display dataset properly #7548', async () => {
    const testWrapper = mount(HotTable, {
      propsData: {
        data: [{
          col1: 'parent1',
          __children: [
            {
              col1: 'p1.c1',
            }, {
              col1: 'p1.c2',
            },
          ],
        }, {
          col1: 'parent2',
          __children: [
            {
              col1: 'p2.c1',
            }, {
              col1: 'p2.c2',
            }, {
              col1: 'p2.c3',
            },
          ],
        }],
        rowHeaders: true,
        colHeaders: true,
        nestedRows: true,
        licenseKey: 'non-commercial-and-evaluation',
      },
    });

    expect(testWrapper.vm.hotInstance.countRows()).toEqual(7);

    await testWrapper.vm.$nextTick();

    expect(testWrapper.vm.hotInstance.countRows()).toEqual(7);

    testWrapper.unmount();
  });
});
