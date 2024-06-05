<template>
  <main class="page" v-bind:class="{ api: isApi }">
    <Breadcrumbs />

    <Content class="theme-default-content" />
    <slot name="top" />
    <PageEdit />

    <slot name="bottom" />
  </main>
</template>

<script>
/* global instanceRegister */
import PageEdit from '@theme/components/PageEdit.vue';
import Breadcrumbs from '@theme/components/Breadcrumbs.vue';

export default {
  components: {
    PageEdit,
    Breadcrumbs,
  },
  props: ['sidebarItems'],
  data() {
    return {
      inActiveElementId: '',
      isButtonInactive: false,
    };
  },
  computed: {
    isApi() {
      return this.$route.fullPath.match(/([^/]*\/)?api\//);
    },
  },
  methods: {
    isScriptLoaderActivated(exampleId) {
      return exampleId !== this.inActiveElementId;
    },
    resetDemo(exampleId) {
      // demo can only be reset once per second
      const exampleDiv = document.querySelector(
        `[data-example-id="${exampleId}"]`
      );
      const exampleContainer = exampleDiv?.closest('.example-container');

      exampleContainer.setAttribute(
        'style',
        `height: ${exampleContainer?.offsetHeight - 16}px`
      );

      this.inActiveElementId = exampleId;
      this.isButtonInactive = true;

      setTimeout(() => {
        this.inActiveElementId = '';
        instanceRegister.destroyExample(exampleId);
      }, 100);

      setTimeout(() => {
        exampleContainer.removeAttribute('style');
        this.isButtonInactive = false;
      }, 1000);
    },
    copyCode(e) {
      const button = e.target;
      const preTag = button.parentElement;
      const codeTag = preTag.querySelector('code');

      navigator.clipboard.writeText(codeTag.innerText);
      button.classList.add('check');
      setTimeout(() => {
        button.classList.remove('check');
      }, 2000);
    },
    reportCode() {
      // eslint-disable-next-line max-len
      window.open(
        `https://github.com/handsontable/handsontable/issues/new?link=${window.location}&template=improve_docs.yaml`,
        '_blank'
      );
    },
    openDropdown(e) {
      const button = e.target;
      button.classList.toggle('active');
    },
    showCodeButton(e) {
      e.target.parentElement?.classList.toggle('active');
    },
    setActiveElement(id) {
      const wrapper = document.querySelector('.table-of-contents > ul');
      const items = document.querySelectorAll(
        '.table-of-contents > ul li'
      );

      items.forEach((item) => {
        item.classList.remove('active');
      });

      const activeItem = document.querySelector(
        `.table-of-contents > ul li a[href="${id}"]`
      );

      if (activeItem) {
        const parentElement = activeItem.parentElement;

        parentElement.classList.add('active');
        const top = parentElement.offsetTop - wrapper.offsetHeight;

        wrapper.scrollTo({ top, behavior: 'smooth' });
      }
    },
    checkSectionInView() {
      const sections = document.querySelectorAll(
        '.theme-default-content h2, .theme-default-content h3'
      );
      const visibleElements = [];

      sections.forEach((section) => {
        const topDistance = section.getBoundingClientRect().top;

        if (topDistance > 0 && topDistance < window.innerHeight) {
          visibleElements.push(section);
        }
      });

      if (visibleElements[0]) {
        this.setActiveElement(`#${visibleElements[0].id}`);
      }
    },
  },
  mounted() {
    this.checkSectionInView();
    window.addEventListener('scroll', this.checkSectionInView);
  },
  unmounted() {
    window.removeEventListener('scroll', this.checkSectionInView);
  },
};
</script>
