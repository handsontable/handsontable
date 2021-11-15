import {
  findVNodeByType,
  createVueComponent,
} from '../src/helpers';
import { createStore } from 'vuex';
import { createVNode, defineComponent, createApp } from 'vue';
import { mount, shallowMount, config } from '@vue/test-utils';
import { createRouter, createWebHashHistory } from 'vue-router';

config.renderStubDefaultSlot = true;

describe('findVNodeByType', () => {
  it('should get the VNode child of the `hot-column` component.', () => {
    const mockHotRendererVNode = createVNode('CustomRenderer', { 'hot-renderer': true });
    const mockHotEditorVNode = createVNode('CustomEditor', { 'hot-editor': true });

    expect(findVNodeByType([mockHotEditorVNode, mockHotRendererVNode], 'hot-renderer')).toBe(mockHotRendererVNode);
    expect(findVNodeByType([mockHotEditorVNode, mockHotRendererVNode], 'hot-editor')).toBe(mockHotEditorVNode);
    expect(findVNodeByType([mockHotEditorVNode, mockHotRendererVNode], 'hot-whatever')).toBe(null);
    expect(findVNodeByType([mockHotRendererVNode], 'hot-editor')).toBe(null);
  });
});
