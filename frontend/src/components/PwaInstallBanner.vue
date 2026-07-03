<template>
  <div v-if="shouldShowBanner" class="pwa-banner">
    <div class="pwa-icon">📲</div>
    <div class="pwa-body">
      <div class="pwa-title">添加到主屏幕</div>
      <p class="pwa-text">{{ installHint }}</p>
      <div class="pwa-actions">
        <button
          v-if="canNativeInstall"
          type="button"
          class="pwa-btn primary"
          @click="handleInstall"
        >
          立即安装
        </button>
        <button type="button" class="pwa-btn" @click="dismissBanner">知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus';
import { usePwaInstall } from '@/composables/usePwaInstall.js';

const {
  shouldShowBanner,
  canNativeInstall,
  installHint,
  promptInstall,
  dismissBanner,
} = usePwaInstall();

const handleInstall = async () => {
  const result = await promptInstall();
  if (result === 'accepted') {
    ElMessage.success('已添加到主屏幕');
  }
};
</script>

<style scoped>
.pwa-banner {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  background: var(--color-bg-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.pwa-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.pwa-body {
  flex: 1;
  min-width: 0;
}

.pwa-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.pwa-text {
  margin: 0 0 var(--spacing-sm);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.pwa-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.pwa-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-accent);
  background: #fff;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.pwa-btn.primary {
  color: #fff;
  background: var(--color-accent);
}

.pwa-btn:hover {
  opacity: 0.92;
}
</style>
