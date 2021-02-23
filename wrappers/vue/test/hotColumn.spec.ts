import HotTable from '../src/HotTable.vue';
import HotColumn from '../src/HotColumn.vue';
import BaseEditorComponent from '../src/BaseEditorComponent.vue';
import { mount } from '@vue/test-utils';
import Vue from 'vue';
import {
  createDomContainer,
  createSampleData,
  mockClientDimensions
} from './_helpers';

describe('createColumnSettings', () => {
  it('should create the column settings based on the data provided to the `hot-column` component and its child components', () => {
    const dummyRendererComponent = {
      render: function (h) {
        return h('DIV', 'test-value');
      }
    };
    const dummyEditorComponent = {
      render: function (h) {
        return h();
      },
      data: function () {
        return {
          hotCustomEditorClass: class A {
            getValue() {
              return 'test-value-editor';
            }
          }
        }
      }
    };

    let App = Vue.extend({
      render(h) {
        // HotTable
        return h(HotTable, {
          props: {
            data: createSampleData(1, 1),
            licenseKey: 'non-commercial-and-evaluation',
            autoRowSize: false,
            autoColumnSize: false,
            init: function () {
              mockClientDimensions(this.rootElement, 400, 400);
            }
          }
        }, [
          // HotColumn #1
          h(HotColumn, {
            props: {
              title: 'test-title'
            }
          }, [
            h(dummyRendererComponent, {
              attrs: {
                'hot-renderer': true
              }
            }),
            h(dummyEditorComponent, {
              attrs: {
                'hot-editor': true
              }
            })
          ]),
          // HotColumn #2
          h(HotColumn, {
            props: {
              readOnly: true,
              type: 'numeric',
              renderer: function () {
                return 'test-value2';
              }
            }
          }),
          // HotColumn #3
          h(HotColumn, {
            props: {
              settings: {
                title: 'title-3',
                renderer: function () {
                  return 'test-value3';
                }
              },
              readOnly: true
            }
          })
        ])
      }
    });

    let testWrapper = mount(App, {
      attachTo: createDomContainer()
    });
    const hotTableComponent = testWrapper.vm.$children[0];

    expect(hotTableComponent.columnSettings[0].title).toEqual('test-title');
    expect(hotTableComponent.columnSettings[0].renderer(hotTableComponent.hotInstance, document.createElement('TD')).innerHTML).toEqual('<div>test-value</div>');
    expect((new hotTableComponent.columnSettings[0].editor()).getValue()).toEqual('test-value-editor');
    expect(hotTableComponent.columnSettings[1].title).toEqual(void 0);
    expect(hotTableComponent.columnSettings[1].readOnly).toEqual(true);
    expect(hotTableComponent.columnSettings[1].type).toEqual('numeric');
    expect(hotTableComponent.columnSettings[1].renderer()).toEqual('test-value2');
    expect(hotTableComponent.columnSettings[2].title).toEqual('title-3');
    expect(hotTableComponent.columnSettings[2].readOnly).toEqual(true);
    expect(hotTableComponent.columnSettings[2].renderer()).toEqual('test-value3');

    expect(hotTableComponent.hotInstance.getSettings().columns[0].title).toEqual('test-title');
    expect(hotTableComponent.hotInstance.getSettings().columns[0].renderer(hotTableComponent.hotInstance, document.createElement('TD')).innerHTML).toEqual('<div>test-value</div>');
    expect((new (hotTableComponent.hotInstance.getSettings().columns[0].editor)()).getValue()).toEqual('test-value-editor');
    expect(hotTableComponent.hotInstance.getSettings().columns[1].title).toEqual(void 0);
    expect(hotTableComponent.hotInstance.getSettings().columns[1].readOnly).toEqual(true);
    expect(hotTableComponent.hotInstance.getSettings().columns[1].type).toEqual('numeric');
    expect(hotTableComponent.hotInstance.getSettings().columns[1].renderer()).toEqual('test-value2');
    expect(hotTableComponent.hotInstance.getSettings().columns[2].title).toEqual('title-3');
    expect(hotTableComponent.hotInstance.getSettings().columns[2].readOnly).toEqual(true);
    expect(hotTableComponent.hotInstance.getSettings().columns[2].renderer()).toEqual('test-value3');

    testWrapper.destroy();
  });
});

