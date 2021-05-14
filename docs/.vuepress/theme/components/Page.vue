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
import PageEdit from '@theme/components/PageEdit.vue'
import PageNav from '@theme/components/PageNav.vue'

export default {
  components: { PageEdit, PageNav },
  props: ['sidebarItems'],
  computed:{
    isApi() {
      return this.$route.fullPath.match(/([^/]*\/)?api\//);
    }
  },
  methods: {
    codePreviewTabChanged(selectedTab, hotId) {
      const hot = window.instanceRegister.get(hotId);

      if (selectedTab.tab.computedId === 'preview' && hot) {
        hot.render();
      }
    }
  },
}
</script>

<style lang="stylus">
.page.api
  h3
    color #0B3692

</style>
