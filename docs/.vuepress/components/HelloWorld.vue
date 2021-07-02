<template>
  <div>
    <tabs :options="{ useUrlFragment: false }" @changed="tabClicked">
      <tab v-for="item in items" :name="item.name" :id="item.tabId">
        <CodeSandboxIframe :id="item.codeSandboxId" :title="item.title" v-if="isSelected(item.tabId)">
        </CodeSandboxIframe>
      </tab>
      <tab name="Vue" id="vue" :is-disabled="true"></tab>
      <tab name="Angular" id="angular" :is-disabled="true"></tab>
    </tabs>
  </div>
</template>

<script>
import CodeSandboxIframe from './CodeSandboxIframe.vue';

export default {
  name: 'HelloWorld',
  components: { CodeSandboxIframe },
  data() {
    return {
      selected: 'js',
      items: [
        {
          name: 'JavaScript',
          tabId: 'js',
          codeSandboxId: 'handsontable-javascript-data-grid-hello-world-app-dzx8f',
          title: 'Handsontable JavaScript Data Grid - Hello World App'
        },
        {
          name: 'TypeScript',
          tabId: 'typescript',
          codeSandboxId: 'handsontable-typescript-data-grid-hello-world-app-145es',
          title: 'Handsontable TypeScript Data Grid - Hello World App'
        },
        {
          name: 'React',
          tabId: 'react',
          codeSandboxId: 'handsontable-react-data-grid-hello-world-app-yt46w',
          title: 'Handsontable React Data Grid - Hello World App'
        }
      ]
    };
  },
  methods: {
    tabClicked(event) {
      this.selected = event.tab.id;
    },
    isSelected(id) {
      return this.selected === id;
    }
  }
};
</script>

<style scoped>
.codeSandboxIframe {
  width: 100%;
  height: 500px;
  border: 0;
  border-radius: 4px;
  overflow: hidden;
}
</style>
