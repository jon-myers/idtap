import { createApp } from 'vue';
import App from '@/App.vue';
import router from './router';
import { createStore } from 'vuex';
import vue3GoogleLogin from 'vue3-google-login';
import VueCookies from 'vue-cookies';

const store = createStore({
  state() {
    return {
      _id: '63445d13dc8b9023a09747a6',
      userID: undefined,
      firstTime: false,
      returning: false,
      firstName: undefined,
      name: undefined,
      lastName: undefined,
      query: undefined,
      incomingFullPath: undefined
    }
  },
  mutations: {
    update_id(state, _id) {
      state._id = _id
    },
    
    update_userID(state, userID) {
      state.userID = userID
    },
    
    update_firstTime(state, firstTime) {
      state.firstTime = firstTime
    },
    
    update_returning(state, returning) {
      state.returning = returning
    },
    
    update_firstName(state, firstName) {
      state.firstName = firstName
    },

    update_name(state, name) {
      state.name = name
    },

    update_lastName(state, lastName) {
      state.lastName = lastName
    },

    update_query(state, query) {
      state.query = query
    },

    update_incomingFullPath(state, incomingFullPath) {
      state.incomingFullPath = incomingFullPath
    }
  }
})

// for event bus
import mitt from 'mitt';
import { createHead } from '@vueuse/head';
const head = createHead();
const emitter = mitt();
const app = createApp(App);
export { store };
app.config.globalProperties.emitter = emitter;
app
  .use(router)
  .use(store)
  .use(vue3GoogleLogin, {
    clientId: "324767655055-crhq76mdupavvrcedtde986glivug1nm.apps.googleuserc" +
      "ontent.com"
  })
  .use(VueCookies, { expires: '7d' })
  .use(head)
  .mount('#app');
