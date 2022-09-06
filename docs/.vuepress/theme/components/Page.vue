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
/* global instanceRegister */
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
      if (selectedTab.tab.computedId.startsWith('preview-tab')) {
        this.activatedExamples.push(exampleId);
      } else {
        instanceRegister.destroyExample(exampleId);
        this.activatedExamples = this.activatedExamples.filter(activatedExample => activatedExample !== exampleId);
      }
    },
    addClassIfPreviewTabIsSelected(exampleId, className) {
      return this.activatedExamples.includes(exampleId) ? className : '';
    },
    isScriptLoaderActivated(exampleId) {
      return this.activatedExamples.includes(exampleId);
    }
  },
};
</script>

<style lang="stylus">
  /* Absolute position of the span */
  h1 {
    position: relative;

    .header-framework {
      position: absolute;
      top: -24px;
      font-size: 16px;
      opacity: .8;
    }
  }
</style>
