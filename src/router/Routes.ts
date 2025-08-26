const basePath = '/PixelWalker-Copy-Bot'

export const LoginViewRoute = {
  path: `${basePath}/login`,
  name: 'login',
  component: () => import('@/view/LoginView.vue'),
}

export const HomeViewRoute = {
  path: `${basePath}/home`,
  name: 'home',
  component: () => import('@/view/HomeView.vue'),
}

export const EelvlImportViewRoute = {
  path: `${basePath}/import-eelvl`,
  name: 'import-eelvl',
  component: () => import('@/view/EelvlImportView.vue'),
}

export const EelvlExportViewRoute = {
  path: `${basePath}/export-eelvl`,
  name: 'export-eelvl',
  component: () => import('@/view/EelvlExportView.vue'),
}

export const PngImportViewRoute = {
  path: `${basePath}/import-png`,
  name: 'import-png',
  component: () => import('@/view/PngImportView.vue'),
}

export const MidiImportViewRoute = {
  path: `${basePath}/import-midi`,
  name: 'import-midi',
  component: () => import('@/view/MidiImportView.vue'),
}

export const DevViewRoute = {
  path: `${basePath}/dev`,
  name: 'dev',
  component: () => import('@/view/DevView.vue'),
}

export const EerImportViewRoute = {
  path: `${basePath}/import-eer`,
  name: 'import-eer',
  component: () => import('@/view/EerImportView.vue'),
}

export const HostBombotViewRoute = {
  path: `${basePath}/dev`,
  name: 'host-bombot',
  component: () => import('@/view/HostBombotView.vue'),
}

export const NotFoundViewRoute = {
  path: '/:pathMatch(.*)*',
  name: 'notFound',
  component: () => import('@/view/NotFoundView.vue'),
}
