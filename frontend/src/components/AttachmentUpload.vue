<template>
  <div class="attachment-upload">
    <div v-if="!isQueueMode" class="upload-fields">
      <el-select v-model="uploadCategory" placeholder="选择分类">
        <el-option
          v-for="item in categories"
          :key="item"
          :label="item"
          :value="item"
        >
          <CategoryIcon :category="item" :size="14" inline />
          <span>{{ item }}</span>
        </el-option>
      </el-select>
      <el-input
        v-model="uploadTagsStr"
        placeholder="标签用逗号分隔（可选）"
      />
    </div>

    <el-upload
      ref="uploadRef"
      v-model:file-list="fileList"
      :action="uploadUrl"
      :headers="uploadHeaders"
      :http-request="submitUploadRequest"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :limit="maxCount"
      :disabled="isUploadDisabled"
      :show-file-list="props.mode === 'upload'"
      name="files"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      list-type="picture-card"
      multiple
    >
      <el-icon><Plus /></el-icon>
      <template #tip>
        <div class="upload-tip">
          支持 jpg/png/webp，单张最大 10MB，最多 {{ maxCount }} 张
        </div>
      </template>
    </el-upload>

    <div v-if="isQueueMode" class="queue-panel">
      <div class="queue-summary">
        <span>待上传 {{ pendingQueueItems.length }} 张</span>
        <span>还可添加 {{ maxCount }} 张</span>
      </div>

      <div v-if="pendingQueueItems.length === 0" class="queue-empty">
        选图后会先暂存在这里，保存记录后自动上传。
      </div>

      <div v-else class="queue-list">
        <div
          v-for="entry in pendingQueueItems"
          :key="entry.id"
          class="queue-item"
        >
          <div class="queue-preview">
            <img
              v-if="getQueuedPreviewUrl(entry.id)"
              :src="getQueuedPreviewUrl(entry.id)"
              :alt="entry.file.name"
            >
            <div v-else class="queue-preview-fallback">IMG</div>
          </div>

          <div class="queue-content">
            <div class="queue-header">
              <div class="queue-name" :title="entry.file.name">{{ entry.file.name }}</div>
              <el-button
                text
                type="danger"
                @click="handleRemoveQueuedItem(entry.id)"
              >
                删除
              </el-button>
            </div>

            <div class="queue-size">{{ formatFileSize(entry.file.size) }}</div>

            <div class="queue-fields">
              <el-select
                :model-value="entry.category"
                placeholder="选择分类"
                @change="(value) => handleQueuedCategoryChange(entry.id, value)"
              >
                <el-option
                  v-for="item in categories"
                  :key="item"
                  :label="item"
                  :value="item"
                >
                  <CategoryIcon :category="item" :size="14" inline />
                  <span>{{ item }}</span>
                </el-option>
              </el-select>

              <el-input
                :model-value="queueTagDrafts[entry.id] ?? entry.tags.join(', ')"
                placeholder="标签用逗号分隔"
                @update:model-value="(value) => updateQueuedTagDraft(entry.id, value)"
                @blur="commitQueuedTags(entry.id)"
                @keyup.enter="commitQueuedTags(entry.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { uploadAttachmentEntry } from '@/api/attachment';
import { ATTACHMENT_CATEGORIES } from '@/utils/attachmentCategories';
import CategoryIcon from '@/components/CategoryIcon.vue';
import {
  appendQueuedAttachmentEntries,
  getRemainingAttachmentSlots,
  normalizeAttachmentTags,
  removeQueuedAttachmentEntry,
  updateQueuedAttachmentEntry
} from '@/utils/attachmentQueue';
import { buildAttachmentUploadUrl } from '@/utils/attachmentUrls';

