const basePath = '/PixelWalker-Copy-Bot'

import MidiImportView from '@/view/MidiImportView.vue'
import LoginView from '@/view/LoginView.vue'
import HomeView from '@/view/HomeView.vue'
import EelvlImportView from '@/view/EelvlImportView.vue'
import EelvlExportView from '@/view/EelvlExportView.vue'
import PngImportView from '@/view/PngImportView.vue'
import DevView from '@/view/DevView.vue'
import EerImportView from '@/view/EerImportView.vue'
import NotFoundView from '@/view/NotFoundView.vue'

export const LoginViewRoute = {
  path: `${basePath}/login`,
  name: 'login',
  component: LoginView,
}

export const HomeViewRoute = {
  path: `${basePath}/home`,
  name: 'home',
  component: HomeView,
}

export const EelvlImportViewRoute = {
  path: `${basePath}/import-eelvl`,
  name: 'import-eelvl',
  component: EelvlImportView,
}

export const EelvlExportViewRoute = {
  path: `${basePath}/export-eelvl`,
  name: 'export-eelvl',
  component: EelvlExportView,
}

export const PngImportViewRoute = {
  path: `${basePath}/import-png`,
  name: 'import-png',
  component: PngImportView,
}

export const MidiImportViewRoute = {
  path: `${basePath}/import-midi`,
  name: 'import-midi',
  component: MidiImportView,
}

export const DevViewRoute = {
  path: `${basePath}/dev`,
  name: 'dev',
  component: DevView,
}

export const EerImportViewRoute = {
  path: `${basePath}/import-eer`,
  name: 'import-eer',
  component: EerImportView,
}

export const NotFoundViewRoute = {
  path: '/:pathMatch(.*)*',
  name: 'notFound',
  component: NotFoundView,
}
