<template>
  <div>
    <tabs :options="{ useUrlFragment: false }" @changed="tabClicked">
      <tab v-for="demo in this.demos" :name="demo.name" :id="getTabId(demo.name)">
        <CodeSandboxIframe
          :id="demo.codeSandboxId"
          :title="demo.title"
          :selectedFile="demo.selectedFile"
          v-if="isSelected(getTabId(demo.name))">
        </CodeSandboxIframe>
      </tab>
    </tabs>
  </div>
</template>

<script>
import CodeSandboxIframe from './CodeSandboxIframe.vue';

export default {
  name: 'HelloWorld',
  props: ['demos'],
  components: { CodeSandboxIframe },
  data() {
    return {
      selected: 'javascript',
    };
  },
  methods: {
    getTabId(demoName) {
      return demoName.replace(/\s/g, '').toLowerCase();
    },
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
