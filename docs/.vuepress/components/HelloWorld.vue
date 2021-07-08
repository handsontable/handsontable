<template>
  <div>
    <tabs :options="{ useUrlFragment: false }" @changed="tabClicked">
      <tab v-for="item in items" :name="item.name" :id="item.tabId">
        <CodeSandboxIframe :id="item.codeSandboxId" :title="item.title" v-if="isSelected(item.tabId)">
        </CodeSandboxIframe>
      </tab>
      <tab name="Vue" id="vue" :is-disabled="true"></tab>
    </tabs>
  </div>
</template>

<script>
import CodeSandboxIframe from './CodeSandboxIframe.vue';

export default {
  name: 'HelloWorld',
  props: ['sandboxesIds'],
  components: { CodeSandboxIframe },
  data() {
    const sandboxesInfo = [
      {
        name: 'JavaScript',
        tabId: 'js',
        title: 'Handsontable JavaScript Data Grid - Hello World App',
      },
      {
        name: 'TypeScript',
        tabId: 'typescript',
        title: 'Handsontable TypeScript Data Grid - Hello World App',
      },
      {
        name: 'React',
        tabId: 'react',
        title: 'Handsontable React Data Grid - Hello World App',
      },
      {
        name: 'Angular',
        tabId: 'angular',
        title: 'Handsontable Angular Data Grid - Hello World App',
      }
      // Zip sandbox information with sandbox ID passed by markdown file (needed for versioning).
    ].map((sandboxInfo, index) => {
      return { ...sandboxInfo, codeSandboxId: this.sandboxesIds[index] };
    });

    return {
      selected: 'js',
      items: sandboxesInfo
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
