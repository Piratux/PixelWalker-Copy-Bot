import type { RouteLocationNormalizedGeneric } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { Routes } from './Routes.ts'
import { RouteName } from './RouteName.ts'
import { AlertService } from '@/core/service/AlertService.ts'

function buildRouter() {
  const router = createRouter({
    history: createWebHistory(),
    routes: Routes,
  })

  router.beforeEach((to: RouteLocationNormalizedGeneric) => {
    AlertService.clear()
    if (to.name === RouteName.NOT_FOUND) {
      return { name: RouteName.HOME }
    }
  })

  return router
}

export { buildRouter as createRouter }