describe('renderer cache', () => {
  it('should cache the same amount of cells, as they are in the table (below LRU limit)', () => {
    const dummyRendererComponent = {
      render: function (h) {
        return h();
      }
    };

    let App = Vue.extend({
      render(h) {
        // HotTable
        return h(HotTable, {
          props: {
            data: createSampleData(20, 2),
            width: 400,
            height: 400,
            licenseKey: 'non-commercial-and-evaluation',
            autoRowSize: false,
            autoColumnSize: false,
            init: function () {
              mockClientDimensions(this.rootElement, 400, 400);
            }
          }
        }, [
          // HotColumn #1
          h(HotColumn, {
            props: {}
          }, [
            h(dummyRendererComponent, {
              attrs: {
                'hot-renderer': true
              }
            })
          ]),
          // HotColumn #2
          h(HotColumn, {
            props: {}
          }, [
            h(dummyRendererComponent, {
              attrs: {
                'hot-renderer': true
              }
            })
          ])
        ])
      }
    });

    let testWrapper = mount(App, {
      attachTo: createDomContainer()
    });
    const hotTableComponent = testWrapper.vm.$children[0];

    expect(hotTableComponent.rendererCache.size).toEqual(40);

    testWrapper.destroy();
  });

  it('should cache the maximum amount of cells possible in the LRU map, if the number of cells exceeds this limit', () => {
    const dummyRendererComponent = {
      render: function (h) {
        return h();
      }
    };

    let App = Vue.extend({
      render(h) {
        // HotTable
        return h(HotTable, {
          props: {
            data: createSampleData(200, 2),
            width: 400,
            height: 400,
            licenseKey: 'non-commercial-and-evaluation',
            autoRowSize: false,
            autoColumnSize: false,
            init: function () {
              mockClientDimensions(this.rootElement, 400, 400);
            },
            wrapperRendererCacheSize: 100
          }
        }, [
          // HotColumn #1
          h(HotColumn, {
            props: {}
          }, [
            h(dummyRendererComponent, {
              attrs: {
                'hot-renderer': true
              }
            })
          ]),
          // HotColumn #2
          h(HotColumn, {
            props: {}
          }, [
            h(dummyRendererComponent, {
              attrs: {
                'hot-renderer': true
              }
            })
          ])
        ])
      }
    });

    let testWrapper = mount(App, {
      attachTo: createDomContainer()
    });
    const hotTableComponent = testWrapper.vm.$children[0];

    expect(hotTableComponent.rendererCache.size).toEqual(100);

    testWrapper.destroy();
  });
});

