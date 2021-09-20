import { mount } from '@vue/test-utils';
// @ts-ignore
import { defineComponent, h } from 'vue';
import HotTable from '../src/HotTable.vue';
import HotColumn from '../src/HotColumn.vue';
import BaseEditorComponent from '../src/BaseEditorComponent.vue';
import {
  createDomContainer,
  createSampleData,
  mockClientDimensions,
} from './_helpers';

describe('createColumnSettings', () => {
  it('should create the column settings based on the data provided to the `hot-column` component and its child components', () => {
    const dummyRendererComponent = {
      render() {
        return h('DIV', 'test-value');
      },
    };
    const dummyEditorComponent = {
      render() {
        return h();
      },
      data() {
        return {
          hotCustomEditorClass: class A {
            getValue() {
              return 'test-value-editor';
            }
          },
        };
      },
    };

    const App = defineComponent({
      render() {
        // HotTable
        return h(HotTable, {
            data: createSampleData(1, 1),
            licenseKey: 'non-commercial-and-evaluation',
            autoRowSize: false,
            autoColumnSize: false,
            init() {
              mockClientDimensions(this.rootElement, 400, 400);
            },
        }, () => [
          // HotColumn #1
          h(HotColumn, {
              title: 'test-title',
          }, () => [
            h(dummyRendererComponent, {
                'hot-renderer': true,
            }),
            h(dummyEditorComponent, {
                'hot-editor': true,
            }),
          ]),
          // HotColumn #2
          h(HotColumn, {
              readOnly: true,
              type: 'numeric',
              renderer() {
                return 'test-value2';
              },
          }),
          // HotColumn #3
          h(HotColumn, {
              settings: {
                title: 'title-3',
                renderer() {
                  return 'test-value3';
                },
              },
              readOnly: true,
          }),
        ]);
      },
    });

    const testWrapper = mount(App);
    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;
    
    expect(hotTableComponent.columnSettings[0].title).toEqual('test-title');
    // TODO: vue components in cells are not working yet
    // expect(hotTableComponent.columnSettings[0].renderer(hotTableComponent.hotInstance, document.createElement('TD')).innerHTML).toEqual('<div>test-value</div>');
    // expect((new hotTableComponent.columnSettings[0].editor()).getValue()).toEqual('test-value-editor');
    expect(hotTableComponent.columnSettings[1].title).toEqual(void 0);
    expect(hotTableComponent.columnSettings[1].readOnly).toEqual(true);
    expect(hotTableComponent.columnSettings[1].type).toEqual('numeric');
    expect(hotTableComponent.columnSettings[1].renderer()).toEqual('test-value2');
    expect(hotTableComponent.columnSettings[2].title).toEqual('title-3');
    expect(hotTableComponent.columnSettings[2].readOnly).toEqual(true);
    expect(hotTableComponent.columnSettings[2].renderer()).toEqual('test-value3');

    expect(hotTableComponent.hotInstance.getSettings().columns[0].title).toEqual('test-title');
    // TODO: vue components in cells are not working yet
    // expect(hotTableComponent.hotInstance.getSettings().columns[0].renderer(hotTableComponent.hotInstance, document.createElement('TD')).innerHTML).toEqual('<div>test-value</div>');
    // expect((new (hotTableComponent.hotInstance.getSettings().columns[0].editor)()).getValue()).toEqual('test-value-editor');
    expect(hotTableComponent.hotInstance.getSettings().columns[1].title).toEqual(void 0);
    expect(hotTableComponent.hotInstance.getSettings().columns[1].readOnly).toEqual(true);
    expect(hotTableComponent.hotInstance.getSettings().columns[1].type).toEqual('numeric');
    expect(hotTableComponent.hotInstance.getSettings().columns[1].renderer()).toEqual('test-value2');
    expect(hotTableComponent.hotInstance.getSettings().columns[2].title).toEqual('title-3');
    expect(hotTableComponent.hotInstance.getSettings().columns[2].readOnly).toEqual(true);
    expect(hotTableComponent.hotInstance.getSettings().columns[2].renderer()).toEqual('test-value3');

    testWrapper.unmount();
  });
});

xdescribe('renderer cache', () => {
  it('should cache the same amount of cells, as they are in the table (below LRU limit)', () => {
    const dummyRendererComponent = {
      render() {
        return h();
      },
    };

    const App = defineComponent({
      render() {
        // HotTable
        return h(HotTable, {
            data: createSampleData(20, 2),
            width: 400,
            height: 400,
            licenseKey: 'non-commercial-and-evaluation',
            autoRowSize: false,
            autoColumnSize: false,
            init: function () {
              mockClientDimensions(this.rootElement, 400, 400);
            },
        }, () => [
          // HotColumn #1
          h(HotColumn, { }, () => [
            h(dummyRendererComponent, {
                'hot-renderer': true,
            }),
          ]),
          // HotColumn #2
          h(HotColumn, { }, () => [
            h(dummyRendererComponent, {
              'hot-renderer': true,
            }),
          ]),
        ]);
      },
    });

    const testWrapper = mount(App);
    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;

    expect(hotTableComponent.rendererCache.size).toEqual(40);

    testWrapper.unmount();
  });

  it('should cache the maximum amount of cells possible in the LRU map, if the number of cells exceeds this limit', () => {
    const dummyRendererComponent = {
      render() {
        return h();
      },
    };

    const App = defineComponent({
      render () {
        // HotTable
        return h(HotTable, {
            data: createSampleData(200, 2),
            width: 400,
            height: 400,
            licenseKey: 'non-commercial-and-evaluation',
            autoRowSize: false,
            autoColumnSize: false,
            init () {
              mockClientDimensions(this.rootElement, 400, 400);
            },
            wrapperRendererCacheSize: 100,
        }, () => [
          // HotColumn #1
          h(HotColumn, {
            props: {},
          }, () => [
            h(dummyRendererComponent, {
              'hot-renderer': true,
            }),
          ]),
          // HotColumn #2
          h(HotColumn, {  }, () => [
            h(dummyRendererComponent, {
              'hot-renderer': true,
            }),
          ]),
        ]);
      },
    });

    const testWrapper = mount(App);
    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;

    expect(hotTableComponent.rendererCache.size).toEqual(100);

    testWrapper.unmount();
  });
});

