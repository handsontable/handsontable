import {
  findVNodeByType,
  createVueComponent
} from '../src/helpers';
import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';

describe('findVNodeByType', () => {
  it('should get the VNode child of the `hot-column` component.', () => {
    // mocks
    const mockHotRendererVNode = {
      data: {
        attrs: {
          'hot-renderer': true
        }
      }
    };
    const mockHotEditorVNode = {
      data: {
          attrs: {
            'hot-editor': true
          }
        }
    };

    // cast to `any` to use VNode mocks
    const findVNodeByTypeAny = findVNodeByType as any;

    expect(findVNodeByTypeAny([mockHotEditorVNode, mockHotRendererVNode], 'hot-renderer')).toEqual(mockHotRendererVNode);
    expect(findVNodeByTypeAny([mockHotEditorVNode, mockHotRendererVNode], 'hot-editor')).toEqual(mockHotEditorVNode);
    expect(findVNodeByTypeAny([mockHotEditorVNode, mockHotRendererVNode], 'hot-whatever')).toEqual(null);
    expect(findVNodeByTypeAny([mockHotRendererVNode], 'hot-editor')).toEqual(null);
  });
});

describe('createVueComponent', () => {
  it('should create an instance of the Vue Component based on the provided VNode using its $mount method, as well as copy the essential ' +
    'parent component properties.', () => {
    const testDiv = document.createElement('DIV');
    testDiv.id = 'vue-test';
    document.body.appendChild(testDiv);

    const mockSubComponent = {
      props: ['testProp'],
      render: (h) => {
        return h(
          "div",
          {},
          []
        );
      }
    };

    const mockComponent = {
      components: {
        'sc': mockSubComponent
      },
      render: (h) => {
        return h(
          "div",
          {},
          [
            h('sc')
          ]
        );
      }
    };

    Vue.use(Vuex);
    Vue.use(VueRouter);

    const vue = new Vue({
      el: '#vue-test',
      components: {
        'mc': mockComponent
      },
      render: (h) => {
        return h(
          "div",
          {},
          [
            h('mc')
          ]
        );
      },
      store: new Vuex.Store({
        state: {
          testValue: 'test'
        },
      }),
      router: new VueRouter({
        routes: [{path: '/foo'}]
      }),
    });

    const sampleVNode = vue.$children[0].$children[0].$vnode;
    const sampleParentComponent = vue.$children[0] as any;

    expect(createVueComponent(sampleVNode, sampleParentComponent, {}, {}).$parent).toEqual(vue.$children[0]);
    expect(createVueComponent(sampleVNode, sampleParentComponent, {}, {}).$router).not.toEqual(void 0);
    expect(createVueComponent(sampleVNode, sampleParentComponent, {}, {}).$store).not.toEqual(void 0);
    expect(createVueComponent(sampleVNode, sampleParentComponent, {'testProp': 'test-prop-value'}, {}).$props['testProp']).toEqual('test-prop-value');
  });
});
