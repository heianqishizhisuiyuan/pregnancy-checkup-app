<template>
  <div class="app-layout" :class="{ 'has-tab-bar': showTabBar }">
    <header v-if="showHeader" class="app-header">
      <div class="header-content">
        <div class="logo-section" @click="goHome">
          <span class="logo">💝</span>
          <span class="app-name">孕期记录</span>
        </div>
        <div class="header-actions">
          <ThemeToggle />
          <div class="user-chip" @click="goProfile">
            <UserAvatar :name="displayName" size="sm" />
            <span class="username">{{ displayName }}</span>
          </div>
          <el-tag v-if="!isOwner" size="small" type="info" class="role-tag hide-mobile">只读家人</el-tag>
        </div>
      </div>
    </header>

    <main class="app-main">
      <slot />
    </main>

    <nav v-if="showTabBar" class="bottom-tab-bar" aria-label="主导航">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        type="button"
        class="tab-item"
        :class="{ active: activeTab === tab.name }"
        @click="router.push(tab.to)"
      >
        <el-icon :size="20"><component :is="tab.icon" /></el-icon>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { House, Clock, TrendCharts, User } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import UserAvatar from '@/components/UserAvatar.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const tabs = [
  { name: 'Home', label: '首页', to: '/', icon: House },
  { name: 'Timeline', label: '时间轴', to: '/timeline', icon: Clock },
  { name: 'Trends', label: '趋势', to: '/trends', icon: TrendCharts },
  { name: 'Profile', label: '我的', to: '/profile', icon: User },
];

const showHeader = computed(() => route.meta.hideAppHeader !== true);
const showTabBar = computed(() => route.meta.hideTabBar !== true);
const activeTab = computed(() => route.name);
const isOwner = computed(() => authStore.isOwner);
const displayName = computed(() => authStore.user?.profile?.nickname || authStore.user?.username || '');

const goHome = () => {
  if (route.name !== 'Home') {
    router.push('/');
  }
};

const goProfile = () => {
  if (route.name !== 'Profile') {
    router.push({ name: 'Profile' });
  }
};
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.app-layout.has-tab-bar .app-main {
  padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(10px);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-sm) var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.logo {
  font-size: 1.35rem;
}

.app-name {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}

.user-chip:hover {
  background: var(--color-accent-light);
}

.username {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-tag {
  flex-shrink: 0;
}

.bottom-tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  display: flex;
  background: var(--color-bg-white);
  border-top: 1px solid var(--color-border);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}

.tab-item.active {
  color: var(--color-accent);
}

.tab-label {
  font-size: 0.7rem;
  line-height: 1.2;
}

@media (max-width: 640px) {
  .hide-mobile {
    display: none;
  }

  .username {
    display: none;
  }
}

@media (min-width: 768px) {
  .bottom-tab-bar {
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: var(--radius-md) var(--radius-md) 0 0;
  }
}
</style>
