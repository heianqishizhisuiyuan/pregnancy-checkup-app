<template>
  <div v-if="attachments.length" ref="containerRef" class="thumb-row">
    <div
      v-for="attachment in attachments"
      :key="attachment._id"
      class="thumb-item"
    >
      <img
        v-if="urls[attachment._id]"
        :src="urls[attachment._id]"
        alt=""
        class="thumb-img"
        loading="lazy"
      />
      <div v-else class="thumb-placeholder" />
    </div>
    <span v-if="extraCount > 0" class="thumb-more">+{{ extraCount }}</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { createAttachmentPreviewObjectUrl } from '@/utils/attachmentPreview.js';

const props = defineProps({
  attachments: {
    type: Array,
    default: () => [],
  },
  totalCount: {
    type: Number,
    default: 0,
  },
});

const authStore = useAuthStore();
const containerRef = ref(null);
const urls = ref({});
const loadingIds = ref(new Set());
let observer;

const extraCount = computed(() => {
  const total = props.totalCount || props.attachments.length;
  return Math.max(0, total - props.attachments.length);
});

const loadThumbnail = async (attachment) => {
  if (!attachment?.path || urls.value[attachment._id] || loadingIds.value.has(attachment._id)) {
    return;
  }
  loadingIds.value.add(attachment._id);
  try {
    const url = await createAttachmentPreviewObjectUrl({
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      path: attachment.path,
      token: authStore.token || localStorage.getItem('token'),
    });
    urls.value = { ...urls.value, [attachment._id]: url };
  } catch {
    // 缩略图加载失败时保持占位
  } finally {
    loadingIds.value.delete(attachment._id);
  }
};

const observeContainer = () => {
  if (!containerRef.value || !('IntersectionObserver' in window)) {
    props.attachments.forEach(loadThumbnail);
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        props.attachments.forEach(loadThumbnail);
        observer?.disconnect();
      }
    },
    { rootMargin: '100px' }
  );
  observer.observe(containerRef.value);
};

watch(
  () => props.attachments,
  () => {
    observeContainer();
  },
  { deep: true }
);

onMounted(() => {
  observeContainer();
});

onBeforeUnmount(() => {
  observer?.disconnect();
  Object.values(urls.value).forEach((url) => {
    if (url && typeof URL !== 'undefined') {
      URL.revokeObjectURL(url);
    }
  });
});
</script>

<style scoped>
.thumb-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--spacing-sm);
}

.thumb-item {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-bg-surface);
}

.thumb-more {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}
</style>