xdescribe('hot-column children', () => {
  it('should add as many hot-column children as there are cached renderers and editors for that column', () => {
    const dummyRendererComponent = {
      render() {
        return h();
      },
    };
    const dummyEditorComponent = {
      render() {
        return h();
      },
    };

    const App = defineComponent({
      render() {
        // HotTable
        return h(HotTable, {
            data: createSampleData(50, 2),
            width: 400,
            height: 400,
            licenseKey: 'non-commercial-and-evaluation',
            autoRowSize: false,
            autoColumnSize: false,
            init() {
              mockClientDimensions(this.rootElement, 400, 400);
            },
        }, () => [
          // HotColumn #1
          h(HotColumn, { }, () => [
            h(dummyRendererComponent, {
                'hot-renderer': true,
            }),
            h(dummyEditorComponent, {
              'hot-editor': true,
            }),
          ]),
          // HotColumn #2
          h(HotColumn, { }, () => [
            h(dummyRendererComponent, {
                'hot-renderer': true,
            }),
          ]),
        ]);
      },
    });

    const testWrapper = mount(App);
    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;

    expect(hotTableComponent.rendererCache.size).toEqual(100);
    expect(hotTableComponent.$children[0].$children.length).toEqual(51);
    expect(hotTableComponent.$children[1].$children.length).toEqual(50);

    testWrapper.unmount();
  });

  it('should be possible to set a key on custom editor to use the same component twice', () => {
    const dummyEditorComponent = {
      name: 'EditorComponent',
      // extends: BaseEditorComponent,
      props: ['test-prop'],
      render () {
        return h('div', {});
      },
    };

    const App = defineComponent({
      render () {
        // HotTable
        return h(HotTable, {
          data: createSampleData(2, 2),
          licenseKey: 'non-commercial-and-evaluation',
        }, () => [
          h(HotColumn, {}, () => [
            h(dummyEditorComponent, {
              key: 'editor-one',
              'hot-editor': true,
              'test-prop': 'test-prop-value-1',
            }),
          ]),
          h(HotColumn, {}, () => [
            h(dummyEditorComponent, {
              key: 'editor-two',
              'hot-editor': true,
              'test-prop': 'test-prop-value-2',
            }),
          ]),
        ]);
      },
    });

    const testWrapper = mount(App);
    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;

    expect(hotTableComponent.editorCache.get('EditorComponent:editor-one').$props.testProp).toEqual('test-prop-value-1');
    expect(hotTableComponent.editorCache.get('EditorComponent:editor-two').$props.testProp).toEqual('test-prop-value-2');

    testWrapper.unmount();
  });

  it('should be possible to set a key on custom editor to use the same component twice, alongside an editor without' +
    ' the key property defined', () => {
    const dummyEditorComponent = {
      name: 'EditorComponent',
      // extends: BaseEditorComponent,
      props: ['test-prop'],
      methods: {
        getValue() {

          // For the sake of this test, the returned value is the passed test prop
          return this.$props.testProp;
        },
        setValue: () => {
        },
        open: () => {
        },
      },
      render() {
        return h('div', {});
      },
    };

    const App = defineComponent({
      render() {
        // HotTable
        return h(HotTable, {
          data: createSampleData(2, 2),
          licenseKey: 'non-commercial-and-evaluation',
        }, () => [
          h(HotColumn, {}, () => [
            h(dummyEditorComponent, {
              key: 'editor-one',
              'hot-editor': true,
              'test-prop': 'test-prop-value-1',
            }),
          ]),
          h(HotColumn, {}, [
            h(dummyEditorComponent, {
              key: 'editor-two',
              'hot-editor': true,
              'test-prop': 'test-prop-value-2',
            }),
          ]),
          h(HotColumn, {}, () => [
            h(dummyEditorComponent, {
              'hot-editor': true,
              'test-prop': 'test-prop-value-common',
            }),
          ]),
          h(HotColumn, {}, () => [
            h(dummyEditorComponent, {
              'hot-editor': true,
            }),
          ]),
        ]);
      },
    });

    const testWrapper = mount(App, {
      attachTo: createDomContainer(),
    });
    const hotTableComponent = testWrapper.getComponent(HotTable as any).vm;

    expect(hotTableComponent.editorCache.get('EditorComponent:editor-one').$props.testProp).toEqual('test-prop-value-1');
    expect(hotTableComponent.editorCache.get('EditorComponent:editor-two').$props.testProp).toEqual('test-prop-value-2');
    expect(hotTableComponent.editorCache.get('EditorComponent').$props.testProp).toEqual('test-prop-value-common');

    const hotInstance = hotTableComponent.hotInstance;

    expect(hotInstance.getCellEditor(0, 0).prototype.getValue()).toEqual('test-prop-value-1');
    expect(hotInstance.getCellEditor(0, 1).prototype.getValue()).toEqual('test-prop-value-2');
    expect(hotInstance.getCellEditor(0, 2).prototype.getValue()).toEqual('test-prop-value-common');
    expect(hotInstance.getCellEditor(0, 3).prototype.getValue()).toEqual('test-prop-value-common');

    testWrapper.unmount();
  });
});

