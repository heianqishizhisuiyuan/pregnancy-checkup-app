<template>
  <Transition name="offline-slide">
    <div v-if="isOffline" class="offline-banner" role="status">
      <el-icon><Warning /></el-icon>
      <span>当前处于离线状态，部分功能可能不可用</span>
    </div>
  </Transition>
</template>

<script setup>
import { Warning } from '@element-plus/icons-vue';
import { useOfflineStatus } from '@/composables/useOfflineStatus.js';

const { isOffline } = useOfflineStatus();
</script>

<style scoped>
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.8125rem;
  border-bottom: 1px solid #fcd34d;
}

.offline-slide-enter-active,
.offline-slide-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.offline-slide-enter-from,
.offline-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
