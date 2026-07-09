import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'
import AssetDetail from '../pages/AssetDetail.vue'
import Portfolio from '../pages/Portfolio.vue'
import Analysis from '../pages/Analysis.vue'
import Daytrading from '../pages/Daytrading.vue'
import Settings from '../pages/Settings.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/asset/:id',
    name: 'AssetDetail',
    component: AssetDetail
  },
  {
    path: '/portfolio',
    name: 'Portfolio',
    component: Portfolio
  },
  {
    path: '/analysis/:id',
    name: 'Analysis',
    component: Analysis
  },
  {
    path: '/daytrading',
    name: 'Daytrading',
    component: Daytrading
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
