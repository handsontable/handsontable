<template>
  <div class="layout-container">
    <ParentLayout>
      <template #page-top>
        <div v-if="show" class="page-top">
          <div class="custom-block tip">
            <p v-if="isNext">This is unreleased documentation for Handsontable <strong>Next</strong> version.</p>
            <p v-else-if="!isLatest">You're viewing a documentation of a previous version of Handsontable.</p>
          </div>
        </div>
      </template>
    </ParentLayout>
    <LayoutFooter />
  </div>
</template>

<script>
import ParentLayout from '@parent-theme/layouts/Layout.vue';
import LayoutFooter from '@theme/components/LayoutFooter.vue';

export default {
  name: 'Layout',
  components: {
    ParentLayout,
    LayoutFooter
  },
  computed: {
    isLatest() {
      return this.$page.currentVersion === this.$page.latestVersion;
    },

    isNext() {
      return this.$page.currentVersion === 'next';
    },

    show() {
      return !this.isLatest || this.isNext;
    }
  }
}
</script>

<style lang="stylus">
.layout-container
  min-height 100%
</style>
