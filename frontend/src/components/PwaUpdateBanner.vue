<template>
  <Transition name="update-slide">
    <div v-if="pwaNeedRefresh" class="update-banner" role="alert">
      <div class="update-text">
        <strong>发现新版本</strong>
        <span>请点击更新以使用最新功能</span>
      </div>
      <button type="button" class="update-btn" @click="handleUpdate">立即更新</button>
    </div>
  </Transition>
</template>

<script setup>
import { pwaNeedRefresh, applyPwaUpdate } from '@/composables/usePwaUpdate.js';

function handleUpdate() {
  applyPwaUpdate();
}
</script>

<style scoped>
.update-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  padding-top: max(10px, env(safe-area-inset-top));
  background: var(--color-accent, #c4612f);
  color: #fff;
  font-size: 0.8125rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.update-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}

.update-text strong {
  font-weight: 600;
}

.update-btn {
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.update-btn:active {
  background: rgba(255, 255, 255, 0.3);
}

.update-slide-enter-active,
.update-slide-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.update-slide-enter-from,
.update-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
