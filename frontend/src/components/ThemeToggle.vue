<template>
  <button type="button" class="theme-toggle" :title="isDark ? '切换浅色' : '切换深色'" @click="toggleTheme">
    <el-icon :size="18">
      <Sunny v-if="isDark" />
      <Moon v-else />
    </el-icon>
  </button>
</template>

<script setup>
import { Sunny, Moon } from '@element-plus/icons-vue';
import { useTheme } from '@/composables/useTheme.js';

const { isDark, toggleTheme } = useTheme();
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
}

.theme-toggle:hover {
  color: var(--color-accent);
  background: var(--color-accent-light);
}
</style>
