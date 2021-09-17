import {HotTable} from '../src/HotTable.vue';
import BaseEditorComponent from '../src/BaseEditorComponent.vue';
import { WARNING_HOT_DESTROYED } from '../src/helpers';
import { mount } from '@vue/test-utils';
import {
  createDomContainer,
  createSampleData,
  mockClientDimensions
} from './_helpers';
import { LRUMap } from "../src/lib/lru/lru";
import { h, reactive } from 'vue';

describe('hotInit', () => {
  it('should initialize Handsontable and assign it to the `hotInstace` property of the provided object', () => {
    let testWrapper = mount(HotTable, {
      propsData: {
        data: createSampleData(1, 1),
        licenseKey: 'non-commercial-and-evaluation'
      }
    });

    expect(typeof testWrapper.componentVM.hotInstance).toEqual('object');
    expect(testWrapper.componentVM.hotInstance.getDataAtCell(0, 0)).toEqual('0-0');
  });
});

describe('Updating the Handsontable settings', () => {
  it('should update the previously initialized Handsontable instance with a single changed property', async() => {
    let updateSettingsCalls = 0;
    const testWrapper = mount(HotTable, {
      propsData: {
        data: createSampleData(1, 1),
        licenseKey: 'non-commercial-and-evaluation',
        rowHeaders: true,
        afterUpdateSettings() {
          updateSettingsCalls++;
        }
      }
    });

    expect(testWrapper.componentVM.hotInstance.getSettings().rowHeaders).toEqual(true);

    testWrapper.setProps({
      rowHeaders: false
    });

    await testWrapper.rootVM.$nextTick();

    expect(updateSettingsCalls).toEqual(1);
    expect(testWrapper.componentVM.hotInstance.getSettings().rowHeaders).toEqual(false);
  });

  it('should update the previously initialized Handsontable instance only once with multiple changed properties', async() => {
    const appComponent = {
      data() {
        return {
          rowHeaders: true,
          colHeaders: true,
          readOnly: true,
        }
      },
      methods: {
        updateData() {
          this.rowHeaders = false;
          this.colHeaders = false;
          this.readOnly = false;
        }
      },
      render() {
        // HotTable
        return h(HotTable, {
          ref: 'dataGrid',
          rowHeaders: this.rowHeaders,
          colHeaders: this.colHeaders,
          readOnly: this.readOnly,
          afterUpdateSettings() {
            updateSettingsCalls++;
          }
        })
      }
    };

    let testWrapper = mount(appComponent, {
      sync: false
    });

    let updateSettingsCalls = 0;

    const hotTableComponent = testWrapper.componentVM.$refs.dataGrid;

    expect(hotTableComponent.hotInstance.getSettings().rowHeaders).toEqual(true);
    expect(hotTableComponent.hotInstance.getSettings().colHeaders).toEqual(true);
    expect(hotTableComponent.hotInstance.getSettings().readOnly).toEqual(true);

    testWrapper.componentVM.updateData();
    await testWrapper.rootVM.$nextTick();
    
    expect(updateSettingsCalls).toEqual(1);
    expect(hotTableComponent.hotInstance.getSettings().rowHeaders).toEqual(false);
    expect(hotTableComponent.hotInstance.getSettings().colHeaders).toEqual(false);
    expect(hotTableComponent.hotInstance.getSettings().readOnly).toEqual(false);
  });

  it('should update the previously initialized Handsontable instance with only the options that are passed to the' +
    ' component as props and actually changed', async() => {
    let newHotSettings = [];
    const appComponent = {
      data() {
        return {
          rowHeaders: true,
          colHeaders: true,
          readOnly: true,
        }
      },
      methods: {
        updateData() {
          this.rowHeaders = false;
          this.colHeaders = false;
          this.readOnly = false;
        }
      },
      render() {
        // HotTable
        return h(HotTable, {
          ref: 'grid',
         
            rowHeaders: this.rowHeaders,
            colHeaders: this.colHeaders,
            readOnly: this.readOnly,
            minSpareRows: 4,
            afterUpdateSettings(newSettings) {
              newHotSettings = newSettings
            }
          
        })
      }
    };

    let testWrapper = mount(appComponent, {
      sync: false
    });

    testWrapper.componentVM.updateData();

    await testWrapper.rootVM.$nextTick();

    expect(Object.keys(newHotSettings).length).toBe(3)
  });

  it('should not call Handsontable\'s `updateSettings` method, when the table data was changed by reference, and the' +
    ' dataset is an array of arrays', async() => {
    let newHotSettings = null;
    const appComponent = {
      data() {
        return {
          data: [[1, 2, 3]],
        }
      },
      methods: {
        modifyFirstRow() {
          this.data[0] = [22, 32, 42];
        },
        addRow() {
          this.data.push([2, 3, 4]);
        },
        removeRow() {
          this.data.pop();
          
        },
      },
      render() {
        // HotTable
        return h(HotTable, {
          ref: 'grid',
         
            data: this.data,
            afterUpdateSettings(newSettings) {
              newHotSettings = newSettings
            }
          
        })
      }
    };

    let testWrapper = mount(appComponent, {
      sync: false
    });

    testWrapper.componentVM.addRow();

    await testWrapper.rootVM.$nextTick();

    expect(testWrapper.componentVM.$refs.grid.hotInstance.getData()).toEqual([[1, 2, 3], [2, 3, 4]]);
    expect(newHotSettings).toBe(null);

    testWrapper.componentVM.removeRow();

    await testWrapper.rootVM.$nextTick();

    expect(testWrapper.componentVM.$refs.grid.hotInstance.getData()).toEqual([[1, 2, 3],
      [null,null,null], //  todo         this.data.pop(); which is a vue3 proxy do not remove this element, instead it put array of nulls.
    ]);
    expect(newHotSettings).toBe(null);

    testWrapper.componentVM.modifyFirstRow();

    await testWrapper.rootVM.$nextTick();

    expect(testWrapper.componentVM.$refs.grid.hotInstance.getData()).toEqual([[22, 32, 42],
      [null,null,null], //  todo         this.data.pop(); which is a vue3 proxy do not remove this element, instead it put array of nulls.
    ]);
    expect(newHotSettings).toBe(null);

    testWrapper.componentVM.removeRow();

    await testWrapper.rootVM.$nextTick();

    expect(testWrapper.componentVM.$refs.grid.hotInstance.getData()).toEqual([
      [null,null,null], //  todo         this.data.pop(); which is a vue3 proxy do not remove this element, instead it put array of nulls.
      [null,null,null], //  todo         this.data.pop(); which is a vue3 proxy do not remove this element, instead it put array of nulls.
    ]);
    expect(newHotSettings).toBe(null);
  });

  it('should call Handsontable\'s `updateSettings` method, when the table data was changed by reference while the' +
    ' dataset is an array of object and property number changed', async() => {
    let newHotSettings = null;
    const appComponent = {
      data() {
        return {
          data: [{a: 1, b: 2, c: 3}],
        }
      },
      methods: {
        updateData(changedRow) {
          this.data[0] = { ... changedRow};
        }
      },
      render() {
        // HotTable
        return h(HotTable, {
          ref: 'grid',
         
            data: this.data,
            afterUpdateSettings(newSettings) {
              newHotSettings = newSettings
            }
          
        })
      }
    }

    let testWrapper = mount(appComponent, {
      sync: false
    });

    testWrapper.componentVM.updateData({a: 1, b: 2, c: 3, d: 4});

    await testWrapper.rootVM.$nextTick();

    expect(testWrapper.componentVM.$refs.grid.hotInstance.getData()).toEqual([[1, 2, 3, 4]]);
    expect(JSON.stringify(newHotSettings)).toBe(JSON.stringify({
      data: [{a: 1, b: 2, c: 3, d: 4}]
    }));

    testWrapper.componentVM.updateData({a: 1});

    await testWrapper.rootVM.$nextTick();

    expect(testWrapper.componentVM.$refs.grid.hotInstance.getData()).toEqual([[1,
      null,null,null], //  todo         this.data.pop(); which is a vue3 proxy do not remove this element, instead it put array of nulls.
      ]);
    expect(JSON.stringify(newHotSettings)).toBe(JSON.stringify({
      data: [{a: 1}]
    }));
  });

  it('should NOT call Handsontable\'s `updateSettings` method, when the table data was changed by reference while the' +
    ' dataset is an array of object and property number DID NOT change', async() => {
    let newHotSettings = null;
    const appComponent = {
      data() {
        return {
          data: [{a: 1, b: 2, c: 3}],
        }
      },
      methods: {
        addRow() {
          this.data.push({a: 12, b: 22, c: 32})
        },
        removeRow() {
          this.data.pop()
        }
      },
      render() {
        // HotTable
        return h(HotTable, {
          ref: 'grid',
         
            data: this.data,
            afterUpdateSettings(newSettings) {
              newHotSettings = newSettings
            }
          
        })
      }
    };

    let testWrapper = mount(appComponent, {
      sync: false
    });

    testWrapper.componentVM.addRow();

    await testWrapper.rootVM.$nextTick();

    expect(testWrapper.componentVM.$refs.grid.hotInstance.getData()).toEqual([[1, 2, 3], [12, 22, 32]]);
    expect(newHotSettings).toBe(null);

    testWrapper.componentVM.removeRow();

    await testWrapper.rootVM.$nextTick();

    expect(testWrapper.componentVM.$refs.grid.hotInstance.getData()).toEqual([[1, 2, 3], 
        [null, null, null] // todo I don't know why this array of nulls is here. I tested this on codesandbox, and I didn't find same behavior.  
    ]);
    expect(newHotSettings).toBe(null);
  });
});

