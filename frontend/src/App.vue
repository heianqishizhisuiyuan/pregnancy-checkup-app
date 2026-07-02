<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getCurrentUser } from '@/api/auth';

const router = useRouter();
const authStore = useAuthStore();

// 应用启动时获取用户信息
onMounted(async () => {
  if (authStore.token) {
    try {
      const response = await getCurrentUser();
      if (response.success) {
        authStore.setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
      authStore.logout();
      router.push({ name: 'Login' });
    }
  }
});
</script>

<style>
/* 全局样式已在 theme.css 中定义 */
</style>
