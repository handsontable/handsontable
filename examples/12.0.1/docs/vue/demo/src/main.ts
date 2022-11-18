import Vue from "vue";
import App from "./App.vue";

Vue.config.silent = true;

new Vue({
  render: (h) => h(App)
}).$mount("#app");