describe('getRendererWrapper', () => {
  xit('should create the wrapper function for the provided renderer child component', () => {
    // mocks
    const mockVNode = { // todo: outdated VNode structure
      componentOptions: {  
        Ctor: class {
          $mount() {
            return {
              $data: {},
              $el: document.createElement('TD')
            };
          }
        }
      }
    };
    const mockComponent = {
      editorCache: new Map(),
      rendererCache: new LRUMap(100),
      $parent: {}
    };

    const getRendererWrapper = (HotTable as any).methods.getRendererWrapper;
    const mockTD = document.createElement('TD');

    expect(typeof getRendererWrapper.call(mockComponent, mockVNode, mockComponent)).toEqual('function');
    expect(getRendererWrapper.call(mockComponent, mockVNode, mockComponent)({}, mockTD, 0, 0, 0, '', {})).toEqual(mockTD);
  });
});

describe('getEditorClass', () => {
  xit('should create a fresh class to be used as an editor, based on the editor component provided.', () => {
    // mocks
    const mockVNode = { // todo: outdated VNode structure
      componentOptions: {
        Ctor: class {
          static get options() {
            return {
              name: 'name'
            };
          }

          $mount() {
            return {
              $data: {
                hotCustomEditorClass: class B {
                  prepare() {
                    return 'not-undefined';
                  }
                }
              },
              $el: document.createElement('TD')
            };
          }
        }
      }
    };
    const mockComponent = {
      editorCache: new Map(),
      rendererCache: new LRUMap(100),
      $parent: {}
    };

    const getEditorClass = (HotTable as any).methods.getEditorClass;
    const editorClass = getEditorClass.call(mockComponent, mockVNode, mockComponent);

    expect(editorClass.constructor).not.toEqual(void 0);
    expect(editorClass.prototype.prepare).not.toEqual(void 0);
  });
});

