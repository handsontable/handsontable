<template>
  <main class="page" v-bind:class="{ 'api': isApi }">
    <slot name="top" />

    <Content class="theme-default-content" />
    <PageEdit />

    <PageNav v-bind="{ sidebarItems }" />

    <slot name="bottom" />
  </main>
</template>

<script>
import PageEdit from '@theme/components/PageEdit.vue';
import PageNav from '@theme/components/PageNav.vue';

export default {
  components: { PageEdit, PageNav },
  props: ['sidebarItems'],
  watch: {
    $route(to, from) {
      // Do not reset the `activatedExamples` array when the anchor is changed.
      if (to.path !== from.path) {
        this.activatedExamples = [];
      }
    }
  },
  data() {
    return {
      activatedExamples: [],
    };
  },
  computed: {
    isApi() {
      return this.$route.fullPath.match(/([^/]*\/)?api\//);
    },
  },
  methods: {
    codePreviewTabChanged(selectedTab, exampleId) {
      const changedClass = 'selected-preview';
      const parentContainer = selectedTab.tab.$el.parentElement;

      // Removing class by method compatible with IE
      parentContainer.className = parentContainer.className.replace(new RegExp(` ?${changedClass}`), '');

      if (selectedTab.tab.computedId.startsWith('preview-tab')) {
        this.activatedExamples.push(exampleId);
        parentContainer.className += ` ${changedClass}`; // Adding class by method compatible with IE
      }
    },
    isScriptLoaderActivated(exampleId) {
      return this.activatedExamples.includes(exampleId);
    }
  },
};
</script>
