<template>
  <div class="theme-container">
    <div class="theme-default-content">
      <h1>404</h1>
      <blockquote>{{ getMsg() }}</blockquote>
      <a :href="homeUrl">Take me home.</a>
    </div>
  </div>
</template>

<script>
const msgs = [
  'There\'s nothing here.',
  'How did we get here?',
  'That\'s a Four-Oh-Four.',
  'Looks like we\'ve got some broken links.'
];

const frameworkRegExp = new RegExp('^/docs/((next|\\d+.\\d+)/)?(?<framework>react|javascript)-data-grid/.*');

export default {
  data() {
    return {
      homeUrl: '/'
    };
  },
  methods: {
    /**
     * Returns the new homepage URL of the previously selected framework. For example for
     * `/docs/10.1/react-data-grid/foo/bar` it's `/docs/react-data-grid/`.
     *
     * The $page object is not available within the component so read the state from
     * the "window.location".
     *
     * @returns {string}
     */
    getFrameworkHomePage() {
      const {
        framework,
      } = window.location.pathname.match(frameworkRegExp)?.groups ?? {
        framework: 'javascript'
      };

      return `/docs/${framework}-data-grid`;
    },
    getMsg() {
      return msgs[Math.floor(Math.random() * msgs.length)];
    }
  },
  mounted() {
    this.homeUrl = this.getFrameworkHomePage();
  },
  created() {
    if (this.$ssrContext) {
      this.$ssrContext.docsGenStamp = '';
    }
  }
};
</script>
