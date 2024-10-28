<template>
  <footer class="footer">
    <a
        v-if="editLink"
        class="edit-link"
        :href="editLink"
        target="_blank"
        rel="noopener noreferrer"
      >{{ editLinkText }} <i class="ico i-external"></i>
    </a>

    <div class="footer-links">
      <div class="socail-links">
        <a href="https://github.com/handsontable/handsontable" target="_blank" aria-label="Link to Github">
          <i class="ico i-github"></i>
        </a>
        <a href="https://www.linkedin.com/company/handsontable/" target="_blank" aria-label="Link to Linkedin">
          <i class="ico i-linkedin"></i>
        </a>
        <a href="https://twitter.com/handsontable" target="_blank" aria-label="Link to X">
          <i class="ico i-twitter"></i>
        </a>
      </div>

      <div class="hot-links">
        <a href="https://handsontable.com/privacy">Privacy policy</a>
        <a href="https://handsontable.com/terms-of-use">Terms of use</a>
        <a href="https://handsontable.com/team">Team</a>
        <a href="https://handsontable.com/contact?category=technical_support">Contact</a>

        <a href="https://handsontable.com/blog/">Blog</a>
        <a href="https://status.handsontable.com/" target="_blank" class="status">Status</a>
      </div>
    </div>

    <div class="copyright">
      <p>© 2012 - {{ new Date().getFullYear() }} Handsoncode</p>
      <ThemeSwitcher />
    </div>
  </footer>
</template>

<script>
import isNil from 'lodash/isNil';
import { endingSlashRE, outboundRE } from '@vuepress/theme-default/util';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';

export default {
  name: 'PageEdit',
  components: {
    ThemeSwitcher
  },

  computed: {
    lastUpdated() {
      return this.$page.lastUpdatedFormat;
    },

    lastUpdatedText() {
      if (typeof this.$themeLocaleConfig.lastUpdated === 'string') {
        return this.$themeLocaleConfig.lastUpdated;
      }
      if (typeof this.$site.themeConfig.lastUpdated === 'string') {
        return this.$site.themeConfig.lastUpdated;
      }

      return 'Last update';
    },

    editLink() {
      const showEditLink = isNil(this.$page.frontmatter.editLink)
        ? this.$site.themeConfig.editLinks
        : this.$page.frontmatter.editLink;

      const {
        repo,
        docsDir = '',
        docsBranch = 'master',
        docsRepo = repo
      } = this.$site.themeConfig;

      if (showEditLink && docsRepo && this.$page.originRelativePath) {
        return this.createEditLink(
          repo,
          docsRepo,
          docsDir,
          docsBranch,
          this.$page.originRelativePath
        );
      }

      return null;
    },

    editLinkText() {
      return (
        this.$themeLocaleConfig.editLinkText
        || this.$site.themeConfig.editLinkText
        || 'Improve this page'
      );
    }
  },

  methods: {
    createEditLink(repo, docsRepo, docsDir, docsBranch, path) {
      const bitbucket = /bitbucket.org/;

      if (bitbucket.test(docsRepo)) {
        const base = docsRepo;

        return (
          `${base.replace(endingSlashRE, '')}/src/${docsBranch}/${docsDir
            ? `${docsDir.replace(endingSlashRE, '')}/`
            : ''}${path}?mode=edit&spa=0&at=${docsBranch}&fileviewer=file-view-default`
        );
      }

      const gitlab = /gitlab.com/;

      if (gitlab.test(docsRepo)) {
        const base = docsRepo;

        return (
          `${base.replace(endingSlashRE, '')}/-/edit/${docsBranch}/${docsDir
            ? `${docsDir.replace(endingSlashRE, '')}/`
            : ''}${path}`
        );
      }

      const base = outboundRE.test(docsRepo)
        ? docsRepo
        : `https://github.com/${docsRepo}`;

      return (
        `${base.replace(endingSlashRE, '')}/edit/${docsBranch}/${docsDir
          ? `${docsDir.replace(endingSlashRE, '')}/`
          : ''}${path}`
      );
    }
  }
};
</script>
