<template>
    <nav class="nav-versions nav-links" >
      <!-- user links -->
      <nav class="nav-item" >
        <DropdownLink :item="item"></DropdownLink>
      </nav>
  </nav>
</template>

<script>
import DropdownLink from '@theme/components/DropdownLink.vue';

export default {
  name: 'Versions',
  components: {
    DropdownLink
  },
  methods: {
    addLatest(version) {
      if (version === this.$page.latestVersion) {
        return `${version} (Current)`;
      }

      return version;
    },
    getLink(version) {
      if (version === this.$page.latestVersion) {
        return '/';
      }

      return `/${version}/`;
    },
    getLegacyVersions() {
      return [
        '8.3.0',
        '8.2.0',
        '8.1.0',
        '8.0.0',
        '6.2.2',
        '7.4.2',
        '7.3.0',
        '7.2.2',
        '7.1.1',
        '7.0.3',
        '6.1.1',
        '6.0.1',
        '5.0.2',
        '4.0.0'
      ].map(v => ({
        text: v.replace(/^(\d*\.\d*)\..*$/, '$1'),
        link: `https://handsontable.com/docs/${v}/`
      }));
    }
  },
  computed: {
    item() {
      return {
        text: this.addLatest(this.$page.currentVersion),
        items:
          [
            ...this.$page.versions.map(v => ({ text: `${this.addLatest(v)}`, link: this.getLink(v) })),
            ...this.getLegacyVersions()
          ]
      };
    }
  }
};
</script>
