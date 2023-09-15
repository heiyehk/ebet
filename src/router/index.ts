import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'main',
    component: () => import('@/pages/main.vue')
  },
  {
    path: '/ebet',
    name: 'ebet',
    component: () => import('@/pages/ebet/index.vue')
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to) => {
  if (to.fullPath) {
    localStorage.setItem('rememberPath', to.fullPath);
  }
});

router.onError((error) => {
  console.error(error);
});

export default router;