describe('hot-column children', () => {
  it('should add as many hot-column children as there are cached renderers and editors for that column', () => {
    const dummyRendererComponent = {
      render: function (h) {
        return h();
      }
    };
    const dummyEditorComponent = {
      render: function (h) {
        return h();
      }
    };

    let App = Vue.extend({
      render(h) {
        // HotTable
        return h(HotTable, {
          props: {
            data: createSampleData(50, 2),
            width: 400,
            height: 400,
            licenseKey: 'non-commercial-and-evaluation',
            autoRowSize: false,
            autoColumnSize: false,
            init: function () {
              mockClientDimensions(this.rootElement, 400, 400);
            }
          }
        }, [
          // HotColumn #1
          h(HotColumn, {
            props: {}
          }, [
            h(dummyRendererComponent, {
              attrs: {
                'hot-renderer': true
              }
            }),
            h(dummyEditorComponent, {
              attrs: {
                'hot-editor': true
              }
            })
          ]),
          // HotColumn #2
          h(HotColumn, {
            props: {}
          }, [
            h(dummyRendererComponent, {
              attrs: {
                'hot-renderer': true
              }
            })
          ])
        ])
      }
    });

    let testWrapper = mount(App, {
      attachTo: createDomContainer()
    });
    const hotTableComponent = testWrapper.vm.$children[0];

    expect(hotTableComponent.rendererCache.size).toEqual(100);
    expect(hotTableComponent.$children[0].$children.length).toEqual(51);
    expect(hotTableComponent.$children[1].$children.length).toEqual(50);

    testWrapper.destroy();
  });

  it('should be possible to set a key on custom editor to use the same component twice', () => {
    const dummyEditorComponent = Vue.component('renderer-component', {
      name: 'EditorComponent',
      extends: BaseEditorComponent,
      props: ['test-prop'],
      render: function (h) {
        return h('div', {});
      }
    });

    let App = Vue.extend({
      render(h) {
        // HotTable
        return h(HotTable, {
          props: {
            data: createSampleData(2, 2),
            licenseKey: 'non-commercial-and-evaluation',
          }
        }, [
          h(HotColumn, {}, [
            h(dummyEditorComponent, {
              key: 'editor-one',
              attrs: {
                'hot-editor': true,
                'test-prop': 'test-prop-value-1'
              }
            }),
          ]),
          h(HotColumn, {}, [
            h(dummyEditorComponent, {
              key: 'editor-two',
              attrs: {
                'hot-editor': true,
                'test-prop': 'test-prop-value-2'
              }
            })
          ])
        ])
      }
    });

    let testWrapper = mount(App, {
      attachTo: createDomContainer()
    });
    const hotTableComponent = testWrapper.vm.$children[0];

    expect(hotTableComponent.editorCache.get('EditorComponent:editor-one').$props.testProp).toEqual('test-prop-value-1');
    expect(hotTableComponent.editorCache.get('EditorComponent:editor-two').$props.testProp).toEqual('test-prop-value-2');

    testWrapper.destroy();
  });

  it('should be possible to set a key on custom editor to use the same component twice, alongside an editor without' +
    ' the key property defined', () => {
    const dummyEditorComponent = Vue.component('renderer-component', {
      name: 'EditorComponent',
      extends: BaseEditorComponent,
      props: ['test-prop'],
      methods: {
        getValue: function () {

          // For the sake of this test, the returned value is the passed test prop
          return this.$props.testProp;
        },
        setValue: () => {},
        open: () => {}
      },
      render: function (h) {
        return h('div', {});
      }
    });

    let App = Vue.extend({
      render(h) {
        // HotTable
        return h(HotTable, {
          props: {
            data: createSampleData(2, 2),
            licenseKey: 'non-commercial-and-evaluation',
          }
        }, [
          h(HotColumn, {}, [
            h(dummyEditorComponent, {
              key: 'editor-one',
              attrs: {
                'hot-editor': true,
                'test-prop': 'test-prop-value-1'
              }
            }),
          ]),
          h(HotColumn, {}, [
            h(dummyEditorComponent, {
              key: 'editor-two',
              attrs: {
                'hot-editor': true,
                'test-prop': 'test-prop-value-2'
              }
            })
          ]),
          h(HotColumn, {}, [
            h(dummyEditorComponent, {
              attrs: {
                'hot-editor': true,
                'test-prop': 'test-prop-value-common'
              }
            })
          ]),
          h(HotColumn, {}, [
            h(dummyEditorComponent, {
              attrs: {
                'hot-editor': true,
              }
            })
          ])
        ])
      }
    });

    let testWrapper = mount(App, {
      attachTo: createDomContainer()
    });
    const hotTableComponent = testWrapper.vm.$children[0];

    expect(hotTableComponent.editorCache.get('EditorComponent:editor-one').$props.testProp).toEqual('test-prop-value-1');
    expect(hotTableComponent.editorCache.get('EditorComponent:editor-two').$props.testProp).toEqual('test-prop-value-2');
    expect(hotTableComponent.editorCache.get('EditorComponent').$props.testProp).toEqual('test-prop-value-common');

    const hotInstance = hotTableComponent.hotInstance;

    expect(hotInstance.getCellEditor(0, 0).prototype.getValue()).toEqual('test-prop-value-1');
    expect(hotInstance.getCellEditor(0, 1).prototype.getValue()).toEqual('test-prop-value-2');
    expect(hotInstance.getCellEditor(0, 2).prototype.getValue()).toEqual('test-prop-value-common');
    expect(hotInstance.getCellEditor(0, 3).prototype.getValue()).toEqual('test-prop-value-common');

    testWrapper.destroy();
  });
});