const props = defineProps({
  mode: {
    type: String,
    default: 'upload'
  },
  recordId: {
    type: String,
    default: ''
  },
  queueItems: {
    type: Array,
    default: () => []
  },
  existingCount: {
    type: Number,
    default: 0
  },
  disabled: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    default: '其他'
  },
  tags: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits([
  'success',
  'queue-change'
]);

const authStore = useAuthStore();
const uploadRef = ref(null);
const fileList = ref([]);
const pendingQueueItems = ref(props.queueItems);
const queueTagDrafts = ref({});
const queuedPreviewUrls = ref({});
const uploadCategory = ref(props.category);
const uploadTagsStr = ref('');
const categories = ATTACHMENT_CATEGORIES;

function canCreateObjectUrl() {
  return typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
}

function revokeQueuedPreviewUrl(entryId) {
  const previewUrl = queuedPreviewUrls.value[entryId];
  if (previewUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(previewUrl);
  }
  delete queuedPreviewUrls.value[entryId];
}

watch(
  () => props.queueItems,
  (queueItems) => {
    pendingQueueItems.value = queueItems;
  }
);

watch(
  pendingQueueItems,
  (queueItems, previousQueueItems = []) => {
    const currentIds = new Set(queueItems.map((entry) => entry.id));

    previousQueueItems
      .filter((entry) => !currentIds.has(entry.id))
      .forEach((entry) => revokeQueuedPreviewUrl(entry.id));

    queueItems.forEach((entry) => {
      queueTagDrafts.value[entry.id] = entry.tags.join(', ');

      if (!queuedPreviewUrls.value[entry.id] && canCreateObjectUrl()) {
        queuedPreviewUrls.value[entry.id] = URL.createObjectURL(entry.file);
      }
    });

    Object.keys(queueTagDrafts.value).forEach((entryId) => {
      if (!currentIds.has(entryId)) {
        delete queueTagDrafts.value[entryId];
      }
    });
  },
  { immediate: true }
);

const isQueueMode = computed(() => props.mode === 'queue');

const hasRecordId = computed(() => {
  return Boolean(props.recordId && props.recordId.trim());
});

const maxCount = computed(() => {
  const queuedCount = isQueueMode.value ? pendingQueueItems.value.length : 0;
  return getRemainingAttachmentSlots(props.existingCount, queuedCount);
});

const isUploadDisabled = computed(() => {
  return props.disabled || (isQueueMode.value && maxCount.value <= 0);
});

const uploadUrl = computed(() => {
  if (!hasRecordId.value) {
    return '';
  }

  return buildAttachmentUploadUrl(import.meta.env.VITE_API_BASE_URL, props.recordId);
});

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${authStore.token}`
  };
});

const emitQueueChange = (nextQueue) => {
  pendingQueueItems.value = nextQueue;
  emit('queue-change', nextQueue);
};

const updateQueuedTagDraft = (entryId, value) => {
  queueTagDrafts.value[entryId] = value;
};

const handleQueuedCategoryChange = (entryId, category) => {
  emitQueueChange(
    updateQueuedAttachmentEntry(pendingQueueItems.value, entryId, { category })
  );
};

const commitQueuedTags = (entryId) => {
  const normalizedTags = normalizeAttachmentTags(queueTagDrafts.value[entryId]);
  queueTagDrafts.value[entryId] = normalizedTags.join(', ');
  emitQueueChange(
    updateQueuedAttachmentEntry(pendingQueueItems.value, entryId, { tags: normalizedTags })
  );
};

const handleRemoveQueuedItem = (entryId) => {
  revokeQueuedPreviewUrl(entryId);
  delete queueTagDrafts.value[entryId];
  emitQueueChange(removeQueuedAttachmentEntry(pendingQueueItems.value, entryId));
};

const getQueuedPreviewUrl = (entryId) => {
  return queuedPreviewUrls.value[entryId] || '';
};

const formatFileSize = (size = 0) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const submitUploadRequest = (options) => {
  uploadAttachmentEntry(props.recordId, {
    file: options.file,
    category: uploadCategory.value,
    tags: normalizeAttachmentTags(uploadTagsStr.value)
  })
    .then((response) => {
      options.onSuccess(response);
    })
    .catch((error) => {
      options.onError(error);
    });
};

const beforeUpload = (file) => {
  const isImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
  if (!isImage) {
    ElMessage.error('只能上传 JPG/PNG/WEBP 格式的图片');
    return false;
  }

  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB');
    return false;
  }

  if (isQueueMode.value) {
    if (maxCount.value <= 0) {
      ElMessage.error('附件最多只能上传 20 张');
      return false;
    }

    const nextQueue = appendQueuedAttachmentEntries(
      pendingQueueItems.value,
      [file],
      {
        category: props.category,
        tags: [...props.tags]
      }
    );
    emitQueueChange(nextQueue);
    fileList.value = [];
    return false;
  }

  if (!hasRecordId.value) {
    ElMessage.error('请先保存记录后再上传附件');
    return false;
  }

  return true;
};

const handleSuccess = (response) => {
  if (response.success) {
    ElMessage.success('上传成功');
    emit('success', response.data.attachments);
    fileList.value = [];
    return;
  }

  ElMessage.error(response.error?.message || '上传失败');
};

const handleError = (error) => {
  console.error('上传失败:', error);
  ElMessage.error('上传失败，请重试');
};

onBeforeUnmount(() => {
  Object.keys(queuedPreviewUrls.value).forEach((entryId) => revokeQueuedPreviewUrl(entryId));
});
</script>

<style scoped>
.attachment-upload {
  width: 100%;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.upload-fields {
  display: grid;
  grid-template-columns: minmax(120px, 180px) minmax(0, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.queue-panel {
  margin-top: 16px;
}

.queue-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.queue-empty {
  padding: 16px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.queue-item {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.queue-preview {
  width: 88px;
  height: 88px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.queue-preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.queue-preview-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.queue-content {
  min-width: 0;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.queue-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.queue-size {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.queue-fields {
  display: grid;
  grid-template-columns: minmax(120px, 180px) minmax(0, 1fr);
  gap: 12px;
  margin-top: 12px;
}

@media (max-width: 640px) {
  .queue-item {
    grid-template-columns: 1fr;
  }

  .queue-preview {
    width: 100%;
    height: 180px;
  }

  .queue-fields {
    grid-template-columns: 1fr;
  }
}
</style>
