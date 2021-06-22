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
        '8.4',
        '8.3',
        '8.2',
        '8.1',
        '8.0',
        '7.4',
        '7.3',
        '7.2',
        '7.1',
        '7.0',
        '6.2',
        '6.1',
        '6.0',
        '5.0',
        '4.0',
      ].map(version => ({
        text: version,
        link: `https://handsontable.com/docs/${version}/`
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
