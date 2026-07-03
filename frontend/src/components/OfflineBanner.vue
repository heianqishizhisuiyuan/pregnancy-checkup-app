<template>
  <Transition name="offline-slide">
    <div v-if="isOffline" class="offline-banner" role="status">
      <el-icon><Warning /></el-icon>
      <div class="offline-text">
        <strong>当前离线</strong>
        <span>可浏览已缓存页面；新建/编辑记录、上传图片、导出数据需联网</span>
      </div>
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
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.8125rem;
  border-bottom: 1px solid #fcd34d;
}

.offline-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.4;
}

.offline-text strong {
  font-weight: 600;
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
