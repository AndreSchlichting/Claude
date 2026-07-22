import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'
import AssetDetail from '../pages/AssetDetail.vue'
import Portfolio from '../pages/Portfolio.vue'
import Analysis from '../pages/Analysis.vue'
import Daytrading from '../pages/Daytrading.vue'
import EventLog from '../pages/EventLog.vue'
import Modi from '../pages/Modi.vue'
import AnalysisTools from '../pages/AnalysisTools.vue'
import Journal from '../pages/Journal.vue'
import Replay from '../pages/Replay.vue'
import Calendar from '../pages/Calendar.vue'
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
    path: '/protokoll',
    name: 'EventLog',
    component: EventLog
  },
  {
    path: '/modi',
    name: 'Modi',
    component: Modi
  },
  {
    path: '/analyse',
    name: 'AnalysisTools',
    component: AnalysisTools
  },
  {
    path: '/journal',
    name: 'Journal',
    component: Journal
  },
  {
    path: '/replay',
    name: 'Replay',
    component: Replay
  },
  {
    path: '/kalender',
    name: 'Calendar',
    component: Calendar
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  }
]

// Hybrid-Erkennung: In Electron (file://) und Capacitor (Android)
// funktioniert nur Hash-History; im Web bleibt die saubere URL-History.
const isHybridShell = window.location.protocol === 'file:' ||
  window.location.protocol === 'capacitor:' ||
  typeof (window as any).Capacitor !== 'undefined'

const router = createRouter({
  history: isHybridShell ? createWebHashHistory() : createWebHistory(),
  routes
})

export default router