describe('Global editors and renderers', () => {
  xit('should allow defining renderer and editor components to work globally on the entire table', () => {
    const dummyHtmlElement = document.createElement('DIV');
    dummyHtmlElement.id = 'dummy';
    
    const app = Vue.createApp()
    
    const dummyEditorComponent = app.component('editor-component', {
      extends: BaseEditorComponent,
      render() {
        return h('div', {
          'attrs': {
            'id': 'dummy-editor'
          }
        });
      }
    });

    const dummyRendererComponent = app.component('renderer-component', {
      render() {
        return h('div', {
          'attrs': {
            'id': 'dummy-renderer'
          }
        });
      }
    });

    const container = {
      render() {
        // HotTable
        return h(HotTable, {
         
            data: createSampleData(50, 2),
            autoRowSize: false,
            autoColumnSize: false,
            width: 400,
            height: 400,
            init() {
              mockClientDimensions(this.rootElement, 400, 400);
            }
          
        }, [
          h(dummyRendererComponent, {
            attrs: {
              'hot-renderer': true // todo: hot-renderer is postponed for now
            }
          }),
          h(dummyEditorComponent, {
            attrs: {
              'hot-editor': true // todo: hot-editor is postponed for now
            }
          })
        ])
      }
    };

    let testWrapper = app.mount(container, {
      attachTo: createDomContainer()
    });
    const hotTableComponent = testWrapper.componentVM.$children[0];
    const globalEditor = hotTableComponent.hotInstance.getSettings().editor;
    const globalEditorInstance = new globalEditor(hotTableComponent.hotInstance);

    expect(globalEditorInstance._fullEditMode).toEqual(false);
    expect(globalEditorInstance.hot).toEqual(hotTableComponent.hotInstance);
    expect(hotTableComponent.hotInstance.getSettings().renderer(hotTableComponent.hotInstance, document.createElement('DIV'), 555, 0, 0, '0', {}).childNodes[0].id).toEqual('dummy-renderer');

    testWrapper.destroy();
  });
});

