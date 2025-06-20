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

export const ImportEelvlViewRoute = {
  path: `${basePath}/import-eelvl`,
  name: 'import-eelvl',
  component: () => import('@/view/EelvlImportView.vue'),
}

export const ExportEelvlViewRoute = {
  path: `${basePath}/export-eelvl`,
  name: 'export-eelvl',
  component: () => import('@/view/EelvlExportView.vue'),
}

export const DevViewRoute = {
  path: `${basePath}/dev`,
  name: 'dev',
  component: () => import('@/view/DevView.vue'),
}

export const NotFoundRoute = {
  path: '/:pathMatch(.*)*',
  name: 'notFound',
  component: () => import('@/view/NotFoundView.vue'),
}
