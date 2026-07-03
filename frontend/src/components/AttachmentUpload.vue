<template>
  <div class="attachment-upload">
    <el-upload
      ref="uploadRef"
      v-model:file-list="fileList"
      :action="uploadUrl"
      :headers="uploadHeaders"
      :data="uploadData"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :limit="maxCount"
      :disabled="disabled"
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
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { appendQueuedAttachmentEntries } from '@/utils/attachmentQueue';
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

watch(
  () => props.queueItems,
  (queueItems) => {
    pendingQueueItems.value = queueItems;
  }
);

const maxCount = computed(() => {
  return Math.max(0, 20 - props.existingCount);
});

const uploadUrl = computed(() => {
  return buildAttachmentUploadUrl(import.meta.env.VITE_API_BASE_URL, props.recordId);
});

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${authStore.token}`
  };
});

const uploadData = computed(() => {
  return {
    category: props.category,
    tags: JSON.stringify(props.tags)
  };
});

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

  if (props.mode === 'queue') {
    const nextQueue = appendQueuedAttachmentEntries(
      pendingQueueItems.value,
      [file],
      {
        category: props.category,
        tags: [...props.tags]
      }
    );
    pendingQueueItems.value = nextQueue;
    emit('queue-change', nextQueue);
    fileList.value = [];
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
</style>
