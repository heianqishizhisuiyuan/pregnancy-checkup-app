import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ElMessage } from 'element-plus';
import { getCurrentUser } from '@/api/auth';
import { ensureAuthUser } from './authGuard';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/family/edit',
    name: 'FamilyEdit',
    component: () => import('@/views/FamilyEdit.vue'),
    meta: { requiresAuth: true, requiresOwner: true },
  },
  {
    path: '/record/new',
    name: 'RecordNew',
    component: () => import('@/views/RecordForm.vue'),
    meta: { requiresAuth: true, requiresOwner: true },
  },
  {
    path: '/record/:id',
    name: 'RecordDetail',
    component: () => import('@/views/RecordDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/record/:id/edit',
    name: 'RecordEdit',
    component: () => import('@/views/RecordForm.vue'),
    meta: { requiresAuth: true, requiresOwner: true },
  },
  {
    path: '/timeline',
    name: 'Timeline',
    component: () => import('@/views/Timeline.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token');

  if (to.meta.requiresAuth && !token) {
    // 需要认证但未登录，跳转到登录页
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (to.meta.requiresOwner) {
    // 需要 owner 权限
    const authStore = useAuthStore();
    try {
      await ensureAuthUser(authStore, getCurrentUser);
    } catch {
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }

    if (!authStore.isOwner) {
      ElMessage.warning('权限不足，仅主账号可操作');
      next({ name: 'Home' });
      return;
    }
    next();
  } else if (!to.meta.requiresAuth && token && (to.name === 'Login' || to.name === 'Register')) {
    // 已登录但访问登录/注册页，跳转到首页
    next({ name: 'Home' });
  } else {
    next();
  }
});

export default router;
