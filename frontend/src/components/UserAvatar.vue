<template>
  <div class="user-avatar" :class="sizeClass" :title="name">
    {{ initials }}
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
});

const initials = computed(() => {
  const text = props.name.trim();
  if (!text) return '?';
  // 中文取首字，英文取首字母
  if (/[\u4e00-\u9fa5]/.test(text[0])) {
    return text[0];
  }
  return text[0].toUpperCase();
});

const sizeClass = computed(() => `size-${props.size}`);
</script>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-accent-light);
  color: var(--color-accent);
  font-weight: 600;
  flex-shrink: 0;
  user-select: none;
}

.size-sm {
  width: 28px;
  height: 28px;
  font-size: 0.75rem;
}

.size-md {
  width: 32px;
  height: 32px;
  font-size: 0.875rem;
}

.size-lg {
  width: 48px;
  height: 48px;
  font-size: 1.125rem;
}
</style>
