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
import Vue from 'vue'
import PageEdit from '@theme/components/PageEdit.vue'
import PageNav from '@theme/components/PageNav.vue'
import ScriptLoader from '../../components/ScriptLoader.vue'

export default {
  components: { PageEdit, PageNav },
  props: ['sidebarItems'],
  watch: {
    $route() {
      this.activatedExamples = [];
    }
  },
  data() {
    return {
      activatedExamples: [],
    }
  },
  computed:{
    isApi() {
      return this.$route.fullPath.match(/([^/]*\/)?api\//);
    },
  },
  methods: {
    codePreviewTabChanged(selectedTab, exampleId) {
      if (selectedTab.tab.computedId === 'preview') {
        this.activatedExamples.push(exampleId);
      }
    },
    isScriptLoaderActivated(exampleId) {
      return this.activatedExamples.includes(exampleId);
    }
  },
}
</script>
