import {
  findVNodeByType,
  createVueComponent
} from '../src/helpers';
import {createApp, h} from 'vue';
import { createStore } from 'vuex'
import {createRouter, createWebHistory} from 'vue-router';

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
  xit('should create an instance of the Vue Component based on the provided VNode using its $mount method, as well as copy the essential ' +
    'parent component properties.', () => {
    const testDiv = document.createElement('DIV');
    document.body.appendChild(testDiv);
    
    const store = createStore({
      state: {
        testValue: 'test'
      },
    })
    
    const router = createRouter({
      history: createWebHistory(),
      routes: [{path: '/foo'}, {path: '/'}],
    });
    
    const mockSubComponent = {
      props: ['testProp'],
      render(){
        return h(
          "span"
        );
      }
    };

    const mockComponent = {
      components: {
         mockSubComponent
      },
      render(){
        return h(
          "p",
          [
            h(mockSubComponent)
          ]
        );
      }
    };
    const rootComponent = {
      components: {
        mockComponent
      },
      render(){
        return h(
          "article",
          [
            h(mockComponent )
          ]
        );
      },
      store: store,
      router: router,
    };
    
    const app = createApp(rootComponent);
    app.use(store);
    app.use(router);
    const vm = app.mount(testDiv);

    // const sampleVNode = vm.$el.firstChild.firstChild.__vnode;
    // const sampleParentComponent = vm.$el.firstChild.__vueParentComponent;
    // const cc = createVueComponent;
    // const c = createVueComponent(sampleVNode, sampleParentComponent, {}, {});
    //
    // expect(createVueComponent(sampleVNode, sampleParentComponent, {}, {}).$parent).toEqual(vm.$refs.first);
    // expect(createVueComponent(sampleVNode, sampleParentComponent, {}, {}).$router).not.toEqual(void 0);
    // expect(createVueComponent(sampleVNode, sampleParentComponent, {}, {}).$store).not.toEqual(void 0);
    // expect(createVueComponent(sampleVNode, sampleParentComponent, {'testProp': 'test-prop-value'}, {}).$props['testProp']).toEqual('test-prop-value');
  });
});
