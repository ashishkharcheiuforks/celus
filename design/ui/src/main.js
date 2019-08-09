import Vue from 'vue'
import App from './pages/Main'
import store from './store'
import router from './router'
import i18n from './i18n'
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false

new Vue({
  el: "#app",
  render: h => h(App),
  store,
  i18n,
  router,
  vuetify
})
