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
import PageEdit from "@theme/components/PageEdit.vue";
import Breadcrumbs from "@theme/components/Breadcrumbs.vue";

export default {
  components: {
    PageEdit,
    Breadcrumbs,
  },
  props: ["sidebarItems"],
  watch: {
    $route(to, from) {
      if (to.hash !== from.hash) {
        const prevItem = document.querySelector(
          `.table-of-contents > ul li a[href="${from.hash}"]`
        );
        const activeItem = document.querySelector(
          `.table-of-contents > ul li a[href="${to.hash}"]`
        );

        if (prevItem) prevItem.parentElement.classList.remove("active");
        if (activeItem) activeItem.parentElement.classList.add("active");
      }
    },
  },
  computed: {
    isApi() {
      return this.$route.fullPath.match(/([^/]*\/)?api\//);
    },
  },
  methods: {
    copyCode(e) {
      const button = e.target;
      const preTag = button.parentElement;
      const codeTag = preTag.querySelector("code");

      navigator.clipboard.writeText(codeTag.innerText);
      button.classList.add("check");
      setTimeout(() => {
        button.classList.remove("check");
      }, 2000);
    },
    showCodeButton(e) {
      e.target.parentElement?.classList.toggle("active");
    },
    setActiveElement() {
      const sections = document.querySelectorAll(
        ".theme-default-content h2, .theme-default-content h3"
      );

      const checkSectionInView = () => {
        sections.forEach((section) => {
          const topDistance = section.getBoundingClientRect().top;

          // if the distance to the top is between 0-200px
          if (
            topDistance > 0 &&
            topDistance < 200 &&
            this.$route.hash !== `#${section.id}`
          ) {
            this.$router.push({ hash: section.id });
          }
        });
      };

      // Listen for scroll event
      window.addEventListener("scroll", checkSectionInView);
    },
  },
  mounted() {
    this.setActiveElement();
  },
  updated() {
    this.setActiveElement();
  },
};
</script>