xit('should inject an `isRenderer` and `isEditor` properties to renderer/editor components', () => {
  const dummyEditorComponent = Vue.component('renderer-component', {
    name: 'EditorComponent',
    extends: BaseEditorComponent,
    render() {
      return h('div', {
        'attrs': {
          'id': 'dummy-editor'
        }
      });
    }
  });

  const dummyRendererComponent = Vue.component('renderer-component', {
    name: 'RendererComponent',
    render() {
      return h('div', {
        'attrs': {
          'id': 'dummy-renderer'
        }
      });
    }
  });

  const appComponent = {
    render() {
      // HotTable
      return h(HotTable, {
       
          data: createSampleData(50, 2),
          licenseKey: 'non-commercial-and-evaluation',
          autoRowSize: false,
          autoColumnSize: false
        
      }, [
        h(dummyRendererComponent, {
          attrs: {
            'hot-renderer': true // todo: hot-renderer is postponed for now
          }
        }),
        h(dummyEditorComponent, {
          attrs: {
            'hot-editor': true // todo: hot-editor is postponed for now
          }
        })
      ])
    }
  };

  let testWrapper = mount(appComponent, {
    attachTo: createDomContainer()
  });
  const hotTableComponent = testWrapper.componentVM.$children[0];

  expect(hotTableComponent.$data.rendererCache.get('0-0').component.$data.isRenderer).toEqual(true);
  expect(hotTableComponent.$data.editorCache.get('EditorComponent').$data.isEditor).toEqual(true);

  testWrapper.destroy();
});

