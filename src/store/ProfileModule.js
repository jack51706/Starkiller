import axios from 'axios';
import { setInstance } from '@/api/axios-instance';
import { initNamespacedStore } from '@/store/electron-store';

export default {
  namespaced: true,
  state: {
    token: '',
    url: '',
    user: {},
    loginError: '',
    empireVersion: '',
  },
  mutations: {
    setApplicationState(state, {
      token, url, user, version,
    }) {
      state.token = token;
      state.url = url;
      state.user = user;
      state.empireVersion = version;
      setInstance(url, token);
      initNamespacedStore(url);
    },
    setLoginError(state, error) {
      state.loginError = error;
    },
    setLogout(state) {
      state.token = '';
      state.url = '';
      state.user = {};
    },
  },
  actions: {
    async login(context, { url, username, password }) {
      try {
        context.commit('setLoginError', '');
        const token = await axios.post(`https://${url}/api/admin/login`,
          { username, password },
          { headers: { 'Content-Type': 'application/json' } });

        const user = await axios.get(`https://${url}/api/users/me?token=${token.data.token}`);
        const version = await axios.get(`https://${url}/api/version?token=${token.data.token}`);
        context.commit('setApplicationState', {
          token: token.data.token, url, user: user.data, version: version.data.version,
        });
      } catch (err) {
        let message = '';
        if (err.response && err.response.data) {
          message = err.response.data;
        } else if (err.response && err.response.statusText) {
          message = err.response.statusText;
        } else {
          message = 'Unable to connect to server.';
        }
        context.commit('setLoginError', message);
      }
    },
    async logout(context) {
      axios.post(`https://${context.state.url}/api/admin/logout?token=${context.state.token}`);
      context.commit('setLogout');
    },
  },
  getters: {
    isLoggedIn(state) {
      return state.token.length > 0;
    },
    isAdmin(state) {
      return state.user.admin === true;
    },
  },
};
