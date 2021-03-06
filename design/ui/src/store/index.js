import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import Cookies from 'js-cookie'
import addMonths from 'date-fns/add_months'
import addYears from 'date-fns/add_years'
import endOfYear from 'date-fns/end_of_year'
import startOfYear from 'date-fns/start_of_year'
import {ymDateFormat} from '../libs/dates'
import {format as formatNumber} from 'mathjs/lib/function/string/format'
import VuexPersistence from 'vuex-persist'
import {sortOrganizations} from '../libs/organizations'
import interest from './modules/interest'
import maintenance from './modules/maintenance'

Vue.use(Vuex)

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  reducer: state => ({
    selectedOrganizationId: state.selectedOrganizationId,
    dateRangeIndex: state.dateRangeIndex,
    dateRangeStart: state.dateRangeStart,
    dateRangeEnd: state.dateRangeEnd,
  })
})

export default new Vuex.Store({
  plugins: [vuexLocal.plugin],
  modules: {
    interest,
    maintenance,
  },
  state: {
    user: null,
    invalidUser: false,
    snackbarShow: false,
    snackbarContent: null,
    snackbarColor: null,
    loginError: null,
    organizations: {},
    selectedOrganizationId: null,
    dateRangeStart: null,
    dateRangeEnd: null,
    dateRangeIndex: 0,
    dateRanges: [
          {name: 'date_range.all_available', start: null, end: null},
          {name: 'date_range.last_12_mo', start: -12, end: 0},
          {name: 'date_range.previous_year', start: startOfYear(addYears(new Date(), -1)),
           end: endOfYear(addYears(new Date(), -1))},
          {name: 'date_range.custom', custom: true},
        ],
    numberFormat: {
          notation: 'fixed',
          precision: 1,
    },
    showLoginDialog: false,
    appLanguage: 'en',
    basicInfo: {},
  },
  getters: {
    avatarImg: state => {
      return null
    },
    avatarText: state => {
      if (state.user) {
        if (state.user.email) {
          return state.user.email[0].toUpperCase()
        } else {
          return state.user.username[0].toUpperCase()
        }
      }
      return 'A'
    },
    usernameText: state => {
      if (state.user) {
        if (state.user.first_name && state.user.last_name) {
          return `${state.user.first_name} ${state.user.last_name}`
        } else if (state.user.email) {
          return state.user.email
        } else {
          return state.user.username
        }
      }
      return 'not logged in'
    },
    loggedIn: state => state.user !== null,
    organizationItems: state => sortOrganizations(state.organizations, state.appLanguage),
    selectedOrganization: state => {
      if (state.organizations && state.selectedOrganizationId !== null) {
        return state.organizations[state.selectedOrganizationId]
      } else {
        return null
      }
    },
    selectedDateRange: state => state.dateRanges[state.dateRangeIndex],
    dateRangeStartText (state) {
      if (state.dateRangeStart) {
        return ymDateFormat(state.dateRangeStart)
      }
      return ''
    },
    dateRangeEndText (state) {
      if (state.dateRangeEnd) {
        return ymDateFormat(state.dateRangeEnd)
      }
      return ''
    },
    formatNumber (state) {
      return (number) => (number === null) ? '-' : formatNumber(number, state.numberFormat)
    },
    showAdminStuff (state, getters) {
      // can the user admin the organization that is selected?
      return (
        (state.user && (state.user.is_from_master_organization || state.user.is_superuser)) ||
        (getters.selectedOrganization && getters.selectedOrganization.is_admin)
        )
    },
    showManagementStuff (state) {
      // can the user manage the system?
      return (state.user && (state.user.is_from_master_organization || state.user.is_superuser))
    },
    organizationSelected (state) {
      return state.selectedOrganizationId && state.selectedOrganizationId > 0
    },
    referenceCurrency (state) {
      if ('REFERENCE_CURRENCY' in state.basicInfo) {
        return state.basicInfo['REFERENCE_CURRENCY']
      }
      return null
    }
  },
  actions: {
    async start ({dispatch, getters, state}) {
      axios.defaults.xsrfCookieName = 'csrftoken'
      axios.defaults.xsrfHeaderName = 'X-CSRFToken'
      axios.interceptors.response.use(function (response) {
        // Do something with response data
        return response;
      }, function (error) {
        // Do something with response error
        if (axios.isCancel(error)) {
          // we ignore this
        } else if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // if there is 401 error, try to (re)authenticate
          dispatch('setShowLoginDialog', {show: true})
        } else if (typeof error.response === 'undefined') {
          // we are getting redirected to the EduID login page, but 302 is transparent for us
          // (the browser handles it on its own) and the error we get does not have any response
          // because it is caused by CORS violation when we try to get the eduid login page
          dispatch('setShowLoginDialog', {show: true})
        }
        return Promise.reject(error)
      })
      await dispatch('loadUserData')  // we need user data first
      dispatch('loadBasicInfo')
      dispatch('loadOrganizations')
      dispatch('changeDateRangeObject', state.dateRangeIndex)
      dispatch('fetchInterestGroups')
      if (getters.showManagementStuff) {
        dispatch('fetchNoInterestPlatforms')
      }
    },
    showSnackbar (context, {content, color}) {
      context.commit('setSnackbarContent', {'content': content})
      context.commit('setSnackbarShow', {'show': true, 'color': color})
    },
    hideSnackbar (context) {
      context.commit('setSnackbarShow', {'show': false})
    },
    selectOrganization (context, {id}) {
      context.commit('setSelectedOrganizationId', {id})
    },
    async loadUserData (context) {
      try {
        let response = await axios.get('/api/user/')
        context.commit('setUserData', response.data)
        context.commit('setAppLanguage', {lang: response.data.language})
      } catch(error) {
        if (error.response && error.response.status === 403) {
          // we could not get user data because of 403 Forbidden error
          // thus we must inform the user that he will not see anything
          context.commit('setInvalidUser', {value: true})
        } else {
          context.dispatch('showSnackbar', {content: 'Error loading user data: ' + error})
        }
      }
    },
    loadOrganizations (context) {
      axios.get('/api/organization/')
        .then(response => {
          let organizations = {}
          for (let rec of response.data) {
            if (rec['name_cs'] === null) {
              rec['name_cs'] = rec['name']
            }
            organizations[rec.pk] = rec
          }
          if (context.getters.showManagementStuff) {
            organizations[-1] = {name: 'All', name_cs: 'Všechny', name_en: 'All', pk: -1, extra: true}
          }
          context.commit('setOrganizations', organizations)
          if (!(context.state.selectedOrganizationId in organizations) && response.data.length > 0) {
            context.commit('setSelectedOrganizationId', {id: response.data[0].pk})
          }
        })
        .catch(error => {
          context.dispatch('showSnackbar', {content: 'Error loading organizations: ' + error})
        })
    },
    async loadBasicInfo ({dispatch, commit}) {
      try {
        commit('setBasicInfo', (await axios.get('/api/info/')).data)
      } catch (error) {
        dispatch('showSnackbar', {content: 'Error loading basic info: ' + error, color: 'error'})
      }

    },
    changeDateRangeObject (context, dateRangeIndex) {
      let drObj = context.state.dateRanges[dateRangeIndex]
      let start = null
      let end = null
      if (!drObj.custom) {
        // for custom specified, we do not do anything with the start and end
        if (drObj.start !== null) {
          if (typeof drObj.start === 'number') {
            start = addMonths(new Date(), drObj.start)
          } else {
            start = drObj.start
          }
        }
        if (drObj.end !== null) {
          if (typeof drObj.end === 'number') {
            end = addMonths(new Date(), drObj.end)
          } else {
            end = drObj.end
          }
        }
        context.commit('changeDateRange', {index: dateRangeIndex, start: start, end: end})
      } else {
        context.commit('changeDateRange', {index: dateRangeIndex})
        // if the end of the period is not specified, set it to current data,
        // because 'undefined' and null states are both used for special purposes
        // in the changeDateRange, we use the specific setters here
        if (context.state.dateRangeEnd === null) {
          context.commit('setDateRangeEnd', {date: new Date()})
        }
        if (context.state.dateRangeStart === null) {
          context.commit('setDateRangeStart', {date: addMonths(context.state.dateRangeEnd, -24)})
        }
      }
    },
    changeDateRangeStart (context, date) {
      context.commit('setDateRangeStart', {date})
    },
    changeDateRangeEnd (context, date) {
      context.commit('setDateRangeEnd', {date})
    },
    setShowLoginDialog (context, {show}) {
      context.commit('setShowLoginDialog', {show})
    },
    async setAppLanguage(context, {lang}) {
      context.commit('setAppLanguage', {lang})
      try {
        let csrftoken = Cookies.get('csrftoken')
        await axios.put(
          '/api/user/language',
          {language: lang},
          {headers: {'X-CSRFToken': csrftoken}}
          )
      } catch (error) {
        // ignore this error - it is not crucial
      }
    }
  },
  mutations: {
    setSnackbarShow(state, {show, color}) {
      Vue.set(state, 'snackbarColor', color)
      Vue.set(state, 'snackbarShow', show)
    },
    setSnackbarContent(state, {content}) {
      Vue.set(state, 'snackbarContent', content)
    },
    setLoginError(state, {error}) {
      Vue.set(state, 'loginError', error)
    },
    setAuthToken(state, {token}) {
      Vue.set(state, 'authToken', token)
    },
    setUserData(state, user) {
      state.user = user
    },
    setOrganizations(state, organizations) {
      state.organizations = organizations
    },
    setSelectedOrganizationId(state, {id}) {
      state.selectedOrganizationId = id
    },
    changeDateRange(state, {index, start, end}) {
      state.dateRangeIndex = index
      if (typeof start !== 'undefined') {
        state.dateRangeStart = start
      }
      if (typeof end !== 'undefined') {
        state.dateRangeEnd = end
      }
    },
    setDateRangeStart(state, {date}) {
      state.dateRangeStart = date
    },
    setDateRangeEnd(state, {date}) {
      state.dateRangeEnd = date
    },
    setShowLoginDialog (state, {show}) {
      state.showLoginDialog = show
    },
    setAppLanguage(state, {lang}) {
      state.appLanguage = lang
    },
    setInvalidUser(state, {value}) {
      state.invalidUser = value
    },
    setBasicInfo(state, data) {
      state.basicInfo = data
    }
  }
})