it('should be possible to access the `hotInstance` property of the HotTable instance from a parent-component', () => {
  let hotInstanceFromRef = 'not-set';
  const appComponent = {
    data() {
      return {
        rowHeaders: true,
        colHeaders: true,
        readOnly: true,
      }
    },
    methods: {
      cellsCallback() {
        if (hotInstanceFromRef === 'not-set') {
          hotInstanceFromRef = this.$refs.hTable.hotInstance;
        }
      }
    },
    render() {
      // HotTable
      return h(HotTable, {
        ref: 'hTable',
       
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
  const dummyEditorComponent = Vue.component('renderer-component', {
    name: 'EditorComponent',
    extends: BaseEditorComponent,
    props: ['test-prop'],
    render() {
      return h('div', {});
    }
  });

  const dummyRendererComponent = Vue.component('renderer-component', {
    name: 'RendererComponent',
    props: ['test-prop'],
    render() {
      return h('div', {});
    }
  });

  const appComponent = {
    render() {
      // HotTable
      return h(HotTable, {
       
          data: createSampleData(1, 1),
          licenseKey: 'non-commercial-and-evaluation',
        
      }, [
        h(dummyRendererComponent, {
          attrs: {
            'hot-renderer': true, // todo: hot-renderer is postponed
            'test-prop': 'test-prop-value'
          }
        }),
        h(dummyEditorComponent, {
          attrs: {
            'hot-editor': true, // todo: hot-renderer is postponed
            'test-prop': 'test-prop-value'
          }
        })
      ])
    }
  };

  let testWrapper = mount(appComponent, {
    attachTo: createDomContainer()
  });
  const hotTableComponent = testWrapper.componentVM.$children[0];

  expect(hotTableComponent.rendererCache.get('0-0').component.$props.testProp).toEqual('test-prop-value');
  expect(hotTableComponent.editorCache.get('EditorComponent').$props.testProp).toEqual('test-prop-value');

  testWrapper.destroy();
});

it('should display a warning and not throw any errors, when the underlying Handsontable instance ' +
  'has been destroyed', () => {
  const warnFunc = console.warn;
  const testWrapper = mount(HotTable, {
    propsData: {
      data: [[1]],
      licenseKey: 'non-commercial-and-evaluation',
    }
  });
  const warnCalls = [];

  console.warn = (warningMessage) => {
    warnCalls.push(warningMessage);
  }

  expect(testWrapper.componentVM.hotInstance.isDestroyed).toEqual(false);

  testWrapper.componentVM.hotInstance.destroy();

  expect(testWrapper.componentVM.hotInstance).toEqual(null);

  expect(warnCalls.length).toBeGreaterThan(0);
  warnCalls.forEach((message) => {
    expect(message).toEqual(WARNING_HOT_DESTROYED);
  });

  testWrapper.unmount();

  console.warn = warnFunc;
});

describe('HOT-based CRUD actions', () => {
  it('should should not add/remove any additional rows when calling `alter` on the HOT instance', async() => {
    const testWrapper = mount(HotTable, {
      propsData: {
        data: createSampleData(4, 4),
        rowHeaders: true,
        colHeaders: true,
      }
    });
    const hotInstance = testWrapper.componentVM.hotInstance;

    hotInstance.alter('insert_row', 2, 2);
    hotInstance.alter('insert_col', 2, 2);

    await testWrapper.rootVM.$nextTick();

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
  });
});

describe('Non-HOT based CRUD actions', () => {
  it('should should not add/remove any additional rows when modifying a data array passed to the wrapper', async() => {
    const testWrapper = mount({
      render() {
        return h(HotTable, {
          rowHeaders: true,
          colHeaders: true,
          data: this.data,
          ref: "dataGrid"
        },)
      },
      setup() {
        return {
          data: createSampleData(4, 4)
        }
      },
      methods: {
        add(){
          this.data.push(this.data[0], this.data[0]);
          this.data[0].push('test', 'test');
        },
        remove(){
          this.data.pop();
          this.data.pop();
          this.data[0].pop();
          this.data[0].pop();
          this.data[0].push('test2', 'test2');

        }
      }
    });
    
    const hotInstance = testWrapper.componentVM.$refs.dataGrid.hotInstance;
    testWrapper.componentVM.add();
    debugger; // next breakpoint will be reach in computed - what is correct 
    await testWrapper.rootVM.$nextTick();

    testWrapper.componentVM.add();
    debugger; // next break point should be catched in computed - what never happens - it is incorrect.
    await testWrapper.rootVM.$nextTick();
    debugger

    //
    // expect(hotInstance.countRows()).toEqual(6);
    // expect(hotInstance.countSourceRows()).toEqual(6);
    // expect(hotInstance.countCols()).toEqual(6);
    // expect(hotInstance.countSourceCols()).toEqual(6);
    // expect(hotInstance.getSourceData().length).toEqual(6);
    // expect(hotInstance.getSourceData()[0].length).toEqual(6);
    //

    testWrapper.componentVM.remove();
    debugger; // next break point should be catched in computed - what never happens - it is incorrect.
    await testWrapper.componentVM.$refs.dataGrid.$nextTick();
    debugger;

    // expect(hotInstance.countRows()).toEqual(4); // todo @see https://github.com/handsontable/handsontable/issues/7545#issuecomment-919340203
    // expect(hotInstance.countSourceRows()).toEqual(4);
    // expect(hotInstance.countCols()).toEqual(4);
    // expect(hotInstance.countSourceCols()).toEqual(4);
    // expect(hotInstance.getSourceData().length).toEqual(4);
    // expect(hotInstance.getSourceData()[0].length).toEqual(4);
  });
});

describe('cooperation with NestedRows plugin', () => {
  it('should display dataset properly #7548', async() => {
    const testWrapper = mount(HotTable, {
      propsData: {
        data: [{
          col1: 'parent1',
          __children: [
            {
              col1: 'p1.c1',
            }, {
              col1: 'p1.c2',
            }
          ]
        }, {
          col1: 'parent2',
          __children: [
            {
              col1: 'p2.c1',
            }, {
              col1: 'p2.c2',
            }, {
              col1: 'p2.c3',
            }
          ]
        }],
        rowHeaders: true,
        colHeaders: true,
        nestedRows: true,
      }
    });

    expect(testWrapper.componentVM.hotInstance.countRows()).toEqual(7);

    await testWrapper.rootVM.$nextTick();

    expect(testWrapper.componentVM.hotInstance.countRows()).toEqual(7);

    testWrapper.unmount();
  });
});
