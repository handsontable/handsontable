import {
  findVNodeByType,
} from '../src/helpers';
// @ts-ignore
import { h } from 'vue';
import { createStore } from 'vuex';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHashHistory } from 'vue-router';
import { createVueComponent } from '../helpers';

describe('findVNodeByType', () => {
  it('should get the VNode child of the `hot-column` component.', () => {
    // mocks
    const mockHotRendererVNode = {
      props: {
        attrs: {
          'hot-renderer': true,
        },
      },
    };
    const mockHotEditorVNode = {
      props: {
        attrs: {
          'hot-editor': true,
        },
      },
    };

    expect(findVNodeByType([mockHotEditorVNode, mockHotRendererVNode], 'hot-renderer')).toEqual(mockHotRendererVNode);
    expect(findVNodeByType([mockHotEditorVNode, mockHotRendererVNode], 'hot-editor')).toEqual(mockHotEditorVNode);
    expect(findVNodeByType([mockHotEditorVNode, mockHotRendererVNode], 'hot-whatever')).toEqual(null);
    expect(findVNodeByType([mockHotRendererVNode], 'hot-editor')).toEqual(null);
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
      render: () => {
        return h(
          'div',
          {},
          [],
        );
      },
    };

    const mockComponent = {
      render: () => {
        return h(
          'div',
          {},
          [
            h(mockSubComponent, {
              testProp: 'test-prop-value'
            }),
          ],
        );
      },
    };

    const store = createStore({
      state: {
        testValue: 'test',
      },
    });

    const router = createRouter({
      history: createWebHashHistory(),
      routes: [
        { path: '/', component: mockComponent },
        { path: '/foo', component: mockComponent }
      ],
    });

    const testWrapper = mount({
      render: () => {
        return h(
          'div',
          {},
          [
            h(mockComponent),
          ],
        );
      },
    }, {
      global: {
        plugins: [store, router]
      }
    });

    const sampleVNode = testWrapper.getComponent(mockComponent as any).vm;
    const sampleChildWrapper = testWrapper.getComponent(mockSubComponent as any);
    const sampleChildComponent = sampleChildWrapper.vm;

    expect(sampleChildComponent.$parent).toEqual(sampleVNode);
    
    expect(sampleVNode.$router).toEqual(router);
    expect(sampleVNode.$store).toEqual(store);

    expect(sampleChildComponent.$parent).toEqual(sampleVNode);
    expect(sampleChildComponent.$router).toEqual(router);
    expect(sampleChildComponent.$store).toEqual(store);
    expect(sampleChildWrapper.props('testProp')).toBe('test-prop-value')
    
    testWrapper.unmount();
  });
});
