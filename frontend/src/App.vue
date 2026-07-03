<template>
  <AppLayout v-if="useLayout">
    <router-view />
  </AppLayout>
  <router-view v-else />
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getCurrentUser } from '@/api/auth';
import AppLayout from '@/components/AppLayout.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const useLayout = computed(() => route.meta.layout === true);

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
