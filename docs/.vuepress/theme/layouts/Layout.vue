<template>
  <div class="layout-container">
    <ParentLayout>
      <template #page-top>
        <div v-show="show" class="page-top">
          <div class="custom-block tip version-alert">
            <p>There is a newer version of Handsontable available. 
              <a href="/docs/latest/">Switch to the latest version ⟶</a></p>
          </div>
        </div>
      </template>
    </ParentLayout>
  </div>
</template>

<script>
import ParentLayout from '@parent-theme/layouts/Layout.vue';
import NavLinks from '@theme/components/NavLinks.vue';
import NavLink from '@theme/components/NavLink.vue';
import Sidebar from '@theme/components/Sidebar.vue';

export default {
  name: 'Layout',
  components: {
    ParentLayout,
    NavLinks,
    NavLink,
    Sidebar
  },
  computed: {
    show() {
      return this.$page.currentVersion !== this.$page.latestVersion && this.$page.currentVersion !== 'next';
    }
  },
  created() {
    if (this.$ssrContext) {
      this.$ssrContext.docsGenStamp = this.$page.docsGenStamp ?? '';
    }
  }
};
</script>

<style lang="stylus">
.layout-container
  min-height 100%

.custom-block.tip.version-alert
  position relative
  top -34px
  border-width 1px
  border-style dashed
</style>
