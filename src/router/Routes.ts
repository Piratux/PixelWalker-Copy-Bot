import type { RouteRecordRaw } from 'vue-router'
import MidiImportView from '@/view/MidiImportView.vue'
import LoginView from '@/view/LoginView.vue'
import HomeView from '@/view/HomeView.vue'
import EelvlImportView from '@/view/EelvlImportView.vue'
import EelvlExportView from '@/view/EelvlExportView.vue'
import PngImportView from '@/view/PngImportView.vue'
import DevView from '@/view/DevView.vue'
import EerImportView from '@/view/EerImportView.vue'
import NotFoundView from '@/view/NotFoundView.vue'
import { RouteName } from './RouteName.ts'

const basePath = '/PixelWalker-Copy-Bot'

export const Routes: RouteRecordRaw[] = [
  {
    path: `${basePath}/login`,
    name: RouteName.Login,
    component: LoginView,
  },
  {
    path: `${basePath}/home`,
    name: RouteName.Home,
    component: HomeView,
  },
  {
    path: `${basePath}/import-eelvl`,
    name: RouteName.ImportEelvl,
    component: EelvlImportView,
  },
  {
    path: `${basePath}/export-eelvl`,
    name: RouteName.ExportEelvl,
    component: EelvlExportView,
  },
  {
    path: `${basePath}/import-png`,
    name: RouteName.ImportPng,
    component: PngImportView,
  },
  {
    path: `${basePath}/import-midi`,
    name: RouteName.ImportMidi,
    component: MidiImportView,
  },
  {
    path: `${basePath}/dev`,
    name: RouteName.Dev,
    component: DevView,
  },
  {
    path: `${basePath}/import-eer`,
    name: RouteName.ImportEer,
    component: EerImportView,
  },
  {
    path: '/:pathMatch(.*)*',
    name: RouteName.NotFound,
    component: NotFoundView,
  },
]
