<template>
  <button v-on:click="toggleTheme" >Yo! {{current}}</button>
</template>

<script>
const CLASS_THEME_DARK = 'theme-dark'

export default {
  name: 'ThemeSwitcher',
  methods:{
    toggleTheme(){
      document.querySelector('body').classList.toggle(CLASS_THEME_DARK) //todo: alert nie działa pod wszystkimi przeglądarkami, sprawdić !
      this.current = document.querySelector('body').classList.contains(CLASS_THEME_DARK) ? 'dark' : 'light';
    }
  },
  data(){
    return {
      current: document.querySelector('body').classList.contains(CLASS_THEME_DARK) ? 'dark' : 'light' //todo duplicated code, refactor
    }
  }
};
</script>

<style lang="stylus">

</style>
